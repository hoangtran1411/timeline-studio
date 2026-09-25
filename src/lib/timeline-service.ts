import { getDb } from './db';
import { TimelineTrack, TimelineNode, NodeDependency, FullTimelineData, NodeStatus, NodePriority } from '@/types/timeline';

export function getFullTimelineData(): FullTimelineData {
  const db = getDb();

  const timelineRows = db.prepare(`
    SELECT id, title, description, color, parent_timeline_id, branch_point_node_id, order_index
    FROM timelines
    ORDER BY order_index ASC, created_at ASC
  `).all() as Array<{
    id: string;
    title: string;
    description: string | null;
    color: string;
    parent_timeline_id: string | null;
    branch_point_node_id: string | null;
    order_index: number;
  }>;

  const nodeRows = db.prepare(`
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

  const timelines: TimelineTrack[] = timelineRows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    color: row.color,
    parentTimelineId: row.parent_timeline_id,
    branchPointNodeId: row.branch_point_node_id,
    orderIndex: row.order_index,
    nodes: nodesByTimeline.get(row.id) || []
  }));

  const dependencies: NodeDependency[] = depRows.map(row => ({
    id: row.id,
    fromNodeId: row.from_node_id,
    toNodeId: row.to_node_id,
    type: row.type as 'blocks' | 'relates_to' | 'branch_from'
  }));

  return { timelines, dependencies };
}

/**
 * Assigns lanes to nodes so overlapping date intervals do not visually collide.
 */
function assignCollisionLanes(nodes: TimelineNode[]): void {
  // Sort primarily by startDate
  nodes.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const laneEndTimes: number[] = [];

  for (const node of nodes) {
    const startTime = new Date(node.startDate).getTime();
    // Default duration to 7 days if endDate not provided
    const endTime = node.endDate
      ? new Date(node.endDate).getTime()
      : startTime + 7 * 24 * 60 * 60 * 1000;

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
  title: string;
  description?: string;
  parentTimelineId?: string | null;
  branchPointNodeId?: string | null;
}): TimelineTrack {
  const db = getDb();
  const id = 'timeline-' + Math.random().toString(36).substring(2, 9);
  const maxOrder = (db.prepare('SELECT COALESCE(MAX(order_index), -1) as max_order FROM timelines').get() as { max_order: number }).max_order;

  db.prepare(`
    INSERT INTO timelines (id, title, description, parent_timeline_id, branch_point_node_id, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.title,
    params.description || null,
    params.parentTimelineId || null,
    params.branchPointNodeId || null,
    maxOrder + 1
  );

  return {
    id,
    title: params.title,
    description: params.description || null,
    color: 'zinc',
    parentTimelineId: params.parentTimelineId || null,
    branchPointNodeId: params.branchPointNodeId || null,
    orderIndex: maxOrder + 1,
    nodes: []
  };
}

export function updateTimeline(id: string, params: { title?: string; description?: string }) {
  const db = getDb();
  if (params.title !== undefined) {
    db.prepare('UPDATE timelines SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.title, id);
  }
  if (params.description !== undefined) {
    db.prepare('UPDATE timelines SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(params.description, id);
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
  const values: any[] = [];

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
