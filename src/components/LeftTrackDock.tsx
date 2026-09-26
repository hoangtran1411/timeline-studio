'use client';

import React from 'react';
import { TimelineTrack } from '@/types/timeline';
import { GitFork, Plus, Trash2, CheckCircle2, Eye, EyeOff, Archive } from 'lucide-react';

interface LeftTrackDockProps {
  timelines: TimelineTrack[];
  width: number;
  onAddNodeToTrack: (timelineId: string) => void;
  onBranchTrack: (parentTimelineId: string) => void;
  onToggleVisibility?: (timelineId: string, isVisible: boolean) => void;
  onArchiveTrack?: (timelineId: string) => void;
  onDeleteTrack: (timelineId: string) => void;
  getTrackHeight: (track: TimelineTrack) => number;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onOpenAddTimeline?: () => void;
  selectedTrackId?: string | null;
  onSelectTrack?: (timelineId: string) => void;
  hoveredTrackId?: string | null;
  onHoverTrack?: (timelineId: string | null) => void;
}

export const LeftTrackDock: React.FC<LeftTrackDockProps> = ({
  timelines,
  width,
  onAddNodeToTrack,
  onBranchTrack,
  onToggleVisibility,
  onArchiveTrack,
  onDeleteTrack,
  getTrackHeight,
  scrollRef,
  onOpenAddTimeline,
  selectedTrackId,
  onSelectTrack,
  hoveredTrackId,
  onHoverTrack
}) => {
  const visibleTracks = timelines.filter(t => t.isVisible !== false);
  const hiddenTracks = timelines.filter(t => t.isVisible === false);

  return (
    <div
      style={{ width: `${width}px` }}
      className="flex-shrink-0 z-30 bg-[#121316] border-r border-[#222328] flex flex-col select-none h-full"
    >
      {/* Dock Header aligned with the Chrono Ruler (h-16 / 64px) */}
      <div className="h-16 px-4 py-2 border-b border-[#222328] flex items-center justify-between flex-shrink-0 bg-[#121316]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-[#ececf0] uppercase tracking-wider font-mono">
            Tracks ({visibleTracks.length}{hiddenTracks.length > 0 ? `/${timelines.length}` : ''})
          </span>
          {hiddenTracks.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e2029] text-[#e4e4e7] border border-[#2a2c38]">
              {hiddenTracks.length} hidden
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-[#71717a]">Synchronized</span>
      </div>

      {/* Track Cards Stack with synchronized vertical scroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-hidden flex flex-col divide-y divide-[#222328]"
      >
        {visibleTracks.map((track) => {
          const height = getTrackHeight(track);
          const completedCount = track.nodes.filter(n => n.status === 'completed').length;
          const totalCount = track.nodes.length;
          const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const parent = track.parentTimelineId
            ? timelines.find(t => t.id === track.parentTimelineId)
            : null;

          const isSelected = selectedTrackId === track.id;
          const isHovered = hoveredTrackId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack?.(track.id)}
              onMouseEnter={() => onHoverTrack?.(track.id)}
              onMouseLeave={() => onHoverTrack?.(null)}
              style={{
                height: `${height}px`,
                minHeight: `${height}px`,
                maxHeight: `${height}px`
              }}
              className={`p-3.5 transition-all duration-200 flex flex-col justify-between group relative flex-shrink-0 overflow-hidden box-border cursor-pointer ${
                isSelected
                  ? 'bg-[#181920] border-l-[3px] border-l-[#ffffff] shadow-lg ring-1 ring-inset ring-[#383a42]/80 opacity-100'
                  : isHovered
                  ? 'bg-[#181920] border-l-[3px] border-l-[#ffffff]/70 shadow-md ring-1 ring-inset ring-[#383a42]/60 opacity-100'
                  : selectedTrackId
                  ? 'bg-[#141519] hover:bg-[#18191e] border-l-[3px] border-l-transparent opacity-35 hover:opacity-100'
                  : 'bg-[#141519] hover:bg-[#18191e] border-l-[3px] border-l-transparent opacity-100'
              }`}
            >
              <div>
                {/* Branch or Root Track indicator */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    {parent ? (
                      <span className="text-[10px] font-mono text-[#9e9ea7] flex items-center gap-1 bg-[#1a1b22] px-2 py-0.5 rounded border border-[#262832] truncate max-w-[180px]">
                        <GitFork className="w-3 h-3 text-[#ececf0] flex-shrink-0" />
                        <span className="truncate">Branch: {parent.title}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#71717a] flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-white' : 'bg-[#ececf0]'}`} />
                        <span>Root Track</span>
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white text-black font-bold tracking-wider">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onAddNodeToTrack(track.id)}
                      className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#262832] transition-colors"
                      title="Add node to this track"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onBranchTrack(track.id)}
                      className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#262832] transition-colors"
                      title="Branch a new timeline from this track"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                    </button>
                    {onToggleVisibility && (
                      <button
                        onClick={() => onToggleVisibility(track.id, false)}
                        className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#262832] transition-colors"
                        title="Hide track from main canvas"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onArchiveTrack && (
                      <button
                        onClick={() => onArchiveTrack(track.id)}
                        className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#262832] transition-colors"
                        title="Archive track (preserves in database)"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {timelines.length > 1 && (
                      <button
                        onClick={() => onDeleteTrack(track.id)}
                        className="p-1 rounded text-[#9e9ea7] hover:text-red-400 hover:bg-[#262832] transition-colors"
                        title="Delete track permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-xs text-[#ececf0] truncate" title={track.title}>
                  {track.title}
                </h3>
                {track.description && (
                  <p className="text-[11px] text-[#71717a] truncate mt-0.5" title={track.description}>
                    {track.description}
                  </p>
                )}
              </div>

              {/* Progress & Node count */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#9e9ea7]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#ececf0]" />
                    {progressPercent}% Complete
                  </span>
                  <span>{totalCount} {totalCount === 1 ? 'node' : 'nodes'}</span>
                </div>
                <div className="w-full h-1 bg-[#222328] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ececf0] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Hidden Tracks Section */}
        {hiddenTracks.length > 0 && (
          <div className="p-3 bg-[#101114] border-t border-[#222328] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a]">
              <span className="flex items-center gap-1.5">
                <EyeOff className="w-3 h-3 text-[#9e9ea7]" />
                <span>Hidden from Canvas ({hiddenTracks.length})</span>
              </span>
              {onToggleVisibility && (
                <button
                  onClick={() => hiddenTracks.forEach(t => onToggleVisibility(t.id, true))}
                  className="text-[10px] text-[#9e9ea7] hover:text-[#ececf0] underline transition-colors"
                >
                  Show all
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {hiddenTracks.map(track => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 rounded bg-[#16171d] border border-[#222328] text-xs hover:border-[#30323c] transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-medium text-[#9e9ea7] truncate block text-[11px]">{track.title}</span>
                    <span className="text-[10px] font-mono text-[#5f606a]">{track.nodes.length} nodes</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onToggleVisibility && (
                      <button
                        onClick={() => onToggleVisibility(track.id, true)}
                        className="p-1 rounded text-[#ececf0] bg-[#22242f] hover:bg-[#2b2e3c] transition-colors"
                        title="Show track on canvas"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onArchiveTrack && (
                      <button
                        onClick={() => onArchiveTrack(track.id)}
                        className="p-1 rounded text-[#71717a] hover:text-[#ececf0] hover:bg-[#22242f] transition-colors"
                        title="Archive track"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteTrack(track.id)}
                      className="p-1 rounded text-[#71717a] hover:text-red-400 hover:bg-[#22242f] transition-colors"
                      title="Delete track permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Track Action Button in dock */}
        {onOpenAddTimeline && (
          <div className="p-3">
            <button
              onClick={onOpenAddTimeline}
              className="w-full py-2.5 px-3 rounded border border-dashed border-[#262832] hover:border-[#383a42] bg-[#141519]/60 hover:bg-[#18191e] text-[#9e9ea7] hover:text-[#ececf0] text-xs font-mono flex items-center justify-center gap-1.5 transition-all group"
            >
              <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Add New Track</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
