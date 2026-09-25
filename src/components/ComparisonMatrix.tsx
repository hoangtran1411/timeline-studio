'use client';

import React from 'react';
import { TimelineTrack } from '@/types/timeline';
import { Table, ChevronDown, ChevronUp } from 'lucide-react';

interface ComparisonMatrixProps {
  timelines: TimelineTrack[];
  height: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  timelines,
  height,
  isCollapsed,
  onToggleCollapse
}) => {
  // Derive comparative milestone pairings
  const track1 = timelines[0];
  const track2 = timelines[1];
  const track3 = timelines[2];

  return (
    <section
      style={{ height: isCollapsed ? '44px' : `${height}px` }}
      className="w-full border-t border-[#222328] bg-[#121316] flex flex-col select-none font-mono text-xs flex-shrink-0 overflow-hidden box-border"
    >
      {/* Header bar (always visible, 44px) */}
      <div className="h-11 px-5 border-b border-[#222328] flex items-center justify-between flex-shrink-0 bg-[#141519]">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded bg-[#18191e] border border-[#2a2b32] text-[#ececf0]">
            <Table className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs text-[#ececf0]">Multi-Timeline Comparative Matrix</h3>
              <span className="text-[10px] px-2 py-0.5 rounded border border-[#2a2b32] bg-[#16171b] text-[#9e9ea7]">
                {timelines.length} Tracks Synchronized
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Collapse & Controls */}
        <div className="flex items-center gap-1.5">
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
        <div className="flex-1 overflow-auto p-4 timeline-scrollbar bg-[#101114]">
          <div className="rounded-lg border border-[#222328] bg-[#141519] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222328] bg-[#16171b] text-[#9e9ea7] text-[10px] uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 px-3 font-medium">Phase / Milestone</th>
                  <th className="py-2.5 px-3 font-medium">{track1?.title || 'Track 1'}</th>
                  <th className="py-2.5 px-3 font-medium">{track2?.title || 'Track 2'}</th>
                  <th className="py-2.5 px-3 font-medium">{track3?.title || 'Track 3'}</th>
                  <th className="py-2.5 px-3 font-medium">Delta / Offset</th>
                  <th className="py-2.5 px-3 font-medium">Status & Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222328] text-[11px] text-[#ececf0]">
                <tr className="hover:bg-[#18191e]/60 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ececf0]" />
                    <span>Research & Architecture</span>
                  </td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">Jul 12 – Aug 25 (Completed)</td>
                  <td className="py-2.5 px-3 text-[#71717a]">Aug 15 (AI Teaser)</td>
                  <td className="py-2.5 px-3 text-[#71717a]">—</td>
                  <td className="py-2.5 px-3 text-[#ececf0] font-semibold">+24d Lead</td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">3-week positioning advantage before market response</td>
                </tr>

                <tr className="hover:bg-[#18191e]/60 transition-colors bg-[#18191e]/30">
                  <td className="py-2.5 px-3 font-medium text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full border border-[#ececf0] animate-pulse" />
                    <span>Closed Alpha & Awareness</span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#ececf0]">Sep 15 – Oct 10 (In Progress)</td>
                  <td className="py-2.5 px-3 text-[#71717a]">None recorded</td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">Sep 10 – Sep 30 (Teaser Done)</td>
                  <td className="py-2.5 px-3 text-[#ececf0] font-semibold">Synchronized</td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">Teaser signups active while completing regression testing</td>
                </tr>

                <tr className="hover:bg-[#18191e]/60 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#71717a]" />
                    <span>Public Beta & KOL Rollout</span>
                  </td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">Oct 20 – Nov 15</td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">Oct 01 (Price hike)</td>
                  <td className="py-2.5 px-3 text-[#ececf0]">Oct 25 (Press Briefing)</td>
                  <td className="py-2.5 px-3 text-[#ececf0] font-semibold">5d GTM Buffer</td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">Requires Alpha Pass approval before sending review builds</td>
                </tr>

                <tr className="hover:bg-[#18191e]/60 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ececf0]" />
                    <span>General Availability Launch</span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">Dec 05</td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">Nov 18 (Competitor Summit)</td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">Nov 24 – Nov 30 (Early Bird)</td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">-17d vs Summit</td>
                  <td className="py-2.5 px-3 text-[#9e9ea7]">Captures post-summit enterprise migration window</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
