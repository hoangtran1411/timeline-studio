'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TimelineNode } from '@/types/timeline';
import { formatDisplayDate, addDays } from '@/utils/date-utils';
import { Check, Edit3, Plus, GitFork, Trash2, GripVertical, Lock, Unlock } from 'lucide-react';

interface TimelineNodeCardProps {
  node: TimelineNode;
  pixelLeft: number;
  pixelWidth: number;
  lane: number;
  pxPerDay: number;
  zIndex?: number;
  isSelected?: boolean;
  onSelect: (node: TimelineNode) => void;
  onAddAfter: (node: TimelineNode) => void;
  onBranchFromNode: (node: TimelineNode) => void;
  onDelete: (nodeId: string) => void;
  onMoveNode: (nodeId: string, newStartDate: string, newEndDate: string | null) => Promise<void>;
  onContextMenu?: (e: React.MouseEvent, node: TimelineNode) => void;
}

const TimelineNodeCardComponent: React.FC<TimelineNodeCardProps> = ({
  node,
  pixelLeft,
  pixelWidth,
  lane,
  pxPerDay,
  zIndex = 10,
  isSelected,
  onSelect,
  onAddAfter,
  onBranchFromNode,
  onDelete,
  onMoveNode,
  onContextMenu
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [resizeDeltaW, setResizeDeltaW] = useState(0);

  // Lock state: Completed nodes are locked by default; user can unlock via lock icon
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showLockNotice, setShowLockNotice] = useState(false);
  const lockNoticeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isLocked = node.status === 'completed' && !isUnlocked;

  // Custom card width persisted in localStorage (avoids database bloat)
  const [customWidth, setCustomWidth] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('timeline_studio_card_widths');
      if (raw) {
        const map = JSON.parse(raw);
        const saved = map[node.id];
        if (typeof saved === 'number' && saved >= 160 && saved <= 900) {
          setCustomWidth(saved);
        }
      }
    } catch (_) {}
  }, [node.id]);

  const triggerLockNotice = () => {
    setShowLockNotice(true);
    if (lockNoticeTimeoutRef.current) {
      clearTimeout(lockNoticeTimeoutRef.current);
    }
    lockNoticeTimeoutRef.current = setTimeout(() => {
      setShowLockNotice(false);
    }, 2000);
  };

  const pointerState = useRef<{
    startX: number;
    mode: 'move' | 'resize';
    isActualAction: boolean;
  } | null>(null);


  // Drag-to-move pointer handlers
  const handlePointerDownMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary (left) button for dragging & selection! Ignore right click (button 2)
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();

    pointerState.current = {
      startX: e.clientX,
      mode: 'move',
      isActualAction: false
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Drag-to-resize pointer handler on right edge (Available by default, persists to localStorage)
  const handlePointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

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
      if (isLocked) {
        if (Math.abs(delta) > 4) {
          triggerLockNotice();
        }
        return;
      }

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

  const baseWidth = customWidth ?? pixelWidth;

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerState.current) return;
    if (e.button !== 0) return; // Ignore right-click release!
    const state = pointerState.current;
    pointerState.current = null;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (state.mode === 'move') {
      const moveDistance = Math.abs(e.clientX - state.startX);
      if (state.isActualAction && !isLocked) {
        const daysShift = Math.round(dragDeltaX / pxPerDay);
        if (daysShift !== 0) {
          const newStart = addDays(node.startDate, daysShift);
          const newEnd = node.endDate ? addDays(node.endDate, daysShift) : null;
          await onMoveNode(node.id, newStart, newEnd);
        }
      } else if (!isLocked && !state.isActualAction) {
        // Just clicked
        onSelect(node);
      } else if (isLocked && moveDistance <= 5) {
        // Click on locked card opens edit drawer
        onSelect(node);
      }
    } else if (state.mode === 'resize') {
      const finalWidth = Math.max(160, Math.min(900, baseWidth + resizeDeltaW));
      setCustomWidth(finalWidth);
      try {
        const raw = localStorage.getItem('timeline_studio_card_widths');
        const map = raw ? JSON.parse(raw) : {};
        map[node.id] = finalWidth;
        localStorage.setItem('timeline_studio_card_widths', JSON.stringify(map));
      } catch (_) {}
    }

    setIsDragging(false);
    setIsResizing(false);
    setDragDeltaX(0);
    setResizeDeltaW(0);
  };

  const handleResetCardWidth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomWidth(null);
    try {
      const raw = localStorage.getItem('timeline_studio_card_widths');
      if (raw) {
        const map = JSON.parse(raw);
        delete map[node.id];
        localStorage.setItem('timeline_studio_card_widths', JSON.stringify(map));
      }
    } catch (_) {}
  };

  // Dynamic preview date calculation during drag
  const currentDaysShift = isDragging ? Math.round(dragDeltaX / pxPerDay) : 0;
  const previewStartDate = isDragging ? addDays(node.startDate, currentDaysShift) : node.startDate;
  const previewEndDate = isDragging && node.endDate ? addDays(node.endDate, currentDaysShift) : node.endDate;

  const currentWidth = Math.max(160, Math.min(900, baseWidth + (isResizing ? resizeDeltaW : 0)));
  const effectiveLeft = pixelLeft + (isDragging ? dragDeltaX : 0);
  const topOffset = 56 + lane * 130;

  // Layering hierarchy:
  // Active dragging/resizing moves to absolute top (500000).
  // Hovered (+2000) and Selected (+1000) apply relative lane-safe boosts so that
  // interacting with a lower-lane card never causes its hanger stem to pierce through upper-lane cards.
  const computedZIndex = isDragging || isResizing
    ? 500000
    : isHovered
    ? zIndex + 2000
    : isSelected
    ? zIndex + 1000
    : zIndex;

  return (
    <div
      style={{
        left: `${effectiveLeft}px`,
        top: `${topOffset}px`,
        width: `${currentWidth}px`,
        zIndex: computedZIndex
      }}
      className={`absolute group select-none rounded-lg border transition-shadow duration-75 shadow-sm ${
        isDragging
          ? 'bg-[#22232a] border-[#ffffff] shadow-2xl cursor-grabbing scale-[1.02]'
          : isSelected
          ? `bg-[#22232a] border-[#ffffff] ring-1 ring-[#ffffff]/20 shadow-md ${isLocked ? 'cursor-default' : 'cursor-grab'}`
          : `bg-[#18191e] border-[#2a2b32] hover:bg-[#1f2027] hover:border-[#454754] hover:shadow-xl ${isLocked ? 'cursor-default' : 'cursor-grab'}`
      }`}
      onPointerDown={handlePointerDownMove}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, node);
      }}
    >
      {/* Clothesline Knot Peg & Hanger Stem connecting down to card */}
      <div
        className="absolute left-[23px] -translate-x-1/2 pointer-events-none select-none flex flex-col items-center w-5"
        style={{
          top: `-${29 + lane * 130}px`,
          height: `${29 + lane * 130}px`
        }}
      >
        {/* Knot Peg clamped on the timeline wire */}
        <div
          onClick={(e) => {
            if (node.status === 'completed') {
              e.stopPropagation();
              setIsUnlocked(!isUnlocked);
            }
          }}
          className={`w-5 h-5 -mt-2.5 rounded-full flex items-center justify-center transition-transform shadow-md z-30 pointer-events-auto ${
            node.status === 'completed' ? 'cursor-pointer' : ''
          } ${
            node.status === 'completed'
              ? isLocked
                ? 'bg-[#ececf0] text-[#101114] ring-2 ring-[#101114]'
                : 'bg-[#181920] text-[#ececf0] border-2 border-white ring-1 ring-[#101114]'
              : node.status === 'in_progress'
              ? 'bg-[#181920] border-2 border-white ring-1 ring-[#101114]'
              : node.status === 'blocked'
              ? 'bg-[#1c1d22] border-2 border-dashed border-[#9e9ea7]'
              : 'bg-[#141519] border-2 border-[#52525b]'
          } ${isHovered ? 'scale-110' : ''}`}
          title={
            node.status === 'completed'
              ? isLocked
                ? 'Completed milestone is locked on branch wire — click to unlock and move'
                : 'Completed milestone is unlocked — click to lock'
              : `Milestone Status: ${node.status}`
          }
        >
          {node.status === 'completed' && (
            isLocked ? (
              <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
            ) : (
              <Check className="w-3 h-3 stroke-[3]" />
            )
          )}
          {node.status === 'in_progress' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
          )}
          {node.status === 'planned' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#71717a]" />
          )}
          {node.status === 'blocked' && (
            <span className="text-[10px] font-bold text-[#ececf0] leading-none">!</span>
          )}
        </div>

        {/* Vertical Hanger / Hook Stem (Dotted connector line from knot to card) */}
        <div
          className={`w-0 flex-1 border-l border-dashed transition-colors ${
            node.status === 'completed'
              ? 'border-[#ececf0]/75'
              : node.status === 'in_progress'
              ? 'border-white/60'
              : 'border-[#52525b]'
          }`}
        />

        {/* Metallic Clothespin / Bracket on top edge of card */}
        <div className="w-3.5 h-1.5 -mb-0.5 rounded-t bg-[#2a2b34] border border-[#454754] z-20 flex items-center justify-center">
          <span className="w-1 h-0.5 rounded-full bg-[#6b6c75]" />
        </div>
      </div>

      {/* Live drag indicator tooltip (moving dates along the branch wire) */}
      {isDragging && (
        <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-[#ffffff] text-black font-mono text-[10px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-50">
          {formatDisplayDate(previewStartDate)}
          {previewEndDate ? ' – ' + formatDisplayDate(previewEndDate) : ''}
          {' '}({currentDaysShift >= 0 ? '+' : ''}{currentDaysShift}d)
        </div>
      )}

      {/* Live card width resize indicator (persisted in localStorage) */}
      {isResizing && (
        <div className="absolute -top-7 right-0 px-2 py-0.5 rounded bg-[#ececf0] text-black font-mono text-[10px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-50">
          Width: {currentWidth}px ({resizeDeltaW >= 0 ? '+' : ''}{resizeDeltaW}px)
        </div>
      )}

      {/* Live lock warning banner when drag is attempted */}
      {showLockNotice && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-[#1c1d24] border border-[#ececf0]/40 text-[#ececf0] font-mono text-[10px] font-semibold shadow-2xl pointer-events-none whitespace-nowrap z-50 flex items-center gap-1.5 animate-pulse">
          <Lock className="w-3 h-3 text-[#ececf0]" />
          <span>Milestone locked — click padlock to unlock</span>
        </div>
      )}

      <div className="p-2.5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {node.status === 'completed' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUnlocked(!isUnlocked);
                }}
                className={`p-1 -ml-1 rounded transition-colors flex items-center justify-center flex-shrink-0 ${
                  isLocked
                    ? 'text-[#ececf0] hover:bg-[#2a2b34] hover:text-white'
                    : 'text-[#9e9ea7] hover:bg-[#2a2b34] hover:text-[#ececf0]'
                }`}
                title={
                  isLocked
                    ? 'Completed milestone is locked — click to unlock and move'
                    : 'Milestone unlocked — click to lock'
                }
              >
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 stroke-[2.2]" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 stroke-[2.2] text-[#ececf0]" />
                )}
              </button>
            ) : (
              <GripVertical className="w-3 h-3 text-[#6b6c75] opacity-50 group-hover:opacity-100 flex-shrink-0" />
            )}
            <span className="font-mono text-[11px] text-[#9e9ea7] tracking-tight truncate font-medium">
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
            {node.status === 'completed' && (
              <button
                type="button"
                onClick={() => setIsUnlocked(!isUnlocked)}
                className={`p-1 rounded transition-colors ${
                  isLocked
                    ? 'text-[#ececf0] hover:bg-[#2a2b34]'
                    : 'text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#2a2b34]'
                }`}
                title={isLocked ? 'Unlock milestone to move' : 'Lock milestone'}
              >
                {isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              </button>
            )}
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
            {isLocked && (
              <span title="Locked milestone">
                <Lock className="w-2.5 h-2.5 text-[#ececf0]" />
              </span>
            )}
            <span className="capitalize">{node.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Right Edge Drag-to-Resize Handle (Always available by default, persists to localStorage) */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-20 flex items-center justify-end pr-0.5 transition-colors group/resize rounded-r-lg ${
          isResizing ? 'bg-[#ececf0]/20' : 'hover:bg-[#ececf0]/15'
        }`}
        title="Drag right edge to resize card width (Double-click to reset) — saved in localStorage"
        onPointerDown={handlePointerDownResize}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleResetCardWidth}
      >
        <div
          className={`w-0.5 rounded-full transition-all ${
            isResizing
              ? 'h-8 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
              : 'h-4 bg-[#6b6c75] group-hover/resize:bg-[#ececf0] group-hover/resize:h-6'
          }`}
        />
      </div>
    </div>
  );
};

export const TimelineNodeCard = React.memo(TimelineNodeCardComponent);
