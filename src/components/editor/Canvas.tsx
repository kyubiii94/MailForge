'use client';

import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Block } from '@/types/editor';
import { useEditorStore } from '@/stores/editor-store';
import { CanvasBlock } from './CanvasBlock';

// Block renderers
import { HeadingBlock } from './blocks/HeadingBlock';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { HeroBlock } from './blocks/HeroBlock';
import { ButtonBlock } from './blocks/ButtonBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { SpacerBlock } from './blocks/SpacerBlock';
import { ColumnsBlock } from './blocks/ColumnsBlock';
import { HeaderBlock } from './blocks/HeaderBlock';
import { FooterBlock } from './blocks/FooterBlock';
import { SocialBlock } from './blocks/SocialBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { ProductCardBlock } from './blocks/ProductCardBlock';
import { CodeBlock } from './blocks/CodeBlock';

/** Render a single block by type. Exported for use by container blocks. */
export function renderBlock(
  block: Block,
  onContentChange?: (blockId: string, content: string) => void
): React.ReactNode {
  const handleChange = onContentChange
    ? (content: string) => onContentChange(block.id, content)
    : undefined;

  switch (block.type) {
    case 'heading':
      return <HeadingBlock key={block.id} block={block} onContentChange={handleChange} />;
    case 'text':
      return <TextBlock key={block.id} block={block} onContentChange={handleChange} />;
    case 'image':
      return <ImageBlock key={block.id} block={block} />;
    case 'hero':
      return <HeroBlock key={block.id} block={block} />;
    case 'button':
      return <ButtonBlock key={block.id} block={block} onContentChange={handleChange} />;
    case 'divider':
      return <DividerBlock key={block.id} block={block} />;
    case 'spacer':
      return <SpacerBlock key={block.id} block={block} />;
    case 'columns':
      return <ColumnsBlock key={block.id} block={block} onContentChange={onContentChange} />;
    case 'header':
      return <HeaderBlock key={block.id} block={block} onContentChange={onContentChange} />;
    case 'footer':
      return <FooterBlock key={block.id} block={block} onContentChange={onContentChange} />;
    case 'social':
      return <SocialBlock key={block.id} block={block} />;
    case 'quote':
      return <QuoteBlock key={block.id} block={block} onContentChange={handleChange} />;
    case 'product-card':
      return <ProductCardBlock key={block.id} block={block} />;
    case 'code':
      return <CodeBlock key={block.id} block={block} onContentChange={handleChange} />;
    default:
      return <div key={block.id} className="p-2 text-sm text-surface-400">Bloc inconnu: {block.type}</div>;
  }
}

export function Canvas() {
  const blocks = useEditorStore((s) => s.blocks);
  const previewMode = useEditorStore((s) => s.previewMode);
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks);
  const updateBlockProperty = useEditorStore((s) => s.updateBlockProperty);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const globalSettings = useEditorStore((s) => s.globalSettings);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        reorderBlocks(active.id as string, over.id as string);
      }
    },
    [reorderBlocks]
  );

  const handleContentChange = useCallback(
    (blockId: string, content: string) => {
      updateBlockProperty(blockId, 'content', content);
    },
    [updateBlockProperty]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Deselect block when clicking on the canvas background (not on a block)
      if (e.target === e.currentTarget) {
        selectBlock(null);
      }
    },
    [selectBlock]
  );

  const isEditing = previewMode === 'edit';
  const canvasWidth = previewMode === 'mobile' ? 375 : 600;

  return (
    <div
      className="flex-1 overflow-auto bg-surface-100 p-4 md:p-8"
      onClick={handleCanvasClick}
    >
      <div
        className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300"
        style={{
          width: canvasWidth,
          maxWidth: '100%',
          backgroundColor: globalSettings.backgroundColor,
        }}
        onClick={handleCanvasClick}
      >
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-surface-400 text-sm">Aucun bloc</p>
            <p className="text-surface-300 text-xs mt-1">
              Cliquez sur un bloc dans le panneau gauche pour l&apos;ajouter
            </p>
          </div>
        ) : isEditing ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block) => (
                <CanvasBlock key={block.id} block={block}>
                  {renderBlock(block, handleContentChange)}
                </CanvasBlock>
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          blocks.map((block) => (
            <div
              key={block.id}
              style={{
                padding: block.properties.padding,
                backgroundColor: block.properties.backgroundColor,
              }}
            >
              {renderBlock(block)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
