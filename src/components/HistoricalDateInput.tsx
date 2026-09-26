'use client';

import React, { useRef, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { formatDisplayDate } from '@/utils/date-utils';

interface HistoricalDateInputProps {
  label: string;
  value: string; // ISO string e.g. "-0221-01-01" or "2026-10-01" or ""
  onChange: (val: string) => void;
  required?: boolean;
  placeholder?: string;
}

export const HistoricalDateInput: React.FC<HistoricalDateInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  placeholder = 'YYYY-MM-DD'
}) => {
  const nativeInputRef = useRef<HTMLInputElement>(null);

  const cleanValue = value ? value.trim() : '';
  const isBC = cleanValue.startsWith('-');
  const rawText = isBC ? cleanValue.slice(1) : cleanValue;

  const handleToggleEra = (targetBC: boolean) => {
    if (targetBC === isBC) return;
    if (!rawText) {
      onChange(targetBC ? '-' : '');
      return;
    }
    onChange(targetBC ? `-${rawText}` : rawText);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    if (!inputVal) {
      onChange('');
      return;
    }

    if (inputVal.startsWith('-')) {
      onChange(`-${inputVal.slice(1)}`);
    } else if (isBC) {
      onChange(`-${inputVal}`);
    } else {
      onChange(inputVal);
    }
  };

  const handleBlur = () => {
    if (!rawText) return;

    const parts = rawText.split('-');
    let normalized = rawText;

    if (parts.length === 1 && !isNaN(Number(parts[0])) && parts[0].length > 0) {
      const year = parts[0].padStart(4, '0');
      normalized = `${year}-01-01`;
    } else if (parts.length === 2) {
      const year = parts[0].padStart(4, '0');
      const month = (parts[1] || '1').padStart(2, '0');
      normalized = `${year}-${month}-01`;
    } else if (parts.length >= 3) {
      const year = parts[0].padStart(4, '0');
      const month = (parts[1] || '1').padStart(2, '0');
      const day = (parts[2] || '1').padStart(2, '0');
      normalized = `${year}-${month}-${day}`;
    }

    onChange(isBC ? `-${normalized}` : normalized);
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.value;
    if (picked) {
      onChange(picked);
    }
  };

  const previewLabel = useMemo(() => {
    if (!cleanValue || cleanValue === '-') return null;
    try {
      return formatDisplayDate(cleanValue);
    } catch {
      return null;
    }
  }, [cleanValue]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[#9e9ea7] font-medium text-xs">
          {label}
        </label>
        {previewLabel && (
          <span className="text-[11px] font-mono text-[#4ade80] font-semibold">
            {previewLabel}
          </span>
        )}
      </div>

      <div className="flex items-center rounded-md border border-[#2a2b32] bg-[#18191e] overflow-hidden focus-within:border-[#52525b] transition-colors">
        {/* Era Segmented Control (BC / AD) */}
        <div className="flex items-center border-r border-[#2a2b32] bg-[#121316] p-0.5">
          <button
            type="button"
            onClick={() => handleToggleEra(true)}
            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
              isBC
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-[#6b6c75] hover:text-[#ececf0]'
            }`}
            title="Before Christ (BCE / TCN) - Negative Year"
          >
            BC
          </button>
          <button
            type="button"
            onClick={() => handleToggleEra(false)}
            className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
              !isBC
                ? 'bg-[#2a2b32] text-[#ececf0] border border-[#3e404b] shadow-xs'
                : 'text-[#6b6c75] hover:text-[#ececf0]'
            }`}
            title="Anno Domini (CE / SCN) - Positive Year"
          >
            AD
          </button>
        </div>

        {/* Text Input for YYYY-MM-DD */}
        <input
          type="text"
          value={rawText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className="flex-1 bg-transparent px-3 py-2 text-[#ececf0] placeholder-[#52525b] text-xs font-mono focus:outline-none"
        />

        {/* Optional Native Date Picker Trigger for AD dates */}
        {!isBC && (
          <div className="relative pr-2">
            <button
              type="button"
              onClick={() => {
                try {
                  nativeInputRef.current?.showPicker();
                } catch {
                  nativeInputRef.current?.focus();
                }
              }}
              className="p-1 rounded text-[#6b6c75] hover:text-[#ececf0] hover:bg-[#202128] transition-colors"
              title="Open calendar picker (AD dates only)"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
            <input
              ref={nativeInputRef}
              type="date"
              tabIndex={-1}
              value={!isBC && rawText.length === 10 ? rawText : ''}
              onChange={handleNativePickerChange}
              className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
            />
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-[#6b6c75]">
        <span>Format: <code className="text-[#9e9ea7]">YYYY-MM-DD</code> (e.g. 0221-01-01)</span>
        {isBC && (
          <span className="text-amber-400/80 font-mono">BCE Era (Saved as -{rawText || 'YYYY-MM-DD'})</span>
        )}
      </div>
    </div>
  );
};
