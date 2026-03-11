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
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  palette?: ColorPalette;
  brandFonts?: string[];
}

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-surface-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 px-1 text-xs font-semibold text-surface-700 hover:text-surface-900"
      >
        {title}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && <div className="pb-3 space-y-3">{children}</div>}
    </div>
  );
}

export function PropertiesPanel({ palette, brandFonts }: Props) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlockProperty = useEditorStore((s) => s.updateBlockProperty);
  const globalSettings = useEditorStore((s) => s.globalSettings);
  const updateGlobalSetting = useEditorStore((s) => s.updateGlobalSetting);

  const selectedBlock = findBlock(blocks, selectedBlockId);

  const update = useCallback(
    (key: string, value: unknown) => {
      if (selectedBlockId) updateBlockProperty(selectedBlockId, key, value);
    },
    [selectedBlockId, updateBlockProperty]
  );

  const colorPalette = palette
    ? [palette.primary, palette.secondary, palette.accent, palette.background, palette.text].filter(Boolean)
    : [];

  // Global settings when no block is selected
  if (!selectedBlock) {
    return (
      <div className="w-80 border-l border-surface-200 bg-white flex flex-col overflow-hidden shrink-0">
        <div className="p-3 border-b border-surface-200">
          <h3 className="text-sm font-semibold text-surface-900">Template</h3>
          <p className="text-[10px] text-surface-400 mt-0.5">Propriétés globales</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <Section title="Apparence">
            <ColorPicker
              label="Fond du template"
              value={globalSettings.backgroundColor}
              onChange={(v) => updateGlobalSetting('backgroundColor', v)}
              palette={colorPalette}
            />
            <FontSelect
              label="Police par défaut"
              value={globalSettings.fontFamily}
              onChange={(v) => updateGlobalSetting('fontFamily', v)}
              brandFonts={brandFonts}
            />
          </Section>
          <div className="pt-2">
            <p className="text-xs text-surface-400 text-center">
              Sélectionnez un bloc pour modifier ses propriétés
            </p>
          </div>
        </div>
      </div>
    );
  }

  const type = selectedBlock.type;

  return (
    <div className="w-80 border-l border-surface-200 bg-white flex flex-col overflow-hidden shrink-0">
      <div className="p-3 border-b border-surface-200">
        <h3 className="text-sm font-semibold text-surface-900">
          {blockLabel(type)}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Content section — type-specific */}
        <ContentSection block={selectedBlock} update={update} />

        {/* Typography section — for text-based blocks */}
        {hasTypography(type) && (
          <Section title="Typographie">
            {(type === 'heading' || type === 'text' || type === 'quote') && (
              <FontSelect label="Police" value={selectedBlock.properties.fontFamily || ''} onChange={(v) => update('fontFamily', v)} brandFonts={brandFonts} />
            )}
            <SizeInput label="Taille" value={selectedBlock.properties.fontSize || '15px'} onChange={(v) => update('fontSize', v)} min={10} max={72} />
            <SelectInput
              label="Poids"
              value={selectedBlock.properties.fontWeight || ''}
              onChange={(v) => update('fontWeight', v)}
              options={[
                { value: '', label: 'Par défaut' },
                { value: '400', label: 'Regular' },
                { value: '500', label: 'Medium' },
                { value: '600', label: 'Semi-bold' },
                { value: '700', label: 'Bold' },
              ]}
            />
            <ColorPicker label="Couleur du texte" value={selectedBlock.properties.textColor || ''} onChange={(v) => update('textColor', v)} palette={colorPalette} />
            <AlignmentButtons label="Alignement" value={selectedBlock.properties.textAlign || 'left'} onChange={(v) => update('textAlign', v)} />
            {type !== 'button' && (
              <SelectInput
                label="Casse"
                value={selectedBlock.properties.textTransform || 'none'}
                onChange={(v) => update('textTransform', v)}
                options={[
                  { value: 'none', label: 'Normal' },
                  { value: 'uppercase', label: 'MAJUSCULES' },
                  { value: 'lowercase', label: 'minuscules' },
                ]}
              />
            )}
          </Section>
        )}

        {/* Button-specific styling */}
        {type === 'button' && (
          <Section title="Style du bouton">
            <ColorPicker label="Fond du bouton" value={selectedBlock.properties.buttonColor || '#0A0A0A'} onChange={(v) => update('buttonColor', v)} palette={colorPalette} />
            <ColorPicker label="Texte du bouton" value={selectedBlock.properties.buttonTextColor || '#FFFFFF'} onChange={(v) => update('buttonTextColor', v)} palette={colorPalette} />
            <SizeInput label="Border radius" value={selectedBlock.properties.buttonBorderRadius || '4px'} onChange={(v) => update('buttonBorderRadius', v)} min={0} max={24} />
            <TextInput label="Padding" value={selectedBlock.properties.buttonPadding || '14px 28px'} onChange={(v) => update('buttonPadding', v)} placeholder="12px 24px" />
          </Section>
        )}

        {/* Background & borders */}
        <Section title="Fond et bordures" defaultOpen={false}>
          <ColorPicker label="Fond" value={selectedBlock.properties.backgroundColor || ''} onChange={(v) => update('backgroundColor', v)} palette={colorPalette} />
          <SizeInput label="Border radius" value={selectedBlock.properties.borderRadius || '0px'} onChange={(v) => update('borderRadius', v)} min={0} max={24} />
          <TextInput label="Bordure" value={selectedBlock.properties.border || ''} onChange={(v) => update('border', v)} placeholder="1px solid #E0E0E0" />
        </Section>

        {/* Spacing */}
        <Section title="Espacement" defaultOpen={false}>
          <PaddingInput label="Padding" value={selectedBlock.properties.padding || ''} onChange={(v) => update('padding', v)} />
          {(type === 'image' || type === 'hero') && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-surface-600">Largeur image</label>
              <p className="text-[10px] text-surface-400">En % par rapport à la largeur du template (ex. 100%, 50%) ou en px</p>
              <div className="flex gap-1 flex-wrap">
                {['100%', '75%', '50%', '33%'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => update('imageWidth', preset)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      (selectedBlock.properties.imageWidth || '100%') === preset
                        ? 'bg-brand-100 border-brand-500 text-brand-800'
                        : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={selectedBlock.properties.imageWidth || ''}
                onChange={(e) => update('imageWidth', e.target.value)}
                placeholder="100%"
                className="w-full px-2 py-1.5 text-xs border border-surface-300 rounded bg-white focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
          )}
          {type === 'columns' && (
            <TextInput label="Gap colonnes" value={selectedBlock.properties.columnsGap || '10px'} onChange={(v) => update('columnsGap', v)} placeholder="10px" />
          )}
        </Section>
      </div>
    </div>
  );
}

