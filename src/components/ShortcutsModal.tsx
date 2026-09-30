'use client';

import React, { useEffect } from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'General & Navigation',
    items: [
      { keys: ['?'], description: 'Open Keyboard Shortcuts cheat sheet' },
      { keys: ['/', '⌘ K'], description: 'Focus search filter' },
      { keys: ['H'], description: 'Scroll timeline to Today' },
      { keys: ['S'], description: 'Scroll to start of timeline' },
      { keys: ['+ / -'], description: 'Zoom in / Zoom out canvas' },
      { keys: ['0'], description: 'Reset zoom to 100%' },
      { keys: ['G'], description: 'Cycle grid style (Notebook / Dots / Plain)' },
      { keys: ['B'], description: 'Toggle bottom Comparison Matrix' },
      { keys: ['Esc'], description: 'Close modal, drawer, or deselect node' }
    ]
  },
  {
    title: 'Creation',
    items: [
      { keys: ['N', 'C'], description: 'Create a new node' },
      { keys: ['T'], description: 'Create a new timeline track' },
      { keys: ['P'], description: 'Create a new project workspace' }
    ]
  },
  {
    title: 'Selected Node Actions',
    items: [
      { keys: ['Enter', 'E'], description: 'Open edit drawer for selected node' },
      { keys: ['←', '→'], description: 'Select previous / next chronological node' },
      { keys: ['D', '⌘ D'], description: 'Duplicate node (+7 days downstream)' },
      { keys: ['1', '2', '3', '4'], description: 'Set status: Planned / In Progress / Done / Blocked' },
      { keys: ['Shift + B'], description: 'Branch new timeline from this node' },
      { keys: ['Del', '⌫'], description: 'Delete selected node' }
    ]
  }
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#141519] border border-[#2a2b32] rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222328] bg-[#121316] flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#ececf0]">
            <div className="p-1.5 rounded-md bg-[#1d1f26] border border-[#2c2e38]">
              <Keyboard className="w-4 h-4 text-[#ececf0]" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-[#ececf0]">
                Keyboard Shortcuts
              </div>
              <div className="text-[10px] text-[#9e9ea7]">
                Navigate and manage your timelines faster with hotkeys
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#202128] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Categories */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
          {SHORTCUT_CATEGORIES.map(category => (
            <div key={category.title} className="space-y-2.5">
              <div className="text-[11px] uppercase tracking-wider text-[#9e9ea7] font-semibold border-b border-[#222328] pb-1">
                {category.title}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#18191e]/70 border border-[#23242b] hover:border-[#333540] transition-colors"
                  >
                    <span className="text-xs text-[#9e9ea7] truncate pr-2">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.keys.map((k, kidx) => (
                        <kbd
                          key={kidx}
                          className="px-2 py-0.5 rounded bg-[#202128] border border-[#33343d] text-[#ececf0] font-mono text-[11px] font-semibold shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-[#222328] bg-[#121316] flex items-center justify-between text-[11px] text-[#9e9ea7]">
          <div className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-[#9e9ea7]" />
            <span>Shortcuts are disabled while typing in text inputs</span>
          </div>
          <div className="font-mono text-[10px]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#1e2027] border border-[#2e303a] text-[#ececf0]">Esc</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
};
