'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import type { Block, BlockType } from '@/types/editor';
import type { ColorPalette } from '@/types';
import {
  ColorPicker,
  FontSelect,
  SizeInput,
  TextInput,
  SelectInput,
  PaddingInput,
  AlignmentButtons,
} from './PropertyControls';

type Tab = 'content' | 'style' | 'layout';

interface Props {
  palette?: ColorPalette;
  brandFonts?: string[];
}

export function PropertiesPanel({ palette, brandFonts }: Props) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlockProperty = useEditorStore((s) => s.updateBlockProperty);
  const [activeTab, setActiveTab] = useState<Tab>('content');

  const selectedBlock = findBlock(blocks, selectedBlockId);

  const update = useCallback(
    (key: string, value: unknown) => {
      if (selectedBlockId) updateBlockProperty(selectedBlockId, key, value);
    },
    [selectedBlockId, updateBlockProperty]
  );

  if (!selectedBlock) {
    return (
      <div className="w-72 border-l border-surface-200 bg-white flex flex-col">
        <div className="p-4 border-b border-surface-200">
          <h3 className="text-sm font-semibold text-surface-900">Propriétés</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-surface-400 text-center">
            Sélectionnez un bloc pour modifier ses propriétés
          </p>
        </div>
      </div>
    );
  }

  const p = selectedBlock.properties;
  const colorPalette = palette
    ? [palette.primary, palette.secondary, palette.accent, palette.background, palette.text]
    : [];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'content', label: 'Contenu' },
    { id: 'style', label: 'Style' },
    { id: 'layout', label: 'Layout' },
  ];

  return (
    <div className="w-72 border-l border-surface-200 bg-white flex flex-col overflow-hidden">
      <div className="p-3 border-b border-surface-200">
        <h3 className="text-sm font-semibold text-surface-900">
          {blockLabel(selectedBlock.type)}
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === t.id
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'content' && (
          <ContentTab block={selectedBlock} update={update} />
        )}
        {activeTab === 'style' && (
          <StyleTab block={selectedBlock} update={update} palette={colorPalette} brandFonts={brandFonts} />
        )}
        {activeTab === 'layout' && (
          <LayoutTab block={selectedBlock} update={update} />
        )}
      </div>
    </div>
  );
}

function ContentTab({ block, update }: { block: Block; update: (k: string, v: unknown) => void }) {
  const p = block.properties;
  switch (block.type) {
    case 'heading':
      return (
        <>
          <TextInput label="Texte" value={p.content || ''} onChange={(v) => update('content', v)} />
          <SelectInput
            label="Niveau"
            value={p.headingLevel || 'h2'}
            onChange={(v) => update('headingLevel', v)}
            options={[
              { value: 'h1', label: 'H1 — Titre principal' },
              { value: 'h2', label: 'H2 — Sous-titre' },
              { value: 'h3', label: 'H3 — Petit titre' },
            ]}
          />
        </>
      );
    case 'text':
    case 'quote':
      return (
        <TextInput label="Contenu" value={p.content || ''} onChange={(v) => update('content', v)} multiline />
      );
    case 'image':
    case 'hero':
      return (
        <>
          <TextInput label="URL de l'image" value={p.src || ''} onChange={(v) => update('src', v)} placeholder="https://..." />
          <TextInput label="Texte alternatif" value={p.alt || ''} onChange={(v) => update('alt', v)} placeholder="Description de l'image" />
          <TextInput label="Lien (optionnel)" value={p.href || ''} onChange={(v) => update('href', v)} placeholder="https://..." />
        </>
      );
    case 'button':
      return (
        <>
          <TextInput label="Texte du bouton" value={p.label || ''} onChange={(v) => update('label', v)} />
          <TextInput label="URL du lien" value={p.href || ''} onChange={(v) => update('href', v)} placeholder="https://..." />
        </>
      );
    case 'divider':
      return (
        <TextInput label="Style de bordure" value={p.border || '1px solid #E0E0E0'} onChange={(v) => update('border', v)} placeholder="1px solid #E0E0E0" />
      );
    case 'spacer':
      return (
        <SizeInput label="Hauteur" value={p.height || '20px'} onChange={(v) => update('height', v)} min={5} max={100} />
      );
    case 'product-card':
      return (
        <>
          <TextInput label="Nom du produit" value={p.content || ''} onChange={(v) => update('content', v)} />
          <TextInput label="URL image" value={p.src || ''} onChange={(v) => update('src', v)} placeholder="https://..." />
          <TextInput label="Texte bouton" value={p.label || ''} onChange={(v) => update('label', v)} />
          <TextInput label="URL du lien" value={p.href || ''} onChange={(v) => update('href', v)} placeholder="https://..." />
        </>
      );
    case 'code':
      return (
        <TextInput label="HTML personnalisé" value={p.rawHtml || ''} onChange={(v) => update('rawHtml', v)} multiline />
      );
    case 'social':
      return (
        <p className="text-xs text-surface-400">
          Les liens sociaux sont configurés depuis le MJML source.
        </p>
      );
    default:
      return (
        <p className="text-xs text-surface-400">
          Aucune propriété de contenu pour ce type de bloc.
        </p>
      );
  }
}

