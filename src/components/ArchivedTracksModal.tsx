'use client';

import React from 'react';
import { TimelineTrack } from '@/types/timeline';
import { X, Archive, ArchiveRestore, Trash2, GitFork, Calendar, CheckCircle2 } from 'lucide-react';

interface ArchivedTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
  archivedTimelines: TimelineTrack[];
  onRestoreTrack: (timelineId: string) => Promise<void>;
  onPermanentDeleteTrack: (timelineId: string) => Promise<void>;
}

export const ArchivedTracksModal: React.FC<ArchivedTracksModalProps> = ({
  isOpen,
  onClose,
  archivedTimelines,
  onRestoreTrack,
  onPermanentDeleteTrack
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#141519] border border-[#262832] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222328] bg-[#101114]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1c1d24] border border-[#2e303d] flex items-center justify-center text-[#ececf0]">
              <Archive className="w-4 h-4 text-[#ececf0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#ececf0]">Archived Timelines</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#1e2029] border border-[#2a2c38] text-[#9e9ea7]">
                  {archivedTimelines.length} {archivedTimelines.length === 1 ? 'track' : 'tracks'}
                </span>
              </div>
              <p className="text-xs text-[#71717a] mt-0.5">
                Preserved in SQLite database without cluttering the main canvas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-[#ececf0] hover:bg-[#1f2027] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {archivedTimelines.length === 0 ? (
            <div className="py-14 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#181920] border border-[#262832] flex items-center justify-center text-[#71717a] mb-3">
                <Archive className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-xs font-semibold text-[#ececf0] uppercase tracking-wider font-mono">
                No Archived Timelines
              </h3>
              <p className="text-xs text-[#71717a] max-w-sm mt-1">
                You can archive any timeline track from the left dock action bar to offload it from the canvas while retaining all nodes and dates in your database.
              </p>
            </div>
          ) : (
            archivedTimelines.map((track) => {
              const completedCount = track.nodes.filter(n => n.status === 'completed').length;
              const totalCount = track.nodes.length;
              const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div
                  key={track.id}
                  className="p-4 rounded-lg bg-[#181920] border border-[#262832] hover:border-[#383a45] transition-all flex flex-col gap-3 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[#ececf0] truncate" title={track.title}>
                          {track.title}
                        </h3>
                        {track.parentTimelineId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f212b] text-[#9e9ea7] border border-[#2a2c38] flex items-center gap-1">
                            <GitFork className="w-2.5 h-2.5 text-[#ececf0]" />
                            <span>Branched</span>
                          </span>
                        )}
                      </div>
                      {track.description && (
                        <p className="text-xs text-[#71717a] line-clamp-2">
                          {track.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onRestoreTrack(track.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ffffff] hover:bg-[#e4e4e7] text-black text-xs font-medium transition-all shadow-sm"
                        title="Restore this track back to the active canvas"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        <span>Restore to Canvas</span>
                      </button>

                      <button
                        onClick={() => onPermanentDeleteTrack(track.id)}
                        className="p-1.5 rounded-md text-[#71717a] hover:text-red-400 hover:bg-[#252026] border border-transparent hover:border-red-900/30 transition-colors"
                        title="Permanently delete from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#222328] text-[11px] font-mono text-[#71717a]">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-[#9e9ea7]">
                        <Calendar className="w-3 h-3 text-[#71717a]" />
                        {totalCount} {totalCount === 1 ? 'milestone' : 'milestones'}
                      </span>
                      {totalCount > 0 && (
                        <span className="flex items-center gap-1.5 text-[#9e9ea7]">
                          <CheckCircle2 className="w-3 h-3 text-[#ececf0]" />
                          {completedCount}/{totalCount} completed ({progressPercent}%)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#555660]">Stored in SQLite</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#222328] bg-[#101114] flex items-center justify-between">
          <span className="text-xs text-[#71717a] font-mono">
            {archivedTimelines.length} archived
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-[#2a2b32] hover:bg-[#1a1b20] text-xs text-[#ececf0] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
