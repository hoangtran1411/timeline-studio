'use client';

import React, { useState, useEffect } from 'react';
import { TimelineNode, TimelineTrack, NodeStatus, NodePriority } from '@/types/timeline';
import { X, Trash2, GitFork, Calendar, Check, AlertCircle, Clock, Tag } from 'lucide-react';

interface NodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: TimelineNode | null; // null means creating a new node
  timelines: TimelineTrack[];
  defaultTimelineId?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  onSave: (nodeData: {
    id?: string;
    timelineId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string | null;
    status: NodeStatus;
    priority: NodePriority;
    tags: string[];
    autoShiftSubsequentDays?: number;
  }) => Promise<void>;
  onDelete?: (nodeId: string) => Promise<void>;
  onBranchFromNode?: (node: TimelineNode) => void;
}

export const NodeDrawer: React.FC<NodeDrawerProps> = ({
  isOpen,
  onClose,
  node,
  timelines,
  defaultTimelineId,
  defaultStartDate,
  defaultEndDate,
  onSave,
  onDelete,
  onBranchFromNode
}) => {
  const [timelineId, setTimelineId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<NodeStatus>('planned');
  const [priority, setPriority] = useState<NodePriority>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [autoShiftDays, setAutoShiftDays] = useState(0);
  const [enableAutoShift, setEnableAutoShift] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (node) {
      setTimelineId(node.timelineId);
      setTitle(node.title);
      setDescription(node.description || '');
      setStartDate(node.startDate);
      setEndDate(node.endDate || '');
      setStatus(node.status);
      setPriority(node.priority);
      setTagsInput(node.tags.join(', '));
      setEnableAutoShift(false);
      setAutoShiftDays(0);
    } else {
      setTimelineId(defaultTimelineId || (timelines[0]?.id ?? ''));
      setTitle('');
      setDescription('');
      setStartDate(defaultStartDate || new Date().toISOString().split('T')[0]);
      setEndDate(defaultEndDate || '');
      setStatus('planned');
      setPriority('medium');
      setTagsInput('');
      setEnableAutoShift(false);
      setAutoShiftDays(14);
    }
  }, [node, isOpen, defaultTimelineId, defaultStartDate, defaultEndDate, timelines]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onSave({
        id: node?.id,
        timelineId,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate: endDate || null,
        status,
        priority,
        tags,
        autoShiftSubsequentDays: enableAutoShift ? autoShiftDays : undefined
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-[#141519] border-l border-[#222328] h-full shadow-2xl flex flex-col z-10 select-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222328] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#9e9ea7]">
              {node ? 'EDIT NODE' : 'CREATE NODE'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {node && onBranchFromNode && (
              <button
                type="button"
                onClick={() => onBranchFromNode(node)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#202128] transition-colors"
                title="Branch timeline from this node"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Branch Track</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-[#9e9ea7] hover:text-[#ececf0] hover:bg-[#202128] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
          {/* Target Timeline */}
          <div>
            <label className="block text-[#9e9ea7] mb-1 font-medium">Timeline Track *</label>
            <select
              value={timelineId}
              onChange={(e) => setTimelineId(e.target.value)}
              className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] focus:outline-none focus:border-[#454754]"
              required
            >
              {timelines.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[#9e9ea7] mb-1 font-medium">Node Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Core API architecture..."
              className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#6b6c75] focus:outline-none focus:border-[#454754]"
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9e9ea7] mb-1 font-medium">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] focus:outline-none focus:border-[#454754]"
                required
              />
            </div>
            <div>
              <label className="block text-[#9e9ea7] mb-1 font-medium">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] focus:outline-none focus:border-[#454754]"
              />
            </div>
          </div>

          {/* Insertion Collision Auto-Shift (Sắp xếp node nếu chèn vào giữa) */}
          <div className="p-3 rounded-md bg-[#18191e] border border-[#2a2b32] space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAutoShift}
                onChange={(e) => setEnableAutoShift(e.target.checked)}
                className="rounded border-[#2a2b32] bg-[#121316] text-[#ececf0] focus:ring-0"
              />
              <span className="text-[#ececf0] font-medium">
                Auto-shift subsequent nodes (Avoid collision)
              </span>
            </label>
            {enableAutoShift && (
              <div className="pl-5 pt-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#9e9ea7]">Shift subsequent nodes by:</span>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={autoShiftDays}
                    onChange={(e) => setAutoShiftDays(parseInt(e.target.value, 10) || 0)}
                    className="w-16 bg-[#121316] border border-[#2a2b32] rounded px-2 py-1 text-[#ececf0] text-center"
                  />
                  <span className="text-[#9e9ea7]">days</span>
                </div>
                <p className="text-[10px] text-[#71717a]">
                  Later nodes on this track starting on or after this date will automatically move forward.
                </p>
              </div>
            )}
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9e9ea7] mb-1 font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as NodeStatus)}
                className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] focus:outline-none focus:border-[#454754]"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-[#9e9ea7] mb-1 font-medium">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NodePriority)}
                className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] focus:outline-none focus:border-[#454754]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[#9e9ea7] mb-1 font-medium">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. backend, security, milestone"
              className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#6b6c75] focus:outline-none focus:border-[#454754]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#9e9ea7] mb-1 font-medium">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverables, goals, or notes..."
              className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#6b6c75] focus:outline-none focus:border-[#454754] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-[#222328]">
            {node && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Delete "${node.title}"?`)) {
                    await onDelete(node.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#2a2b32] text-[#9e9ea7] hover:text-red-400 hover:border-red-900/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-md border border-[#2a2b32] text-[#9e9ea7] hover:text-[#ececf0] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md bg-[#ffffff] hover:bg-[#e4e4e7] text-black font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : node ? 'Update Node' : 'Create Node'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
