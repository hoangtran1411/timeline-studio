'use client';

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo, useCallback } from 'react';
import { TimelineTrack, TimelineNode, NodeDependency, NodeStatus } from '@/types/timeline';
import { LeftTrackDock } from './LeftTrackDock';
import { ChronoRuler } from './ChronoRuler';
import { TimelineNodeCard } from './TimelineNodeCard';
import { BetweenNodeInserter } from './BetweenNodeInserter';
import { BranchConnectionLayer } from './BranchConnectionLayer';
import { ContextMenu, ContextMenuType } from './ContextMenu';
import { dateToPixelX, pixelXToDate, compareDateStrings } from '@/utils/date-utils';

export interface ChronoCanvasRef {
  scrollToToday: () => void;
  scrollToStart: () => void;
}

interface ChronoCanvasProps {
  timelines: TimelineTrack[];
  dependencies: NodeDependency[];
  originDate: Date;
  totalDays: number;
  pxPerDay: number;
  todayDateStr: string;
  selectedNode: TimelineNode | null;
  onSelectNode: (node: TimelineNode) => void;
  onAddNodeToTrack: (timelineId: string, defaultStartDate?: string) => void;
  onInsertNodeBetween: (timelineId: string, leftNode: TimelineNode, rightNode: TimelineNode) => void;
  onBranchTrack: (parentTimelineId: string, branchPointNodeId?: string) => void;
  onToggleVisibility?: (timelineId: string, isVisible: boolean) => void;
  onArchiveTrack?: (timelineId: string) => void;
  onDeleteTrack: (timelineId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onMoveNode: (nodeId: string, newStartDate: string, newEndDate: string | null) => Promise<void>;
  gridStyle?: 'notebook' | 'dots' | 'plain';
  onOpenAddTimeline?: () => void;
  selectedTrackId?: string | null;
  onSelectTrack?: (timelineId: string | null) => void;
  onDuplicateNode?: (node: TimelineNode) => void;
  onChangeNodeStatus?: (nodeId: string, status: NodeStatus) => void;
  onResetZoom?: () => void;
}

export const ChronoCanvas = forwardRef<ChronoCanvasRef, ChronoCanvasProps>(({
  timelines,
  dependencies,
  originDate,
  totalDays,
  pxPerDay,
  todayDateStr,
  selectedNode,
  onSelectNode,
  onAddNodeToTrack,
  onInsertNodeBetween,
  onBranchTrack,
  onToggleVisibility,
  onArchiveTrack,
  onDeleteTrack,
  onDeleteNode,
  onMoveNode,
  gridStyle = 'notebook',
  onOpenAddTimeline,
  selectedTrackId,
  onSelectTrack,
  onDuplicateNode,
  onChangeNodeStatus,
  onResetZoom
}, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const leftDockScrollRef = useRef<HTMLDivElement>(null);

  // Hovered track state for synchronized highlight across canvas and SVG wire layer
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  // Resizable sidebar dock state
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(320);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('timeline_studio_dock_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 220 && parsed <= 560) {
          setSidebarWidth(parsed);
        }
      }
    } catch (_) {}
  }, []);

  // Reset horizontal scroll position when project/origin date changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [originDate]);

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = sidebarWidth;
    setIsResizingSidebar(true);
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingSidebar) return;
    const delta = e.clientX - resizeStartX.current;
    const nextWidth = Math.max(220, Math.min(560, resizeStartWidth.current + delta));
    setSidebarWidth(nextWidth);
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingSidebar) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsResizingSidebar(false);
    try {
      localStorage.setItem('timeline_studio_dock_width', String(sidebarWidth));
    } catch (_) {}
  };

  const handleResizeDoubleClick = () => {
    setSidebarWidth(320);
    try {
      localStorage.setItem('timeline_studio_dock_width', '320');
    } catch (_) {}
  };

  // Synchronized bidirectional vertical scroll state between Canvas and Left Track Dock
  const activeScrollSource = useRef<'canvas' | 'dock' | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const setScrollSource = (source: 'canvas' | 'dock') => {
    activeScrollSource.current = source;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      activeScrollSource.current = null;
    }, 80);
  };

  const handleCanvasScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeScrollSource.current === 'dock') return;
    setScrollSource('canvas');

    if (leftDockScrollRef.current && leftDockScrollRef.current.scrollTop !== e.currentTarget.scrollTop) {
      leftDockScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleDockScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeScrollSource.current === 'canvas') return;
    setScrollSource('dock');

    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop !== e.currentTarget.scrollTop) {
      scrollContainerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleScrollToToday = useCallback(() => {
    if (scrollContainerRef.current) {
      const todayX = dateToPixelX(todayDateStr, originDate, pxPerDay);
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, todayX - containerWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [todayDateStr, originDate, pxPerDay]);

  const handleScrollToStart = useCallback(() => {
    if (scrollContainerRef.current) {
      let earliestX = 0;
      let found = false;
      timelines.forEach(track => {
        track.nodes.forEach(node => {
          const x = dateToPixelX(node.startDate, originDate, pxPerDay);
          if (!found || x < earliestX) {
            earliestX = x;
            found = true;
          }
        });
      });
      const targetLeft = found ? Math.max(0, earliestX - 40) : 0;
      scrollContainerRef.current.scrollTo({
        left: targetLeft,
        behavior: 'smooth'
      });
    }
  }, [timelines, originDate, pxPerDay]);

  useImperativeHandle(ref, () => ({
    scrollToToday: handleScrollToToday,
    scrollToStart: handleScrollToStart
  }), [handleScrollToToday, handleScrollToStart]);

  // Calculate track heights based on the maximum collision lane within that track
  const getTrackHeight = useCallback((track: TimelineTrack): number => {
    let maxLane = 0;
    track.nodes.forEach((n) => {
      if (n.lane !== undefined && n.lane > maxLane) {
        maxLane = n.lane;
      }
    });
    // Expanded track height: 210px base for lane 0 (28px wire top margin + 28px hanger + 120px card + 34px bottom padding)
    // +130px for each collision lane so cards and hover toolbars never overflow into adjacent tracks
    return Math.max(210, 210 + maxLane * 130);
  }, []);

  // Dynamically assign visual collision lanes based on actual card pixel positions & widths
  const computedTimelines: TimelineTrack[] = useMemo(() => {
    const MAX_STAGGER_LANES = 3; // Allows lane 0, lane 1, lane 2 (staggered dropdowns)

    return timelines.map((track) => {
      // Sort nodes chronologically with tie-breaker
      const sortedNodes = [...track.nodes].sort((a, b) => {
        const diff = compareDateStrings(a.startDate, b.startDate);
        if (diff !== 0) return diff;
        if (a.endDate && b.endDate) {
          const endDiff = compareDateStrings(a.endDate, b.endDate);
          if (endDiff !== 0) return endDiff;
        }
        return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      });

      // Track the rightmost pixel boundary of each lane
      const laneEndPixels: number[] = [];

      const assignedNodes = sortedNodes.map((node) => {
        const startX = dateToPixelX(node.startDate, originDate, pxPerDay);
        let nodeWidth = 160;
        if (node.endDate) {
          const endX = dateToPixelX(node.endDate, originDate, pxPerDay);
          nodeWidth = Math.max(160, Math.min(360, endX - startX + 160));
        }

        // Check custom card width saved in localStorage
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('timeline_studio_card_widths');
            if (raw) {
              const map = JSON.parse(raw);
              if (typeof map[node.id] === 'number') {
                nodeWidth = Math.max(160, Math.min(900, map[node.id]));
              }
            }
          } catch (_) {}
        }

        const endX = startX + nodeWidth;
        const requiredSpacing = 24; // 24px clean visual margin between cards in the same lane

        // Find the lowest lane where this card fits without overlapping
        let placedLane = -1;
        for (let i = 0; i < laneEndPixels.length && i < MAX_STAGGER_LANES; i++) {
          if (laneEndPixels[i] + requiredSpacing <= startX) {
            placedLane = i;
            laneEndPixels[i] = endX;
            break;
          }
        }

        // If no existing lane fits and we haven't reached MAX_STAGGER_LANES, drop down to the next lane
        if (placedLane === -1) {
          if (laneEndPixels.length < MAX_STAGGER_LANES) {
            placedLane = laneEndPixels.length;
            laneEndPixels.push(endX);
          } else {
            // Find the lane with the earliest end pixel and place there
            let earliestLane = 0;
            let minEnd = laneEndPixels[0];
            for (let i = 1; i < laneEndPixels.length; i++) {
              if (laneEndPixels[i] < minEnd) {
                minEnd = laneEndPixels[i];
                earliestLane = i;
              }
            }
            placedLane = earliestLane;
            laneEndPixels[earliestLane] = Math.max(laneEndPixels[earliestLane], endX);
          }
        }

        return {
          ...node,
          lane: placedLane
        };
      });

      return {
        ...track,
        nodes: assignedNodes
      };
    });
  }, [timelines, originDate, pxPerDay]);

  // Filter visible tracks for canvas rendering
  const visibleTimelines: TimelineTrack[] = useMemo(() => {
    return computedTimelines.filter((t: TimelineTrack) => t.isVisible !== false);
  }, [computedTimelines]);

  const getTrackTopOffset = useCallback((trackIndex: number): number => {
    let offset = 64; // height of top ruler
    for (let i = 0; i < trackIndex; i++) {
      offset += getTrackHeight(visibleTimelines[i]);
    }
    return offset;
  }, [visibleTimelines, getTrackHeight]);

  const canvasWidth = Math.max(1400, Math.round(totalDays * pxPerDay));
  let totalTrackHeights = 0;
  visibleTimelines.forEach(t => totalTrackHeights += getTrackHeight(t));
  const totalCanvasHeight = 64 + totalTrackHeights + 28;

  // Handle clicking empty area in a track to create a node at that exact date
  const handleTrackBackgroundClick = (e: React.MouseEvent<HTMLDivElement>, timelineId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedDate = pixelXToDate(clickX, originDate, pxPerDay);
    onAddNodeToTrack(timelineId, clickedDate);
  };

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    type: ContextMenuType;
    track?: TimelineTrack;
    node?: TimelineNode;
    clickedDate?: string;
    leftNeighborNode?: TimelineNode;
    rightNeighborNode?: TimelineNode;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'canvas'
  });

  const handleCloseContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  const handleNodeContextMenu = (e: React.MouseEvent, node: TimelineNode, track: TimelineTrack) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'node',
      node,
      track
    });
  };

  const handleTrackContextMenu = (e: React.MouseEvent, track: TimelineTrack) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedDate = pixelXToDate(clickX, originDate, pxPerDay);

    const sortedNodes = [...track.nodes].sort((a, b) => compareDateStrings(a.startDate, b.startDate));
    let leftNeighbor: TimelineNode | undefined;
    let rightNeighbor: TimelineNode | undefined;

    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const curr = sortedNodes[i];
      const next = sortedNodes[i + 1];
      const currX = dateToPixelX(curr.startDate, originDate, pxPerDay);
      const nextX = dateToPixelX(next.startDate, originDate, pxPerDay);
      if (clickX >= currX && clickX <= nextX) {
        leftNeighbor = curr;
        rightNeighbor = next;
        break;
      }
    }

    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'track',
      track,
      clickedDate,
      leftNeighborNode: leftNeighbor,
      rightNeighborNode: rightNeighbor
    });
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    let clickedDate = todayDateStr;
    if (scrollContainerRef.current) {
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const canvasX = e.clientX - containerRect.left + scrollLeft;
      clickedDate = pixelXToDate(canvasX, originDate, pxPerDay);
    }
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'canvas',
      clickedDate
    });
  };

  const handleDockTrackContextMenu = (e: React.MouseEvent, track: TimelineTrack) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'dock_track',
      track
    });
  };

  const handleEmptyDockContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'dock_empty'
    });
  };

  return (
    <div className="relative w-full flex-1 flex overflow-hidden min-h-[280px] bg-[#101114] border-b border-[#222328]">
      {/* Left Dock: Track names, branch metadata, controls */}
      <LeftTrackDock
        timelines={computedTimelines}
        width={sidebarWidth}
        onAddNodeToTrack={(id) => onAddNodeToTrack(id)}
        onBranchTrack={(id) => onBranchTrack(id)}
        onToggleVisibility={onToggleVisibility}
        onArchiveTrack={onArchiveTrack}
        onDeleteTrack={onDeleteTrack}
        getTrackHeight={getTrackHeight}
        scrollRef={leftDockScrollRef}
        onScroll={handleDockScroll}
        onWheel={() => { activeScrollSource.current = 'dock'; }}
        onPointerDown={() => { activeScrollSource.current = 'dock'; }}
        onOpenAddTimeline={onOpenAddTimeline}
        selectedTrackId={selectedTrackId}
        onSelectTrack={onSelectTrack}
        hoveredTrackId={hoveredTrackId}
        onHoverTrack={setHoveredTrackId}
        onTrackContextMenu={handleDockTrackContextMenu}
        onEmptyDockContextMenu={handleEmptyDockContextMenu}
      />

      {/* Resizable Divider Splitter Handle */}
      <div
        className={`relative z-30 w-1.5 flex-shrink-0 cursor-col-resize group flex items-center justify-center transition-colors ${
          isResizingSidebar ? 'bg-[#ececf0]' : 'bg-[#222328] hover:bg-[#3e404b]'
        }`}
        title="Drag to resize track panel (Double-click to reset to default)"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onDoubleClick={handleResizeDoubleClick}
      >
        {/* Center Grip Pill */}
        <div className="absolute w-3.5 h-8 rounded flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1c1d22] border border-[#2a2b32] pointer-events-none shadow-md">
          <span className="w-0.5 h-0.5 rounded-full bg-[#9e9ea7]" />
          <span className="w-0.5 h-0.5 rounded-full bg-[#9e9ea7]" />
          <span className="w-0.5 h-0.5 rounded-full bg-[#9e9ea7]" />
        </div>
      </div>

      {/* Right Scrollable Canvas with Full-Coverage Background Grid */}
      <div
        ref={scrollContainerRef}
        onScroll={handleCanvasScroll}
        onWheel={() => { activeScrollSource.current = 'canvas'; }}
        onPointerDown={() => { activeScrollSource.current = 'canvas'; }}
        className={`flex-1 overflow-x-auto overflow-y-auto relative timeline-scrollbar ${
          gridStyle === 'notebook'
            ? 'notebook-grid'
            : gridStyle === 'dots'
            ? 'notebook-dot-grid'
            : 'bg-[#111215]'
        }`}
      >
        <div
          style={{
            width: `${canvasWidth}px`,
            minWidth: '100%',
            minHeight: '100%'
          }}
          className="relative min-w-full min-h-full flex flex-col"
        >
          {/* Top Sticky Time Ruler */}
          <ChronoRuler
            originDate={originDate}
            totalDays={totalDays}
            pxPerDay={pxPerDay}
            todayDateStr={todayDateStr}
          />

          {/* SVG Branches and Dependencies Layer */}
          <BranchConnectionLayer
            timelines={visibleTimelines}
            dependencies={dependencies}
            originDate={originDate}
            pxPerDay={pxPerDay}
            canvasWidth={canvasWidth}
            totalCanvasHeight={totalCanvasHeight}
            getTrackTopOffset={getTrackTopOffset}
            selectedTrackId={selectedTrackId}
            hoveredTrackId={hoveredTrackId}
            selectedNodeId={selectedNode?.id || null}
          />

          {/* Tracks Stack */}
          <div
            className="flex flex-col pb-6 relative z-10"
            onClick={(e) => {
              if (e.target === e.currentTarget && selectedTrackId) {
                onSelectTrack?.(null);
              }
            }}
          >
            {visibleTimelines.map((track) => {
              const trackHeight = getTrackHeight(track);
              const isSelectedTrack = selectedTrackId === track.id;
              const isHoveredTrack = hoveredTrackId === track.id;

              // Pre-sorted and collision-assigned nodes
              const sortedNodes = track.nodes;

              return (
                <div
                  key={track.id}
                  style={{
                    height: `${trackHeight}px`,
                    minHeight: `${trackHeight}px`,
                    maxHeight: `${trackHeight}px`
                  }}
                  className={`relative group/track transition-all duration-200 flex-shrink-0 box-border overflow-visible border-b border-[#222328] ${
                    isSelectedTrack
                      ? 'bg-[#15161c]/80 ring-1 ring-inset ring-[#ffffff]/25 shadow-inner opacity-100 z-10'
                      : isHoveredTrack
                      ? 'bg-[#15161c]/80 ring-1 ring-inset ring-[#ffffff]/25 shadow-inner opacity-100 z-10'
                      : selectedTrackId
                      ? 'opacity-35'
                      : 'hover:bg-[#141519]/40 opacity-100'
                  }`}
                  onClick={() => onSelectTrack?.(track.id)}
                  onDoubleClick={(e) => handleTrackBackgroundClick(e, track.id)}
                  onMouseEnter={() => setHoveredTrackId(track.id)}
                  onMouseLeave={() => setHoveredTrackId(null)}
                  onContextMenu={(e) => handleTrackContextMenu(e, track)}
                >
                  {/* Render Gap Inserters between adjacent nodes (active or hovered tracks) */}
                  {(!selectedTrackId || isSelectedTrack || isHoveredTrack) && sortedNodes.map((currNode, idx) => {
                    if (idx === sortedNodes.length - 1) return null;
                    const nextNode = sortedNodes[idx + 1];

                    const currEndX = currNode.endDate
                      ? dateToPixelX(currNode.endDate, originDate, pxPerDay) + 160
                      : dateToPixelX(currNode.startDate, originDate, pxPerDay) + 160;

                    const nextStartX = dateToPixelX(nextNode.startDate, originDate, pxPerDay);
                    const gapWidth = nextStartX - currEndX;

                    return (
                      <BetweenNodeInserter
                        key={`gap-${currNode.id}-${nextNode.id}`}
                        timelineId={track.id}
                        leftNode={currNode}
                        rightNode={nextNode}
                        pixelLeft={currEndX}
                        pixelWidth={gapWidth}
                        onInsertBetween={onInsertNodeBetween}
                      />
                    );
                  })}

                  {/* Render Node Cards with lane-prioritized and chronological z-index */}
                  {sortedNodes.map((node, chronoIndex) => {
                    const startX = dateToPixelX(node.startDate, originDate, pxPerDay);
                    let nodeWidth = 160;
                    if (node.endDate) {
                      const endX = dateToPixelX(node.endDate, originDate, pxPerDay);
                      nodeWidth = Math.max(160, Math.min(360, endX - startX + 160));
                    }

                    // Layering base: Upper lanes (lane 0) MUST have higher z-index than lower lanes (lane 1, 2)
                    // so that hanger stems extending down to lower lanes pass cleanly BEHIND upper lane cards.
                    // Within the same lane, chronologically later cards layer slightly higher.
                    const laneBaseZ = Math.max(0, 4 - (node.lane || 0)) * 1000;
                    const cardZIndex = laneBaseZ + (chronoIndex % 500);

                    return (
                      <TimelineNodeCard
                        key={node.id}
                        node={node}
                        pixelLeft={startX}
                        pixelWidth={nodeWidth}
                        lane={node.lane || 0}
                        pxPerDay={pxPerDay}
                        zIndex={cardZIndex}
                        isSelected={selectedNode?.id === node.id}
                        onSelect={onSelectNode}
                        onAddAfter={(n) => {
                          const date = n.endDate || n.startDate;
                          onAddNodeToTrack(track.id, date);
                        }}
                        onBranchFromNode={(n) => onBranchTrack(track.id, n.id)}
                        onDelete={onDeleteNode}
                        onMoveNode={onMoveNode}
                        onContextMenu={(e, n) => handleNodeContextMenu(e, n, track)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Empty Canvas Area below tracks filling remaining vertical viewport */}
          <div
            className="flex-1 min-h-[160px] cursor-pointer group/empty flex items-start justify-center pt-8"
            onClick={() => {
              if (selectedTrackId) {
                onSelectTrack?.(null);
              }
            }}
            onDoubleClick={(e) => {
              if (timelines.length > 0) {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickedDate = pixelXToDate(clickX, originDate, pxPerDay);
                onAddNodeToTrack(timelines[0].id, clickedDate);
              } else if (onOpenAddTimeline) {
                onOpenAddTimeline();
              }
            }}
            onContextMenu={handleCanvasContextMenu}
            title={selectedTrackId ? "Click empty canvas to track all timelines (Double-click to add a milestone)" : "Double-click empty grid to add a milestone"}
          >
            <div className="opacity-0 group-hover/empty:opacity-100 transition-opacity px-4 py-2 rounded border border-dashed border-[#2a2b32] bg-[#141519]/80 text-[#71717a] text-xs font-mono flex items-center gap-2 pointer-events-none">
              <span>{selectedTrackId ? 'Click empty canvas to track all timelines • Double-click to add milestone' : '+ Double-click to add milestone to canvas'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Right-Click Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        type={contextMenu.type}
        track={contextMenu.track}
        node={contextMenu.node}
        clickedDate={contextMenu.clickedDate}
        leftNeighborNode={contextMenu.leftNeighborNode}
        rightNeighborNode={contextMenu.rightNeighborNode}
        selectedTrackId={selectedTrackId}
        onClose={handleCloseContextMenu}
        onSelectNode={onSelectNode}
        onDuplicateNode={onDuplicateNode}
        onDeleteNode={onDeleteNode}
        onChangeNodeStatus={onChangeNodeStatus}
        onBranchFromNode={(n) => onBranchTrack(n.timelineId, n.id)}
        onAddNodeToTrack={onAddNodeToTrack}
        onInsertNodeBetween={onInsertNodeBetween}
        onBranchTrack={onBranchTrack}
        onToggleTrackVisibility={onToggleVisibility}
        onDeleteTrack={onDeleteTrack}
        onSelectTrack={onSelectTrack}
        onOpenAddTimeline={onOpenAddTimeline}
        onScrollToToday={handleScrollToToday}
        onScrollToStart={handleScrollToStart}
        onResetZoom={onResetZoom}
      />
    </div>
  );
});

ChronoCanvas.displayName = 'ChronoCanvas';
