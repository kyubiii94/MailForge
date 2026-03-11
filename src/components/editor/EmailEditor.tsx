'use client';

import { useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import type { Block } from '@/types/editor';
import type { ColorPalette } from '@/types';
import { BlockPanel } from './BlockPanel';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Monitor, Smartphone, Pencil, Save } from 'lucide-react';

interface Props {
  initialBlocks: Block[];
  palette?: ColorPalette;
  brandFonts?: string[];
  onSave: (blocks: Block[]) => Promise<void>;
  isSaving?: boolean;
}

export function EmailEditor({ initialBlocks, palette, brandFonts, onSave, isSaving }: Props) {
  const setBlocks = useEditorStore((s) => s.setBlocks);
  const blocks = useEditorStore((s) => s.blocks);
  const isDirty = useEditorStore((s) => s.isDirty);
  const previewMode = useEditorStore((s) => s.previewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const historyLength = useEditorStore((s) => s.history.length);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks, setBlocks]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave(blocks);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        const isEditing = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
        if (!isEditing) {
          const state = useEditorStore.getState();
          if (state.selectedBlockId) {
            const block = state.blocks.find((b) => b.id === state.selectedBlockId);
            if (block && !block.locked) {
              e.preventDefault();
              state.removeBlock(state.selectedBlockId);
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, blocks, onSave]);

  const handleSave = useCallback(() => onSave(blocks), [blocks, onSave]);
  const isEditing = previewMode === 'edit';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 bg-white shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Annuler (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= historyLength - 1}
            title="Rétablir (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-0.5">
          <button
            onClick={() => setPreviewMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              previewMode === 'edit'
                ? 'bg-white shadow-sm text-brand-700'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Éditer
          </button>
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              previewMode === 'desktop'
                ? 'bg-white shadow-sm text-brand-700'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              previewMode === 'mobile'
                ? 'bg-white shadow-sm text-brand-700'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-amber-600">Modifications non sauvegardées</span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!isDirty}
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Main 3-column layout: colonne centrale scrollable pour voir tout le template */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {isEditing && <BlockPanel />}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) selectBlock(null);
          }}
        >
          <Canvas />
        </div>
        {isEditing && <PropertiesPanel palette={palette} brandFonts={brandFonts} />}
      </div>
    </div>
  );
}
