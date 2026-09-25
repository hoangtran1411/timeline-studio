'use client';

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { TimelineTrack, TimelineNode, NodeDependency } from '@/types/timeline';
import { LeftTrackDock } from './LeftTrackDock';
import { ChronoRuler } from './ChronoRuler';
import { TimelineNodeCard } from './TimelineNodeCard';
import { BetweenNodeInserter } from './BetweenNodeInserter';
import { BranchConnectionLayer } from './BranchConnectionLayer';
import { dateToPixelX, pixelXToDate, getMidpointDate } from '@/utils/date-utils';

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
  onMoveNode
}, ref) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const leftDockScrollRef = useRef<HTMLDivElement>(null);

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
    // 130px minimum for 1 lane, and +88px for each collision lane to ensure no overlap
    return Math.max(130, (maxLane + 1) * 88 + 24);
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
  const totalCanvasHeight = 64 + totalTrackHeights;

  // Handle clicking empty area in a track to create a node at that exact date
  const handleTrackBackgroundClick = (e: React.MouseEvent<HTMLDivElement>, timelineId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedDate = pixelXToDate(clickX, originDate, pxPerDay);
    onAddNodeToTrack(timelineId, clickedDate);
  };

  return (
    <div className="relative w-full flex-1 flex overflow-hidden min-h-[280px] bg-[#101114]">
      {/* Left Dock: Track names, branch metadata, controls */}
      <LeftTrackDock
        timelines={timelines}
        width={sidebarWidth}
        onAddNodeToTrack={(id) => onAddNodeToTrack(id)}
        onBranchTrack={(id) => onBranchTrack(id)}
        onDeleteTrack={onDeleteTrack}
        getTrackHeight={getTrackHeight}
        scrollRef={leftDockScrollRef}
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

      {/* Right Scrollable Canvas */}
      <div
        ref={scrollContainerRef}
        onScroll={handleCanvasScroll}
        className="flex-1 overflow-x-auto overflow-y-auto relative timeline-scrollbar bg-[#121316]/50"
      >
        <div
          style={{ width: `${canvasWidth}px`, minHeight: `${totalCanvasHeight}px` }}
          className="relative"
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
          />

          {/* Tracks Stack */}
          <div className="flex flex-col divide-y divide-[#222328]">
            {timelines.map((track) => {
              const trackHeight = getTrackHeight(track);

              // Sort nodes chronologically for gap insertion calculation
              const sortedNodes = [...track.nodes].sort((a, b) => a.startDate.localeCompare(b.startDate));

              return (
                <div
                  key={track.id}
                  style={{
                    height: `${trackHeight}px`,
                    minHeight: `${trackHeight}px`,
                    maxHeight: `${trackHeight}px`
                  }}
                  className="relative group/track hover:bg-[#141519]/40 transition-colors flex-shrink-0 box-border overflow-hidden"
                  onDoubleClick={(e) => handleTrackBackgroundClick(e, track.id)}
                >
                  {/* Subtle horizontal guideline center */}
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-[#222328]/60 pointer-events-none" />

                  {/* Render Gap Inserters between adjacent nodes */}
                  {sortedNodes.map((currNode, idx) => {
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
                      nodeWidth = Math.max(160, endX - startX + 160);
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
        </div>
      </div>
    </div>
  );
});

ChronoCanvas.displayName = 'ChronoCanvas';
