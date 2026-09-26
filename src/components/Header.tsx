'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project } from '@/types/timeline';
import {
  Plus,
  GitFork,
  Calendar,
  Search,
  ZoomIn,
  ZoomOut,
  Database,
  Grid3X3,
  Archive,
  EyeOff,
  ChevronDown,
  Pencil,
  FolderPlus,
  Check,
  SkipBack
} from 'lucide-react';

interface HeaderProps {
  projects?: Project[];
  currentProject?: Project | null;
  onSelectProject?: (projectId: string) => void;
  onOpenCreateProject?: () => void;
  onOpenEditProject?: (project: Project) => void;
  timelineCount: number;
  nodeCount: number;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onCenterToday: () => void;
  onScrollToStart?: () => void;
  onOpenAddTimeline: () => void;
  onOpenAddNode: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  gridStyle: 'notebook' | 'dots' | 'plain';
  onToggleGrid: () => void;
  archivedCount?: number;
  onOpenArchiveModal?: () => void;
  hiddenCount?: number;
  onShowAllTracks?: () => void;
}

export function renderProjectIcon(icon?: string | null): string {
  if (!icon) return '📁';
  if (icon === 'landmark' || icon === 'history') return '📜';
  if (icon === 'lightbulb' || icon === 'idea') return '💡';
  if (icon === 'rocket' || icon === 'roadmap') return '🚀';
  if (icon === 'science' || icon === 'research') return '🔬';
  if (icon === 'finance' || icon === 'strategy') return '📊';
  if (icon === 'game') return '🎮';
  if (icon === 'education' || icon === 'study') return '📚';
  if (icon === 'goal' || icon === 'milestone') return '🎯';
  return icon;
}

