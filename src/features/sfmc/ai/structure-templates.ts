/**
 * Catalogue de structures d'email SeLoger — l'IA propose parmi ces templates,
 * le moteur de modules applique ensuite le rendu déterministe (jamais de HTML inventé).
 */

export type StructureTemplateId =
  | 'hero-cta-article'
  | 'editorial-story'
  | 'conseils-plus-article'
  | 'info-highlight'
  | 'visuel-impact'
  | 'parcours-vendeur';

export interface StructureTemplate {
  id: StructureTemplateId;
  label: string;
  description: string;
  /** Ordre des modules à activer (types registry). */
  moduleOrder: string[];
  /** Layout article recommandé si le module article est présent. */
  defaultArticleLayout: 'horizontal' | 'vertical' | 'editorial' | 'highlight' | 'banner';
}

export const STRUCTURE_TEMPLATES: StructureTemplate[] = [
  {
    id: 'hero-cta-article',
    label: 'Hero + CTA + Article',
    description: 'Structure newsletter classique : accroche, bouton, puis article de fond.',
    moduleOrder: ['hero', 'cta', 'article'],
    defaultArticleLayout: 'horizontal',
  },
  {
    id: 'editorial-story',
    label: 'Story éditoriale',
    description: 'Mise en avant magazine : hero long + article en lecture éditoriale.',
    moduleOrder: ['hero', 'article', 'cta'],
    defaultArticleLayout: 'editorial',
  },
  {
    id: 'conseils-plus-article',
    label: 'Conseils + Article',
    description: 'Pédagogie (bloc conseils) puis approfondissement via l’article blog.',
    moduleOrder: ['hero', 'cta', 'advice', 'article'],
    defaultArticleLayout: 'horizontal',
  },
  {
    id: 'info-highlight',
    label: 'Info mise en avant',
    description: 'Message court + encadré accent pour une info / article prioritaire.',
    moduleOrder: ['hero', 'article', 'cta'],
    defaultArticleLayout: 'highlight',
  },
  {
    id: 'visuel-impact',
    label: 'Impact visuel',
    description: 'Priorité image : article vertical ou bannière pour capter l’attention.',
    moduleOrder: ['hero', 'article', 'cta'],
    defaultArticleLayout: 'vertical',
  },
  {
    id: 'parcours-vendeur',
    label: 'Parcours vendeur',
    description: 'Estimation / vente : hero, conseils, carte bien, article, agence.',
    moduleOrder: ['hero', 'cta', 'advice', 'price-card', 'article', 'agence'],
    defaultArticleLayout: 'highlight',
  },
];

export const STRUCTURE_TEMPLATE_IDS = STRUCTURE_TEMPLATES.map((t) => t.id);

export function getStructureTemplate(id: string): StructureTemplate | undefined {
  return STRUCTURE_TEMPLATES.find((t) => t.id === id);
}
