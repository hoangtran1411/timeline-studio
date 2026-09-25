'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { TimelineNode } from '@/types/timeline';

interface BetweenNodeInserterProps {
  timelineId: string;
  leftNode: TimelineNode;
  rightNode: TimelineNode;
  pixelLeft: number;
  pixelWidth: number;
  onInsertBetween: (timelineId: string, leftNode: TimelineNode, rightNode: TimelineNode) => void;
}

export const BetweenNodeInserter: React.FC<BetweenNodeInserterProps> = ({
  timelineId,
  leftNode,
  rightNode,
  pixelLeft,
  pixelWidth,
  onInsertBetween
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Only render if there's reasonable spacing (or minimal gap)
  if (pixelWidth < 12) return null;

  return (
    <div
      style={{
        left: `${pixelLeft}px`,
        width: `${pixelWidth}px`,
        top: '8px',
        bottom: '8px'
      }}
      className="absolute z-10 flex items-center justify-center group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onInsertBetween(timelineId, leftNode, rightNode)}
    >
      {/* Dashed connector line on hover */}
      <div
        className={`w-full h-px border-t border-dashed transition-colors ${
          isHovered ? 'border-[#ececf0]/40' : 'border-transparent'
        }`}
      />

      {/* Floating "+" badge */}
      <div
        className={`absolute px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1 transition-all ${
          isHovered
            ? 'opacity-100 scale-100 bg-[#1c1d22] border-[#ececf0] text-[#ececf0] shadow-sm'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
        title={`Insert node between "${leftNode.title}" and "${rightNode.title}"`}
      >
        <Plus className="w-3 h-3 text-[#ececf0]" />
        <span>Insert</span>
      </div>
    </div>
  );
};
