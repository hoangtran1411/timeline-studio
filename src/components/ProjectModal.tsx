'use client';

import React, { useState, useEffect } from 'react';
import { Project } from '@/types/timeline';
import { X, FolderPlus, Settings2, Trash2, Check, AlertTriangle } from 'lucide-react';
import { renderProjectIcon } from './Header';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSave: (data: { name: string; description?: string; color?: string; icon?: string }) => Promise<void>;
  onDelete?: (projectId: string) => Promise<void>;
}

const COLOR_PRESETS = [
  { id: 'amber', bg: 'bg-amber-500', border: 'border-amber-400', ring: 'ring-amber-500/30', label: 'Amber Gold' },
  { id: 'blue', bg: 'bg-blue-500', border: 'border-blue-400', ring: 'ring-blue-500/30', label: 'Ocean Blue' },
  { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-400', ring: 'ring-emerald-500/30', label: 'Emerald' },
  { id: 'purple', bg: 'bg-purple-500', border: 'border-purple-400', ring: 'ring-purple-500/30', label: 'Purple' },
  { id: 'rose', bg: 'bg-rose-500', border: 'border-rose-400', ring: 'ring-rose-500/30', label: 'Rose' },
  { id: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-400', ring: 'ring-cyan-500/30', label: 'Cyan' },
  { id: 'orange', bg: 'bg-orange-500', border: 'border-orange-400', ring: 'ring-orange-500/30', label: 'Orange' },
  { id: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-400', ring: 'ring-indigo-500/30', label: 'Indigo' },
];

const ICON_PRESETS = [
  { icon: '📜', label: 'History / Chrono' },
  { icon: '💡', label: 'Ideas & Brainstorm' },
  { icon: '🚀', label: 'Roadmap & Product' },
  { icon: '🔬', label: 'Research & Sci' },
  { icon: '📊', label: 'Finance & Strategy' },
  { icon: '🎮', label: 'Game & Creative' },
  { icon: '📚', label: 'Education & Study' },
  { icon: '🎯', label: 'Goals & Milestones' },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
  onDelete
}) => {
  const isEditing = Boolean(project);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('amber');
  const [icon, setIcon] = useState('📜');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color || 'amber');
      setIcon(renderProjectIcon(project.icon) || '📜');
    } else {
      setName('');
      setDescription('');
      setColor('amber');
      setIcon('📜');
    }
    setConfirmDelete(false);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(project.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#141519] border border-[#2a2b32] rounded-xl shadow-2xl overflow-hidden z-10 font-mono text-xs select-none">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#222328] flex items-center justify-between bg-[#121316]">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Settings2 className="w-4 h-4 text-[#ececf0]" />
            ) : (
              <FolderPlus className="w-4 h-4 text-[#ececf0]" />
            )}
            <span className="font-semibold text-[#ececf0]">
              {isEditing ? 'Project Settings' : 'Create New Project'}
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
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Project Name */}
          <div>
            <label className="block text-[#9e9ea7] mb-1.5 uppercase tracking-wider text-[10px]">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xl bg-[#1a1b20] border border-[#282932] w-10 h-9 rounded flex items-center justify-center flex-shrink-0">
                {icon}
              </span>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Historical Chronology, Idea Roadmap..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#6b6c75] focus:outline-none focus:border-[#4e505e] transition-colors"
              />
            </div>
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-[#9e9ea7] mb-1.5 uppercase tracking-wider text-[10px]">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief context or goals for this timeline project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#18191e] border border-[#2a2b32] rounded-md px-3 py-2 text-[#ececf0] placeholder-[#6b6c75] focus:outline-none focus:border-[#4e505e] transition-colors resize-none"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-[#9e9ea7] mb-1.5 uppercase tracking-wider text-[10px]">
              Project Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_PRESETS.map((p) => {
                const isSelected = icon === p.icon;
                return (
                  <button
                    key={p.icon}
                    type="button"
                    onClick={() => setIcon(p.icon)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-left transition-all ${
                      isSelected
                        ? 'border-[#4e505e] bg-[#22242c] text-white shadow-xs'
                        : 'border-[#222328] bg-[#16171b] text-[#9e9ea7] hover:border-[#383a45] hover:text-[#ececf0]'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="text-[10px] truncate">{p.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="block text-[#9e9ea7] mb-1.5 uppercase tracking-wider text-[10px]">
              Accent Theme Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    title={c.label}
                    className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                      isSelected
                        ? `ring-2 ring-white ring-offset-2 ring-offset-[#141519] scale-110`
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete Danger Zone (in edit mode only) */}
          {isEditing && onDelete && (
            <div className="mt-2 pt-3 border-t border-[#222328]">
              {confirmDelete ? (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Delete &quot;{project?.name}&quot;?</span>
                  </div>
                  <p className="text-[10px] text-rose-400/80 leading-relaxed font-sans">
                    This will permanently delete this project and all associated timeline tracks and nodes.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleDelete}
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1 rounded bg-[#202128] hover:bg-[#282a33] text-[#9e9ea7] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-[11px] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete this project...</span>
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-[#222328]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-[#2a2b32] bg-[#18191e] hover:bg-[#22232a] text-[#9e9ea7] hover:text-[#ececf0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-1.5 rounded-md bg-white hover:bg-[#e4e4e7] disabled:opacity-50 text-black font-semibold transition-all shadow-xs"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