function StyleTab({
  block,
  update,
  palette,
  brandFonts,
}: {
  block: Block;
  update: (k: string, v: unknown) => void;
  palette: string[];
  brandFonts?: string[];
}) {
  const p = block.properties;
  const isButton = block.type === 'button';

  return (
    <>
      <ColorPicker label="Couleur du texte" value={p.textColor || ''} onChange={(v) => update('textColor', v)} palette={palette} />
      <ColorPicker label="Fond" value={p.backgroundColor || ''} onChange={(v) => update('backgroundColor', v)} palette={palette} />
      <FontSelect label="Police" value={p.fontFamily || ''} onChange={(v) => update('fontFamily', v)} brandFonts={brandFonts} />
      <SizeInput label="Taille" value={p.fontSize || '15px'} onChange={(v) => update('fontSize', v)} min={10} max={72} />
      <SelectInput
        label="Poids"
        value={p.fontWeight || ''}
        onChange={(v) => update('fontWeight', v)}
        options={[
          { value: '', label: 'Par défaut' },
          { value: '400', label: 'Regular (400)' },
          { value: '500', label: 'Medium (500)' },
          { value: '600', label: 'Semi-bold (600)' },
          { value: '700', label: 'Bold (700)' },
        ]}
      />
      <AlignmentButtons label="Alignement" value={p.textAlign || 'left'} onChange={(v) => update('textAlign', v)} />
      <TextInput label="Letter-spacing" value={p.letterSpacing || ''} onChange={(v) => update('letterSpacing', v)} placeholder="0px" />
      <SelectInput
        label="Casse"
        value={p.textTransform || 'none'}
        onChange={(v) => update('textTransform', v)}
        options={[
          { value: 'none', label: 'Normal' },
          { value: 'uppercase', label: 'MAJUSCULES' },
          { value: 'lowercase', label: 'minuscules' },
        ]}
      />
      {isButton && (
        <>
          <div className="border-t border-surface-200 pt-3 mt-3">
            <p className="text-xs font-semibold text-surface-700 mb-2">Bouton</p>
          </div>
          <ColorPicker label="Fond du bouton" value={p.buttonColor || ''} onChange={(v) => update('buttonColor', v)} palette={palette} />
          <ColorPicker label="Texte du bouton" value={p.buttonTextColor || ''} onChange={(v) => update('buttonTextColor', v)} palette={palette} />
          <TextInput label="Border radius" value={p.buttonBorderRadius || ''} onChange={(v) => update('buttonBorderRadius', v)} placeholder="4px" />
          <TextInput label="Padding interne" value={p.buttonPadding || ''} onChange={(v) => update('buttonPadding', v)} placeholder="12px 24px" />
        </>
      )}
    </>
  );
}

function LayoutTab({ block, update }: { block: Block; update: (k: string, v: unknown) => void }) {
  const p = block.properties;
  return (
    <>
      <PaddingInput label="Padding" value={p.padding || ''} onChange={(v) => update('padding', v)} />
      <TextInput label="Largeur" value={p.width || ''} onChange={(v) => update('width', v)} placeholder="auto / 100% / 600px" />
      <TextInput label="Border radius" value={p.borderRadius || ''} onChange={(v) => update('borderRadius', v)} placeholder="0px" />
      <TextInput label="Bordure" value={p.border || ''} onChange={(v) => update('border', v)} placeholder="1px solid #E0E0E0" />
      {(block.type === 'image' || block.type === 'hero') && (
        <TextInput label="Largeur image" value={p.imageWidth || ''} onChange={(v) => update('imageWidth', v)} placeholder="100% / 300px" />
      )}
      {block.type === 'columns' && (
        <TextInput label="Gap colonnes" value={p.columnsGap || ''} onChange={(v) => update('columnsGap', v)} placeholder="10px" />
      )}
    </>
  );
}

function findBlock(blocks: Block[], id: string | null): Block | null {
  if (!id) return null;
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBlock(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

function blockLabel(type: BlockType): string {
  const labels: Record<string, string> = {
    header: 'Header',
    hero: 'Image Hero',
    heading: 'Titre',
    text: 'Texte',
    image: 'Image',
    button: 'Bouton CTA',
    divider: 'Séparateur',
    spacer: 'Espace',
    columns: 'Colonnes',
    column: 'Colonne',
    'product-card': 'Carte Produit',
    social: 'Réseaux sociaux',
    footer: 'Footer',
    quote: 'Citation',
    code: 'HTML Custom',
  };
  return labels[type] || type;
}
