import Anthropic from '@anthropic-ai/sdk';
import type { BrandDNA, EditorialTone } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Modèle stable et disponible (voir https://docs.anthropic.com/en/api/models-list)
const MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Analyze editorial tone from website text content using Claude AI.
 * Returns structured tone analysis including formality, energy, and style notes.
 */
export async function analyzeEditorialTone(
  textContent: string
): Promise<EditorialTone> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Tu es un expert en analyse de communication de marque.

Analyse le ton éditorial des textes suivants extraits d'un site web.

Textes du site :
"""
${textContent.slice(0, 8000)}
"""

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "tone": "le ton principal (ex: formel, décontracté, inspirationnel, technique, chaleureux, professionnel)",
  "style_notes": "description détaillée du style en 2-3 phrases",
  "formality_level": nombre de 1 à 10 (1=très informel, 10=très formel),
  "energy_level": nombre de 1 à 10 (1=calme/posé, 10=dynamique/enthousiaste)
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response as JSON');
  }

  return JSON.parse(jsonMatch[0]) as EditorialTone;
}

/**
 * Improve a marketing email draft using Claude AI, aligned with brand DNA.
 * Returns structured email content: subject, preheader, headline, body, CTA.
 */
export async function improveEmailDraft(params: {
  draft: string;
  brandDNA: BrandDNA;
  campaignGoal: string;
  desiredCTA: string;
  targetLength: number;
  tone?: string;
}): Promise<{
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  ctaText: string;
}> {
  const { draft, brandDNA, campaignGoal, desiredCTA, targetLength, tone } = params;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Tu es un expert en email marketing avec 15 ans d'expérience.

Voici l'ADN de la marque :
- Ton : ${tone || brandDNA.editorialTone.tone}
- Mots-clés de la marque : ${brandDNA.keywords.keywords.join(', ')}
- Style : ${brandDNA.editorialTone.style_notes}
- Couleur dominante : ${brandDNA.colors.primary}

Voici le brouillon du client :
"""
${draft}
"""

Objectif de la campagne : ${campaignGoal}
CTA souhaité : ${desiredCTA || 'À déterminer selon le contexte'}
Longueur cible : ${targetLength} mots

Génère un email marketing optimisé en respectant strictement le ton et le vocabulaire de la marque.

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "subject": "Objet de l'email (max 60 caractères)",
  "preheader": "Pré-header (max 100 caractères)",
  "headline": "Titre principal accrocheur",
  "body": "Corps de l'email en HTML simple (paragraphes <p>, listes <ul>, gras <strong>)",
  "ctaText": "Texte du bouton CTA (max 30 caractères)"
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response as JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Extract keywords and slogans from website text using Claude AI.
 */
export async function extractKeywords(
  textContent: string
): Promise<{ keywords: string[]; slogans: string[]; lexicalFields: string[] }> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyse les textes suivants d'un site web et extrais les éléments clés.

Textes :
"""
${textContent.slice(0, 8000)}
"""

Réponds UNIQUEMENT en JSON valide :
{
  "keywords": ["mot-clé 1", "mot-clé 2", ...],
  "slogans": ["slogan ou phrase d'accroche trouvée", ...],
  "lexicalFields": ["champ lexical 1 (ex: innovation)", "champ lexical 2 (ex: confiance)", ...]
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response as JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate email HTML/MJML design using Claude AI based on brand DNA and content.
 */
export async function generateEmailDesign(params: {
  brandDNA: BrandDNA;
  textContent: {
    subject: string;
    preheader: string;
    headline: string;
    body: string;
    ctaText: string;
    ctaUrl: string;
  };
  visualUrls: string[];
  variantNumber: number;
}): Promise<{ mjml: string; html: string }> {
  const { brandDNA, textContent, visualUrls, variantNumber } = params;

  const layoutStyles = [
    'layout centré avec hero image en haut, puis texte, puis CTA',
    'layout en Z avec image à gauche et texte à droite, alternance',
    'layout minimaliste texte-centré avec accents de couleur et CTA proéminent',
  ];

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Tu es un expert en design d'emails marketing HTML. Génère un email MJML complet.

ADN de la marque :
- Couleurs : primaire ${brandDNA.colors.primary}, secondaire ${brandDNA.colors.secondary}, accent ${brandDNA.colors.accent}, fond ${brandDNA.colors.background}, texte ${brandDNA.colors.text}
- Typographies : titres "${brandDNA.typography.headingFont}", corps "${brandDNA.typography.bodyFont}"
- Ton : ${brandDNA.editorialTone.tone}

Contenu de l'email :
- Objet : ${textContent.subject}
- Pré-header : ${textContent.preheader}
- Titre : ${textContent.headline}
- Corps : ${textContent.body}
- CTA : ${textContent.ctaText} → ${textContent.ctaUrl || '#'}

${visualUrls.length > 0 ? `Images disponibles : ${visualUrls.join(', ')}` : 'Pas d\'images disponibles, utilise un design typographique'}

Style de mise en page : ${layoutStyles[variantNumber - 1] || layoutStyles[0]}

Règles strictes :
- Largeur max : 600px
- Tous les styles en inline
- Texte ALT sur toutes les images
- Compatible Outlook (MSO conditional comments)
- Design responsive (mobile 375px)

Génère le code MJML complet. Réponds UNIQUEMENT avec le code MJML, sans explications, entre les balises <mjml> et </mjml>.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const mjmlMatch = content.text.match(/<mjml[\s\S]*<\/mjml>/);
  const mjmlSource = mjmlMatch ? mjmlMatch[0] : content.text;

  // We return the MJML source; the caller will convert to HTML
  return { mjml: mjmlSource, html: '' };
}
