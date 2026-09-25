'use client';

import React from 'react';
import { formatMonthYear, dateToPixelX } from '@/utils/date-utils';

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
  // Generate month divisions
  const months: Array<{ name: string; pixelStart: number; pixelWidth: number }> = [];
  const currentDate = new Date(originDate);
  const endDate = new Date(originDate.getTime() + totalDays * 24 * 60 * 60 * 1000);

  let temp = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1));
  while (temp <= endDate) {
    const nextMonth = new Date(Date.UTC(temp.getUTCFullYear(), temp.getUTCMonth() + 1, 1));
    const startX = Math.max(0, ((temp.getTime() - originDate.getTime()) / (1000 * 60 * 60 * 24)) * pxPerDay);
    const endX = ((nextMonth.getTime() - originDate.getTime()) / (1000 * 60 * 60 * 24)) * pxPerDay;

    months.push({
      name: formatMonthYear(temp),
      pixelStart: Math.round(startX),
      pixelWidth: Math.round(endX - startX)
    });

    temp = nextMonth;
  }

  // Generate week intervals
  const weeks: Array<{ label: string; pixelX: number }> = [];
  let weekTemp = new Date(originDate);
  // align to Sunday/Monday or 7-day stride
  let dayOffset = 0;
  while (dayOffset < totalDays) {
    const d = new Date(originDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dayOfMonth = d.getUTCDate();
    weeks.push({
      label: `Day ${dayOfMonth}`,
      pixelX: Math.round(dayOffset * pxPerDay)
    });
    dayOffset += 7;
  }

  const todayX = dateToPixelX(todayDateStr, originDate, pxPerDay);

  return (
    <div className="sticky top-0 z-30 h-16 bg-[#121316] border-b border-[#222328] select-none">
      {/* Month row */}
      <div className="h-8 border-b border-[#222328] relative flex">
        {months.map((m, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${m.pixelStart}px`,
              width: `${m.pixelWidth}px`
            }}
            className="h-full border-r border-[#222328] px-3 flex items-center justify-between text-xs font-mono text-[#ececf0]/90 font-medium"
          >
            <span>{m.name}</span>
          </div>
        ))}
      </div>

      {/* Week / Day Ticks */}
      <div className="h-8 relative flex items-center font-mono text-[10px] text-[#6b6c75]">
        {weeks.map((w, idx) => (
          <div
            key={idx}
            style={{ position: 'absolute', left: `${w.pixelX}px` }}
            className="flex flex-col items-center -translate-x-1/2"
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
