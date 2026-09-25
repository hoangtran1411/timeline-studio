'use client';

import React, { useState, useRef } from 'react';
import { TimelineNode } from '@/types/timeline';
import { formatDisplayDate, addDays } from '@/utils/date-utils';
import { Check, AlertCircle, Edit3, Plus, GitFork, Trash2, GripVertical } from 'lucide-react';

interface TimelineNodeCardProps {
  node: TimelineNode;
  pixelLeft: number;
  pixelWidth: number;
  lane: number;
  pxPerDay: number;
  isSelected?: boolean;
  onSelect: (node: TimelineNode) => void;
  onAddAfter: (node: TimelineNode) => void;
  onBranchFromNode: (node: TimelineNode) => void;
  onDelete: (nodeId: string) => void;
  onMoveNode: (nodeId: string, newStartDate: string, newEndDate: string | null) => Promise<void>;
}

export const TimelineNodeCard: React.FC<TimelineNodeCardProps> = ({
  node,
  pixelLeft,
  pixelWidth,
  lane,
  pxPerDay,
  isSelected,
  onSelect,
  onAddAfter,
  onBranchFromNode,
  onDelete,
  onMoveNode
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [resizeDeltaW, setResizeDeltaW] = useState(0);

  const pointerState = useRef<{
    startX: number;
    mode: 'move' | 'resize';
    isActualAction: boolean;
  } | null>(null);

  // Status visual indicators
  const renderStatusIcon = () => {
    switch (node.status) {
      case 'completed':
        return (
          <div className="w-3.5 h-3.5 rounded-full bg-[#ececf0] text-[#101114] flex items-center justify-center flex-shrink-0">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-3.5 h-3.5 rounded-full border border-[#ececf0] flex items-center justify-center flex-shrink-0 relative">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ececf0] animate-pulse" />
          </div>
        );
      case 'blocked':
        return (
          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-[#9e9ea7] flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-2.5 h-2.5 text-[#9e9ea7]" />
          </div>
        );
      case 'planned':
      default:
        return (
          <div className="w-3.5 h-3.5 rounded-full border border-[#383a42] flex items-center justify-center flex-shrink-0">
            <div className="w-1 h-1 rounded-full bg-[#383a42]" />
          </div>
        );
    }
  };

  // Drag-to-move pointer handlers
  const handlePointerDownMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    pointerState.current = {
      startX: e.clientX,
      mode: 'move',
      isActualAction: false
    };
  };

  // Drag-to-resize pointer handler on right edge
  const handlePointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    pointerState.current = {
      startX: e.clientX,
      mode: 'resize',
      isActualAction: true
    };
    setIsResizing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerState.current) return;
    const delta = e.clientX - pointerState.current.startX;

    if (pointerState.current.mode === 'move') {
      if (!pointerState.current.isActualAction && Math.abs(delta) > 3) {
        pointerState.current.isActualAction = true;
        setIsDragging(true);
      }
      if (pointerState.current.isActualAction) {
        setDragDeltaX(delta);
      }
    } else if (pointerState.current.mode === 'resize') {
      setResizeDeltaW(delta);
    }
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerState.current) return;
    const state = pointerState.current;
    pointerState.current = null;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (state.mode === 'move') {
      if (state.isActualAction) {
        const daysShift = Math.round(dragDeltaX / pxPerDay);
        if (daysShift !== 0) {
          const newStart = addDays(node.startDate, daysShift);
          const newEnd = node.endDate ? addDays(node.endDate, daysShift) : null;
          await onMoveNode(node.id, newStart, newEnd);
        }
      } else {
        // Just clicked
        onSelect(node);
      }
    } else if (state.mode === 'resize') {
      const addedDays = Math.round(resizeDeltaW / pxPerDay);
      if (addedDays !== 0) {
        const currentEnd = node.endDate || addDays(node.startDate, 7);
        const newEnd = addDays(currentEnd, addedDays);
        if (newEnd >= node.startDate) {
          await onMoveNode(node.id, node.startDate, newEnd);
        }
      }
    }

    setIsDragging(false);
    setIsResizing(false);
    setDragDeltaX(0);
    setResizeDeltaW(0);
  };

  // Dynamic preview date calculation during drag
  const currentDaysShift = isDragging ? Math.round(dragDeltaX / pxPerDay) : 0;
  const previewStartDate = isDragging ? addDays(node.startDate, currentDaysShift) : node.startDate;
  const previewEndDate = isDragging && node.endDate ? addDays(node.endDate, currentDaysShift) : node.endDate;

  const currentWidth = Math.max(160, pixelWidth + (isResizing ? resizeDeltaW : 0));
  const effectiveLeft = pixelLeft + (isDragging ? dragDeltaX : 0);
  const topOffset = 16 + lane * 116;

  return (
    <div
      style={{
        left: `${effectiveLeft}px`,
        top: `${topOffset}px`,
        width: `${currentWidth}px`,
        zIndex: isDragging || isResizing ? 40 : 20
      }}
      className={`absolute group select-none rounded-lg border transition-shadow duration-75 ${
        isDragging
          ? 'bg-[#22232a] border-[#ffffff] shadow-2xl cursor-grabbing scale-[1.02]'
          : isSelected
          ? 'bg-[#22232a] border-[#ffffff] ring-1 ring-[#ffffff]/20 shadow-md cursor-grab'
          : 'bg-[#18191e] border-[#2a2b32] hover:bg-[#1f2027] hover:border-[#454754] cursor-grab'
      }`}
      onPointerDown={handlePointerDownMove}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Live drag indicator tooltip */}
      {(isDragging || isResizing) && (
        <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-[#ffffff] text-black font-mono text-[10px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-50">
          {isDragging
            ? `${formatDisplayDate(previewStartDate)}${previewEndDate ? ' – ' + formatDisplayDate(previewEndDate) : ''} (${currentDaysShift >= 0 ? '+' : ''}${currentDaysShift}d)`
            : `Extend duration (${Math.round(resizeDeltaW / pxPerDay) >= 0 ? '+' : ''}${Math.round(resizeDeltaW / pxPerDay)}d)`}
        </div>
      )}

      <div className="p-2.5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <GripVertical className="w-3 h-3 text-[#6b6c75] opacity-50 group-hover:opacity-100 flex-shrink-0" />
            {renderStatusIcon()}
            <span className="font-mono text-[11px] text-[#9e9ea7] tracking-tight truncate">
              {formatDisplayDate(previewStartDate)}
              {previewEndDate && ` – ${formatDisplayDate(previewEndDate)}`}
            </span>
          </div>

          {/* Quick inline hover actions */}
          <div
            className={`flex items-center gap-0.5 transition-opacity ${
              isHovered && !isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onSelect(node)}
              className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#2a2b34] transition-colors"
              title="Edit Node"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onBranchFromNode(node)}
              className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#2a2b34] transition-colors"
              title="Branch timeline from this node"
            >
              <GitFork className="w-3 h-3" />
            </button>
            <button
              onClick={() => onAddAfter(node)}
              className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#2a2b34] transition-colors"
              title="Insert node after this"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(node.id)}
              className="p-1 rounded text-[#9e9ea7] hover:text-red-400 hover:bg-[#2a2b34] transition-colors"
              title="Delete node"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="font-medium text-xs text-[#ececf0] leading-snug line-clamp-1 group-hover:text-white">
          {node.title}
        </div>

        {/* Description preview */}
        {node.description && (
          <div className="text-[11px] text-[#71717a] line-clamp-1 mt-0.5 font-normal">
            {node.description}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#222328]">
          <div className="flex items-center gap-1 overflow-hidden">
            {node.tags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#121316] border border-[#222328] text-[#9e9ea7] truncate"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
            {node.tags.length > 2 && (
              <span className="text-[9px] font-mono text-[#6b6c75]">
                +{node.tags.length - 2}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] text-[#9e9ea7]">
            {node.priority === 'high' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#ececf0]" title="High Priority" />
            )}
            {node.priority === 'medium' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#71717a]" title="Medium Priority" />
            )}
            <span className="capitalize">{node.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Right Edge Drag-to-Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-[#ececf0]/30 rounded-r-lg transition-colors"
        title="Drag right edge to adjust duration"
        onPointerDown={handlePointerDownResize}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};
