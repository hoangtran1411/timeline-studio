'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TimelineTrack, TimelineNode, NodeStatus } from '@/types/timeline';
import { formatDisplayDate, parseDate } from '@/utils/date-utils';
import { Table, ChevronDown, ChevronUp, Search, Check, AlertCircle, Clock, Edit3, Layers, X } from 'lucide-react';

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
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState<boolean>(false);
  const [trackSearchQuery, setTrackSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTrackTab = (selectedTrackTab !== 'all' && !timelines.some(t => t.id === selectedTrackTab))
    ? 'all'
    : selectedTrackTab;

  const activeTrack = useMemo(() => {
    return timelines.find(t => t.id === activeTrackTab);
  }, [timelines, activeTrackTab]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTrackDropdownOpen(false);
      }
    };
    if (isTrackDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isTrackDropdownOpen]);

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
      if (activeTrackTab !== 'all' && track.id !== activeTrackTab) {
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
  }, [allNodesWithTrack, activeTrackTab, statusFilter, searchQuery]);

  const filteredDropdownTracks = useMemo(() => {
    if (!trackSearchQuery.trim()) return timelines;
    const q = trackSearchQuery.toLowerCase();
    return timelines.filter(t => t.title.toLowerCase().includes(q));
  }, [timelines, trackSearchQuery]);

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
            <Clock className="w-2.5 h-2.5 text-[#9e9ea7]" />
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
      <div className="h-11 px-3 sm:px-4 border-b border-[#222328] flex items-center justify-between flex-shrink-0 bg-[#141519] gap-2 sm:gap-3">
        {/* Left Title & Live Record Count - Flex-shrink-0 ensures it never collapses */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 min-w-0">
          <div className="p-1 rounded bg-[#18191e] border border-[#2a2b32] text-[#ececf0] flex-shrink-0">
            <Table className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h2 className="font-semibold text-xs text-[#ececf0] truncate">Timeline Milestones Matrix</h2>
            <span className="text-[10px] px-2 py-0.5 rounded border border-[#2a2b32] bg-[#16171b] text-[#9e9ea7] flex-shrink-0 hidden md:inline-block">
              {allNodesWithTrack.length} Real Records (Database)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#2a2b32] bg-[#16171b] text-[#9e9ea7] flex-shrink-0 md:hidden">
              {allNodesWithTrack.length}
            </span>
          </div>
        </div>

        {/* Right Controls: Search, Combobox Tracks, Collapse/Expand */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {!isCollapsed && (
            <>
              {/* Search input */}
              <div className="relative flex items-center">
                <Search className="w-3 h-3 text-[#9e9ea7] absolute left-2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter records..."
                  className="w-28 sm:w-36 md:w-44 bg-[#18191e] border border-[#2a2b32] rounded pl-7 pr-2 py-1 text-[11px] text-[#ececf0] placeholder-[#9e9ea7] focus:outline-none focus:border-[#454754]"
                />
              </div>

              {/* Combobox Tracks Selector (next to Collapse) */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrackDropdownOpen((prev) => !prev);
                      setTrackSearchQuery('');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap border ${
                      activeTrackTab !== 'all'
                        ? 'bg-[#181920] border-[#383a42] text-[#ececf0] hover:bg-[#202128]'
                        : isTrackDropdownOpen
                        ? 'bg-[#22232a] border-[#383a42] text-[#ececf0]'
                        : 'border-[#2a2b32] bg-[#16171b] text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#1f2026]'
                    }`}
                    title="Filter milestones by timeline track"
                  >
                    {activeTrackTab !== 'all' && activeTrack ? (
                      <>
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: activeTrack.color || '#ececf0' }}
                        />
                        <span className="truncate max-w-[110px] sm:max-w-[150px]">{activeTrack.title}</span>
                        <span className="text-[10px] text-[#9e9ea7] flex-shrink-0">({activeTrack.nodes.length})</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3 h-3 text-[#9e9ea7]" />
                        <span>Tracks ({timelines.length})</span>
                      </>
                    )}
                    <ChevronDown
                      className={`w-3 h-3 text-[#9e9ea7] transition-transform ${
                        isTrackDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* 1-click Clear Filter Button when a track is active */}
                  {activeTrackTab !== 'all' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrackTab('all');
                      }}
                      className="ml-1 p-1 rounded hover:bg-[#252733] text-[#9e9ea7] hover:text-white transition-colors border border-[#2a2b32] bg-[#16171b]"
                      title="Clear track filter (Show all tracks)"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Menu Popover */}
                {isTrackDropdownOpen && (
                  <div className="absolute top-full mt-1.5 right-0 z-50 w-64 max-w-[90vw] bg-[#16171b] border border-[#2a2b32] rounded-lg shadow-2xl p-1.5 flex flex-col gap-1 font-mono text-xs">
                    {/* Search box if > 5 tracks */}
                    {timelines.length > 5 && (
                      <div className="relative px-1 pt-1 pb-1">
                        <Search className="w-3 h-3 absolute left-3 top-3 text-[#9e9ea7] pointer-events-none" />
                        <input
                          type="text"
                          value={trackSearchQuery}
                          onChange={(e) => setTrackSearchQuery(e.target.value)}
                          placeholder="Search tracks..."
                          className="w-full pl-7 pr-2 py-1 text-[11px] bg-[#101114] border border-[#2a2b32] rounded text-[#ececf0] placeholder-[#9e9ea7] focus:outline-none focus:border-[#454754]"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* All Tracks Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrackTab('all');
                        setIsTrackDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-colors ${
                        activeTrackTab === 'all'
                          ? 'bg-[#22232a] text-[#ececf0] font-medium'
                          : 'text-[#9e9ea7] hover:bg-[#1c1d24] hover:text-[#ececf0]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-[#9e9ea7]" />
                        <span>All Tracks</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#9e9ea7]">({allNodesWithTrack.length})</span>
                        {activeTrackTab === 'all' && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>

                    <div className="h-px bg-[#222328] my-0.5" />

                    {/* Tracks List */}
                    <div className="overflow-y-auto max-h-[220px] timeline-scrollbar flex flex-col gap-0.5 pr-0.5">
                      {filteredDropdownTracks.length > 0 ? (
                        filteredDropdownTracks.map((track) => {
                          const isSelected = activeTrackTab === track.id;
                          return (
                            <button
                              key={track.id}
                              type="button"
                              onClick={() => {
                                setSelectedTrackTab(track.id);
                                setIsTrackDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-colors text-left ${
                                isSelected
                                  ? 'bg-[#22232a] text-[#ececf0] font-medium'
                                  : 'text-[#9e9ea7] hover:bg-[#1c1d24] hover:text-[#ececf0]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 mr-2">
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: track.color || '#ececf0' }}
                                />
                                <span className="truncate">{track.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px] text-[#9e9ea7]">({track.nodes.length})</span>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-3 text-center text-[10px] text-[#9e9ea7]">
                          No tracks match &quot;{trackSearchQuery}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Collapse/Expand Button */}
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded border border-[#2a2b32] bg-[#18191e] hover:bg-[#202128] text-[#9e9ea7] hover:text-[#ececf0] transition-colors text-[11px] flex-shrink-0"
            title={isCollapsed ? 'Expand comparison panel' : 'Collapse comparison panel'}
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand Matrix</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Matrix Table (Scrollable within allocated height) */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto p-3 timeline-scrollbar bg-[#101114]">
          <div className="rounded-lg border border-[#222328] bg-[#141519] overflow-hidden">
            <table className="w-full text-left border-collapse min-w-[860px]">
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
                      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 40px' }}
                      onClick={() => onSelectNode?.(node)}
                      className="hover:bg-[#1b1c24] cursor-pointer transition-colors group"
                      title="Click to edit milestone in drawer"
                    >
                      {/* Counter */}
                      <td className="py-2.5 px-3 text-[#9e9ea7] font-mono text-center text-[10px]">
                        {idx + 1}
                      </td>

                      {/* Milestone Title & Description */}
                      <td className="py-2.5 px-3 min-w-[200px] max-w-[320px]">
                        <div className="font-medium text-[#ececf0] group-hover:text-white truncate">
                          {node.title}
                        </div>
                        {node.description && (
                          <div className="text-[10px] text-[#9e9ea7] truncate font-normal mt-0.5">
                            {node.description}
                          </div>
                        )}
                      </td>

                      {/* Track Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#2a2b32] bg-[#18191e] text-[#9e9ea7] text-[10px] max-w-[200px]">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: track.color || '#ececf0' }}
                          />
                          <span className="truncate">{track.title}</span>
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-2.5 px-3 font-mono text-[#9e9ea7] whitespace-nowrap">
                        <span>{formatDisplayDate(node.startDate)}</span>
                        {node.endDate && (
                          <span className="text-[#9e9ea7]"> – {formatDisplayDate(node.endDate)}</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-2.5 px-3 font-mono text-[#9e9ea7] whitespace-nowrap">
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
                    <td colSpan={9} className="py-8 text-center text-[#9e9ea7]">
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
