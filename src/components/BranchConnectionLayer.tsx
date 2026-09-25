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
}

export const BranchConnectionLayer: React.FC<BranchConnectionLayerProps> = ({
  timelines,
  dependencies,
  originDate,
  pxPerDay,
  canvasWidth,
  totalCanvasHeight,
  getTrackTopOffset
}) => {
  // Map all nodes by id for fast lookup
  const nodeMap = new Map<string, { node: TimelineNode; trackIndex: number; lane: number }>();
  timelines.forEach((track, trackIndex) => {
    track.nodes.forEach((node) => {
      nodeMap.set(node.id, {
        node,
        trackIndex,
        lane: node.lane || 0
      });
    });
  });

  // Calculate coordinates for branches
  const branchLines: Array<{
    id: string;
    path: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    label?: string;
  }> = [];

  timelines.forEach((track, trackIndex) => {
    if (track.parentTimelineId && track.branchPointNodeId) {
      const parentNodeInfo = nodeMap.get(track.branchPointNodeId);
      if (parentNodeInfo) {
        const startX = dateToPixelX(parentNodeInfo.node.startDate, originDate, pxPerDay) + 80;
        const startY = getTrackTopOffset(parentNodeInfo.trackIndex) + 54 + parentNodeInfo.lane * 84;

        const endX = startX + 40;
        const endY = getTrackTopOffset(trackIndex) + 20;

        // Smooth cubic bezier curve connecting parent node to child branch
        const cp1x = startX + 20;
        const cp1y = startY + (endY - startY) * 0.5;
        const cp2x = endX - 20;
        const cp2y = endY;

        const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

        branchLines.push({
          id: `branch-${track.id}`,
          path,
          startX,
          startY,
          endX,
          endY,
          label: 'Branch'
        });
      }
    }
  });

  // Calculate coordinates for dependencies
  const depLines: Array<{
    id: string;
    path: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }> = [];

  dependencies.forEach((dep) => {
    const fromInfo = nodeMap.get(dep.fromNodeId);
    const toInfo = nodeMap.get(dep.toNodeId);

    if (fromInfo && toInfo) {
      const fromEndX = fromInfo.node.endDate
        ? dateToPixelX(fromInfo.node.endDate, originDate, pxPerDay) + 80
        : dateToPixelX(fromInfo.node.startDate, originDate, pxPerDay) + 120;
      const fromY = getTrackTopOffset(fromInfo.trackIndex) + 54 + fromInfo.lane * 84;

      const toStartX = dateToPixelX(toInfo.node.startDate, originDate, pxPerDay);
      const toY = getTrackTopOffset(toInfo.trackIndex) + 54 + toInfo.lane * 84;

      const deltaX = toStartX - fromEndX;
      const cp1x = fromEndX + Math.max(30, deltaX * 0.4);
      const cp2x = toStartX - Math.max(30, deltaX * 0.4);

      const path = `M ${fromEndX} ${fromY} C ${cp1x} ${fromY}, ${cp2x} ${toY}, ${toStartX} ${toY}`;

      depLines.push({
        id: dep.id,
        path,
        startX: fromEndX,
        startY: fromY,
        endX: toStartX,
        endY: toY
      });
    }
  });

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
        <marker
          id="dep-arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#9e9ea7" />
        </marker>
        <marker
          id="branch-fork"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="5"
          markerHeight="5"
        >
          <circle cx="5" cy="5" r="3" fill="#ececf0" />
        </marker>
      </defs>

      {/* Branch Lines */}
      {branchLines.map((line) => (
        <g key={line.id}>
          <path
            d={line.path}
            fill="none"
            stroke="#6b6c75"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <circle cx={line.startX} cy={line.startY} r="3" fill="#ececf0" />
          <circle cx={line.endX} cy={line.endY} r="3" fill="#6b6c75" />
        </g>
      ))}

      {/* Dependency Lines */}
      {depLines.map((line) => (
        <g key={line.id}>
          <path
            d={line.path}
            fill="none"
            stroke="#9e9ea7"
            strokeWidth="1.5"
            markerEnd="url(#dep-arrow)"
          />
          <circle cx={line.startX} cy={line.startY} r="3" fill="#ececf0" />
        </g>
      ))}
    </svg>
  );
};
