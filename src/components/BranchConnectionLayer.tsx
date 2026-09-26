'use client';

import React, { useMemo } from 'react';
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
  hoveredTrackId?: string | null;
  selectedNodeId?: string | null;
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
  selectedTrackId,
  hoveredTrackId,
  selectedNodeId
}) => {
  // Map all nodes by id for fast lookup
  const nodeMap = useMemo(() => {
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

    const map = new Map<string, NodeCoords>();
    timelines.forEach((track, trackIndex) => {
      track.nodes.forEach((node) => {
        map.set(node.id, computeNodeCoords(node, trackIndex));
      });
    });
    return map;
  }, [timelines, originDate, pxPerDay, getTrackTopOffset]);

  // 1. Generate structured clothesline wires for each track
  const trackWires = timelines.map((track, trackIndex) => {
    const trackTop = getTrackTopOffset(trackIndex);
    const wireY = trackTop + 28;
    const startX = 24;
    const endX = Math.max(canvasWidth - 32, 1200);

    const sortedNodes = [...track.nodes].sort((a, b) => compareDateStrings(a.startDate, b.startDate));

    let leadIn: { startX: number; endX: number; status: string } | null = null;
    const segments: Array<{
      id: string;
      startX: number;
      endX: number;
      wireY: number;
      status: string;
    }> = [];
    let futureWire: { startX: number; endX: number; wireY: number } | null = null;

    if (sortedNodes.length > 0) {
      const firstCoords = nodeMap.get(sortedNodes[0].id);
      if (firstCoords) {
        // Approach the left boundary of the first knot (-11px)
        leadIn = {
          startX: Math.max(24, firstCoords.knotX - 48),
          endX: firstCoords.knotX - 11,
          status: firstCoords.node.status
        };
      }

      for (let i = 0; i < sortedNodes.length - 1; i++) {
        const curr = nodeMap.get(sortedNodes[i].id);
        const next = nodeMap.get(sortedNodes[i + 1].id);
        if (curr && next) {
          // Wire starts at the right perimeter of curr knot (+11px) and stops at left perimeter of next knot (-11px)
          const segStartX = curr.knotX + 11;
          const segEndX = next.knotX - 11;
          if (segEndX > segStartX) {
            segments.push({
              id: `wire-segment-${curr.node.id}-${next.node.id}`,
              startX: segStartX,
              endX: segEndX,
              wireY,
              status: curr.node.status
            });
          }
        }
      }

      const lastCoords = nodeMap.get(sortedNodes[sortedNodes.length - 1].id);
      if (lastCoords) {
        // Emerges from the right perimeter of the last knot (+11px)
        futureWire = {
          startX: lastCoords.knotX + 11,
          endX: lastCoords.knotX + 64,
          wireY
        };
      }
    }

    // Generate non-overlapping background wire spans that stop at knot perimeters
    const backgroundSpans: Array<{ startX: number; endX: number }> = [];
    const knotRadius = 11;

    if (sortedNodes.length === 0) {
      backgroundSpans.push({ startX, endX });
    } else {
      const firstCoords = nodeMap.get(sortedNodes[0].id);
      if (firstCoords && firstCoords.knotX - knotRadius > startX) {
        backgroundSpans.push({
          startX,
          endX: firstCoords.knotX - knotRadius
        });
      }

      for (let i = 0; i < sortedNodes.length - 1; i++) {
        const curr = nodeMap.get(sortedNodes[i].id);
        const next = nodeMap.get(sortedNodes[i + 1].id);
        if (curr && next) {
          const spanStart = curr.knotX + knotRadius;
          const spanEnd = next.knotX - knotRadius;
          if (spanEnd > spanStart) {
            backgroundSpans.push({
              startX: spanStart,
              endX: spanEnd
            });
          }
        }
      }

      const lastCoords = nodeMap.get(sortedNodes[sortedNodes.length - 1].id);
      if (lastCoords && endX > lastCoords.knotX + knotRadius) {
        backgroundSpans.push({
          startX: lastCoords.knotX + knotRadius,
          endX
        });
      }
    }

    return {
      trackId: track.id,
      wireY,
      startX,
      endX,
      leadIn,
      segments,
      futureWire,
      backgroundSpans
    };
  });

  // 2. Calculate branch offshoots flowing forward and down from parent knot to child wire
  const branchLines: Array<{
    id: string;
    trackId: string;
    parentTrackId: string;
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
        // Branch emerges cleanly from the outer perimeter of the parent knot (lower-right tangent)
        // Parent knot center is (parentCoords.knotX, parentCoords.knotY). Leaves at +9px, +7px
        const startX = parentCoords.knotX + 9;
        const startY = parentCoords.knotY + 7;

        const childTrackTop = getTrackTopOffset(trackIndex);
        const childWireY = childTrackTop + 28;

        // Find child's first node or default landing point
        const childSortedNodes = [...track.nodes].sort((a, b) => compareDateStrings(a.startDate, b.startDate));
        let endX = parentCoords.knotX + 64;
        let endY = childWireY;

        if (childSortedNodes.length > 0) {
          const firstChildCoords = nodeMap.get(childSortedNodes[0].id);
          if (firstChildCoords) {
            // Target the approach boundary of the child knot (stops 14px before center, touching the left boundary with arrow)
            if (firstChildCoords.knotX > startX + 16) {
              endX = firstChildCoords.knotX - 14;
              endY = firstChildCoords.knotY;
            } else {
              // Child's first node is before or right at branch point; land cleanly on wire without cutting through
              endX = Math.max(startX + 32, firstChildCoords.knotX + 16);
              endY = childWireY;
            }
          }
        }

        // Smooth cubic bezier flowing forward (LEFT to RIGHT) and down to child clothesline
        const deltaX = Math.max(28, endX - startX);
        const cp1x = startX + deltaX * 0.45;
        const cp1y = startY;
        const cp2x = endX - deltaX * 0.45;
        const cp2y = endY;

        const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

        branchLines.push({
          id: `branch-${track.id}`,
          trackId: track.id,
          parentTrackId: track.parentTimelineId,
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

  // 3. Calculate dependencies between knots (approaching knot perimeters cleanly without cutting through)
  const depLines: Array<{
    id: string;
    fromTrackId: string;
    toTrackId: string;
    fromNodeId: string;
    toNodeId: string;
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
      const fromCenter = { x: fromInfo.knotX, y: fromInfo.knotY };
      const toCenter = { x: toInfo.knotX, y: toInfo.knotY };

      let startX: number;
      let startY: number;
      let endX: number;
      let endY: number;
      let path = '';

      if (fromCenter.y === toCenter.y) {
        // Same track dependency: gentle upward arched curve over the clothesline wire
        // Leaves top-right of from-knot (+8, -7), approaches top-left of to-knot (-14, -7)
        startX = fromCenter.x + 8;
        startY = fromCenter.y - 7;
        endX = toCenter.x - 14;
        endY = toCenter.y - 7;

        const midX = (startX + endX) / 2;
        const archY = fromCenter.y - Math.min(32, Math.max(16, Math.abs(endX - startX) * 0.12));
        path = `M ${startX} ${startY} Q ${midX} ${archY}, ${endX} ${endY}`;
      } else if (fromCenter.y < toCenter.y) {
        // Cross-track dependency going DOWN: leaves bottom-right of from-knot, approaches top-left of to-knot
        startX = fromCenter.x + 9;
        startY = fromCenter.y + 7;
        endX = toCenter.x - 14;
        endY = toCenter.y - 6;

        const deltaX = Math.max(36, Math.abs(endX - startX));
        const cp1x = startX + deltaX * 0.4;
        const cp2x = endX - deltaX * 0.4;
        path = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
      } else {
        // Cross-track dependency going UP: leaves top-right of from-knot, approaches bottom-left of to-knot
        startX = fromCenter.x + 9;
        startY = fromCenter.y - 7;
        endX = toCenter.x - 14;
        endY = toCenter.y + 6;

        const deltaX = Math.max(36, Math.abs(endX - startX));
        const cp1x = startX + deltaX * 0.4;
        const cp2x = endX - deltaX * 0.4;
        path = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
      }

      depLines.push({
        id: dep.id,
        fromTrackId: fromInfo.node.timelineId,
        toTrackId: toInfo.node.timelineId,
        fromNodeId: dep.fromNodeId,
        toNodeId: dep.toNodeId,
        path,
        startX,
        startY,
        endX,
        endY,
        label: dep.type
      });
    }
  });

  // 4. Calculate continuous path along clothesline wire for the traveling light beam on active or hovered track
  const activeTrackPath = React.useMemo(() => {
    const activeTrackId = hoveredTrackId || selectedTrackId;
    if (!activeTrackId) return null;
    const track = timelines.find((t) => t.id === activeTrackId);
    if (!track) return null;

    const sortedNodes = [...track.nodes].sort((a, b) => compareDateStrings(a.startDate, b.startDate));
    if (sortedNodes.length === 0) return null;

    const coords = sortedNodes.map((n) => nodeMap.get(n.id)).filter(Boolean) as NodeCoords[];
    if (coords.length === 0) return null;

    const wireY = coords[0].knotY;
    const startX = Math.max(24, coords[0].knotX - 48);
    const endX = coords[coords.length - 1].knotX + 64;

    // The light beam travels horizontally straight along the clothesline wire through every knot
    return {
      path: `M ${startX} ${wireY} L ${endX} ${wireY}`,
      trackId: activeTrackId
    };
  }, [hoveredTrackId, selectedTrackId, timelines, nodeMap]);

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
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
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

      {/* 1. Track Clothesline Wires per Track (Synchronized Opacity with Knots & Cards) */}
      {trackWires.map((tw) => {
        const isSelected = selectedTrackId === tw.trackId;
        const isHovered = hoveredTrackId === tw.trackId;
        const isDimmed = !!selectedTrackId && !isSelected && !isHovered;
        const trackOpacity = isSelected || isHovered ? 1 : isDimmed ? 0.35 : 1;

        return (
          <g
            key={`track-wire-${tw.trackId}`}
            style={{ opacity: trackOpacity }}
            className="transition-opacity duration-200"
          >
            {/* Subtle background taut wire segments cleanly stopping at knot boundaries so they never slice through knots */}
            {tw.backgroundSpans.map((span, sIdx) => (
              <line
                key={`bg-wire-${tw.trackId}-${sIdx}`}
                x1={span.startX}
                y1={tw.wireY}
                x2={span.endX}
                y2={tw.wireY}
                stroke={isSelected || isHovered ? '#3a3c4a' : '#262731'}
                strokeWidth="1.5"
              />
            ))}

            {/* Left Wall Hook / Tension Eyelet */}
            <g>
              <circle cx={tw.startX} cy={tw.wireY} r="4.5" fill="#181920" stroke="#454754" strokeWidth="1.5" />
              <circle cx={tw.startX} cy={tw.wireY} r="1.5" fill="#ececf0" />
            </g>

            {/* Right End Tension Bracket */}
            <g>
              <rect
                x={tw.endX - 7}
                y={tw.wireY - 3}
                width="7"
                height="6"
                rx="1"
                fill="#181920"
                stroke="#454754"
                strokeWidth="1"
              />
              <line
                x1={tw.endX}
                y1={tw.wireY - 4.5}
                x2={tw.endX}
                y2={tw.wireY + 4.5}
                stroke="#52525b"
                strokeWidth="1.5"
              />
            </g>

            {/* Lead-In Wire */}
            {tw.leadIn && (
              <line
                x1={tw.leadIn.startX}
                y1={tw.wireY}
                x2={tw.leadIn.endX}
                y2={tw.wireY}
                stroke="#383a45"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            )}

            {/* Sequential Active Segments between Knots */}
            {tw.segments.map((seg) => {
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
                  {/* Active taut wire running cleanly between knots */}
                  <line
                    x1={seg.startX}
                    y1={seg.wireY}
                    x2={seg.endX}
                    y2={seg.wireY}
                    stroke={segColor}
                    strokeWidth={isCompleted ? '2' : '1.5'}
                    strokeDasharray={isCompleted ? undefined : isInProgress ? '5 3' : '4 4'}
                  />
                  {/* Mid-span flow chevron */}
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

            {/* Future Continuation Wire */}
            {tw.futureWire && (
              <line
                x1={tw.futureWire.startX}
                y1={tw.wireY}
                x2={tw.futureWire.endX}
                y2={tw.wireY}
                stroke="#3f3f46"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                markerEnd="url(#future-arrow)"
              />
            )}
          </g>
        );
      })}

      {/* 2. Branch Offshoots (Dropping gracefully from parent knot to child wire) */}
      {branchLines.map((branch) => {
        const isSelected = !!selectedTrackId && (branch.trackId === selectedTrackId || branch.parentTrackId === selectedTrackId);
        const isHovered = hoveredTrackId === branch.trackId || hoveredTrackId === branch.parentTrackId;
        const isHighlighted = isSelected || isHovered;
        const isDimmed = !!selectedTrackId && !isHighlighted;
        const branchOpacity = isHighlighted || !selectedTrackId ? 1 : isDimmed ? 0.25 : 1;
        const branchStroke = isHighlighted ? '#ececf0' : !selectedTrackId ? '#8e90a0' : '#71717a';
        const branchWidth = isHighlighted ? '2.5' : !selectedTrackId ? '2' : '1.8';

        return (
          <g key={branch.id} style={{ opacity: branchOpacity }} className="transition-opacity duration-200">
            {/* Branch curve with smooth left-to-right flow */}
            <path
              d={branch.path}
              fill="none"
              stroke={branchStroke}
              strokeWidth={branchWidth}
              strokeDasharray={isHighlighted ? undefined : '6 4'}
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
              stroke={isHighlighted ? '#525568' : !selectedTrackId ? '#383a48' : '#2a2b32'}
              strokeWidth="1"
            />
            <text
              x={branch.startX + 59}
              y={(branch.startY + branch.endY) / 2 + 3}
              textAnchor="middle"
              fill={isHighlighted ? '#ececf0' : !selectedTrackId ? '#d4d4d8' : '#9e9ea7'}
              fontSize="9"
              fontFamily="monospace"
              fontWeight={isHighlighted ? 'bold' : 'normal'}
            >
              ⑂ {branch.label.length > 9 ? branch.label.slice(0, 9) + '…' : branch.label}
            </text>
          </g>
        );
      })}

      {/* 3. Inter-Node Dependencies between Knots (Synchronized Opacity) */}
      {depLines.map((dep) => {
        const isFromSelected = dep.fromTrackId === selectedTrackId;
        const isToSelected = dep.toTrackId === selectedTrackId;
        const isBothSelected = isFromSelected && isToSelected;
        const isOneSelected = isFromSelected || isToSelected;
        const isNodeConnected = !!selectedNodeId && (dep.fromNodeId === selectedNodeId || dep.toNodeId === selectedNodeId);
        const isHovered = hoveredTrackId === dep.fromTrackId || hoveredTrackId === dep.toTrackId;

        let depOpacity = 0.75; // Default ambient when tracking all timelines simultaneously
        let strokeColor = '#9e9ea7';
        let strokeWidth = '1.5';

        if (isNodeConnected) {
          // Explicitly focused node dependency
          depOpacity = 1;
          strokeColor = '#ffffff';
          strokeWidth = '2';
        } else if (selectedTrackId) {
          if (isBothSelected) {
            // Internal to the selected track
            depOpacity = 0.9;
            strokeColor = '#ececf0';
            strokeWidth = '1.8';
          } else if (isOneSelected) {
            // Crosses to an UNSELECTED track! Dimmed synchronously with the unselected track
            depOpacity = isHovered ? 0.7 : 0.3;
            strokeColor = isHovered ? '#9e9ea7' : '#52525b';
            strokeWidth = '1.2';
          } else {
            // Unrelated tracks entirely
            depOpacity = 0.12;
            strokeColor = '#3f3f46';
            strokeWidth = '1';
          }
        } else if (isHovered) {
          depOpacity = 1;
          strokeColor = '#ffffff';
          strokeWidth = '1.8';
        }

        return (
          <g
            key={dep.id}
            style={{ opacity: depOpacity, color: strokeColor }}
            className="transition-opacity duration-200"
          >
            <path
              d={dep.path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray="4 3"
              markerEnd="url(#dep-arrow)"
            />
          </g>
        );
      })}

      {/* 7. Traveling Light Beam on Selected or Hovered Track (Tia sáng di chuyển dọc sợi dây clothesline qua các nút) */}
      {activeTrackPath && (
        <g key={`beam-${activeTrackPath.trackId}`} className="pointer-events-none">
          {/* Luminous aura track pulse */}
          <path
            d={activeTrackPath.path}
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
            d={activeTrackPath.path}
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
              path={activeTrackPath.path}
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
