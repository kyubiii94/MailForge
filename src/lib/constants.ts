import type { TemplateTypeInfo } from '@/types';

export const TEMPLATE_TYPES: TemplateTypeInfo[] = [
  { number: 1, type: 'Welcome / Onboarding', objective: 'Premier contact, poser le ton de la marque', icon: '👋' },
  { number: 2, type: 'Hero Product Launch', objective: 'Lancement produit phare, impact visuel maximum', icon: '🚀' },
  { number: 3, type: 'Editorial / Storytelling', objective: 'Contenu de valeur, brand story, article', icon: '📖' },
  { number: 4, type: 'Promotional / Sale', objective: 'Offre commerciale, urgence, conversion', icon: '🏷️' },
  { number: 5, type: 'Social Proof / Testimonial', objective: 'Avis clients, UGC, confiance', icon: '⭐' },
  { number: 6, type: 'Event / Invitation', objective: 'Invitation événement, webinar, date clé', icon: '📅' },
  { number: 7, type: 'Re-engagement / Win-back', objective: 'Réactiver les inactifs, offre spéciale', icon: '💌' },
  { number: 8, type: 'Campaign Master Template', objective: 'Template hero réutilisable — système de design complet', icon: '🎨' },
];

export const DEFAULT_SELECTED_TEMPLATES = [1, 2, 3, 4, 8];

export const AMBIANCE_VOCABULARY: Record<string, string> = {
  luxe: 'generous whitespace, serif typography (Georgia, Times), muted palette, thin borders, letter-spacing: 2px on headings, minimal CTA, editorial photography full-width',
  tech: 'clean sans-serif (Arial, Helvetica), bold CTAs with high contrast, card-based layout, subtle gradients, icon-driven sections, dark mode optimized',
  ecommerce: 'product grid layout, price typography bold, urgency badges, countdown timer section, social proof bar, multiple CTAs, mobile-first shopping experience',
  lifestyle: 'rounded corners, warm palette, lifestyle photography, handwritten-style accents, story-driven layout, community feel',
  corporate: 'structured layout, data visualization sections, professional headshots, branded header bar, two-column content, white background dominant',
  minimaliste: 'monospace typography (Courier), raw HTML feel, black and white, no images or minimal, text-heavy, border: 1px solid black, anti-design aesthetic',
};

export const WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
