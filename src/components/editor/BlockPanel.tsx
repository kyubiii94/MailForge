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
  Heading1,
  AlignLeft,
  MoveVertical,
  LayoutGrid,
} from 'lucide-react';

const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    name: 'Basiques',
    items: [
      { type: 'heading', label: 'Titre', icon: 'heading', defaultProperties: { content: 'Nouveau titre', headingLevel: 'h2', fontWeight: '700', fontSize: '24px', textColor: '#1A1A1A' } },
      { type: 'text', label: 'Texte', icon: 'text', defaultProperties: { content: 'Votre texte ici...', fontSize: '15px', lineHeight: '1.6', textColor: '#2D2D2D' } },
      { type: 'image', label: 'Image', icon: 'image', defaultProperties: {} },
      { type: 'button', label: 'Bouton CTA', icon: 'click', defaultProperties: { label: 'En savoir plus', href: '#', buttonColor: '#0A0A0A', buttonTextColor: '#FFFFFF', buttonBorderRadius: '4px', buttonPadding: '14px 28px', textAlign: 'center' } },
    ],
  },
  {
    name: 'Layout',
    items: [
      { type: 'divider', label: 'Séparateur', icon: 'minus', defaultProperties: { border: '1px solid #E0E0E0' } },
      { type: 'spacer', label: 'Espace', icon: 'arrowupdown', defaultProperties: { height: '30px' } },
      { type: 'columns', label: '2 colonnes', icon: 'columns', defaultProperties: { columnsCount: 2 } },
    ],
  },
  {
    name: 'Composés',
    items: [
      { type: 'hero', label: 'Hero image', icon: 'sparkles', defaultProperties: {} },
      { type: 'product-card', label: 'Carte produit', icon: 'package', defaultProperties: { content: 'Produit', label: 'Voir', buttonColor: '#0A0A0A', buttonTextColor: '#FFFFFF' } },
      { type: 'quote', label: 'Citation', icon: 'quote', defaultProperties: { content: 'Votre citation ici...', border: '3px solid #E0E0E0', backgroundColor: '#f9f9f9', textColor: '#2D2D2D' } },
      { type: 'social', label: 'Réseaux sociaux', icon: 'globe', defaultProperties: { socialLinks: [{ platform: 'facebook', href: '#' }, { platform: 'instagram', href: '#' }] } },
    ],
  },
  {
    name: 'Structure',
    items: [
      { type: 'header', label: 'Header', icon: 'layout', defaultProperties: { backgroundColor: '#FFFFFF', padding: '10px 20px' } },
      { type: 'footer', label: 'Footer', icon: 'panelbottom', defaultProperties: { backgroundColor: '#f4f4f4', padding: '20px', textColor: '#888888', fontSize: '12px' } },
      { type: 'code', label: 'HTML custom', icon: 'code', defaultProperties: { rawHtml: '<!-- votre HTML -->' } },
    ],
  },
];

function getIcon(icon: string) {
  const cls = 'w-4 h-4';
  switch (icon) {
    case 'heading': return <Heading1 className={cls} />;
    case 'text': return <AlignLeft className={cls} />;
    case 'type': return <Type className={cls} />;
    case 'image': return <Image className={cls} />;
    case 'click': return <MousePointerClick className={cls} />;
    case 'minus': return <Minus className={cls} />;
    case 'arrowupdown': return <MoveVertical className={cls} />;
    case 'columns': return <LayoutGrid className={cls} />;
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

  if (type === 'columns') {
    const count = defaultProperties?.columnsCount || 2;
    block.children = Array.from({ length: count }, () => ({
      id: crypto.randomUUID(),
      type: 'column' as BlockType,
      properties: {},
      children: [],
    }));
  }

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
    <div className="w-52 border-r border-surface-200 bg-white flex flex-col overflow-hidden shrink-0">
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
            <div className="space-y-0.5">
              {cat.items.map((item) => (
                <button
                  key={item.type + item.label}
                  onClick={() => handleAdd(item.type, item.defaultProperties)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg border border-transparent hover:bg-brand-50 hover:border-brand-200 transition-colors text-surface-600 hover:text-brand-700"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded bg-surface-100 text-surface-500 group-hover:bg-brand-100 group-hover:text-brand-600 shrink-0">
                    {getIcon(item.icon)}
                  </span>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
