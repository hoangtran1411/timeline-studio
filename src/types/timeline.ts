export type NodeStatus = 'planned' | 'in_progress' | 'completed' | 'blocked';
export type NodePriority = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  timelineCount?: number;
  nodeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimelineNode {
  id: string;
  timelineId: string;
  title: string;
  description?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  status: NodeStatus;
  priority: NodePriority;
  orderIndex: number;
  tags: string[];
  lane?: number; // visual sub-lane for collision avoidance
}

export interface TimelineTrack {
  id: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  color: string;
  parentTimelineId?: string | null;
  branchPointNodeId?: string | null;
  orderIndex: number;
  isArchived?: boolean;
  isVisible?: boolean;
  nodes: TimelineNode[];
}

export interface NodeDependency {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'blocks' | 'relates_to' | 'branch_from';
}

export interface FullTimelineData {
  project?: Project | null;
  timelines: TimelineTrack[];
  archivedTimelines?: TimelineTrack[];
  dependencies: NodeDependency[];
}
