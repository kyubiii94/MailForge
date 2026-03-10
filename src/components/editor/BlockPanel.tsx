'use client';

import { useEditorStore } from '@/stores/editor-store';
import type { Block, BlockType, BlockCategory } from '@/types/editor';
import {
  Type,
  Image,
  Square,
  Minus,
  ArrowUpDown,
  Columns,
  MousePointerClick,
  Quote,
  Globe,
  LayoutTemplate,
  PanelBottom,
  Package,
  Code,
  Sparkles,
} from 'lucide-react';

const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    name: 'Structure',
    items: [
      { type: 'columns', label: 'Colonnes', icon: 'columns', defaultProperties: { columnsCount: 2 } },
      { type: 'divider', label: 'Séparateur', icon: 'minus', defaultProperties: { border: '1px solid #E0E0E0' } },
      { type: 'spacer', label: 'Espace', icon: 'arrowupdown', defaultProperties: { height: '20px' } },
    ],
  },
  {
    name: 'Contenu',
    items: [
      { type: 'heading', label: 'Titre', icon: 'type', defaultProperties: { content: 'Nouveau titre', headingLevel: 'h2', fontWeight: '700' } },
      { type: 'text', label: 'Texte', icon: 'type', defaultProperties: { content: 'Votre texte ici...', fontSize: '15px' } },
      { type: 'image', label: 'Image', icon: 'image', defaultProperties: {} },
      { type: 'button', label: 'Bouton CTA', icon: 'click', defaultProperties: { label: 'En savoir plus', href: '#', buttonColor: '#0A0A0A', buttonTextColor: '#FFFFFF', buttonBorderRadius: '4px' } },
      { type: 'quote', label: 'Citation', icon: 'quote', defaultProperties: { content: 'Votre citation ici...', border: '3px solid #E0E0E0', backgroundColor: '#f9f9f9' } },
    ],
  },
  {
    name: 'Composés',
    items: [
      { type: 'hero', label: 'Hero', icon: 'sparkles', defaultProperties: {} },
      { type: 'product-card', label: 'Carte produit', icon: 'package', defaultProperties: { content: 'Produit', label: 'Voir', buttonColor: '#0A0A0A', buttonTextColor: '#FFFFFF' } },
      { type: 'social', label: 'Réseaux sociaux', icon: 'globe', defaultProperties: { socialLinks: [{ platform: 'facebook', href: '#' }, { platform: 'instagram', href: '#' }] } },
    ],
  },
  {
    name: 'Layout',
    items: [
      { type: 'header', label: 'Header', icon: 'layout', defaultProperties: { backgroundColor: '#FFFFFF', padding: '10px 20px' } },
      { type: 'footer', label: 'Footer', icon: 'panelbottom', defaultProperties: { backgroundColor: '#f4f4f4', padding: '20px', textColor: '#888888' } },
      { type: 'code', label: 'HTML custom', icon: 'code', defaultProperties: { rawHtml: '<!-- votre HTML -->' } },
    ],
  },
];

function getIcon(icon: string) {
  const cls = 'w-4 h-4';
  switch (icon) {
    case 'type': return <Type className={cls} />;
    case 'image': return <Image className={cls} />;
    case 'click': return <MousePointerClick className={cls} />;
    case 'minus': return <Minus className={cls} />;
    case 'arrowupdown': return <ArrowUpDown className={cls} />;
    case 'columns': return <Columns className={cls} />;
    case 'quote': return <Quote className={cls} />;
    case 'globe': return <Globe className={cls} />;
    case 'layout': return <LayoutTemplate className={cls} />;
    case 'panelbottom': return <PanelBottom className={cls} />;
    case 'package': return <Package className={cls} />;
    case 'code': return <Code className={cls} />;
    case 'sparkles': return <Sparkles className={cls} />;
    default: return <Square className={cls} />;
  }
}

function createBlock(type: BlockType, defaultProperties?: Partial<Block['properties']>): Block {
  const block: Block = {
    id: crypto.randomUUID(),
    type,
    properties: { ...defaultProperties },
  };

  // Create children for columns
  if (type === 'columns') {
    const count = defaultProperties?.columnsCount || 2;
    block.children = Array.from({ length: count }, () => ({
      id: crypto.randomUUID(),
      type: 'column' as BlockType,
      properties: {},
      children: [],
    }));
  }

  // Create empty children for header/footer
  if (type === 'header' || type === 'footer') {
    block.children = [];
    if (type === 'footer') block.locked = true;
  }

  return block;
}

export function BlockPanel() {
  const addBlock = useEditorStore((s) => s.addBlock);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);

  const handleAdd = (type: BlockType, defaultProps?: Partial<Block['properties']>) => {
    const block = createBlock(type, defaultProps);
    addBlock(block, selectedBlockId || undefined);
  };

  return (
    <div className="w-56 border-r border-surface-200 bg-white flex flex-col overflow-hidden">
      <div className="p-3 border-b border-surface-200">
        <h3 className="text-sm font-semibold text-surface-900">Blocs</h3>
        <p className="text-[10px] text-surface-400 mt-0.5">Cliquez pour ajouter</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {BLOCK_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-1.5 px-1">
              {cat.name}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {cat.items.map((item) => (
                <button
                  key={item.type + item.label}
                  onClick={() => handleAdd(item.type, item.defaultProperties)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-surface-200 bg-white hover:bg-brand-50 hover:border-brand-300 transition-colors text-surface-600 hover:text-brand-700"
                >
                  {getIcon(item.icon)}
                  <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
