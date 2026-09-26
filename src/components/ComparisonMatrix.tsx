'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TimelineTrack, TimelineNode, NodeStatus } from '@/types/timeline';
import { formatDisplayDate, parseDate } from '@/utils/date-utils';
import { Table, ChevronDown, ChevronUp, Search, Check, AlertCircle, Clock, Edit3 } from 'lucide-react';

interface ComparisonMatrixProps {
  timelines: TimelineTrack[];
  height: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectNode?: (node: TimelineNode) => void;
}

function getDurationLabel(startDate: string, endDate?: string | null): string {
  if (!endDate) return 'Milestone';
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '1 day';
  const years = Math.round(diffDays / 365.25);
  if (years >= 2) return `${years} yrs`;
  if (diffDays >= 60) return `${Math.round(diffDays / 30)} mos`;
  return `${diffDays} days`;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  timelines,
  height,
  isCollapsed,
  onToggleCollapse,
  onSelectNode
}) => {
  const [selectedTrackTab, setSelectedTrackTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, _setStatusFilter] = useState<string>('all');

  // Reset selectedTrackTab if the track no longer exists in current project
  useEffect(() => {
    if (selectedTrackTab !== 'all' && !timelines.some(t => t.id === selectedTrackTab)) {
      setSelectedTrackTab('all');
    }
  }, [timelines, selectedTrackTab]);

  // Flatten all real database nodes across all timeline tracks
  const allNodesWithTrack = useMemo(() => {
    const list: Array<{ node: TimelineNode; track: TimelineTrack }> = [];
    timelines.forEach((track) => {
      track.nodes.forEach((node) => {
        list.push({ node, track });
      });
    });
    // Sort chronologically by start date
    return list.sort((a, b) => {
      const timeA = parseDate(a.node.startDate).getTime();
      const timeB = parseDate(b.node.startDate).getTime();
      return timeA - timeB;
    });
  }, [timelines]);

  // Filter based on selected track, status, and search query
  const filteredRecords = useMemo(() => {
    return allNodesWithTrack.filter(({ node, track }) => {
      if (selectedTrackTab !== 'all' && track.id !== selectedTrackTab) {
        return false;
      }
      if (statusFilter !== 'all' && node.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = node.title.toLowerCase().includes(q);
        const matchDesc = node.description ? node.description.toLowerCase().includes(q) : false;
        const matchTag = node.tags.some((t) => t.toLowerCase().includes(q));
        const matchTrack = track.title.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTag && !matchTrack) {
          return false;
        }
      }
      return true;
    });
  }, [allNodesWithTrack, selectedTrackTab, statusFilter, searchQuery]);

  const renderStatusBadge = (status: NodeStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#222328] border border-[#383a42] text-[#ececf0] text-[10px]">
            <Check className="w-2.5 h-2.5 text-white" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#181920] border border-[#454754] text-[#ececf0] text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1f191b] border border-[#6b2a2a] text-[#fca5a5] text-[10px]">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Blocked</span>
          </span>
        );
      case 'planned':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#141519] border border-[#2a2b32] text-[#9e9ea7] text-[10px]">
            <Clock className="w-2.5 h-2.5 text-[#71717a]" />
            <span>Planned</span>
          </span>
        );
    }
  };

  return (
    <section
      style={{ height: isCollapsed ? '44px' : `${height}px` }}
      className="w-full border-t border-[#222328] bg-[#121316] flex flex-col select-none font-mono text-xs flex-shrink-0 overflow-hidden box-border"
    >
      {/* Header bar (always visible, 44px) */}
      <div className="h-11 px-4 border-b border-[#222328] flex items-center justify-between flex-shrink-0 bg-[#141519] gap-3">
        {/* Left Title & Live Record Count */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded bg-[#18191e] border border-[#2a2b32] text-[#ececf0] flex-shrink-0">
            <Table className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-xs text-[#ececf0] truncate">Timeline Milestones Matrix</h3>
            <span className="text-[10px] px-2 py-0.5 rounded border border-[#2a2b32] bg-[#16171b] text-[#9e9ea7] flex-shrink-0">
              {allNodesWithTrack.length} Real Records (Database)
            </span>
          </div>
        </div>

        {/* Center Filter Tabs (when expanded) */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 overflow-x-auto timeline-scrollbar py-1">
            <button
              onClick={() => setSelectedTrackTab('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                selectedTrackTab === 'all'
                  ? 'bg-[#22232a] text-[#ececf0] border border-[#383a42]'
                  : 'text-[#71717a] hover:text-[#9e9ea7]'
              }`}
            >
              All ({allNodesWithTrack.length})
            </button>
            {timelines.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrackTab(track.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  selectedTrackTab === track.id
                    ? 'bg-[#22232a] text-[#ececf0] border border-[#383a42]'
                    : 'text-[#71717a] hover:text-[#9e9ea7]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ececf0]" />
                <span>{track.title}</span>
                <span className="text-[10px] text-[#6b6c75]">({track.nodes.length})</span>
              </button>
            ))}
          </div>
        )}

        {/* Right Search & Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isCollapsed && (
            <div className="relative flex items-center">
              <Search className="w-3 h-3 text-[#6b6c75] absolute left-2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter matrix records..."
                className="w-40 sm:w-48 bg-[#18191e] border border-[#2a2b32] rounded pl-7 pr-2 py-1 text-[11px] text-[#ececf0] placeholder-[#6b6c75] focus:outline-none focus:border-[#454754]"
              />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#2a2b32] bg-[#18191e] hover:bg-[#202128] text-[#9e9ea7] hover:text-[#ececf0] transition-colors text-[11px]"
            title={isCollapsed ? 'Expand comparison panel' : 'Collapse comparison panel'}
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Expand Matrix</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Matrix Table (Scrollable within allocated height) */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto p-3 timeline-scrollbar bg-[#101114]">
          <div className="rounded-lg border border-[#222328] bg-[#141519] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222328] bg-[#16171b] text-[#9e9ea7] text-[10px] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 px-3 font-medium w-10 text-center">#</th>
                  <th className="py-2.5 px-3 font-medium">Milestone Event</th>
                  <th className="py-2.5 px-3 font-medium">Track / Timeline</th>
                  <th className="py-2.5 px-3 font-medium">Time Span</th>
                  <th className="py-2.5 px-3 font-medium">Duration</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium">Priority</th>
                  <th className="py-2.5 px-3 font-medium">Tags</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222328] text-[11px] text-[#ececf0]">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map(({ node, track }, idx) => (
                    <tr
                      key={node.id}
                      onClick={() => onSelectNode?.(node)}
                      className="hover:bg-[#1b1c24] cursor-pointer transition-colors group"
                      title="Click to edit milestone in drawer"
                    >
                      {/* Counter */}
                      <td className="py-2.5 px-3 text-[#6b6c75] font-mono text-center text-[10px]">
                        {idx + 1}
                      </td>

                      {/* Milestone Title & Description */}
                      <td className="py-2.5 px-3 min-w-[200px] max-w-[320px]">
                        <div className="font-medium text-[#ececf0] group-hover:text-white truncate">
                          {node.title}
                        </div>
                        {node.description && (
                          <div className="text-[10px] text-[#71717a] truncate font-normal mt-0.5">
                            {node.description}
                          </div>
                        )}
                      </td>

                      {/* Track Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#2a2b32] bg-[#18191e] text-[#9e9ea7] text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ececf0]" />
                          <span>{track.title}</span>
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-2.5 px-3 font-mono text-[#9e9ea7] whitespace-nowrap">
                        <span>{formatDisplayDate(node.startDate)}</span>
                        {node.endDate && (
                          <span className="text-[#6b6c75]"> – {formatDisplayDate(node.endDate)}</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-2.5 px-3 font-mono text-[#71717a] whitespace-nowrap">
                        {getDurationLabel(node.startDate, node.endDate)}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {renderStatusBadge(node.status)}
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#9e9ea7] capitalize">
                          {node.priority === 'high' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ececf0]" />
                          )}
                          {node.priority === 'medium' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#71717a]" />
                          )}
                          {node.priority === 'low' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#383a42]" />
                          )}
                          <span>{node.priority}</span>
                        </span>
                      </td>

                      {/* Tags */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="flex items-center gap-1 flex-wrap">
                          {node.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#121316] border border-[#222328] text-[#9e9ea7]"
                            >
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNode?.(node);
                          }}
                          className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#2a2b34] transition-colors"
                          title="Open Node in Drawer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#71717a]">
                      No milestones match the current filter or search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
