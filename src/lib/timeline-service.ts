import { getDb } from './db';
import { TimelineTrack, TimelineNode, NodeDependency, FullTimelineData, NodeStatus, NodePriority, Project } from '@/types/timeline';
import { parseDate, compareDateStrings } from '@/utils/date-utils';

export function getProjects(): Project[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.id, p.name, p.description, p.color, p.icon, p.created_at, p.updated_at,
           COUNT(DISTINCT t.id) as timeline_count,
           COUNT(DISTINCT n.id) as node_count
    FROM projects p
    LEFT JOIN timelines t ON t.project_id = p.id AND (t.is_archived = 0 OR t.is_archived IS NULL)
    LEFT JOIN nodes n ON n.timeline_id = t.id
    GROUP BY p.id
    ORDER BY p.created_at ASC
  `).all() as Array<{
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    created_at: string;
    updated_at: string;
    timeline_count: number;
    node_count: number;
  }>;

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color || 'indigo',
    icon: r.icon || 'folder',
    timelineCount: r.timeline_count,
    nodeCount: r.node_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export function createProject(params: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Project {
  const db = getDb();
  const id = 'proj-' + Math.random().toString(36).substring(2, 9);
  db.prepare(`
    INSERT INTO projects (id, name, description, color, icon)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    params.name,
    params.description || null,
    params.color || 'indigo',
    params.icon || 'folder'
  );
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

