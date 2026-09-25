'use client';

import React from 'react';
import { TimelineTrack, NodeDependency, TimelineNode } from '@/types/timeline';
import { dateToPixelX, compareDateStrings } from '@/utils/date-utils';

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
  knotX: number;
  knotY: number;
  cardTop: number;
  cardBottom: number;
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
  // Helper to compute node bounding coordinates and knot position on the clothesline
  const computeNodeCoords = (node: TimelineNode, trackIndex: number): NodeCoords => {
    const leftX = dateToPixelX(node.startDate, originDate, pxPerDay);
    let width = 160;
    if (node.endDate) {
      const endX = dateToPixelX(node.endDate, originDate, pxPerDay);
      width = Math.max(160, Math.min(360, endX - leftX + 160));
    }
    const rightX = leftX + width;
    const lane = node.lane || 0;
    const trackTop = getTrackTopOffset(trackIndex);
    const wireY = trackTop + 28; // The horizontal clothesline wire Y
    const knotX = leftX + 24;   // Center of the knot peg (left-6 = 24px)
    const knotY = wireY;
    const cardTop = trackTop + 56 + lane * 130;
    const cardBottom = cardTop + 110;
    const centerY = (cardTop + cardBottom) / 2;

    return {
      node,
      trackIndex,
      lane,
      leftX,
      rightX,
      knotX,
      knotY,
      cardTop,
      cardBottom,
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

  // 1. Generate horizontal clothesline wires and tension anchors for each track
  const clotheslineWires: Array<{
    trackId: string;
    wireY: number;
    startX: number;
    endX: number;
  }> = [];

  const leadInWires: Array<{
    startX: number;
    endX: number;
    wireY: number;
    status: string;
  }> = [];

  const knotWireSegments: Array<{
    id: string;
    startX: number;
    endX: number;
    wireY: number;
    status: string;
  }> = [];

  const futureWires: Array<{
    startX: number;
    endX: number;
    wireY: number;
  }> = [];

  timelines.forEach((track, trackIndex) => {
    const trackTop = getTrackTopOffset(trackIndex);
    const wireY = trackTop + 28;
    const startX = 24;
    const endX = Math.max(canvasWidth - 32, 1200);

    // Continuous clothesline wire running across track
    clotheslineWires.push({
      trackId: track.id,
      wireY,
      startX,
      endX
    });

    // Sort nodes on this track chronologically
    const sortedNodes = [...track.nodes].sort((a, b) => compareDateStrings(a.startDate, b.startDate));
    if (sortedNodes.length === 0) return;

    // Lead-in wire before the first milestone knot
    const firstCoords = nodeMap.get(sortedNodes[0].id);
    if (firstCoords) {
      const leadStartX = Math.max(24, firstCoords.knotX - 48);
      leadInWires.push({
        startX: leadStartX,
        endX: firstCoords.knotX,
        wireY,
        status: firstCoords.node.status
      });
    }

    // Connect sequential milestone knots strictly from LEFT to RIGHT along the wire
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const curr = nodeMap.get(sortedNodes[i].id);
      const next = nodeMap.get(sortedNodes[i + 1].id);
      if (!curr || !next) continue;

      knotWireSegments.push({
        id: `wire-segment-${curr.node.id}-${next.node.id}`,
        startX: curr.knotX,
        endX: next.knotX,
        wireY,
        status: curr.node.status
      });
    }

    // Future continuation wire with forward arrow after the last milestone knot
    const lastCoords = nodeMap.get(sortedNodes[sortedNodes.length - 1].id);
    if (lastCoords) {
      futureWires.push({
        startX: lastCoords.knotX,
        endX: lastCoords.knotX + 64,
        wireY
      });
    }
  });

  // 2. Calculate branch offshoots flowing forward and down from parent knot to child wire
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
        // Branch emerges from the parent knot peg on the clothesline
        const startX = parentCoords.knotX;
        const startY = parentCoords.knotY;

        const childTrackTop = getTrackTopOffset(trackIndex);
        const childWireY = childTrackTop + 28;

        // Find child's first node or default landing point
        const childSortedNodes = [...track.nodes].sort((a, b) => compareDateStrings(a.startDate, b.startDate));
        let endX = startX + 64;
        const endY = childWireY;

        if (childSortedNodes.length > 0) {
          const firstChildCoords = nodeMap.get(childSortedNodes[0].id);
          if (firstChildCoords) {
            endX = Math.max(startX + 48, firstChildCoords.knotX);
          }
        }

        // Smooth cubic bezier flowing forward (LEFT to RIGHT) and down to child clothesline
        const deltaX = Math.max(48, endX - startX);
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
          label: track.title
        });
      }
    }
  });

  // 3. Calculate dependencies between knots
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
      const startX = fromInfo.knotX;
      const startY = fromInfo.knotY;
      const endX = toInfo.knotX;
      const endY = toInfo.knotY;

      let path = '';
      if (startY === endY) {
        // Same track dependency: gentle upward arched curve over the clothesline wire
        const midX = (startX + endX) / 2;
        const archY = startY - Math.min(28, Math.max(14, Math.abs(endX - startX) * 0.12));
        path = `M ${startX} ${startY} Q ${midX} ${archY}, ${endX} ${endY}`;
      } else {
        // Cross-track dependency: smooth cubic bezier forward and up/down
        const deltaX = Math.max(36, Math.abs(endX - startX));
        const cp1x = startX + deltaX * 0.4;
        const cp2x = endX - deltaX * 0.4;
        path = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
      }

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

  // 4. Calculate continuous path along clothesline wire for the traveling light beam on selected track
  const selectedTrackPath = React.useMemo(() => {
    if (!selectedTrackId) return null;
    const track = timelines.find((t) => t.id === selectedTrackId);
    if (!track) return null;

    const sortedNodes = [...track.nodes].sort((a, b) => compareDateStrings(a.startDate, b.startDate));
    if (sortedNodes.length === 0) return null;

    const coords = sortedNodes.map((n) => nodeMap.get(n.id)).filter(Boolean) as NodeCoords[];
    if (coords.length === 0) return null;

    const wireY = coords[0].knotY;
    const startX = Math.max(24, coords[0].knotX - 48);
    const endX = coords[coords.length - 1].knotX + 64;

    // The light beam travels horizontally straight along the clothesline wire through every knot
    return `M ${startX} ${wireY} L ${endX} ${wireY}`;
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

      {/* 1. Underlying Continuous Clothesline Wires across each track */}
      {clotheslineWires.map((wire) => (
        <g key={wire.trackId}>
          {/* Subtle background taut wire */}
          <line
            x1={wire.startX}
            y1={wire.wireY}
            x2={wire.endX}
            y2={wire.wireY}
            stroke="#262731"
            strokeWidth="1.5"
          />

          {/* Left Wall Hook / Tension Eyelet */}
          <g>
            <circle cx={wire.startX} cy={wire.wireY} r="4.5" fill="#181920" stroke="#454754" strokeWidth="1.5" />
            <circle cx={wire.startX} cy={wire.wireY} r="1.5" fill="#ececf0" />
          </g>

          {/* Right End Tension Bracket */}
          <g>
            <rect
              x={wire.endX - 7}
              y={wire.wireY - 3}
              width="7"
              height="6"
              rx="1"
              fill="#181920"
              stroke="#454754"
              strokeWidth="1"
            />
            <line
              x1={wire.endX}
              y1={wire.wireY - 4.5}
              x2={wire.endX}
              y2={wire.wireY + 4.5}
              stroke="#52525b"
              strokeWidth="1.5"
            />
          </g>
        </g>
      ))}

      {/* 2. Lead-In Wires entering first milestone on each track */}
      {leadInWires.map((lead, idx) => (
        <line
          key={`leadin-${idx}`}
          x1={lead.startX}
          y1={lead.wireY}
          x2={lead.endX}
          y2={lead.wireY}
          stroke="#383a45"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      ))}

      {/* 3. Active Clothesline Wire Segments between Knots */}
      {knotWireSegments.map((seg) => {
        const isCompleted = seg.status === 'completed';
        const isInProgress = seg.status === 'in_progress';
        const midX = (seg.startX + seg.endX) / 2;
        const segColor = isCompleted ? '#ececf0' : isInProgress ? '#9e9ea7' : '#454754';

        return (
          <g key={seg.id}>
            {/* Contrast shadow behind wire */}
            <line
              x1={seg.startX}
              y1={seg.wireY}
              x2={seg.endX}
              y2={seg.wireY}
              stroke="#101114"
              strokeWidth="3.5"
            />
            {/* Illuminated / active taut wire running cleanly between knots */}
            <line
              x1={seg.startX}
              y1={seg.wireY}
              x2={seg.endX}
              y2={seg.wireY}
              stroke={segColor}
              strokeWidth={isCompleted ? '2' : '1.5'}
              strokeDasharray={isCompleted ? undefined : isInProgress ? '5 3' : '4 4'}
            />
            {/* Mid-span subtle flow chevron (direction indicator without poking into knot) */}
            {seg.endX - seg.startX >= 36 && (
              <path
                d={`M ${midX - 3} ${seg.wireY - 3.5} L ${midX + 2} ${seg.wireY} L ${midX - 3} ${seg.wireY + 3.5}`}
                fill="none"
                stroke={segColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}

      {/* 4. Future Trajectory Wires (continuing past the last knot) */}
      {futureWires.map((fw, idx) => (
        <line
          key={`future-${idx}`}
          x1={fw.startX}
          y1={fw.wireY}
          x2={fw.endX}
          y2={fw.wireY}
          stroke="#3f3f46"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          markerEnd="url(#future-arrow)"
        />
      ))}

      {/* 5. Branch Offshoots (Dropping gracefully from parent knot to child wire) */}
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
          {/* Branch indicator pill */}
          <rect
            x={branch.startX + 18}
            y={(branch.startY + branch.endY) / 2 - 9}
            width="82"
            height="18"
            rx="4"
            fill="#18191e"
            stroke="#2a2b32"
            strokeWidth="1"
          />
          <text
            x={branch.startX + 59}
            y={(branch.startY + branch.endY) / 2 + 3}
            textAnchor="middle"
            fill="#9e9ea7"
            fontSize="9"
            fontFamily="monospace"
          >
            ⑂ {branch.label.length > 9 ? branch.label.slice(0, 9) + '…' : branch.label}
          </text>
        </g>
      ))}

      {/* 6. Inter-Node Dependencies between Knots */}
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
        </g>
      ))}

      {/* 7. Traveling Light Beam on Selected Track (Tia sáng di chuyển dọc sợi dây clothesline qua các nút) */}
      {selectedTrackPath && (
        <g key={`beam-${selectedTrackId}`} className="pointer-events-none">
          {/* Luminous aura track pulse */}
          <path
            d={selectedTrackPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeOpacity="0.85"
            strokeLinecap="round"
            filter="url(#beam-glow)"
            strokeDasharray="80 1200"
            className="timeline-laser-tail"
          />

          {/* High-intensity crisp core laser beam */}
          <path
            d={selectedTrackPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="45 1200"
            className="timeline-laser-core"
          />

          {/* Traveling Spark / Photon Head that glides along the clothesline wire through each knot */}
          <g>
            <animateMotion
              path={selectedTrackPath}
              dur="3.6s"
              repeatCount="indefinite"
            />
            {/* Soft outer glow */}
            <circle cx="0" cy="0" r="9" fill="#ffffff" opacity="0.25" filter="url(#beam-glow)" />
            {/* Inner halo */}
            <circle cx="0" cy="0" r="4.5" fill="#ececf0" opacity="0.8" />
            {/* Bright spark center */}
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
          </g>
        </g>
      )}
    </svg>
  );
};
