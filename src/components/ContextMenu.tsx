'use client';

import React, { useRef, useEffect } from 'react';
import { TimelineTrack, TimelineNode, NodeStatus } from '@/types/timeline';
import { formatDisplayDate } from '@/utils/date-utils';
import {
  Plus,
  PlusCircle,
  GitBranch,
  Copy,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Maximize2,
  Calendar,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Layers
} from 'lucide-react';

export type ContextMenuType = 'node' | 'track' | 'canvas' | 'dock_track' | 'dock_empty';

export interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  type: ContextMenuType;
  track?: TimelineTrack;
  node?: TimelineNode;
  clickedDate?: string;
  leftNeighborNode?: TimelineNode;
  rightNeighborNode?: TimelineNode;
  selectedTrackId?: string | null;
  onClose: () => void;
  onSelectNode?: (node: TimelineNode) => void;
  onDuplicateNode?: (node: TimelineNode) => void;
  onDeleteNode?: (nodeId: string) => void;
  onChangeNodeStatus?: (nodeId: string, status: NodeStatus) => void;
  onBranchFromNode?: (node: TimelineNode) => void;
  onAddNodeToTrack?: (timelineId: string, date?: string) => void;
  onInsertNodeBetween?: (timelineId: string, leftNode: TimelineNode, rightNode: TimelineNode) => void;
  onBranchTrack?: (parentTimelineId: string, branchPointNodeId?: string) => void;
  onToggleTrackVisibility?: (timelineId: string, isVisible: boolean) => void;
  onDeleteTrack?: (timelineId: string) => void;
  onSelectTrack?: (timelineId: string | null) => void;
  onOpenAddTimeline?: () => void;
  onScrollToToday?: () => void;
  onResetZoom?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  x,
  y,
  type,
  track,
  node,
  clickedDate,
  leftNeighborNode,
  rightNeighborNode,
  selectedTrackId,
  onClose,
  onSelectNode,
  onDuplicateNode,
  onDeleteNode,
  onChangeNodeStatus,
  onBranchFromNode,
  onAddNodeToTrack,
  onInsertNodeBetween,
  onBranchTrack,
  onToggleTrackVisibility,
  onDeleteTrack,
  onSelectTrack,
  onOpenAddTimeline,
  onScrollToToday,
  onResetZoom
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Immediate coordinate boundary clamping (0ms execution, zero DOM measuring delay, zero second-render lag)
  const menuWidth = 240;
  const menuHeight = type === 'node' ? 300 : type === 'track' ? 240 : 180;
  const padding = 12;

  const posX = typeof window !== 'undefined'
    ? (x + menuWidth > window.innerWidth - padding ? Math.max(padding, window.innerWidth - menuWidth - padding) : x)
    : x;

  const posY = typeof window !== 'undefined'
    ? (y + menuHeight > window.innerHeight - padding ? Math.max(padding, window.innerHeight - menuHeight - padding) : y)
    : y;

  // Click outside and Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      if (e.button === 0) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${posX}px`,
        top: `${posY}px`,
        zIndex: 120
      }}
      className="bg-[#16171d]/95 backdrop-blur-md border border-[#2c2d3a] shadow-2xl rounded-lg py-1.5 min-w-[220px] max-w-[280px] text-xs font-sans select-none animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/10"
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. NODE CONTEXT MENU */}
      {type === 'node' && node && (
        <>
          {/* Header */}
          <div className="px-3 py-1.5 mb-1 border-b border-[#242632] flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-[#ececf0] truncate font-medium max-w-[150px]">
              {node.title}
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#20222d] text-[#9e9ea7] font-mono shrink-0">
              {node.status}
            </span>
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => {
              onSelectNode?.(node);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Edit Milestone Details</span>
            </span>
            <span className="text-[10px] text-[#71717a] font-mono">Enter</span>
          </button>

          <button
            onClick={() => {
              onDuplicateNode?.(node);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Duplicate (+7 Days)</span>
            </span>
            <span className="text-[10px] text-[#71717a] font-mono">D</span>
          </button>

          <button
            onClick={() => {
              onBranchFromNode?.(node);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Branch New Track Here</span>
            </span>
            <span className="text-[10px] text-[#71717a] font-mono">B</span>
          </button>

          {/* Quick Status Switcher Grid */}
          <div className="my-1 border-t border-[#242632]" />
          <div className="px-3 py-1">
            <span className="text-[10px] text-[#71717a] uppercase font-mono tracking-wider block mb-1.5">
              Set Status
            </span>
            <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
              <button
                onClick={() => {
                  onChangeNodeStatus?.(node.id, 'planned');
                  onClose();
                }}
                className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                  node.status === 'planned'
                    ? 'bg-[#2b2d3c] text-white font-semibold'
                    : 'bg-[#1b1c23] hover:bg-[#252733] text-[#9e9ea7]'
                }`}
              >
                <Clock className="w-2.5 h-2.5 text-[#71717a]" />
                <span>Planned</span>
              </button>

              <button
                onClick={() => {
                  onChangeNodeStatus?.(node.id, 'in_progress');
                  onClose();
                }}
                className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                  node.status === 'in_progress'
                    ? 'bg-blue-900/60 text-blue-200 font-semibold'
                    : 'bg-[#1b1c23] hover:bg-blue-950/40 text-[#9e9ea7] hover:text-blue-300'
                }`}
              >
                <PlayCircle className="w-2.5 h-2.5 text-blue-400" />
                <span>Active</span>
              </button>

              <button
                onClick={() => {
                  onChangeNodeStatus?.(node.id, 'completed');
                  onClose();
                }}
                className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                  node.status === 'completed'
                    ? 'bg-emerald-900/60 text-emerald-200 font-semibold'
                    : 'bg-[#1b1c23] hover:bg-emerald-950/40 text-[#9e9ea7] hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                <span>Done</span>
              </button>

              <button
                onClick={() => {
                  onChangeNodeStatus?.(node.id, 'blocked');
                  onClose();
                }}
                className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                  node.status === 'blocked'
                    ? 'bg-red-900/60 text-red-200 font-semibold'
                    : 'bg-[#1b1c23] hover:bg-red-950/40 text-[#9e9ea7] hover:text-red-300'
                }`}
              >
                <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                <span>Blocked</span>
              </button>
            </div>
          </div>

          {/* Delete Action */}
          <div className="my-1 border-t border-[#242632]" />
          <button
            onClick={() => {
              onDeleteNode?.(node.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-red-950/40 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Milestone</span>
            </span>
            <span className="text-[10px] text-rose-500/80 font-mono">Del</span>
          </button>
        </>
      )}

      {/* 2. TRACK WIRE CONTEXT MENU */}
      {type === 'track' && track && (
        <>
          {/* Header */}
          <div className="px-3 py-1.5 mb-1 border-b border-[#242632] flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-[#ececf0] truncate font-medium max-w-[150px]">
              {track.title}
            </span>
            {clickedDate && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#20222d] text-[#9e9ea7] font-mono shrink-0">
                {formatDisplayDate(clickedDate)}
              </span>
            )}
          </div>

          {/* Contextual Insert between nodes if applicable */}
          {leftNeighborNode && rightNeighborNode ? (
            <button
              onClick={() => {
                onInsertNodeBetween?.(track.id, leftNeighborNode, rightNeighborNode);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Insert Node in Gap</span>
              </span>
              <span className="text-[10px] text-[#71717a] font-mono">Between</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onAddNodeToTrack?.(track.id, clickedDate);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-[#9e9ea7]" />
                <span>Add Milestone Here</span>
              </span>
              <span className="text-[10px] text-[#71717a] font-mono">+N</span>
            </button>
          )}

          <div className="my-1 border-t border-[#242632]" />

          {/* Focus or Track All toggle */}
          {selectedTrackId === track.id ? (
            <button
              onClick={() => {
                onSelectTrack?.(null);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-[#9e9ea7]" />
                <span>Track All (Clear Focus)</span>
              </span>
              <span className="text-[10px] text-[#71717a] font-mono">Esc</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onSelectTrack?.(track.id);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-[#9e9ea7]" />
                <span>Focus This Track</span>
              </span>
              <span className="text-[10px] text-[#71717a] font-mono">Solo</span>
            </button>
          )}

          <button
            onClick={() => {
              onBranchTrack?.(track.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Branch New Track</span>
            </span>
          </button>

          <button
            onClick={() => {
              onToggleTrackVisibility?.(track.id, false);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Hide Track from Canvas</span>
            </span>
          </button>

          <div className="my-1 border-t border-[#242632]" />
          <button
            onClick={() => {
              onDeleteTrack?.(track.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-red-950/40 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Track</span>
            </span>
          </button>
        </>
      )}

      {/* 3. EMPTY CANVAS CONTEXT MENU */}
      {type === 'canvas' && (
        <>
          {/* Header */}
          <div className="px-3 py-1.5 mb-1 border-b border-[#242632] flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-[#ececf0] font-medium">
              Chrono Canvas
            </span>
            {clickedDate && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#20222d] text-[#9e9ea7] font-mono shrink-0">
                {formatDisplayDate(clickedDate)}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              onOpenAddTimeline?.();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-emerald-300">Add Timeline Tracker</span>
            </span>
            <span className="text-[10px] text-[#71717a] font-mono">+T</span>
          </button>

          {selectedTrackId && (
            <button
              onClick={() => {
                onSelectTrack?.(null);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-[#9e9ea7]" />
                <span>Track All (Reset Focus)</span>
              </span>
            </button>
          )}

          <div className="my-1 border-t border-[#242632]" />

          <button
            onClick={() => {
              onScrollToToday?.();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Jump to Today</span>
            </span>
            <span className="text-[10px] text-[#71717a] font-mono">Today</span>
          </button>

          <button
            onClick={() => {
              onResetZoom?.();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Reset Zoom (100%)</span>
            </span>
            <span className="text-[10px] text-[#71717a] font-mono">1:1</span>
          </button>
        </>
      )}

      {/* 4. DOCK TRACK CONTEXT MENU */}
      {type === 'dock_track' && track && (
        <>
          <div className="px-3 py-1.5 mb-1 border-b border-[#242632] flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-[#ececf0] truncate font-medium max-w-[150px]">
              {track.title}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#20222d] text-[#9e9ea7] font-mono shrink-0">
              {track.nodes.length} nodes
            </span>
          </div>

          <button
            onClick={() => {
              onAddNodeToTrack?.(track.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Milestone</span>
            </span>
          </button>

          {selectedTrackId === track.id ? (
            <button
              onClick={() => {
                onSelectTrack?.(null);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-[#9e9ea7]" />
                <span>Track All (Clear Focus)</span>
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                onSelectTrack?.(track.id);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-[#9e9ea7]" />
                <span>Focus Track</span>
              </span>
            </button>
          )}

          <button
            onClick={() => {
              onBranchTrack?.(track.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Branch New Track</span>
            </span>
          </button>

          <button
            onClick={() => {
              onToggleTrackVisibility?.(track.id, false);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Hide Track</span>
            </span>
          </button>

          <div className="my-1 border-t border-[#242632]" />
          <button
            onClick={() => {
              onDeleteTrack?.(track.id);
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-red-950/40 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Track</span>
            </span>
          </button>
        </>
      )}

      {/* 5. DOCK EMPTY CONTEXT MENU */}
      {type === 'dock_empty' && (
        <>
          <div className="px-3 py-1.5 mb-1 border-b border-[#242632] flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-[#ececf0] font-medium">
              Track Dock
            </span>
          </div>

          <button
            onClick={() => {
              onOpenAddTimeline?.();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-emerald-300">Add Timeline Tracker</span>
            </span>
          </button>

          {selectedTrackId && (
            <button
              onClick={() => {
                onSelectTrack?.(null);
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#252838] text-[#e4e4e7] hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-[#9e9ea7]" />
                <span>Track All (Clear Focus)</span>
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
