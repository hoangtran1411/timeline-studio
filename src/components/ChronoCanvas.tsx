'use client';

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { TimelineTrack, TimelineNode, NodeDependency } from '@/types/timeline';
import { LeftTrackDock } from './LeftTrackDock';
import { ChronoRuler } from './ChronoRuler';
import { TimelineNodeCard } from './TimelineNodeCard';
import { BetweenNodeInserter } from './BetweenNodeInserter';
import { BranchConnectionLayer } from './BranchConnectionLayer';
import { dateToPixelX, pixelXToDate, getMidpointDate, compareDateStrings } from '@/utils/date-utils';

export interface ChronoCanvasRef {
  scrollToToday: () => void;
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
  onDeleteTrack: (timelineId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onMoveNode: (nodeId: string, newStartDate: string, newEndDate: string | null) => Promise<void>;
  gridStyle?: 'notebook' | 'dots' | 'plain';
  onOpenAddTimeline?: () => void;
  selectedTrackId?: string | null;
  onSelectTrack?: (timelineId: string) => void;
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
  onDeleteTrack,
  onDeleteNode,
  onMoveNode,
  gridStyle = 'notebook',
  onOpenAddTimeline,
  selectedTrackId,
  onSelectTrack
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

  const handleCanvasScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (leftDockScrollRef.current) {
      leftDockScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToToday: () => {
      if (scrollContainerRef.current) {
        const todayX = dateToPixelX(todayDateStr, originDate, pxPerDay);
        const containerWidth = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, todayX - containerWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }));

  // Calculate track heights based on the maximum collision lane within that track
  const getTrackHeight = (track: TimelineTrack): number => {
    let maxLane = 0;
    track.nodes.forEach((n) => {
      if (n.lane !== undefined && n.lane > maxLane) {
        maxLane = n.lane;
      }
    });
    // Expanded track height: 210px base for lane 0 (28px wire top margin + 28px hanger + 120px card + 34px bottom padding)
    // +130px for each collision lane so cards and hover toolbars never overflow into adjacent tracks
    return Math.max(210, 210 + maxLane * 130);
  };

  const getTrackTopOffset = (trackIndex: number): number => {
    let offset = 64; // height of top ruler
    for (let i = 0; i < trackIndex; i++) {
      offset += getTrackHeight(timelines[i]);
    }
    return offset;
  };

  const canvasWidth = Math.max(1400, Math.round(totalDays * pxPerDay));
  let totalTrackHeights = 0;
  timelines.forEach(t => totalTrackHeights += getTrackHeight(t));
  const totalCanvasHeight = 64 + totalTrackHeights + 28;

  // Handle clicking empty area in a track to create a node at that exact date
  const handleTrackBackgroundClick = (e: React.MouseEvent<HTMLDivElement>, timelineId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedDate = pixelXToDate(clickX, originDate, pxPerDay);
    onAddNodeToTrack(timelineId, clickedDate);
  };

  return (
    <div className="relative w-full flex-1 flex overflow-hidden min-h-[280px] bg-[#101114] border-b border-[#222328]">
      {/* Left Dock: Track names, branch metadata, controls */}
      <LeftTrackDock
        timelines={timelines}
        width={sidebarWidth}
        onAddNodeToTrack={(id) => onAddNodeToTrack(id)}
        onBranchTrack={(id) => onBranchTrack(id)}
        onDeleteTrack={onDeleteTrack}
        getTrackHeight={getTrackHeight}
        scrollRef={leftDockScrollRef}
        onOpenAddTimeline={onOpenAddTimeline}
        selectedTrackId={selectedTrackId}
        onSelectTrack={onSelectTrack}
      />

      {/* Resizable Divider Splitter Handle */}
      <div
        className={`relative z-40 w-1.5 flex-shrink-0 cursor-col-resize group flex items-center justify-center transition-colors ${
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
            timelines={timelines}
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
          <div className="flex flex-col pb-6">
            {timelines.map((track) => {
              const trackHeight = getTrackHeight(track);
              const isSelectedTrack = selectedTrackId === track.id;
              const isHoveredTrack = hoveredTrackId === track.id;

              // Sort nodes chronologically for gap insertion calculation
              const sortedNodes = [...track.nodes].sort((a, b) => compareDateStrings(a.startDate, b.startDate));

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
                      ? 'bg-[#15161c]/80 ring-1 ring-inset ring-[#ffffff]/25 shadow-inner opacity-100'
                      : selectedTrackId
                      ? isHoveredTrack
                        ? 'bg-[#141519]/70 opacity-85'
                        : 'opacity-35'
                      : 'hover:bg-[#141519]/40 opacity-100'
                  }`}
                  onClick={() => onSelectTrack?.(track.id)}
                  onDoubleClick={(e) => handleTrackBackgroundClick(e, track.id)}
                  onMouseEnter={() => setHoveredTrackId(track.id)}
                  onMouseLeave={() => setHoveredTrackId(null)}
                >
                  {/* Render Gap Inserters between adjacent nodes (active tracks only) */}
                  {(!selectedTrackId || isSelectedTrack) && sortedNodes.map((currNode, idx) => {
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

                  {/* Render Node Cards */}
                  {track.nodes.map((node) => {
                    const startX = dateToPixelX(node.startDate, originDate, pxPerDay);
                    let nodeWidth = 160;
                    if (node.endDate) {
                      const endX = dateToPixelX(node.endDate, originDate, pxPerDay);
                      nodeWidth = Math.max(160, Math.min(360, endX - startX + 160));
                    }

                    return (
                      <TimelineNodeCard
                        key={node.id}
                        node={node}
                        pixelLeft={startX}
                        pixelWidth={nodeWidth}
                        lane={node.lane || 0}
                        pxPerDay={pxPerDay}
                        isSelected={selectedNode?.id === node.id}
                        onSelect={onSelectNode}
                        onAddAfter={(n) => {
                          const date = n.endDate || n.startDate;
                          onAddNodeToTrack(track.id, date);
                        }}
                        onBranchFromNode={(n) => onBranchTrack(track.id, n.id)}
                        onDelete={onDeleteNode}
                        onMoveNode={onMoveNode}
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
            title="Double-click empty grid to add a milestone"
          >
            <div className="opacity-0 group-hover/empty:opacity-100 transition-opacity px-4 py-2 rounded border border-dashed border-[#2a2b32] bg-[#141519]/80 text-[#71717a] text-xs font-mono flex items-center gap-2 pointer-events-none">
              <span>+ Double-click to add milestone to canvas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChronoCanvas.displayName = 'ChronoCanvas';
