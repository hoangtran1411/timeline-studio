'use client';

import React, { useState, useRef } from 'react';
import { TimelineNode, TimelineTrack, NodeStatus, NodePriority } from '@/types/timeline';
import { X, Trash2, GitFork, Image as ImageIcon, Upload, Loader2, Link as LinkIcon, Maximize2, Plus } from 'lucide-react';
import { HistoricalDateInput } from './HistoricalDateInput';

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
    imageUrl?: string | null;
    imageUrls?: string[];
    autoShiftSubsequentDays?: number;
  }) => Promise<void>;
  onDelete?: (nodeId: string) => Promise<void>;
  onBranchFromNode?: (node: TimelineNode) => void;
  onPreviewImages?: (images: string[], index?: number) => void;
}

const NodeDrawerContent: React.FC<NodeDrawerProps> = ({
  onClose,
  node,
  timelines,
  defaultTimelineId,
  defaultStartDate,
  defaultEndDate,
  onSave,
  onDelete,
  onBranchFromNode,
  onPreviewImages
}) => {
  const [timelineId, setTimelineId] = useState(
    node?.timelineId || defaultTimelineId || (timelines[0]?.id ?? '')
  );
  const [title, setTitle] = useState(node?.title ?? '');
  const [description, setDescription] = useState(node?.description ?? '');
  const [startDate, setStartDate] = useState(
    node?.startDate || defaultStartDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(node?.endDate || defaultEndDate || '');
  const [status, setStatus] = useState<NodeStatus>(node?.status ?? 'planned');
  const [priority, setPriority] = useState<NodePriority>(node?.priority ?? 'medium');
  const [tagsInput, setTagsInput] = useState(node?.tags?.join(', ') ?? '');
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (node?.imageUrls && node.imageUrls.length > 0) {
      return node.imageUrls.slice(0, 4);
    }
    if (node?.imageUrl) {
      return [node.imageUrl];
    }
    return [];
  });
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageReusedNotice, setImageReusedNotice] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [autoShiftDays, setAutoShiftDays] = useState(node ? 0 : 14);
  const [enableAutoShift, setEnableAutoShift] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drawer width resize state (persisted to localStorage to prevent database bloat)
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 480;
    try {
      const savedWidth = localStorage.getItem('timeline_studio_node_drawer_width');
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed >= 360 && parsed <= 1200) {
          return parsed;
        }
      }
    } catch (_) {}
    return 480;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(480);

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = drawerWidth;
    setIsResizing(true);
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    const delta = resizeStartX.current - e.clientX;
    const maxWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth - 60, 1100) : 960;
    const nextWidth = Math.max(360, Math.min(maxWidth, resizeStartWidth.current + delta));
    setDrawerWidth(nextWidth);
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsResizing(false);
    try {
      localStorage.setItem('timeline_studio_node_drawer_width', String(drawerWidth));
    } catch (_) {}
  };

  const handleResizeDoubleClick = () => {
    const defaultWidth = 480;
    setDrawerWidth(defaultWidth);
    try {
      localStorage.setItem('timeline_studio_node_drawer_width', String(defaultWidth));
    } catch (_) {}
  };

  const handleFilesUpload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const availableSlots = 4 - imageUrls.length;
    if (availableSlots <= 0) {
      setImageUploadError('Maximum of 4 images allowed per node');
      return;
    }

    const filesToUpload = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setImageUploadError(`Only ${availableSlots} more image(s) can be added (max 4).`);
    } else {
      setImageUploadError(null);
    }

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        setImageUploadError('Please select valid image files (PNG, JPG, WebP, SVG, GIF)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageUploadError(`"${file.name}" exceeds 5MB limit`);
        return;
      }
    }

    setIsUploadingImage(true);
    setImageReusedNotice(null);
    try {
      const uploadedUrls: string[] = [];
      let anyReused = false;

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }

        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
        if (data.reused) {
          anyReused = true;
        }
      }

      if (uploadedUrls.length > 0) {
        setImageUrls(prev => [...prev, ...uploadedUrls].slice(0, 4));
      }
      if (anyReused) {
        setImageReusedNotice('Identical image matched by SHA-256 hash. Reused existing storage reference.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setImageUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setImageUploadError(null);
  };

  const handleAddUrlImage = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    if (imageUrls.length >= 4) {
      setImageUploadError('Maximum of 4 images allowed per node');
      return;
    }
    setImageUrls(prev => [...prev, trimmed].slice(0, 4));
    setCustomUrlInput('');
    setShowUrlInput(false);
    setImageUploadError(null);
  };

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
        imageUrl: imageUrls[0] || null,
        imageUrls: imageUrls.slice(0, 4),
        autoShiftSubsequentDays: enableAutoShift ? autoShiftDays : undefined
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body with Resizable Left Edge */}
      <div
        style={{ width: `${drawerWidth}px`, maxWidth: '96vw' }}
        className={`relative bg-[#141519] border-l border-[#222328] h-full shadow-2xl flex flex-col z-10 select-none ${
          isResizing ? 'transition-none select-none' : 'transition-[width] duration-75'
        }`}
      >
        {/* Resizable Splitter Handle on Left Border */}
        <div
          className={`absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize z-30 flex items-center justify-center transition-colors group ${
            isResizing ? 'bg-[#ececf0]/20' : 'hover:bg-[#ececf0]/15'
          }`}
          title="Drag left/right to resize panel width (Double-click to reset to 480px)"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onDoubleClick={handleResizeDoubleClick}
        >
          {/* Visual Grip Pill */}
          <div
            className={`w-1 rounded-full transition-all ${
              isResizing
                ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] h-14'
                : 'bg-[#52525b] group-hover:bg-[#ececf0] h-8 group-hover:h-10'
            }`}
          />
        </div>

        {/* Live width indicator tooltip when resizing */}
        {isResizing && (
          <div className="absolute top-4 -left-16 px-2 py-0.5 rounded bg-[#ececf0] text-black font-mono text-[10px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-50">
            {drawerWidth}px
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222328] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#9e9ea7]">
              {node ? 'EDIT NODE' : 'CREATE NODE'}
            </span>
            <span className="font-mono text-[10px] text-[#52525b]">
              ({drawerWidth}px)
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
              className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#9e9ea7] focus:outline-none focus:border-[#454754]"
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HistoricalDateInput
              label="Start Date *"
              value={startDate}
              onChange={setStartDate}
              required
            />
            <HistoricalDateInput
              label="End Date (Optional)"
              value={endDate}
              onChange={setEndDate}
            />
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
                <p className="text-[10px] text-[#9e9ea7]">
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
              className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#9e9ea7] focus:outline-none focus:border-[#454754]"
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
              className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#9e9ea7] focus:outline-none focus:border-[#454754] resize-none"
            />
          </div>

          {/* Node Image Attachments (up to 4) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[#9e9ea7] font-medium flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#9e9ea7]" />
                <span>Image Attachments ({imageUrls.length}/4)</span>
              </label>
              {imageUrls.length < 4 && (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[10px] text-[#9e9ea7] hover:text-[#ececf0] transition-colors flex items-center gap-1"
                >
                  <LinkIcon className="w-2.5 h-2.5" />
                  <span>{showUrlInput ? 'Upload files' : 'Link via URL'}</span>
                </button>
              )}
            </div>

            {/* Hidden file input supporting multiple selection */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesUpload(e.target.files);
                }
              }}
            />

            {/* Existing Images Gallery Grid */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imageUrls.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="relative group rounded-md border border-[#2a2b32] bg-[#101114] overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div
                      className="h-24 w-full cursor-pointer relative overflow-hidden bg-[#0a0a0c]"
                      onClick={() => onPreviewImages?.(imageUrls, idx)}
                      title="Click to view fullscreen"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {/* Hover Overlay with Preview Icon */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white">
                        <Maximize2 className="w-4 h-4 drop-shadow" />
                        <span className="text-[10px] font-mono font-medium drop-shadow">Preview</span>
                      </div>
                    </div>

                    {/* Image index badge */}
                    <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded bg-black/70 border border-white/10 text-white font-mono text-[9px] font-semibold pointer-events-none">
                      #{idx + 1}
                    </span>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute right-1.5 top-1.5 p-1 rounded bg-[#101114]/85 text-[#9e9ea7] hover:text-red-400 hover:bg-black transition-colors border border-white/10"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* URL Input Form when active */}
            {showUrlInput && imageUrls.length < 4 && (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/image.png"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrlImage();
                    }
                  }}
                  className="flex-1 bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#9e9ea7] focus:outline-none focus:border-[#454754]"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  disabled={!customUrlInput.trim()}
                  className="px-3 py-2 rounded-md bg-[#252630] hover:bg-[#323340] text-[#ececf0] font-medium transition-colors border border-[#3a3b47] disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            )}

            {/* Upload Dropzone (if less than 4 images) */}
            {imageUrls.length < 4 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFilesUpload(e.dataTransfer.files);
                  }
                }}
                className={`border border-dashed border-[#2a2b32] hover:border-[#454754] rounded-md p-3.5 bg-[#18191e]/50 hover:bg-[#18191e] cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors text-center ${
                  isUploadingImage ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 text-[#ececf0] animate-spin mb-1" />
                    <span className="text-[11px] text-[#ececf0] font-medium">Uploading to storage...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-[#9e9ea7]" />
                    <span className="text-[11px] text-[#ececf0] font-medium">
                      {imageUrls.length === 0
                        ? 'Click to upload up to 4 images (or drag & drop)'
                        : `Upload more (${4 - imageUrls.length} slot${4 - imageUrls.length > 1 ? 's' : ''} remaining)`}
                    </span>
                    <span className="text-[10px] text-[#9e9ea7]">
                      PNG, JPG, WebP, GIF, SVG up to 5MB each
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-2 px-3 rounded border border-[#2a2b32] bg-[#18191e]/40 text-[#9e9ea7] font-mono text-[11px]">
                Maximum 4 images attached
              </div>
            )}

            {imageUploadError && (
              <div className="text-[10px] text-red-400 font-mono">
                {imageUploadError}
              </div>
            )}

            {imageReusedNotice && (
              <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/30 border border-emerald-900/50 rounded px-2 py-1">
                ✓ {imageReusedNotice}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-[#222328]">
            {node && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  // eslint-disable-next-line no-alert
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

export const NodeDrawer: React.FC<NodeDrawerProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <NodeDrawerContent
      key={props.node?.id ?? `new-node-${props.defaultTimelineId ?? 'root'}-${props.defaultStartDate ?? 'now'}`}
      {...props}
    />
  );
};
