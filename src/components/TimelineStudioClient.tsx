'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TimelineNode, FullTimelineData, Project, NodeStatus } from '@/types/timeline';
import { Header } from '@/components/Header';
import { ChronoCanvas, ChronoCanvasRef } from '@/components/ChronoCanvas';
import { ComparisonMatrix } from '@/components/ComparisonMatrix';
import { parseDate, getMidpointDate, addDays, formatDateStr } from '@/utils/date-utils';

// Dynamic code-split imports for heavy dialogs/drawers to keep initial LCP bundle minimal
const NodeDrawer = dynamic(() => import('@/components/NodeDrawer').then(m => m.NodeDrawer), {
  ssr: false
});

const AddTimelineModal = dynamic(() => import('@/components/AddTimelineModal').then(m => m.AddTimelineModal), {
  ssr: false
});

const ArchivedTracksModal = dynamic(() => import('@/components/ArchivedTracksModal').then(m => m.ArchivedTracksModal), {
  ssr: false
});

const ProjectModal = dynamic(() => import('@/components/ProjectModal').then(m => m.ProjectModal), {
  ssr: false
});

interface TimelineStudioClientProps {
  initialProjects: Project[];
  initialData: FullTimelineData;
}

export function TimelineStudioClient({ initialProjects, initialData }: TimelineStudioClientProps) {
  const [data, setData] = useState<FullTimelineData>(initialData);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>(initialData.project?.id || 'proj-historical');
  const activeProjectIdRef = useRef<string>(initialData.project?.id || 'proj-historical');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers state
  const [selectedNode, setSelectedNode] = useState<TimelineNode | null>(null);
  const [isNodeDrawerOpen, setIsNodeDrawerOpen] = useState(false);
  const [defaultNodeTimelineId, setDefaultNodeTimelineId] = useState<string | undefined>();
  const [defaultNodeStartDate, setDefaultNodeStartDate] = useState<string | undefined>();
  const [defaultNodeEndDate, setDefaultNodeEndDate] = useState<string | undefined>();

  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(null);
  const [preselectedBranchNodeId, setPreselectedBranchNodeId] = useState<string | null>(null);

  // Active highlighted timeline track state (null = track all timelines simultaneously for comparison)
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const handleSelectTrack = (timelineId: string | null) => {
    if (timelineId === null) {
      setSelectedTrackId(null);
      return;
    }
    setSelectedTrackId(prev => (prev === timelineId ? null : timelineId));
  };

  const canvasRef = useRef<ChronoCanvasRef>(null);

  // Fetch project list
  const fetchProjects = async (): Promise<Project[]> => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const list: Project[] = await res.json();
        setProjects(list);
        return list;
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
    return [];
  };

  // Fetch data for a specific project from SQLite/Turso API
  const fetchData = async (projectIdToFetch?: string) => {
    const targetPid = projectIdToFetch || activeProjectIdRef.current;
    try {
      setLoading(true);
      const res = await fetch(`/api/timeline?projectId=${encodeURIComponent(targetPid)}`);
      if (res.ok) {
        const json: FullTimelineData = await res.json();
        setData(json);
        if (json.project?.id) {
          setActiveProjectId(json.project.id);
          activeProjectIdRef.current = json.project.id;
        }
      }
    } catch (err) {
      console.error('Failed to load timelines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If the server didn't pre-populate projects, fetch them
    if (initialProjects.length === 0) {
      fetchProjects();
    }

    // Check if user had selected a different project from localStorage previously
    try {
      const savedPid = localStorage.getItem('timeline_studio_active_project_id');
      if (savedPid && savedPid !== activeProjectIdRef.current) {
        setActiveProjectId(savedPid);
        activeProjectIdRef.current = savedPid;
        fetchData(savedPid);
      }
    } catch (_) {}
  }, []);

  // Project Switcher and Management Handlers
  const handleSelectProject = async (projectId: string) => {
    setActiveProjectId(projectId);
    activeProjectIdRef.current = projectId;
    try {
      localStorage.setItem('timeline_studio_active_project_id', projectId);
    } catch (_) {}
    setSelectedTrackId(null);
    setSelectedNode(null);
    await fetchData(projectId);
    await fetchProjects();
  };

  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (projectData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }) => {
    if (editingProject) {
      await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      await fetchProjects();
      await fetchData(activeProjectIdRef.current);
    } else {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (res.ok) {
        const newProject: Project = await res.json();
        await fetchProjects();
        await handleSelectProject(newProject.id);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    const remaining = await fetchProjects();
    if (activeProjectIdRef.current === projectId) {
      const nextPid = remaining.length > 0 ? remaining[0].id : 'proj-historical';
      await handleSelectProject(nextPid);
    } else {
      await fetchData(activeProjectIdRef.current);
    }
  };

  // Dynamic today's date string in YYYY-MM-DD based on current real-time clock
  const todayDateStr = useMemo(() => formatDateStr(new Date()), []);

  // Compute overall timeline date span dynamically based on active project nodes
  const { originDate, totalDays } = useMemo(() => {
    let minTime = Infinity;
    let maxTime = -Infinity;

    data.timelines.forEach(track => {
      track.nodes.forEach(node => {
        const sTime = parseDate(node.startDate).getTime();
        const eTime = node.endDate ? parseDate(node.endDate).getTime() : sTime;
        if (sTime < minTime) minTime = sTime;
        if (eTime > maxTime) maxTime = eTime;
      });
    });

    // If there are no nodes in this project, default to a window around today
    if (minTime === Infinity || maxTime === -Infinity) {
      const todayTime = parseDate(todayDateStr).getTime();
      minTime = todayTime - 30 * 24 * 60 * 60 * 1000;
      maxTime = todayTime + 180 * 24 * 60 * 60 * 1000;
    } else {
      // If today falls close to or within the project date range, include today
      const todayTime = parseDate(todayDateStr).getTime();
      if (todayTime >= minTime - 365 * 24 * 60 * 60 * 1000 && todayTime <= maxTime + 365 * 24 * 60 * 60 * 1000) {
        if (todayTime < minTime) minTime = todayTime;
        if (todayTime > maxTime) maxTime = todayTime;
      }
    }

    const origin = new Date(minTime);
    // Add extra padding days for smooth scrolling
    const spanDays = Math.round((maxTime - minTime) / (1000 * 60 * 60 * 24));
    const days = Math.max(180, spanDays + 60);
    return { originDate: origin, totalDays: days };
  }, [data.timelines, todayDateStr]);

  // Adaptive base pixel resolution per day supporting both sprints and millennia
  const pxPerDay = useMemo(() => {
    if (totalDays > 3650) {
      const targetWidth = Math.min(32000, Math.max(12000, Math.round(totalDays * 0.045)));
      return (targetWidth / totalDays) * zoom;
    }
    if (totalDays > 730) {
      return 1.8 * zoom;
    }
    return 6.2 * zoom;
  }, [totalDays, zoom]);

  // Total nodes calculation
  const totalNodesCount = useMemo(() => {
    return data.timelines.reduce((acc, t) => acc + t.nodes.length, 0);
  }, [data.timelines]);

  // Filtered timelines based on search query
  const filteredTimelines = useMemo(() => {
    if (!searchQuery.trim()) return data.timelines;
    const q = searchQuery.toLowerCase();
    return data.timelines.map(track => ({
      ...track,
      nodes: track.nodes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.description && n.description.toLowerCase().includes(q)) ||
        n.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }));
  }, [data.timelines, searchQuery]);

  // Handler: Save Node (Create or Edit)
  const handleSaveNode = async (nodeData: Partial<TimelineNode> & { id?: string }) => {
    if (nodeData.id) {
      await fetch(`/api/nodes/${nodeData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData)
      });
    } else {
      await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData)
      });
    }
    await fetchData();
    await fetchProjects();
  };

  // Handler: Delete Node
  const handleDeleteNode = async (nodeId: string) => {
    await fetch(`/api/nodes/${nodeId}`, { method: 'DELETE' });
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    await fetchData();
    await fetchProjects();
  };

  // Handler: Duplicate Node (+7 days downstream)
  const handleDuplicateNode = async (node: TimelineNode) => {
    const newStartDate = addDays(node.startDate, 7);
    const newEndDate = node.endDate ? addDays(node.endDate, 7) : null;
    await handleSaveNode({
      timelineId: node.timelineId,
      title: `${node.title} (Copy)`,
      description: node.description,
      startDate: newStartDate,
      endDate: newEndDate,
      status: 'planned',
      priority: node.priority,
      tags: [...node.tags]
    });
  };

  // Handler: Change Node Status directly
  const handleChangeNodeStatus = async (nodeId: string, status: NodeStatus) => {
    await handleSaveNode({
      id: nodeId,
      status
    });
  };

  // Handler: Move or Resize Node (Drag and Drop)
  const handleMoveNode = async (nodeId: string, newStartDate: string, newEndDate: string | null) => {
    setData(prev => ({
      ...prev,
      timelines: prev.timelines.map(track => ({
        ...track,
        nodes: track.nodes.map(node =>
          node.id === nodeId
            ? { ...node, startDate: newStartDate, endDate: newEndDate }
            : node
        )
      }))
    }));

    try {
      await fetch(`/api/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: newStartDate, endDate: newEndDate })
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to update node position:', err);
      await fetchData();
    }
  };

  // Handler: Create Timeline Track
  const handleCreateTimeline = async (timelineData: {
    projectId?: string;
    title: string;
    description?: string;
    parentTimelineId?: string | null;
    branchPointNodeId?: string | null;
  }) => {
    const targetProject = timelineData.projectId || activeProjectIdRef.current;
    await fetch('/api/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...timelineData,
        projectId: targetProject
      })
    });
    if (targetProject !== activeProjectIdRef.current) {
      await handleSelectProject(targetProject);
    } else {
      await fetchData();
      await fetchProjects();
    }
  };

  // Handler: Toggle track visibility on canvas
  const handleToggleTrackVisibility = async (timelineId: string, isVisible: boolean) => {
    setData(prev => ({
      ...prev,
      timelines: prev.timelines.map(t =>
        t.id === timelineId ? { ...t, isVisible } : t
      )
    }));

    try {
      await fetch(`/api/timeline/${timelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible })
      });
    } catch (err) {
      console.error('Failed to update timeline visibility:', err);
      await fetchData();
    }
  };

  // Handler: Show all hidden tracks
  const handleShowAllTracks = async () => {
    setData(prev => ({
      ...prev,
      timelines: prev.timelines.map(t => ({ ...t, isVisible: true }))
    }));

    try {
      const hidden = data.timelines.filter(t => t.isVisible === false);
      for (const t of hidden) {
        await fetch(`/api/timeline/${t.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVisible: true })
        });
      }
    } catch (err) {
      console.error('Failed to show all tracks:', err);
      await fetchData();
    }
  };

  // Handler: Archive Timeline Track
  const handleArchiveTrack = async (timelineId: string) => {
    const track = data.timelines.find(t => t.id === timelineId);
    if (!track) return;

    if (data.timelines.length <= 1) {
      alert('Cannot archive the only active timeline track.');
      return;
    }

    setData(prev => ({
      ...prev,
      timelines: prev.timelines.filter(t => t.id !== timelineId),
      archivedTimelines: [...(prev.archivedTimelines || []), { ...track, isArchived: true }]
    }));

    try {
      await fetch(`/api/timeline/${timelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true })
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to archive timeline:', err);
      await fetchData();
    }
  };

  // Handler: Restore Archived Timeline Track
  const handleRestoreTrack = async (timelineId: string) => {
    const track = (data.archivedTimelines || []).find(t => t.id === timelineId);
    if (!track) return;

    setData(prev => ({
      ...prev,
      timelines: [...prev.timelines, { ...track, isArchived: false, isVisible: true }],
      archivedTimelines: (prev.archivedTimelines || []).filter(t => t.id !== timelineId)
    }));

    try {
      await fetch(`/api/timeline/${timelineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false, isVisible: true })
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to restore timeline:', err);
      await fetchData();
    }
  };

  // Handler: Permanent Delete Track from modal
  const handlePermanentDeleteTrack = async (timelineId: string) => {
    if (confirm('Are you sure you want to permanently delete this timeline track and all its nodes? This cannot be undone.')) {
      await fetch(`/api/timeline/${timelineId}`, { method: 'DELETE' });
      await fetchData();
      await fetchProjects();
    }
  };

  // Handler: Delete Timeline Track from dock
  const handleDeleteTrack = async (timelineId: string) => {
    if (confirm('Are you sure you want to permanently delete this timeline track and all its nodes? (Tip: You can also use Archive to keep it in database)')) {
      await fetch(`/api/timeline/${timelineId}`, { method: 'DELETE' });
      await fetchData();
      await fetchProjects();
    }
  };

  // Handler: Quick Add Node to Track
  const handleOpenAddNode = (timelineId?: string, defaultStartDate?: string) => {
    setSelectedNode(null);
    setDefaultNodeTimelineId(timelineId || data.timelines[0]?.id);
    setDefaultNodeStartDate(defaultStartDate || todayDateStr);
    setDefaultNodeEndDate(undefined);
    setIsNodeDrawerOpen(true);
  };

  // Handler: Insert Node Between Two Nodes
  const handleInsertBetween = (
    timelineId: string,
    leftNode: TimelineNode,
    rightNode: TimelineNode
  ) => {
    const leftEnd = leftNode.endDate || leftNode.startDate;
    const rightStart = rightNode.startDate;
    const midDate = getMidpointDate(leftEnd, rightStart);

    setSelectedNode(null);
    setDefaultNodeTimelineId(timelineId);
    setDefaultNodeStartDate(midDate);
    setDefaultNodeEndDate(addDays(midDate, 7));
    setIsNodeDrawerOpen(true);
  };

  // Handler: Branch Timeline
  const handleOpenBranchModal = (parentTimelineId?: string, branchPointNodeId?: string) => {
    setPreselectedParentId(parentTimelineId || null);
    setPreselectedBranchNodeId(branchPointNodeId || null);
    setIsTimelineModalOpen(true);
  };

  // Resizable bottom panel state
  const [bottomPanelHeight, setBottomPanelHeight] = useState(250);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const resizeStartY = useRef<number>(0);
  const resizeStartBottomHeight = useRef<number>(250);

  useEffect(() => {
    try {
      const savedHeight = localStorage.getItem('timeline_studio_bottom_height');
      if (savedHeight) {
        const parsed = parseInt(savedHeight, 10);
        if (!isNaN(parsed) && parsed >= 120 && parsed <= 600) {
          setBottomPanelHeight(parsed);
        }
      }
      const savedCollapsed = localStorage.getItem('timeline_studio_bottom_collapsed');
      if (savedCollapsed === 'true') {
        setIsBottomCollapsed(true);
      }
    } catch (_) {}
  }, []);

  const handleBottomResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStartY.current = e.clientY;
    resizeStartBottomHeight.current = bottomPanelHeight;
    setIsResizingBottom(true);
    if (isBottomCollapsed) {
      setIsBottomCollapsed(false);
    }
  };

  const handleBottomResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingBottom) return;
    const deltaY = e.clientY - resizeStartY.current;
    const nextHeight = Math.max(120, Math.min(600, resizeStartBottomHeight.current - deltaY));
    setBottomPanelHeight(nextHeight);
  };

  const handleBottomResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingBottom) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsResizingBottom(false);
    try {
      localStorage.setItem('timeline_studio_bottom_height', String(bottomPanelHeight));
    } catch (_) {}
  };

  const handleBottomResizeDoubleClick = () => {
    setIsBottomCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('timeline_studio_bottom_collapsed', String(next));
      } catch (_) {}
      return next;
    });
  };

  // Canvas grid style state (notebook paper / dot grid / plain)
  const [gridStyle, setGridStyle] = useState<'notebook' | 'dots' | 'plain'>('notebook');

  useEffect(() => {
    try {
      const savedGrid = localStorage.getItem('timeline_studio_grid_style');
      if (savedGrid === 'notebook' || savedGrid === 'dots' || savedGrid === 'plain') {
        setGridStyle(savedGrid);
      }
    } catch (_) {}
  }, []);

  const handleToggleGrid = () => {
    setGridStyle(prev => {
      const next = prev === 'notebook' ? 'dots' : prev === 'dots' ? 'plain' : 'notebook';
      try {
        localStorage.setItem('timeline_studio_grid_style', next);
      } catch (_) {}
      return next;
    });
  };

  return (
    <div className="h-screen bg-[#101114] flex flex-col overflow-hidden relative">
      {/* Top subtle progress indicator during project switches (avoids full-screen blocking) */}
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-pulse z-50 pointer-events-none" />
      )}

      {/* Top Header */}
      <Header
        projects={projects}
        currentProject={data.project}
        onSelectProject={handleSelectProject}
        onOpenCreateProject={handleOpenCreateProject}
        onOpenEditProject={handleOpenEditProject}
        timelineCount={data.timelines.length}
        nodeCount={totalNodesCount}
        zoom={zoom}
        onZoomChange={setZoom}
        onCenterToday={() => canvasRef.current?.scrollToToday()}
        onScrollToStart={() => canvasRef.current?.scrollToStart()}
        onOpenAddTimeline={() => {
          setPreselectedParentId(null);
          setPreselectedBranchNodeId(null);
          setIsTimelineModalOpen(true);
        }}
        onOpenAddNode={() => handleOpenAddNode()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        gridStyle={gridStyle}
        onToggleGrid={handleToggleGrid}
        archivedCount={(data.archivedTimelines || []).length}
        onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
        hiddenCount={data.timelines.filter(t => t.isVisible === false).length}
        onShowAllTracks={handleShowAllTracks}
      />

      {/* Main Interactive Canvas & Bottom Panel Container */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-0 isolate bg-[#101114]">
        <ChronoCanvas
          ref={canvasRef}
          timelines={filteredTimelines}
          dependencies={data.dependencies}
          originDate={originDate}
          totalDays={totalDays}
          pxPerDay={pxPerDay}
          todayDateStr={todayDateStr}
          selectedNode={selectedNode}
          onSelectNode={(node) => {
            setSelectedNode(node);
            setIsNodeDrawerOpen(true);
          }}
          onAddNodeToTrack={handleOpenAddNode}
          onInsertNodeBetween={handleInsertBetween}
          onBranchTrack={handleOpenBranchModal}
          onToggleVisibility={handleToggleTrackVisibility}
          onArchiveTrack={handleArchiveTrack}
          onDeleteTrack={handleDeleteTrack}
          onDeleteNode={handleDeleteNode}
          onMoveNode={handleMoveNode}
          gridStyle={gridStyle}
          onOpenAddTimeline={() => {
            setPreselectedParentId(null);
            setPreselectedBranchNodeId(null);
            setIsTimelineModalOpen(true);
          }}
          selectedTrackId={selectedTrackId}
          onSelectTrack={handleSelectTrack}
          onDuplicateNode={handleDuplicateNode}
          onChangeNodeStatus={handleChangeNodeStatus}
          onResetZoom={() => setZoom(1.0)}
        />

        {/* Dedicated Buffer separating Canvas Scrollbar from Bottom Resize Splitter */}
        <div className="h-2 w-full bg-[#101114] flex-shrink-0" />

        {/* Horizontal Resizable Splitter Handle */}
        <div
          className={`relative z-20 h-2 w-full flex-shrink-0 cursor-row-resize group flex items-center justify-center transition-colors ${
            isResizingBottom ? 'bg-[#ececf0]' : 'bg-[#1b1c22] hover:bg-[#32343e]'
          }`}
          title="Drag up/down to resize bottom panel (Double-click to collapse/expand)"
          onPointerDown={handleBottomResizePointerDown}
          onPointerMove={handleBottomResizePointerMove}
          onPointerUp={handleBottomResizePointerUp}
          onDoubleClick={handleBottomResizeDoubleClick}
        >
          {/* Center Horizontal Grip Pill */}
          <div className="absolute h-3 w-8 rounded flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1c1d22] border border-[#2a2b32] pointer-events-none shadow-md">
            <span className="w-0.5 h-0.5 rounded-full bg-[#9e9ea7]" />
            <span className="w-0.5 h-0.5 rounded-full bg-[#9e9ea7]" />
            <span className="w-0.5 h-0.5 rounded-full bg-[#9e9ea7]" />
          </div>
        </div>

        {/* Multi-Timeline Comparative Matrix */}
        <ComparisonMatrix
          timelines={data.timelines}
          height={bottomPanelHeight}
          isCollapsed={isBottomCollapsed}
          onToggleCollapse={() => {
            setIsBottomCollapsed(prev => {
              const next = !prev;
              try {
                localStorage.setItem('timeline_studio_bottom_collapsed', String(next));
              } catch (_) {}
              return next;
            });
          }}
          onSelectNode={(node) => {
            setSelectedNode(node);
            setIsNodeDrawerOpen(true);
          }}
        />
      </main>

      {/* Node Create & Edit Drawer */}
      <NodeDrawer
        isOpen={isNodeDrawerOpen}
        onClose={() => {
          setIsNodeDrawerOpen(false);
          setSelectedNode(null);
        }}
        node={selectedNode}
        timelines={data.timelines}
        defaultTimelineId={defaultNodeTimelineId}
        defaultStartDate={defaultNodeStartDate}
        defaultEndDate={defaultNodeEndDate}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        onBranchFromNode={(node) => {
          setIsNodeDrawerOpen(false);
          handleOpenBranchModal(node.timelineId, node.id);
        }}
      />

      {/* Add / Branch Timeline Modal */}
      <AddTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        timelines={data.timelines}
        preselectedParentId={preselectedParentId}
        preselectedBranchNodeId={preselectedBranchNodeId}
        onCreateTimeline={handleCreateTimeline}
        projects={projects}
        activeProjectId={activeProjectId}
      />

      {/* Archived Timelines Modal */}
      <ArchivedTracksModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        archivedTimelines={data.archivedTimelines || []}
        onRestoreTrack={handleRestoreTrack}
        onPermanentDeleteTrack={handlePermanentDeleteTrack}
      />

      {/* Project Settings & Creation Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        project={editingProject}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
}