export function updateProject(id: string, params: {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}) {
  const db = getDb();
  if (params.name !== undefined) {
    db.prepare('UPDATE projects SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.name, id);
  }
  if (params.description !== undefined) {
    db.prepare('UPDATE projects SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.description, id);
  }
  if (params.color !== undefined) {
    db.prepare('UPDATE projects SET color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.color, id);
  }
  if (params.icon !== undefined) {
    db.prepare('UPDATE projects SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.icon, id);
  }
}

export function deleteProject(id: string) {
  const db = getDb();
  db.prepare('DELETE FROM timelines WHERE project_id = ?').run(id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

export function getFullTimelineData(requestedProjectId?: string): FullTimelineData {
  const db = getDb();
  const projects = getProjects();
  const activeProject = (requestedProjectId ? projects.find(p => p.id === requestedProjectId) : null) || projects[0] || null;

  const timelineRows = activeProject
    ? (db.prepare(`
        SELECT id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index,
               COALESCE(is_archived, 0) as is_archived,
               COALESCE(is_visible, 1) as is_visible
        FROM timelines
        WHERE project_id = ?
        ORDER BY order_index ASC, created_at ASC
      `).all(activeProject.id) as Array<{
        id: string;
        project_id: string | null;
        title: string;
        description: string | null;
        color: string;
        parent_timeline_id: string | null;
        branch_point_node_id: string | null;
        order_index: number;
        is_archived: number;
        is_visible: number;
      }>)
    : (db.prepare(`
        SELECT id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index,
               COALESCE(is_archived, 0) as is_archived,
               COALESCE(is_visible, 1) as is_visible
        FROM timelines
        ORDER BY order_index ASC, created_at ASC
      `).all() as Array<{
        id: string;
        project_id: string | null;
        title: string;
        description: string | null;
        color: string;
        parent_timeline_id: string | null;
        branch_point_node_id: string | null;
        order_index: number;
        is_archived: number;
        is_visible: number;
      }>);

  const activeTimelineIds = new Set(timelineRows.map(r => r.id));

  const allNodeRows = db.prepare(`
    SELECT id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags
    FROM nodes
    ORDER BY start_date ASC, order_index ASC
  `).all() as Array<{
    id: string;
    timeline_id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    status: string;
    priority: string;
    order_index: number;
    tags: string | null;
  }>;

  // Filter nodes for timelines that belong to this project
  const nodeRows = allNodeRows.filter(r => activeTimelineIds.has(r.timeline_id));

  const depRows = db.prepare(`
    SELECT id, from_node_id, to_node_id, type
    FROM dependencies
  `).all() as Array<{
    id: string;
    from_node_id: string;
    to_node_id: string;
    type: string;
  }>;

  // Group nodes by timeline and calculate collision lanes
  const nodesByTimeline = new Map<string, TimelineNode[]>();
  for (const row of nodeRows) {
    const node: TimelineNode = {
      id: row.id,
      timelineId: row.timeline_id,
      title: row.title,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      status: (row.status as NodeStatus) || 'planned',
      priority: (row.priority as NodePriority) || 'medium',
      orderIndex: row.order_index,
      tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    if (!nodesByTimeline.has(row.timeline_id)) {
      nodesByTimeline.set(row.timeline_id, []);
    }
    nodesByTimeline.get(row.timeline_id)!.push(node);
  }

  // Calculate layout lanes for collision avoidance on each timeline
  for (const [_, nodes] of nodesByTimeline) {
    assignCollisionLanes(nodes);
  }

  const allTracks: TimelineTrack[] = timelineRows.map(row => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    color: row.color,
    parentTimelineId: row.parent_timeline_id,
    branchPointNodeId: row.branch_point_node_id,
    orderIndex: row.order_index,
    isArchived: Boolean(row.is_archived),
    isVisible: row.is_visible !== 0,
    nodes: nodesByTimeline.get(row.id) || []
  }));

  const activeTimelines = allTracks.filter(t => !t.isArchived);
  const archivedTimelines = allTracks.filter(t => t.isArchived);

  const activeNodeIds = new Set(nodeRows.map(n => n.id));
  const dependencies: NodeDependency[] = depRows
    .filter(row => activeNodeIds.has(row.from_node_id) && activeNodeIds.has(row.to_node_id))
    .map(row => ({
      id: row.id,
      fromNodeId: row.from_node_id,
      toNodeId: row.to_node_id,
      type: row.type as 'blocks' | 'relates_to' | 'branch_from'
    }));

  return { project: activeProject, timelines: activeTimelines, archivedTimelines, dependencies };
}

/**
 * Assigns lanes to nodes so overlapping date intervals do not visually collide.
 */
function assignCollisionLanes(nodes: TimelineNode[]): void {
  // Sort primarily by startDate chronologically (supports BCE & CE)
  nodes.sort((a, b) => compareDateStrings(a.startDate, b.startDate));

  const laneEndTimes: number[] = [];

  for (const node of nodes) {
    const startTime = parseDate(node.startDate).getTime();
    // Default duration to 30 days if endDate not provided
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

export function createTimeline(params: {
  projectId?: string;
  title: string;
  description?: string;
  parentTimelineId?: string | null;
  branchPointNodeId?: string | null;
}): TimelineTrack {
  const db = getDb();
  const id = 'timeline-' + Math.random().toString(36).substring(2, 9);
  const maxOrder = (db.prepare('SELECT COALESCE(MAX(order_index), -1) as max_order FROM timelines').get() as { max_order: number }).max_order;
  const projectId = params.projectId || 'proj-historical';

  db.prepare(`
    INSERT INTO timelines (id, project_id, title, description, parent_timeline_id, branch_point_node_id, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    projectId,
    params.title,
    params.description || null,
    params.parentTimelineId || null,
    params.branchPointNodeId || null,
    maxOrder + 1
  );

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

export function updateTimeline(id: string, params: {
  projectId?: string;
  title?: string;
  description?: string;
  isArchived?: boolean;
  isVisible?: boolean;
}) {
  const db = getDb();
  if (params.projectId !== undefined) {
    db.prepare('UPDATE timelines SET project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.projectId, id);
  }
  if (params.title !== undefined) {
    db.prepare('UPDATE timelines SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.title, id);
  }
  if (params.description !== undefined) {
    db.prepare('UPDATE timelines SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.description, id);
  }
  if (params.isArchived !== undefined) {
    db.prepare('UPDATE timelines SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.isArchived ? 1 : 0, id);
  }
  if (params.isVisible !== undefined) {
    db.prepare('UPDATE timelines SET is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.isVisible ? 1 : 0, id);
  }
}

export function deleteTimeline(id: string) {
  const db = getDb();
  db.prepare('DELETE FROM timelines WHERE id = ?').run(id);
}

export function createNode(params: {
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
}): TimelineNode {
  const db = getDb();
  const id = 'node-' + Math.random().toString(36).substring(2, 9);

  // If auto-shift is requested (e.g. inserting between nodes causes collision),
  // shift all subsequent nodes on the same timeline forward by autoShiftSubsequentDays
  if (params.autoShiftSubsequentDays && params.autoShiftSubsequentDays > 0) {
    shiftSubsequentNodes(params.timelineId, params.startDate, params.autoShiftSubsequentDays);
  }

  const maxOrder = (
    db.prepare('SELECT COALESCE(MAX(order_index), -1) as max_order FROM nodes WHERE timeline_id = ?').get(params.timelineId) as { max_order: number }
  ).max_order;

  db.prepare(`
    INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
  );

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

/**
 * Shifts subsequent nodes starting on or after a given date by N days
 */
function shiftSubsequentNodes(timelineId: string, fromDate: string, shiftDays: number) {
  const db = getDb();
  const subsequent = db.prepare(`
    SELECT id, start_date, end_date
    FROM nodes
    WHERE timeline_id = ? AND start_date >= ?
  `).all(timelineId, fromDate) as Array<{ id: string; start_date: string; end_date: string | null }>;

  const updateStmt = db.prepare(`
    UPDATE nodes
    SET start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  for (const node of subsequent) {
    const newStart = addDaysToDateStr(node.start_date, shiftDays);
    const newEnd = node.end_date ? addDaysToDateStr(node.end_date, shiftDays) : null;
    updateStmt.run(newStart, newEnd, node.id);
  }
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function updateNode(id: string, params: Partial<TimelineNode>): void {
  const db = getDb();
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
    db.prepare(`UPDATE nodes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
}

export function deleteNode(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM nodes WHERE id = ?').run(id);
}
