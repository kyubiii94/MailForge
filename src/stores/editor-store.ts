import { create } from 'zustand';
import type { Block, EditorPreviewMode } from '@/types/editor';

interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  history: Block[][];
  historyIndex: number;
  isDirty: boolean;
  previewMode: EditorPreviewMode;

  // Actions
  setBlocks: (blocks: Block[]) => void;
  selectBlock: (id: string | null) => void;
  hoverBlock: (id: string | null) => void;
  updateBlockProperty: (blockId: string, key: string, value: unknown) => void;
  addBlock: (block: Block, afterBlockId?: string) => void;
  removeBlock: (blockId: string) => void;
  moveBlock: (blockId: string, direction: 'up' | 'down') => void;
  duplicateBlock: (blockId: string) => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  undo: () => void;
  redo: () => void;
  setPreviewMode: (mode: EditorPreviewMode) => void;
  resetDirty: () => void;
}

function pushHistory(state: EditorState): Partial<EditorState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(structuredClone(state.blocks));
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
    isDirty: true,
  };
}

function updateBlockInList(blocks: Block[], blockId: string, key: string, value: unknown): Block[] {
  return blocks.map((b) => {
    if (b.id === blockId) {
      return { ...b, properties: { ...b.properties, [key]: value } };
    }
    if (b.children?.length) {
      return { ...b, children: updateBlockInList(b.children, blockId, key, value) };
    }
    return b;
  });
}

function findAndRemoveBlock(blocks: Block[], blockId: string): { remaining: Block[]; removed: Block | null } {
  let removed: Block | null = null;
  const remaining = blocks.filter((b) => {
    if (b.id === blockId) {
      removed = b;
      return false;
    }
    return true;
  });
  if (!removed) {
    for (const b of remaining) {
      if (b.children?.length) {
        const result = findAndRemoveBlock(b.children, blockId);
        if (result.removed) {
          b.children = result.remaining;
          removed = result.removed;
          break;
        }
      }
    }
  }
  return { remaining, removed };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  hoveredBlockId: null,
  history: [[]],
  historyIndex: 0,
  isDirty: false,
  previewMode: 'edit',

  setBlocks: (blocks) =>
    set({
      blocks,
      history: [structuredClone(blocks)],
      historyIndex: 0,
      isDirty: false,
      selectedBlockId: null,
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),
  hoverBlock: (id) => set({ hoveredBlockId: id }),

  updateBlockProperty: (blockId, key, value) =>
    set((state) => ({
      blocks: updateBlockInList(state.blocks, blockId, key, value),
      ...pushHistory(state),
    })),

  addBlock: (block, afterBlockId) =>
    set((state) => {
      const newBlocks = [...state.blocks];
      if (afterBlockId) {
        const idx = newBlocks.findIndex((b) => b.id === afterBlockId);
        if (idx !== -1) {
          newBlocks.splice(idx + 1, 0, block);
        } else {
          newBlocks.push(block);
        }
      } else {
        newBlocks.push(block);
      }
      return { blocks: newBlocks, selectedBlockId: block.id, ...pushHistory(state) };
    }),

  removeBlock: (blockId) =>
    set((state) => {
      const { remaining } = findAndRemoveBlock([...state.blocks], blockId);
      return {
        blocks: remaining,
        selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
        ...pushHistory(state),
      };
    }),

  moveBlock: (blockId, direction) =>
    set((state) => {
      const idx = state.blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return state;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= state.blocks.length) return state;
      const newBlocks = [...state.blocks];
      [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
      return { blocks: newBlocks, ...pushHistory(state) };
    }),

  duplicateBlock: (blockId) =>
    set((state) => {
      const idx = state.blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return state;
      const clone = structuredClone(state.blocks[idx]);
      clone.id = crypto.randomUUID();
      if (clone.children) {
        clone.children = clone.children.map((c) => ({ ...c, id: crypto.randomUUID() }));
      }
      const newBlocks = [...state.blocks];
      newBlocks.splice(idx + 1, 0, clone);
      return { blocks: newBlocks, selectedBlockId: clone.id, ...pushHistory(state) };
    }),

  reorderBlocks: (activeId, overId) =>
    set((state) => {
      const oldIdx = state.blocks.findIndex((b) => b.id === activeId);
      const newIdx = state.blocks.findIndex((b) => b.id === overId);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return state;
      const newBlocks = [...state.blocks];
      const [moved] = newBlocks.splice(oldIdx, 1);
      newBlocks.splice(newIdx, 0, moved);
      return { blocks: newBlocks, ...pushHistory(state) };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        blocks: structuredClone(state.history[newIndex]),
        historyIndex: newIndex,
        isDirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        blocks: structuredClone(state.history[newIndex]),
        historyIndex: newIndex,
        isDirty: true,
      };
    }),

  setPreviewMode: (mode) => set({ previewMode: mode }),
  resetDirty: () => set({ isDirty: false }),
}));
