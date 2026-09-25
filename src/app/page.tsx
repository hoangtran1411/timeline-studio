'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TimelineNode, FullTimelineData } from '@/types/timeline';
import { Header } from '@/components/Header';
import { ChronoCanvas, ChronoCanvasRef } from '@/components/ChronoCanvas';
import { NodeDrawer } from '@/components/NodeDrawer';
import { AddTimelineModal } from '@/components/AddTimelineModal';
import { ComparisonMatrix } from '@/components/ComparisonMatrix';
import { parseDate, getMidpointDate, addDays, formatDateStr } from '@/utils/date-utils';

export default function TimelineStudioPage() {
  const [data, setData] = useState<FullTimelineData>({ timelines: [], dependencies: [] });
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers state
  const [selectedNode, setSelectedNode] = useState<TimelineNode | null>(null);
  const [isNodeDrawerOpen, setIsNodeDrawerOpen] = useState(false);
  const [defaultNodeTimelineId, setDefaultNodeTimelineId] = useState<string | undefined>();
  const [defaultNodeStartDate, setDefaultNodeStartDate] = useState<string | undefined>();
  const [defaultNodeEndDate, setDefaultNodeEndDate] = useState<string | undefined>();

  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(null);
  const [preselectedBranchNodeId, setPreselectedBranchNodeId] = useState<string | null>(null);

  // Active highlighted timeline track state
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>('track-main');

  const handleSelectTrack = (timelineId: string) => {
    setSelectedTrackId(prev => prev === timelineId ? null : timelineId);
  };

  const canvasRef = useRef<ChronoCanvasRef>(null);

  // Fetch data from SQLite API
  const fetchData = async () => {
    try {
      const res = await fetch('/api/timeline');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load timelines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamic today's date string in YYYY-MM-DD based on current real-time clock
  const todayDateStr = useMemo(() => formatDateStr(new Date()), []);

  // Compute overall timeline date span dynamically encompassing all nodes and today
  const { originDate, totalDays } = useMemo(() => {
    let minTime = parseDate(todayDateStr).getTime();
    let maxTime = minTime;

    data.timelines.forEach(track => {
      track.nodes.forEach(node => {
        const sTime = parseDate(node.startDate).getTime();
        const eTime = node.endDate ? parseDate(node.endDate).getTime() : sTime;
        if (sTime < minTime) minTime = sTime;
        if (eTime > maxTime) maxTime = eTime;
      });
    });

    const origin = new Date(minTime);
    // Add extra padding days for smooth scrolling
    const spanDays = Math.round((maxTime - minTime) / (1000 * 60 * 60 * 24));
    const days = Math.max(180, spanDays + 60);
    return { originDate: origin, totalDays: days };
  }, [data.timelines, todayDateStr]);

  // Adaptive base pixel resolution per day supporting both sprints and millennia
  const pxPerDay = useMemo(() => {
    if (totalDays > 3650) {
      // Historical macro scale: target ~24,000px canvas width for 1,500 years
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
      // Edit existing
      await fetch(`/api/nodes/${nodeData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData)
      });
    } else {
      // Create new
      await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData)
      });
    }
    await fetchData();
  };

  // Handler: Delete Node
  const handleDeleteNode = async (nodeId: string) => {
    await fetch(`/api/nodes/${nodeId}`, { method: 'DELETE' });
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    await fetchData();
  };

  // Handler: Move or Resize Node (Drag and Drop)
  const handleMoveNode = async (nodeId: string, newStartDate: string, newEndDate: string | null) => {
    // Optimistic local state update for instant feedback
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
    title: string;
    description?: string;
    parentTimelineId?: string | null;
    branchPointNodeId?: string | null;
  }) => {
    await fetch('/api/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timelineData)
    });
    await fetchData();
  };

  // Handler: Delete Timeline Track
  const handleDeleteTrack = async (timelineId: string) => {
    if (confirm('Are you sure you want to delete this timeline track and all its nodes?')) {
      await fetch(`/api/timeline/${timelineId}`, { method: 'DELETE' });
      await fetchData();
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

  // Handler: Insert Node Between Two Nodes (Sắp xếp node nếu bị chèn vào giữa)
  const handleInsertBetween = (
    timelineId: string,
    leftNode: TimelineNode,
    rightNode: TimelineNode
  ) => {
    const leftEnd = leftNode.endDate || leftNode.startDate;
    const rightStart = rightNode.startDate;

    // Calculate midpoint date
    const midDate = getMidpointDate(leftEnd, rightStart);

    setSelectedNode(null);
    setDefaultNodeTimelineId(timelineId);
    setDefaultNodeStartDate(midDate);
    // Suggest 7-day span
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101114] flex items-center justify-center font-mono text-xs text-[#9e9ea7]">
        Loading ChronoSync Studio...
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#101114] flex flex-col overflow-hidden">
      {/* Top Header */}
      <Header
        timelineCount={data.timelines.length}
        nodeCount={totalNodesCount}
        zoom={zoom}
        onZoomChange={setZoom}
        onCenterToday={() => canvasRef.current?.scrollToToday()}
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
      />

      {/* Main Interactive Canvas & Bottom Panel Container */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-[#101114]">
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
        />

        {/* Dedicated Buffer separating Canvas Scrollbar from Bottom Resize Splitter */}
        <div className="h-2 w-full bg-[#101114] flex-shrink-0" />

        {/* Horizontal Resizable Splitter Handle */}
        <div
          className={`relative z-40 h-2 w-full flex-shrink-0 cursor-row-resize group flex items-center justify-center transition-colors ${
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
      />
    </div>
  );
}