export const Header: React.FC<HeaderProps> = ({
  projects = [],
  currentProject,
  onSelectProject,
  onOpenCreateProject,
  onOpenEditProject,
  timelineCount,
  nodeCount,
  zoom,
  onZoomChange,
  onCenterToday,
  onScrollToStart,
  onOpenAddTimeline,
  onOpenAddNode,
  searchQuery,
  onSearchChange,
  gridStyle,
  onToggleGrid,
  archivedCount = 0,
  onOpenArchiveModal,
  hiddenCount = 0,
  onShowAllTracks
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isProjectDropdownOpen]);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-[#222328] bg-[#121316]/95 backdrop-blur px-5 py-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: App Brand & Project Switcher */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Permanent App Brand */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#1c1d22] border border-[#2a2b32] flex items-center justify-center text-white">
              <GitFork className="w-4 h-4 text-[#ececf0]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-[#ececf0] whitespace-nowrap">
                  Timeline Studio
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#2a2b32] bg-[#16171b] text-[#9e9ea7] hidden xl:flex items-center gap-1 font-mono">
                  <Database className="w-2.5 h-2.5 text-[#71717a]" />
                  SQLite
                </span>
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-[#262832] flex-shrink-0 hidden sm:block" />

          {/* Dedicated Project Workspace Switcher */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProjectDropdownOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer text-left shadow-xs ${
                isProjectDropdownOpen
                  ? 'bg-[#1e2029] border-[#424453] ring-1 ring-[#525568]'
                  : 'bg-[#16171b] hover:bg-[#1c1d23] border-[#2a2b34] hover:border-[#3e404e]'
              }`}
              title="Click to switch or manage project workspaces"
            >
              <span className="text-base flex-shrink-0 leading-none">
                {renderProjectIcon(currentProject?.icon)}
              </span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-xs text-[#ececf0] group-hover:text-white transition-colors max-w-[160px] sm:max-w-[220px] truncate">
                    {currentProject?.name || 'Select Project'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#71717a] transition-transform duration-200 ${
                      isProjectDropdownOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e2028] text-[#9e9ea7] border border-[#262832] hidden md:inline-block">
                {timelineCount} {timelineCount === 1 ? 'track' : 'tracks'}
              </span>
            </button>

            {/* Project Switcher Dropdown */}
            {isProjectDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-[#141519] border border-[#2a2b32] rounded-xl shadow-2xl overflow-hidden z-[100] font-mono text-xs select-none">
                <div className="px-3.5 py-2 border-b border-[#222328] bg-[#121316] flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#71717a] font-semibold">
                    Workspaces & Projects
                  </span>
                  <span className="text-[10px] text-[#9e9ea7] bg-[#1a1b20] px-1.5 py-0.5 rounded border border-[#262832]">
                    {projects.length} available
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-[#1e1f26] p-1.5">
                  {projects.map((proj) => {
                    const isCurrent = proj.id === currentProject?.id;
                    return (
                      <div
                        key={proj.id}
                        className={`group flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#1e2029] text-[#ececf0]'
                            : 'hover:bg-[#181920] text-[#9e9ea7] hover:text-[#ececf0]'
                        }`}
                        onClick={() => {
                          onSelectProject?.(proj.id);
                          setIsProjectDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-lg flex-shrink-0">{renderProjectIcon(proj.icon)}</span>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-xs truncate max-w-[170px]">
                                {proj.name}
                              </span>
                              {isCurrent && (
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              )}
                            </div>
                            {proj.description && (
                              <span className="text-[10px] text-[#6b6c75] truncate max-w-[190px] font-sans">
                                {proj.description}
                              </span>
                            )}
                            <span className="text-[9px] text-[#555761] mt-0.5">
                              {proj.timelineCount || 0} tracks • {proj.nodeCount || 0} nodes
                            </span>
                          </div>
                        </div>

                        {onOpenEditProject && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsProjectDropdownOpen(false);
                              onOpenEditProject(proj);
                            }}
                            className="p-1.5 rounded text-[#71717a] hover:text-[#ececf0] hover:bg-[#252733] transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit Project Settings"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {onOpenCreateProject && (
                  <div className="p-1.5 border-t border-[#222328] bg-[#121316]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProjectDropdownOpen(false);
                        onOpenCreateProject();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1b22] hover:bg-[#22242e] text-[#ececf0] transition-colors text-xs font-medium border border-[#2a2b34]"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-[#9e9ea7]" />
                      <span>+ Create New Project</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-[#9e9ea7] font-mono hidden 2xl:flex items-center gap-2">
            <span>{nodeCount} nodes</span>
          </div>
        </div>

        {/* Right Section: Search & Actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Search box */}
          <div className="relative w-44 lg:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717a]" />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#16171b] border border-[#222328] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#ececf0] placeholder-[#6b6c75] focus:outline-none focus:border-[#3e404b] transition-colors"
            />
          </div>

          {/* Canvas Zoom & Navigation */}
          <div className="flex items-center bg-[#16171b] border border-[#222328] rounded-md p-0.5">
            <button
              onClick={() => onZoomChange(Math.max(0.6, zoom - 0.15))}
              className="p-1 rounded text-[#9e9ea7] hover:text-white hover:bg-[#202127] transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-[#9e9ea7] px-2 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => onZoomChange(Math.min(1.6, zoom + 0.15))}
              className="p-1 rounded text-[#9e9ea7] hover:text-white hover:bg-[#202127] transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Return to Timeline Beginning */}
          {onScrollToStart && (
            <button
              onClick={onScrollToStart}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#222328] bg-[#16171b] hover:bg-[#202127] text-xs text-[#9e9ea7] hover:text-[#ececf0] transition-colors font-mono cursor-pointer"
              title="Scroll to beginning of timeline (Đầu mốc thời gian)"
            >
              <SkipBack className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Start</span>
            </button>
          )}

          <button
            onClick={onCenterToday}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#222328] bg-[#16171b] hover:bg-[#202127] text-xs text-[#9e9ea7] hover:text-[#ececf0] transition-colors font-mono cursor-pointer"
            title="Scroll to Today marker"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* Notebook Grid Style Toggle */}
          <button
            onClick={onToggleGrid}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors font-mono ${
              gridStyle !== 'plain'
                ? 'border-[#383a42] bg-[#1c1d22] text-[#ececf0]'
                : 'border-[#222328] bg-[#16171b] text-[#9e9ea7] hover:text-[#ececf0]'
            }`}
            title={`Canvas Grid Style: ${gridStyle === 'notebook' ? 'Notebook Graph Paper (Kẻ ô vở)' : gridStyle === 'dots' ? 'Dot Grid' : 'Plain'} (Click to toggle)`}
          >
            <Grid3X3 className="w-3.5 h-3.5 text-[#9e9ea7]" />
            <span className="capitalize">{gridStyle === 'notebook' ? 'Notebook' : gridStyle}</span>
          </button>

          {/* Hidden tracks quick unhide indicator */}
          {hiddenCount > 0 && onShowAllTracks && (
            <button
              onClick={onShowAllTracks}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#383a45] bg-[#191a24] hover:bg-[#20222f] text-xs text-[#ececf0] transition-colors font-mono"
              title={`${hiddenCount} track(s) hidden from canvas. Click to show all.`}
            >
              <EyeOff className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>{hiddenCount} Hidden</span>
            </button>
          )}

          {/* Archive modal toggle button */}
          {onOpenArchiveModal && (
            <button
              onClick={onOpenArchiveModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors font-mono ${
                archivedCount > 0
                  ? 'border-[#2e303d] bg-[#181920] hover:bg-[#20222b] text-[#ececf0]'
                  : 'border-[#222328] bg-[#16171b] hover:bg-[#202127] text-[#9e9ea7] hover:text-[#ececf0]'
              }`}
              title="Open Archived Timelines"
            >
              <Archive className="w-3.5 h-3.5 text-[#9e9ea7]" />
              <span>Archived{archivedCount > 0 ? ` (${archivedCount})` : ''}</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#222328]" />

          {/* New Timeline Button */}
          <button
            onClick={onOpenAddTimeline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2a2b32] bg-[#1c1d22] hover:bg-[#24252c] text-xs font-medium text-[#ececf0] transition-all hover:border-[#3e404b]"
          >
            <GitFork className="w-3.5 h-3.5 text-[#9e9ea7]" />
            <span>+ Timeline</span>
          </button>

          {/* New Node Button */}
          <button
            onClick={onOpenAddNode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ffffff] hover:bg-[#e4e4e7] text-black text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Node</span>
          </button>
        </div>
      </div>
    </header>
  );
};
