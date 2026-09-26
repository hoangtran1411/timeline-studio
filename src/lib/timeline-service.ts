import { getDb, ensureSchema } from './db';
import { TimelineTrack, TimelineNode, NodeDependency, FullTimelineData, NodeStatus, NodePriority, Project } from '@/types/timeline';
import { parseDate, compareDateStrings } from '@/utils/date-utils';

export async function getProjects(): Promise<Project[]> {
  const db = getDb();
  await ensureSchema(db);

  const res = await db.execute(`
    SELECT p.id, p.name, p.description, p.color, p.icon, p.created_at, p.updated_at,
           COUNT(DISTINCT t.id) as timeline_count,
           COUNT(DISTINCT n.id) as node_count
    FROM projects p
    LEFT JOIN timelines t ON t.project_id = p.id AND (t.is_archived = 0 OR t.is_archived IS NULL)
    LEFT JOIN nodes n ON n.timeline_id = t.id
    GROUP BY p.id
    ORDER BY p.created_at ASC
  `);

  return res.rows.map(r => ({
    id: String(r.id),
    name: String(r.name),
    description: r.description ? String(r.description) : null,
    color: r.color ? String(r.color) : 'indigo',
    icon: r.icon ? String(r.icon) : 'folder',
    timelineCount: Number(r.timeline_count ?? 0),
    nodeCount: Number(r.node_count ?? 0),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at)
  }));
}

