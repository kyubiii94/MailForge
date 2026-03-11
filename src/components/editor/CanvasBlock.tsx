'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditorStore } from '@/stores/editor-store';
import type { Block } from '@/types/editor';
import { ArrowUp, ArrowDown, Copy, Trash2, GripVertical, Lock } from 'lucide-react';

interface Props {
  block: Block;
  children: React.ReactNode;
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  header: 'Header',
  hero: 'Hero',
  heading: 'Titre',
  text: 'Texte',
  image: 'Image',
  button: 'Bouton',
  divider: 'Séparateur',
  spacer: 'Espace',
  columns: 'Colonnes',
  column: 'Colonne',
  'product-card': 'Produit',
  social: 'Social',
  footer: 'Footer',
  quote: 'Citation',
  code: 'HTML',
};

export function CanvasBlock({ block, children }: Props) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const hoveredBlockId = useEditorStore((s) => s.hoveredBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const hoverBlock = useEditorStore((s) => s.hoverBlock);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  const isSelected = selectedBlockId === block.id;
  const isHovered = hoveredBlockId === block.id && !isSelected;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group transition-all duration-100 ${
        isSelected
          ? 'ring-2 ring-brand-500 ring-inset z-10'
          : isHovered
          ? 'ring-1 ring-dashed ring-brand-300 ring-inset'
          : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
      onMouseEnter={() => hoverBlock(block.id)}
      onMouseLeave={() => hoverBlock(null)}
    >
      {/* Block type label — visible on hover */}
      {isHovered && !isSelected && (
        <div className="absolute -top-5 left-0 z-20">
          <span className="text-[10px] font-medium bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-t">
            {BLOCK_TYPE_LABELS[block.type] || block.type}
          </span>
        </div>
      )}

      {/* Floating toolbar — visible when selected */}
      {isSelected && (
        <div className="absolute -top-8 left-0 right-0 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-1 pointer-events-auto">
            <span
              className="flex items-center gap-1 text-[11px] font-medium bg-brand-600 text-white px-2 py-0.5 rounded-t cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3 h-3" />
              {BLOCK_TYPE_LABELS[block.type] || block.type}
            </span>
          </div>
          <div className="flex items-center gap-0.5 pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
              className="p-1 bg-white border border-surface-200 rounded hover:bg-surface-50 shadow-sm"
              title="Monter"
            >
              <ArrowUp className="w-3 h-3 text-surface-600" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
              className="p-1 bg-white border border-surface-200 rounded hover:bg-surface-50 shadow-sm"
              title="Descendre"
            >
              <ArrowDown className="w-3 h-3 text-surface-600" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
              className="p-1 bg-white border border-surface-200 rounded hover:bg-surface-50 shadow-sm"
              title="Dupliquer"
            >
              <Copy className="w-3 h-3 text-surface-600" />
            </button>
            {block.locked ? (
              <span className="p-1 bg-surface-100 border border-surface-200 rounded" title="Verrouillé">
                <Lock className="w-3 h-3 text-surface-400" />
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                className="p-1 bg-white border border-red-200 rounded hover:bg-red-50 shadow-sm"
                title="Supprimer"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Block content */}
      <div
        style={{
          padding: block.properties.padding || undefined,
          backgroundColor: block.properties.backgroundColor || undefined,
          borderRadius: block.properties.borderRadius || undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
