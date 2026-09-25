'use client';

import React from 'react';
import { Plus, GitFork, Calendar, Search, ZoomIn, ZoomOut, Database, Grid3X3 } from 'lucide-react';

interface HeaderProps {
  timelineCount: number;
  nodeCount: number;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onCenterToday: () => void;
  onOpenAddTimeline: () => void;
  onOpenAddNode: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  gridStyle: 'notebook' | 'dots' | 'plain';
  onToggleGrid: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  timelineCount,
  nodeCount,
  zoom,
  onZoomChange,
  onCenterToday,
  onOpenAddTimeline,
  onOpenAddNode,
  searchQuery,
  onSearchChange,
  gridStyle,
  onToggleGrid
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#222328] bg-[#121316]/95 backdrop-blur px-5 py-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Stats */}
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#1c1d22] border border-[#2a2b32] flex items-center justify-center text-white">
            <GitFork className="w-4 h-4 text-[#ececf0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-[#ececf0]">Timeline Studio</span>
              <span className="text-xs px-2 py-0.5 rounded border border-[#2a2b32] bg-[#16171b] text-[#9e9ea7] flex items-center gap-1 font-mono">
                <Database className="w-3 h-3 text-[#71717a]" />
                SQLite Local
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#9e9ea7] mt-0.5 font-mono">
              <span>{timelineCount} {timelineCount === 1 ? 'track' : 'tracks'}</span>
              <span className="text-[#383a42]">•</span>
              <span>{nodeCount} nodes</span>
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Search box */}
          <div className="relative w-48 lg:w-64">
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

          <button
            onClick={onCenterToday}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#222328] bg-[#16171b] hover:bg-[#202127] text-xs text-[#9e9ea7] hover:text-[#ececf0] transition-colors font-mono"
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
