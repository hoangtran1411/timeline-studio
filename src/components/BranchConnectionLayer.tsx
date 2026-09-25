'use client';

import React from 'react';
import { TimelineTrack, NodeDependency, TimelineNode } from '@/types/timeline';
import { dateToPixelX } from '@/utils/date-utils';

interface BranchConnectionLayerProps {
  timelines: TimelineTrack[];
  dependencies: NodeDependency[];
  originDate: Date;
  pxPerDay: number;
  canvasWidth: number;
  totalCanvasHeight: number;
  getTrackTopOffset: (trackIndex: number) => number;
  selectedTrackId?: string | null;
}

interface NodeCoords {
  node: TimelineNode;
  trackIndex: number;
  lane: number;
  leftX: number;
  rightX: number;
  centerY: number;
}

export const BranchConnectionLayer: React.FC<BranchConnectionLayerProps> = ({
  timelines,
  dependencies,
  originDate,
  pxPerDay,
  canvasWidth,
  totalCanvasHeight,
  getTrackTopOffset,
  selectedTrackId
}) => {
  // Helper to compute node bounding coordinates
  const computeNodeCoords = (node: TimelineNode, trackIndex: number): NodeCoords => {
    const leftX = dateToPixelX(node.startDate, originDate, pxPerDay);
    let width = 160;
    if (node.endDate) {
      const endX = dateToPixelX(node.endDate, originDate, pxPerDay);
      width = Math.max(160, endX - leftX + 160);
    }
    const rightX = leftX + width;
    const lane = node.lane || 0;
    const trackTop = getTrackTopOffset(trackIndex);
    const centerY = trackTop + 16 + lane * 116 + 48; // center height of card (~96px)

    return {
      node,
      trackIndex,
      lane,
      leftX,
      rightX,
      centerY
    };
  };

  // Map all nodes by id for fast lookup
  const nodeMap = new Map<string, NodeCoords>();
  timelines.forEach((track, trackIndex) => {
    track.nodes.forEach((node) => {
      nodeMap.set(node.id, computeNodeCoords(node, trackIndex));
    });
  });

  // 1. Generate horizontal track rails and left-to-right milestone connectors for each track
  const trackSpines: Array<{
    trackId: string;
    baselineY: number;
    startX: number;
    endX: number;
  }> = [];

  const milestoneConnectors: Array<{
    id: string;
    path: string;
    status: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }> = [];

  const startCaps: Array<{ x: number; y: number }> = [];
  const futureArrows: Array<{ path: string; x: number; y: number }> = [];

  timelines.forEach((track, trackIndex) => {
    const trackTop = getTrackTopOffset(trackIndex);
    const baselineY = trackTop + 64; // lane 0 center line

    // Track baseline rail running horizontally across the canvas from left to right
    trackSpines.push({
      trackId: track.id,
      baselineY,
      startX: 32,
      endX: Math.max(canvasWidth - 48, 1200)
    });

    // Sort nodes on this track chronologically
    const sortedNodes = [...track.nodes].sort((a, b) => a.startDate.localeCompare(b.startDate));
    if (sortedNodes.length === 0) return;

    // Start anchor before first milestone
    const firstCoords = nodeMap.get(sortedNodes[0].id);
    if (firstCoords) {
      const startAnchorX = Math.max(32, firstCoords.leftX - 56);
      milestoneConnectors.push({
        id: `start-lead-${track.id}`,
        path: `M ${startAnchorX} ${firstCoords.centerY} L ${firstCoords.leftX} ${firstCoords.centerY}`,
        status: firstCoords.node.status,
        startX: startAnchorX,
        startY: firstCoords.centerY,
        endX: firstCoords.leftX,
        endY: firstCoords.centerY
      });
      startCaps.push({ x: startAnchorX, y: firstCoords.centerY });
    }

    // Connect sequential milestones strictly from LEFT to RIGHT
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const curr = nodeMap.get(sortedNodes[i].id);
      const next = nodeMap.get(sortedNodes[i + 1].id);
      if (!curr || !next) continue;

      const startX = curr.rightX;
      const startY = curr.centerY;
      const endX = next.leftX;
      const endY = next.centerY;

      let path = '';
      if (endX >= startX) {
        if (startY === endY) {
          // Direct horizontal straight line going from left to right
          path = `M ${startX} ${startY} L ${endX} ${endY}`;
        } else {
          // Smooth forward S-curve bezier transitioning between collision lanes
          const midX = (startX + endX) / 2;
          path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
        }
      } else {
        // In the event of overlapping cards on different lanes, forward curve
        const midX = Math.max(startX, endX) + 24;
        path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
      }

      milestoneConnectors.push({
        id: `connect-${curr.node.id}-${next.node.id}`,
        path,
        status: curr.node.status,
        startX,
        startY,
        endX,
        endY
      });
    }

    // Future continuation arrow after the last milestone
    const lastCoords = nodeMap.get(sortedNodes[sortedNodes.length - 1].id);
    if (lastCoords) {
      const futureEndX = lastCoords.rightX + 80;
      futureArrows.push({
        path: `M ${lastCoords.rightX} ${lastCoords.centerY} L ${futureEndX} ${lastCoords.centerY}`,
        x: futureEndX,
        y: lastCoords.centerY
      });
    }
  });

  // 2. Calculate branch lines flowing forward from parent milestone to child track
  const branchLines: Array<{
    id: string;
    path: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    label: string;
  }> = [];

  timelines.forEach((track, trackIndex) => {
    if (track.parentTimelineId && track.branchPointNodeId) {
      const parentCoords = nodeMap.get(track.branchPointNodeId);
      if (parentCoords) {
        // Branch emerges from the right side of the parent milestone
        const startX = parentCoords.rightX;
        const startY = parentCoords.centerY;

        const childTrackTop = getTrackTopOffset(trackIndex);
        const childBaselineY = childTrackTop + 64;

        // Find child's first node to connect to
        const childSortedNodes = [...track.nodes].sort((a, b) => a.startDate.localeCompare(b.startDate));
        let endX = startX + 64;
        let endY = childBaselineY;

        if (childSortedNodes.length > 0) {
          const firstChildCoords = nodeMap.get(childSortedNodes[0].id);
          if (firstChildCoords) {
            endX = Math.max(startX + 48, firstChildCoords.leftX);
            endY = firstChildCoords.centerY;
          }
        }

        // Smooth cubic bezier flowing forward (LEFT to RIGHT) and down to child track
        const deltaX = Math.max(40, endX - startX);
        const cp1x = startX + deltaX * 0.45;
        const cp1y = startY;
        const cp2x = endX - deltaX * 0.45;
        const cp2y = endY;

        const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

        branchLines.push({
          id: `branch-${track.id}`,
          path,
          startX,
          startY,
          endX,
          endY,
          label: `Branch: ${track.title}`
        });
      }
    }
  });

  // 3. Calculate dependencies flowing forward from fromNode to toNode
  const depLines: Array<{
    id: string;
    path: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    label?: string;
  }> = [];

  dependencies.forEach((dep) => {
    const fromInfo = nodeMap.get(dep.fromNodeId);
    const toInfo = nodeMap.get(dep.toNodeId);

    if (fromInfo && toInfo) {
      const startX = fromInfo.rightX;
      const startY = fromInfo.centerY;
      const endX = toInfo.leftX;
      const endY = toInfo.centerY;

      const deltaX = Math.max(30, Math.abs(endX - startX));
      const cp1x = startX + deltaX * 0.4;
      const cp2x = endX - deltaX * 0.4;

      const path = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;

      depLines.push({
        id: dep.id,
        path,
        startX,
        startY,
        endX,
        endY,
        label: dep.type
      });
    }
  });

  // 4. Calculate continuous path along selected track for the traveling light beam
  const selectedTrackPath = React.useMemo(() => {
    if (!selectedTrackId) return null;
    const track = timelines.find((t) => t.id === selectedTrackId);
    if (!track) return null;

    const sortedNodes = [...track.nodes].sort((a, b) => a.startDate.localeCompare(b.startDate));
    if (sortedNodes.length === 0) return null;

    const coords = sortedNodes.map((n) => nodeMap.get(n.id)).filter(Boolean) as NodeCoords[];
    if (coords.length === 0) return null;

    const first = coords[0];
    const startX = Math.max(32, first.leftX - 48);
    let d = `M ${startX} ${first.centerY} L ${first.leftX} ${first.centerY}`;

    for (let i = 0; i < coords.length; i++) {
      const curr = coords[i];
      d += ` L ${curr.rightX} ${curr.centerY}`;

      if (i < coords.length - 1) {
        const next = coords[i + 1];
        if (curr.centerY === next.centerY) {
          d += ` L ${next.leftX} ${next.centerY}`;
        } else {
          const midX = (curr.rightX + next.leftX) / 2;
          d += ` C ${midX} ${curr.centerY}, ${midX} ${next.centerY}, ${next.leftX} ${next.centerY}`;
        }
      }
    }

    const last = coords[coords.length - 1];
    d += ` L ${last.rightX + 80} ${last.centerY}`;
    return d;
  }, [selectedTrackId, timelines, nodeMap]);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${canvasWidth}px`,
        height: `${totalCanvasHeight}px`,
        pointerEvents: 'none',
        zIndex: 10
      }}
    >
      <defs>
        {/* Completed Timeline Flow Arrow */}
        <marker
          id="timeline-arrow-completed"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 1 2 L 7 5 L 1 8 z" fill="#ececf0" />
        </marker>

        {/* Planned / In-Progress Timeline Flow Arrow */}
        <marker
          id="timeline-arrow-planned"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 1 2 L 7 5 L 1 8 z" fill="#9e9ea7" />
        </marker>

        {/* Future Trajectory Arrow */}
        <marker
          id="future-arrow"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#71717a" />
        </marker>

        {/* Branch Fork Arrow */}
        <marker
          id="branch-arrow"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 1 2 L 7 5 L 1 8 z" fill="#ececf0" />
        </marker>

        {/* Dependency Arrow */}
        <marker
          id="dep-arrow"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ececf0" />
        </marker>

        {/* Soft bloom glow for traveling light beam */}
        <filter id="beam-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Underlying Track Rails (Spines) */}
      {trackSpines.map((spine) => (
        <g key={spine.trackId} opacity="0.45">
          <line
            x1={spine.startX}
            y1={spine.baselineY}
            x2={spine.endX}
            y2={spine.baselineY}
            stroke="#2a2b32"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <path
            d={`M ${spine.endX} ${spine.baselineY - 4} L ${spine.endX + 6} ${spine.baselineY} L ${spine.endX} ${spine.baselineY + 4}`}
            fill="none"
            stroke="#383a42"
            strokeWidth="1.5"
          />
        </g>
      ))}

      {/* 2. Track Origin Start Caps */}
      {startCaps.map((cap, idx) => (
        <g key={`start-cap-${idx}`}>
          <circle cx={cap.x} cy={cap.y} r="5" fill="#141519" stroke="#9e9ea7" strokeWidth="2" />
          <circle cx={cap.x} cy={cap.y} r="2" fill="#ececf0" />
        </g>
      ))}

      {/* 3. Sequential Milestone Connectors (Strictly Left to Right) */}
      {milestoneConnectors.map((conn) => {
        const isCompleted = conn.status === 'completed';
        const isInProgress = conn.status === 'in_progress';
        return (
          <g key={conn.id}>
            {/* Background shadow path for contrast against grid */}
            <path
              d={conn.path}
              fill="none"
              stroke="#101114"
              strokeWidth="4"
            />
            {/* Active timeline line */}
            <path
              d={conn.path}
              fill="none"
              stroke={isCompleted ? '#ececf0' : isInProgress ? '#9e9ea7' : '#52525b'}
              strokeWidth={isCompleted ? '2' : '1.5'}
              strokeDasharray={isCompleted ? undefined : '5 4'}
              markerEnd={isCompleted ? 'url(#timeline-arrow-completed)' : 'url(#timeline-arrow-planned)'}
            />
            {/* Node Exit Anchor Point */}
            <circle cx={conn.startX} cy={conn.startY} r="3" fill={isCompleted ? '#ececf0' : '#71717a'} />
          </g>
        );
      })}

      {/* 4. Future Trajectory Arrows (Flowing Forward into the Future) */}
      {futureArrows.map((fa, idx) => (
        <g key={`future-${idx}`}>
          <path
            d={fa.path}
            fill="none"
            stroke="#3f3f46"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            markerEnd="url(#future-arrow)"
          />
        </g>
      ))}

      {/* 5. Branch Offshoot Lines (Flowing Left to Right from Parent Node) */}
      {branchLines.map((branch) => (
        <g key={branch.id}>
          {/* Branch curve with smooth left-to-right flow */}
          <path
            d={branch.path}
            fill="none"
            stroke="#71717a"
            strokeWidth="2"
            strokeDasharray="6 4"
            markerEnd="url(#branch-arrow)"
          />
          {/* Branch start pivot anchor */}
          <circle cx={branch.startX} cy={branch.startY} r="4" fill="#141519" stroke="#ececf0" strokeWidth="2" />
          {/* Branch indicator pill */}
          <rect
            x={branch.startX + 16}
            y={(branch.startY + branch.endY) / 2 - 9}
            width="68"
            height="18"
            rx="4"
            fill="#18191e"
            stroke="#2a2b32"
            strokeWidth="1"
          />
          <text
            x={branch.startX + 50}
            y={(branch.startY + branch.endY) / 2 + 3}
            textAnchor="middle"
            fill="#9e9ea7"
            fontSize="9"
            fontFamily="monospace"
          >
            ⑂ Branch ➔
          </text>
        </g>
      ))}

      {/* 6. Inter-Node Dependencies (Flowing Left to Right) */}
      {depLines.map((dep) => (
        <g key={dep.id}>
          <path
            d={dep.path}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            markerEnd="url(#dep-arrow)"
          />
          <circle cx={dep.startX} cy={dep.startY} r="3.5" fill="#ececf0" />
        </g>
      ))}

      {/* 7. Traveling Light Beam on Selected Track (Tia sáng di chuyển từ đầu đến cuối timeline) */}
      {selectedTrackPath && (
        <g key={`beam-${selectedTrackId}`} className="pointer-events-none">
          {/* Luminous aura track pulse */}
          <path
            d={selectedTrackPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="4"
            strokeOpacity="0.85"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#beam-glow)"
            strokeDasharray="100 1400"
            className="timeline-laser-tail"
          />

          {/* High-intensity crisp core laser beam */}
          <path
            d={selectedTrackPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="60 1400"
            className="timeline-laser-core"
          />

          {/* Traveling Spark / Photon Head that glides along the timeline */}
          <g>
            <animateMotion
              path={selectedTrackPath}
              dur="3.5s"
              repeatCount="indefinite"
            />
            {/* Soft outer glow */}
            <circle cx="0" cy="0" r="10" fill="#ffffff" opacity="0.25" filter="url(#beam-glow)" />
            {/* Inner halo */}
            <circle cx="0" cy="0" r="5" fill="#ececf0" opacity="0.75" />
            {/* Bright spark center */}
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
          </g>
        </g>
      )}
    </svg>
  );
};
