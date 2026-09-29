'use client';

import { useEffect, useRef } from 'react';
import { TimelineNode, NodeStatus } from '@/types/timeline';
import { compareDateStrings } from '@/utils/date-utils';

interface TimelineShortcutsOptions {
  // Navigation & Zoom
  onCenterToday: () => void;
  onScrollToStart?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleGrid: () => void;
  onToggleBottomPanel: () => void;
  onFocusSearch: () => void;

  // Modals & Panels
  onOpenShortcuts: () => void;
  onOpenAddNode: () => void;
  onOpenAddTimeline: () => void;
  onOpenCreateProject?: () => void;

  // Selected Node Actions
  selectedNode: TimelineNode | null;
  onSelectNode: (node: TimelineNode | null) => void;
  onEditSelectedNode: () => void;
  onDuplicateSelectedNode: (node: TimelineNode) => void;
  onChangeNodeStatus: (nodeId: string, status: NodeStatus) => void;
  onDeleteSelectedNode: (nodeId: string) => void;
  onBranchFromNode?: (timelineId: string, nodeId: string) => void;

  // All nodes for chronological navigation
  allNodes: TimelineNode[];

  // Active modal/drawer guard
  isAnyModalOpen: boolean;
}

function isEditingInput(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

export function useTimelineShortcuts(options: TimelineShortcutsOptions) {
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const {
        onCenterToday,
        onScrollToStart,
        onZoomIn,
        onZoomOut,
        onResetZoom,
        onToggleGrid,
        onToggleBottomPanel,
        onFocusSearch,
        onOpenShortcuts,
        onOpenAddNode,
        onOpenAddTimeline,
        onOpenCreateProject,
        selectedNode,
        onSelectNode,
        onEditSelectedNode,
        onDuplicateSelectedNode,
        onChangeNodeStatus,
        onDeleteSelectedNode,
        onBranchFromNode,
        allNodes,
        isAnyModalOpen
      } = optionsRef.current;

      const isInput = isEditingInput(e.target);

      // If user is focused inside a text input
      if (isInput) {
        if (e.key === 'Escape') {
          // Blur the input to restore hotkeys immediately
          (e.target as HTMLElement).blur();
        }
        return;
      }

      // If a modal or drawer is currently open, let the modal handle input/Esc
      if (isAnyModalOpen) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // 1. Help Cheat Sheet: '?' or Shift + '/' or Cmd + '/'
      if (e.key === '?' || (e.shiftKey && e.key === '/') || (isCmdOrCtrl && e.key === '/')) {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }

      // 2. Search filter: '/' or Cmd/Ctrl + K
      if ((e.key === '/' && !isCmdOrCtrl) || (isCmdOrCtrl && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        onFocusSearch();
        return;
      }

      // 3. Escape: deselect active node
      if (e.key === 'Escape') {
        if (selectedNode) {
          e.preventDefault();
          onSelectNode(null);
        }
        return;
      }

      // 4. Creation shortcuts
      if ((e.key === 'n' || e.key === 'N' || e.key === 'c' || e.key === 'C') && !isCmdOrCtrl) {
        e.preventDefault();
        onOpenAddNode();
        return;
      }

      if ((e.key === 't' || e.key === 'T') && !isCmdOrCtrl) {
        e.preventDefault();
        onOpenAddTimeline();
        return;
      }

      if ((e.key === 'p' || e.key === 'P') && !isCmdOrCtrl && onOpenCreateProject) {
        e.preventDefault();
        onOpenCreateProject();
        return;
      }

      // 5. Navigation & Zoom
      if ((e.key === 'h' || e.key === 'H' || e.key === 'Home') && !isCmdOrCtrl) {
        e.preventDefault();
        onCenterToday();
        return;
      }

      if ((e.key === 's' || e.key === 'S') && !isCmdOrCtrl && onScrollToStart) {
        e.preventDefault();
        onScrollToStart();
        return;
      }

      if (e.key === '+' || e.key === '=' || (isCmdOrCtrl && (e.key === '=' || e.key === '+'))) {
        e.preventDefault();
        onZoomIn();
        return;
      }

      if (e.key === '-' || e.key === '_' || (isCmdOrCtrl && (e.key === '-' || e.key === '_'))) {
        e.preventDefault();
        onZoomOut();
        return;
      }

      if (e.key === '0' || (isCmdOrCtrl && e.key === '0')) {
        e.preventDefault();
        onResetZoom();
        return;
      }

      if ((e.key === 'g' || e.key === 'G') && !isCmdOrCtrl) {
        e.preventDefault();
        onToggleGrid();
        return;
      }

      // 6. Branch from selected node: Shift + B
      if (e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        if (selectedNode && onBranchFromNode) {
          e.preventDefault();
          onBranchFromNode(selectedNode.timelineId, selectedNode.id);
          return;
        }
      }

      // 7. Toggle bottom Comparison Matrix: 'B'
      if ((e.key === 'b' || e.key === 'B') && !isCmdOrCtrl) {
        e.preventDefault();
        onToggleBottomPanel();
        return;
      }

      // 8. Actions on Selected Node
      if (selectedNode) {
        // Edit node: Enter or E
        if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          onEditSelectedNode();
          return;
        }

        // Duplicate node: 'D' or Cmd/Ctrl + D
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          onDuplicateSelectedNode(selectedNode);
          return;
        }

        // Delete selected node: Delete or Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          // eslint-disable-next-line no-alert
          if (confirm(`Delete "${selectedNode.title}"?`)) {
            onDeleteSelectedNode(selectedNode.id);
          }
          return;
        }

        // Status numbers: 1 = planned, 2 = in_progress, 3 = completed, 4 = blocked
        if (e.key === '1') {
          e.preventDefault();
          onChangeNodeStatus(selectedNode.id, 'planned');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          onChangeNodeStatus(selectedNode.id, 'in_progress');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          onChangeNodeStatus(selectedNode.id, 'completed');
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          onChangeNodeStatus(selectedNode.id, 'blocked');
          return;
        }

        // Arrow navigation: Previous / Next node chronologically
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          if (allNodes.length > 1) {
            e.preventDefault();
            const sorted = [...allNodes].sort((a, b) => compareDateStrings(a.startDate, b.startDate));
            const currentIndex = sorted.findIndex(n => n.id === selectedNode.id);
            if (currentIndex !== -1) {
              const nextIndex =
                e.key === 'ArrowRight'
                  ? (currentIndex + 1) % sorted.length
                  : (currentIndex - 1 + sorted.length) % sorted.length;
              onSelectNode(sorted[nextIndex]);
            }
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
