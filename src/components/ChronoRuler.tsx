'use client';

import React, { useMemo } from 'react';
import { formatMonthYear, dateToPixelX, formatYearLabel, formatDateStr } from '@/utils/date-utils';

interface ChronoRulerProps {
  originDate: Date;
  totalDays: number;
  pxPerDay: number;
  todayDateStr: string;
}

export const ChronoRuler: React.FC<ChronoRulerProps> = ({
  originDate,
  totalDays,
  pxPerDay,
  todayDateStr
}) => {
  const yearWidth = 365.25 * pxPerDay;
  const originYear = originDate.getUTCFullYear();
  const endYear = originYear + Math.round(totalDays / 365.25);

  // 1. Generate adaptive Major and Minor timeline ruler intervals
  const { majorIntervals, minorTicks } = useMemo(() => {
    const majors: Array<{ name: string; pixelStart: number; pixelWidth: number }> = [];
    const minors: Array<{ label: string; pixelX: number }> = [];

    // TIER A: Multi-Century / Historical Macro Scale (yearWidth < 50px)
    if (yearWidth < 50) {
      const step = yearWidth < 12 ? 100 : 50; // 100-year or 50-year century blocks
      const minorStep = step === 100 ? 25 : 10;
      const startY = Math.floor(originYear / step) * step;

      for (let y = startY; y <= endYear + step; y += step) {
        const d1 = new Date(0);
        d1.setUTCFullYear(y, 0, 1);
        const d2 = new Date(0);
        d2.setUTCFullYear(y + step, 0, 1);

        const startX = dateToPixelX(formatDateStr(d1), originDate, pxPerDay);
        const endX = dateToPixelX(formatDateStr(d2), originDate, pxPerDay);
        const width = Math.max(20, endX - startX);

        if (startX <= totalDays * pxPerDay + 200 && endX >= -200) {
          majors.push({
            name: `${formatYearLabel(y)} – ${formatYearLabel(y + step)}`,
            pixelStart: startX,
            pixelWidth: width
          });
        }

        // Minor ticks within this block
        for (let my = y; my < y + step; my += minorStep) {
          const md = new Date(0);
          md.setUTCFullYear(my, 0, 1);
          const mX = dateToPixelX(formatDateStr(md), originDate, pxPerDay);
          if (mX >= 0 && mX <= totalDays * pxPerDay) {
            minors.push({
              label: formatYearLabel(my),
              pixelX: mX
            });
          }
        }
      }

      return { majorIntervals: majors, minorTicks: minors };
    }

    // TIER B: Multi-Year Scale (50px <= yearWidth < 400px)
    if (yearWidth < 400) {
      for (let y = originYear; y <= endYear + 1; y++) {
        const d1 = new Date(0);
        d1.setUTCFullYear(y, 0, 1);
        const d2 = new Date(0);
        d2.setUTCFullYear(y + 1, 0, 1);

        const startX = dateToPixelX(formatDateStr(d1), originDate, pxPerDay);
        const endX = dateToPixelX(formatDateStr(d2), originDate, pxPerDay);

        majors.push({
          name: formatYearLabel(y),
          pixelStart: startX,
          pixelWidth: Math.max(20, endX - startX)
        });

        // Quarters
        [3, 6, 9].forEach((month, qIdx) => {
          const qDate = new Date(0);
          qDate.setUTCFullYear(y, month, 1);
          const qX = dateToPixelX(formatDateStr(qDate), originDate, pxPerDay);
          if (qX >= 0 && qX <= totalDays * pxPerDay) {
            minors.push({
              label: `Q${qIdx + 2}`,
              pixelX: qX
            });
          }
        });
      }

      return { majorIntervals: majors, minorTicks: minors };
    }

    // TIER C: Standard Monthly & Weekly Scale (yearWidth >= 400px)
    const endDate = new Date(originDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
    let temp = new Date(Date.UTC(originDate.getUTCFullYear(), originDate.getUTCMonth(), 1));

    while (temp <= endDate) {
      const nextMonth = new Date(Date.UTC(temp.getUTCFullYear(), temp.getUTCMonth() + 1, 1));
      const startX = Math.max(0, ((temp.getTime() - originDate.getTime()) / (1000 * 60 * 60 * 24)) * pxPerDay);
      const endX = ((nextMonth.getTime() - originDate.getTime()) / (1000 * 60 * 60 * 24)) * pxPerDay;

      majors.push({
        name: formatMonthYear(temp),
        pixelStart: Math.round(startX),
        pixelWidth: Math.round(endX - startX)
      });

      temp = nextMonth;
    }

    let dayOffset = 0;
    while (dayOffset < totalDays) {
      const d = new Date(originDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const dayOfMonth = d.getUTCDate();
      minors.push({
        label: `Day ${dayOfMonth}`,
        pixelX: Math.round(dayOffset * pxPerDay)
      });
      dayOffset += 7;
    }

    return { majorIntervals: majors, minorTicks: minors };
  }, [yearWidth, originYear, endYear, originDate, pxPerDay, totalDays]);

  const todayX = dateToPixelX(todayDateStr, originDate, pxPerDay);

  return (
    <div className="sticky top-0 z-30 h-16 bg-[#121316] border-b border-[#222328] select-none">
      {/* Major row (Centuries / Years / Months) */}
      <div className="h-8 border-b border-[#222328] relative flex overflow-hidden">
        {majorIntervals.map((m, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${m.pixelStart}px`,
              width: `${m.pixelWidth}px`
            }}
            className="h-full border-r border-[#222328] px-3 flex items-center justify-between text-xs font-mono text-[#ececf0]/90 font-medium whitespace-nowrap overflow-hidden"
          >
            <span className="truncate">{m.name}</span>
          </div>
        ))}
      </div>

      {/* Minor Ticks row (Decades / Quarters / Weeks) */}
      <div className="h-8 relative flex items-center font-mono text-[10px] text-[#6b6c75] overflow-hidden">
        {minorTicks.map((w, idx) => (
          <div
            key={idx}
            style={{ position: 'absolute', left: `${w.pixelX}px` }}
            className="flex flex-col items-center -translate-x-1/2 whitespace-nowrap"
          >
            <span>{w.label}</span>
            <div className="h-2 w-px bg-[#2a2b32] mt-0.5" />
          </div>
        ))}
      </div>

      {/* "Today" vertical marker indicator */}
      {todayX >= 0 && todayX <= totalDays * pxPerDay && (
        <div
          style={{ left: `${todayX}px` }}
          className="absolute top-0 bottom-0 w-px bg-[#ffffff] z-40 pointer-events-none"
        >
          <div className="absolute top-1.5 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#ffffff] text-[#101114] font-mono text-[9px] font-semibold whitespace-nowrap shadow-sm">
            Today
          </div>
        </div>
      )}
    </div>
  );
};