export async function createProject(params: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<Project> {
  const db = getDb();
  await ensureSchema(db);
  const id = 'proj-' + Math.random().toString(36).substring(2, 9);

  await db.execute({
    sql: `
      INSERT INTO projects (id, name, description, color, icon)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      id,
      params.name,
      params.description || null,
      params.color || 'indigo',
      params.icon || 'folder'
    ]
  });

  return {
    id,
    name: params.name,
    description: params.description || null,
    color: params.color || 'indigo',
    icon: params.icon || 'folder',
    timelineCount: 0,
    nodeCount: 0
  };
}

export async function updateProject(id: string, params: {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<void> {
  const db = getDb();
  await ensureSchema(db);
  if (params.name !== undefined) {
    await db.execute({ sql: 'UPDATE projects SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [params.name, id] });
  }
  if (params.description !== undefined) {
    await db.execute({ sql: 'UPDATE projects SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [params.description, id] });
  }
  if (params.color !== undefined) {
    await db.execute({ sql: 'UPDATE projects SET color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [params.color, id] });
  }
  if (params.icon !== undefined) {
    await db.execute({ sql: 'UPDATE projects SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [params.icon, id] });
  }
}

export async function deleteProject(id: string): Promise<void> {
  const db = getDb();
  await ensureSchema(db);
  await db.batch([
    { sql: 'DELETE FROM timelines WHERE project_id = ?', args: [id] },
    { sql: 'DELETE FROM projects WHERE id = ?', args: [id] }
  ]);
}

export async function getFullTimelineData(requestedProjectId?: string): Promise<FullTimelineData> {
  const db = getDb();
  await ensureSchema(db);
  const projects = await getProjects();
  const activeProject = (requestedProjectId ? projects.find(p => p.id === requestedProjectId) : null) || projects[0] || null;

  const timelineRes = activeProject
    ? await db.execute({
        sql: `
          SELECT id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index,
                 COALESCE(is_archived, 0) as is_archived,
                 COALESCE(is_visible, 1) as is_visible
          FROM timelines
          WHERE project_id = ?
          ORDER BY order_index ASC, created_at ASC
        `,
        args: [activeProject.id]
      })
    : await db.execute(`
        SELECT id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index,
               COALESCE(is_archived, 0) as is_archived,
               COALESCE(is_visible, 1) as is_visible
        FROM timelines
        ORDER BY order_index ASC, created_at ASC
      `);

  const activeTimelineIds = new Set(timelineRes.rows.map(r => String(r.id)));

  const allNodeRes = await db.execute(`
    SELECT id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags
    FROM nodes
    ORDER BY start_date ASC, order_index ASC
  `);

  // Filter nodes for timelines that belong to this project
  const nodeRows = allNodeRes.rows.filter(r => activeTimelineIds.has(String(r.timeline_id)));

  const depRes = await db.execute(`
    SELECT id, from_node_id, to_node_id, type
    FROM dependencies
  `);

  // Group nodes by timeline and calculate collision lanes
  const nodesByTimeline = new Map<string, TimelineNode[]>();
  for (const row of nodeRows) {
    const rawTags = row.tags ? String(row.tags) : '';
    const node: TimelineNode = {
      id: String(row.id),
      timelineId: String(row.timeline_id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      startDate: String(row.start_date),
      endDate: row.end_date ? String(row.end_date) : null,
      status: (String(row.status) as NodeStatus) || 'planned',
      priority: (String(row.priority) as NodePriority) || 'medium',
      orderIndex: Number(row.order_index ?? 0),
      tags: rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    const tid = String(row.timeline_id);
    if (!nodesByTimeline.has(tid)) {
      nodesByTimeline.set(tid, []);
    }
    nodesByTimeline.get(tid)!.push(node);
  }

  // Calculate layout lanes for collision avoidance on each timeline
  for (const [_, nodes] of nodesByTimeline) {
    assignCollisionLanes(nodes);
  }

  const allTracks: TimelineTrack[] = timelineRes.rows.map(row => ({
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : null,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    color: String(row.color || 'zinc'),
    parentTimelineId: row.parent_timeline_id ? String(row.parent_timeline_id) : null,
    branchPointNodeId: row.branch_point_node_id ? String(row.branch_point_node_id) : null,
    orderIndex: Number(row.order_index ?? 0),
    isArchived: Boolean(row.is_archived),
    isVisible: Number(row.is_visible) !== 0,
    nodes: nodesByTimeline.get(String(row.id)) || []
  }));

  const activeTimelines = allTracks.filter(t => !t.isArchived);
  const archivedTimelines = allTracks.filter(t => t.isArchived);

  const activeNodeIds = new Set(nodeRows.map(n => String(n.id)));
  const dependencies: NodeDependency[] = depRes.rows
    .filter(row => activeNodeIds.has(String(row.from_node_id)) && activeNodeIds.has(String(row.to_node_id)))
    .map(row => ({
      id: String(row.id),
      fromNodeId: String(row.from_node_id),
      toNodeId: String(row.to_node_id),
      type: (String(row.type) as 'blocks' | 'relates_to' | 'branch_from') || 'blocks'
    }));

  return { project: activeProject, timelines: activeTimelines, archivedTimelines, dependencies };
}

/**
 * Assigns lanes to nodes so overlapping date intervals do not visually collide.
 */
function assignCollisionLanes(nodes: TimelineNode[]): void {
  nodes.sort((a, b) => compareDateStrings(a.startDate, b.startDate));

  const laneEndTimes: number[] = [];

  for (const node of nodes) {
    const startTime = parseDate(node.startDate).getTime();
    const endTime = node.endDate
      ? parseDate(node.endDate).getTime()
      : startTime + 30 * 24 * 60 * 60 * 1000;

    let placedLane = -1;
    for (let i = 0; i < laneEndTimes.length; i++) {
      if (laneEndTimes[i] <= startTime) {
        placedLane = i;
        laneEndTimes[i] = endTime;
        break;
      }
    }

    if (placedLane === -1) {
      placedLane = laneEndTimes.length;
      laneEndTimes.push(endTime);
    }

    node.lane = placedLane;
  }
}

export async function createTimeline(params: {
  projectId?: string;
  title: string;
  description?: string;
  parentTimelineId?: string | null;
  branchPointNodeId?: string | null;
}): Promise<TimelineTrack> {
  const db = getDb();
  await ensureSchema(db);
  const id = 'timeline-' + Math.random().toString(36).substring(2, 9);
  const maxOrderRes = await db.execute('SELECT COALESCE(MAX(order_index), -1) as max_order FROM timelines');
  const maxOrder = Number(maxOrderRes.rows[0]?.max_order ?? -1);
  const projectId = params.projectId || 'proj-historical';

  await db.execute({
    sql: `
      INSERT INTO timelines (id, project_id, title, description, parent_timeline_id, branch_point_node_id, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      projectId,
      params.title,
      params.description || null,
      params.parentTimelineId || null,
      params.branchPointNodeId || null,
      maxOrder + 1
    ]
  });

  return {
    id,
    projectId,
    title: params.title,
    description: params.description || null,
    color: 'zinc',
    parentTimelineId: params.parentTimelineId || null,
    branchPointNodeId: params.branchPointNodeId || null,
    orderIndex: maxOrder + 1,
    nodes: []
  };
}

export async function updateTimeline(id: string, params: {
  projectId?: string;
  title?: string;
  description?: string;
  isArchived?: boolean;
  isVisible?: boolean;
}): Promise<void> {
  const db = getDb();
  await ensureSchema(db);
  if (params.projectId !== undefined) {
    await db.execute({ sql: 'UPDATE timelines SET project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [params.projectId, id] });
  }
  if (params.title !== undefined) {
    await db.execute({ sql: 'UPDATE timelines SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [params.title, id] });
  }
  if (params.description !== undefined) {
    await db.execute({ sql: 'UPDATE timelines SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [params.description, id] });
  }
  if (params.isArchived !== undefined) {
    await db.execute({ sql: 'UPDATE timelines SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [params.isArchived ? 1 : 0, id] });
  }
  if (params.isVisible !== undefined) {
    await db.execute({ sql: 'UPDATE timelines SET is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [params.isVisible ? 1 : 0, id] });
  }
}

export async function deleteTimeline(id: string): Promise<void> {
  const db = getDb();
  await ensureSchema(db);
  await db.execute({ sql: 'DELETE FROM timelines WHERE id = ?', args: [id] });
}

export async function createNode(params: {
  timelineId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  status?: NodeStatus;
  priority?: NodePriority;
  tags?: string[];
  insertAfterNodeId?: string;
  autoShiftSubsequentDays?: number;
}): Promise<TimelineNode> {
  const db = getDb();
  await ensureSchema(db);
  const id = 'node-' + Math.random().toString(36).substring(2, 9);

  if (params.autoShiftSubsequentDays && params.autoShiftSubsequentDays > 0) {
    await shiftSubsequentNodes(params.timelineId, params.startDate, params.autoShiftSubsequentDays);
  }

  const maxOrderRes = await db.execute({
    sql: 'SELECT COALESCE(MAX(order_index), -1) as max_order FROM nodes WHERE timeline_id = ?',
    args: [params.timelineId]
  });
  const maxOrder = Number(maxOrderRes.rows[0]?.max_order ?? -1);

  await db.execute({
    sql: `
      INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      params.timelineId,
      params.title,
      params.description || null,
      params.startDate,
      params.endDate || null,
      params.status || 'planned',
      params.priority || 'medium',
      maxOrder + 1,
      params.tags ? params.tags.join(',') : ''
    ]
  });

  return {
    id,
    timelineId: params.timelineId,
    title: params.title,
    description: params.description || null,
    startDate: params.startDate,
    endDate: params.endDate || null,
    status: params.status || 'planned',
    priority: params.priority || 'medium',
    orderIndex: maxOrder + 1,
    tags: params.tags || []
  };
}

async function shiftSubsequentNodes(timelineId: string, fromDate: string, shiftDays: number): Promise<void> {
  const db = getDb();
  const subsequentRes = await db.execute({
    sql: `
      SELECT id, start_date, end_date
      FROM nodes
      WHERE timeline_id = ? AND start_date >= ?
    `,
    args: [timelineId, fromDate]
  });

  const batchUpdates = subsequentRes.rows.map(row => {
    const newStart = addDaysToDateStr(String(row.start_date), shiftDays);
    const newEnd = row.end_date ? addDaysToDateStr(String(row.end_date), shiftDays) : null;
    return {
      sql: `
        UPDATE nodes
        SET start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [newStart, newEnd, String(row.id)]
    };
  });

  if (batchUpdates.length > 0) {
    await db.batch(batchUpdates);
  }
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function updateNode(id: string, params: Partial<TimelineNode>): Promise<void> {
  const db = getDb();
  await ensureSchema(db);
  const fields: string[] = [];
  const values: (string | number | bigint | null)[] = [];

  if (params.title !== undefined) {
    fields.push('title = ?');
    values.push(params.title);
  }
  if (params.description !== undefined) {
    fields.push('description = ?');
    values.push(params.description);
  }
  if (params.startDate !== undefined) {
    fields.push('start_date = ?');
    values.push(params.startDate);
  }
  if (params.endDate !== undefined) {
    fields.push('end_date = ?');
    values.push(params.endDate);
  }
  if (params.status !== undefined) {
    fields.push('status = ?');
    values.push(params.status);
  }
  if (params.priority !== undefined) {
    fields.push('priority = ?');
    values.push(params.priority);
  }
  if (params.tags !== undefined) {
    fields.push('tags = ?');
    values.push(params.tags.join(','));
  }
  if (params.timelineId !== undefined) {
    fields.push('timeline_id = ?');
    values.push(params.timelineId);
  }

  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await db.execute({
      sql: `UPDATE nodes SET ${fields.join(', ')} WHERE id = ?`,
      args: values
    });
  }
}

export async function deleteNode(id: string): Promise<void> {
  const db = getDb();
  await ensureSchema(db);
  await db.execute({ sql: 'DELETE FROM nodes WHERE id = ?', args: [id] });
}
