'use client';

import React, { useState, useEffect } from 'react';
import { TimelineTrack, Project } from '@/types/timeline';
import { X, GitFork, Layers, Folder } from 'lucide-react';
import { renderProjectIcon } from './Header';

interface AddTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelines: TimelineTrack[];
  preselectedParentId?: string | null;
  preselectedBranchNodeId?: string | null;
  onCreateTimeline: (data: {
    projectId?: string;
    title: string;
    description?: string;
    parentTimelineId?: string | null;
    branchPointNodeId?: string | null;
  }) => Promise<void>;
  projects?: Project[];
  activeProjectId?: string;
}

export const AddTimelineModal: React.FC<AddTimelineModalProps> = ({
  isOpen,
  onClose,
  timelines,
  preselectedParentId,
  preselectedBranchNodeId,
  onCreateTimeline,
  projects = [],
  activeProjectId
}) => {
  const [targetProjectId, setTargetProjectId] = useState<string>(activeProjectId || '');
  const [trackType, setTrackType] = useState<'independent' | 'branch'>('independent');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentTimelineId, setParentTimelineId] = useState('');
  const [branchPointNodeId, setBranchPointNodeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeProjectId) {
      setTargetProjectId(activeProjectId);
    } else if (projects.length > 0) {
      setTargetProjectId(projects[0].id);
    }
  }, [activeProjectId, projects]);

  useEffect(() => {
    if (preselectedParentId) {
      setTrackType('branch');
      setParentTimelineId(preselectedParentId);
      if (preselectedBranchNodeId) {
        setBranchPointNodeId(preselectedBranchNodeId);
      }
    } else {
      setTrackType('independent');
      setParentTimelineId(timelines[0]?.id || '');
      setBranchPointNodeId('');
    }
    setTitle('');
    setDescription('');
  }, [isOpen, preselectedParentId, preselectedBranchNodeId, timelines]);

  if (!isOpen) return null;

  const parentTrack = timelines.find(t => t.id === parentTimelineId);
  const parentNodes = parentTrack ? parentTrack.nodes : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateTimeline({
        projectId: targetProjectId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        parentTimelineId: trackType === 'branch' ? parentTimelineId : null,
        branchPointNodeId: trackType === 'branch' ? branchPointNodeId || null : null
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#141519] border border-[#2a2b32] rounded-xl shadow-2xl overflow-hidden z-10 font-mono text-xs select-none">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#222328] flex items-center justify-between bg-[#121316]">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-[#ececf0]" />
            <span className="font-semibold text-[#ececf0]">
              {trackType === 'branch' ? 'Branch Timeline Track' : 'Create New Timeline Track'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#202128] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Project Selection */}
          {projects.length > 0 && (
            <div>
              <label className="block text-[#9e9ea7] mb-1.5 font-medium flex items-center gap-1.5 text-[11px]">
                <Folder className="w-3.5 h-3.5" />
                <span>Target Project Workspace</span>
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className="w-full bg-[#18191e] border border-[#2a2b32] rounded-lg px-3 py-2 text-[#ececf0] focus:outline-none focus:border-[#454754]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {renderProjectIcon(p.icon)} {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Selector */}
          <div>
            <label className="block text-[#9e9ea7] mb-2 font-medium">Timeline Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTrackType('independent')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  trackType === 'independent'
                    ? 'bg-[#1e1f26] border-[#ececf0] text-[#ececf0]'
                    : 'bg-[#16171b] border-[#222328] text-[#9e9ea7] hover:border-[#383a42]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Independent Track</span>
                </div>
                <span className="text-[10px] text-[#71717a]">
                  Parallel roadmap, competitor, or standalone milestone track.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTrackType('branch')}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  trackType === 'branch'
                    ? 'bg-[#1e1f26] border-[#ececf0] text-[#ececf0]'
                    : 'bg-[#16171b] border-[#222328] text-[#9e9ea7] hover:border-[#383a42]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Branch from Track</span>
                </div>
                <span className="text-[10px] text-[#71717a]">
                  Diverges from an existing roadmap or specific milestone node.
                </span>
              </button>
            </div>
          </div>

          {/* Branch configuration if selected */}
          {trackType === 'branch' && (
            <div className="p-3.5 rounded-lg bg-[#18191e] border border-[#2a2b32] space-y-3">
              <div>
                <label className="block text-[#9e9ea7] mb-1 font-medium">Parent Timeline</label>
                <select
                  value={parentTimelineId}
                  onChange={(e) => {
                    setParentTimelineId(e.target.value);
                    setBranchPointNodeId('');
                  }}
                  className="w-full bg-[#121316] border border-[#2a2b32] rounded px-3 py-1.5 text-[#ececf0] focus:outline-none focus:border-[#454754]"
                >
                  {timelines.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#9e9ea7] mb-1 font-medium">
                  Branch Point Node (Milestone origin)
                </label>
                <select
                  value={branchPointNodeId}
                  onChange={(e) => setBranchPointNodeId(e.target.value)}
                  className="w-full bg-[#121316] border border-[#2a2b32] rounded px-3 py-1.5 text-[#ececf0] focus:outline-none focus:border-[#454754]"
                >
                  <option value="">-- General Track Branch --</option>
                  {parentNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({n.startDate})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[#9e9ea7] mb-1 font-medium">
              Track Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Backend API, Competitor X, Mobile App..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#16171b] border border-[#222328] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#6b6c75] focus:outline-none focus:border-[#4e505e]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#9e9ea7] mb-1 font-medium">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Goal, owner, or focus of this track..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#16171b] border border-[#222328] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#6b6c75] focus:outline-none focus:border-[#4e505e] resize-none"
            />
          </div>

          {/* Submit & Cancel */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#222328]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#1a1b20] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-1.5 rounded bg-white hover:bg-[#e4e4e7] disabled:opacity-50 text-black font-semibold transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Track'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