function ContentSection({ block, update }: { block: Block; update: (k: string, v: unknown) => void }) {
  const p = block.properties;

  switch (block.type) {
    case 'heading':
      return (
        <Section title="Contenu">
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
        </Section>
      );
    case 'text':
      return (
        <Section title="Contenu">
          <TextInput label="Texte" value={p.content || ''} onChange={(v) => update('content', v)} multiline />
        </Section>
      );
    case 'quote':
      return (
        <Section title="Contenu">
          <TextInput label="Citation" value={p.content || ''} onChange={(v) => update('content', v)} multiline />
        </Section>
      );
    case 'image':
    case 'hero':
      return (
        <Section title="Contenu">
          <TextInput label="URL de l'image" value={p.src || ''} onChange={(v) => update('src', v)} placeholder="https://..." />
          <TextInput label="Texte alternatif" value={p.alt || ''} onChange={(v) => update('alt', v)} placeholder="Description de l'image" />
          <TextInput label="Lien (optionnel)" value={p.href || ''} onChange={(v) => update('href', v)} placeholder="https://..." />
        </Section>
      );
    case 'button':
      return (
        <Section title="Contenu">
          <TextInput label="Texte du bouton" value={p.label || ''} onChange={(v) => update('label', v)} />
          <TextInput label="URL du lien" value={p.href || ''} onChange={(v) => update('href', v)} placeholder="https://..." />
        </Section>
      );
    case 'divider':
      return (
        <Section title="Contenu">
          <TextInput label="Style" value={p.border || '1px solid #E0E0E0'} onChange={(v) => update('border', v)} placeholder="1px solid #E0E0E0" />
        </Section>
      );
    case 'spacer':
      return (
        <Section title="Contenu">
          <SizeInput label="Hauteur" value={p.height || '20px'} onChange={(v) => update('height', v)} min={5} max={100} />
        </Section>
      );
    case 'product-card':
      return (
        <Section title="Contenu">
          <TextInput label="Nom du produit" value={p.content || ''} onChange={(v) => update('content', v)} />
          <TextInput label="URL image" value={p.src || ''} onChange={(v) => update('src', v)} placeholder="https://..." />
          <TextInput label="Alt image" value={p.alt || ''} onChange={(v) => update('alt', v)} placeholder="Description" />
          <TextInput label="Texte bouton" value={p.label || 'Voir'} onChange={(v) => update('label', v)} />
          <TextInput label="URL du lien" value={p.href || ''} onChange={(v) => update('href', v)} placeholder="https://..." />
        </Section>
      );
    case 'code':
      return (
        <Section title="Contenu">
          <TextInput label="HTML personnalisé" value={p.rawHtml || ''} onChange={(v) => update('rawHtml', v)} multiline />
        </Section>
      );
    default:
      return null;
  }
}

function hasTypography(type: BlockType): boolean {
  return ['heading', 'text', 'quote', 'button', 'product-card', 'header', 'footer'].includes(type);
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
