import Anthropic from '@anthropic-ai/sdk';
import type { BrandDNA, Client, EditorialTone } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-20250514';

/**
 * Extract JSON from Claude's response, handling markdown code fences.
 */
function extractJSON(text: string): string {
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const cleaned = fenceMatch ? fenceMatch[1].trim() : text;
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response as JSON');
  }
  return jsonMatch[0];
}

/**
 * Build client context block for AI prompts.
 */
function buildClientContext(client: Client): string {
  const parts = [
    `## CLIENT`,
    `- Marque : ${client.name}`,
    `- Secteur : ${client.sector}`,
  ];
  if (client.positioning) parts.push(`- Positionnement : ${client.positioning}`);
  if (client.toneOfVoice?.style) parts.push(`- Ton : ${client.toneOfVoice.style}`);
  if (client.toneOfVoice?.do?.length) parts.push(`- À faire : ${client.toneOfVoice.do.join(', ')}`);
  if (client.toneOfVoice?.dont?.length) parts.push(`- À éviter : ${client.toneOfVoice.dont.join(', ')}`);
  if (client.distribution?.length) parts.push(`- Distribution : ${client.distribution.join(', ')}`);
  return parts.join('\n');
}

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

  return JSON.parse(extractJSON(content.text)) as EditorialTone;
}

/**
 * Improve a marketing email draft using Claude AI, aligned with brand DNA and client profile.
 * Returns structured email content: subject, preheader, headline, body, CTA.
 */
export async function improveEmailDraft(params: {
  draft: string;
  brandDNA: BrandDNA;
  client?: Client;
  campaignGoal: string;
  campaignTrigger?: string;
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
  const { draft, brandDNA, client, campaignGoal, campaignTrigger, desiredCTA, targetLength, tone } = params;

  const clientBlock = client ? buildClientContext(client) : '';

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Tu es un expert en email marketing avec 15 ans d'expérience.

${clientBlock}

## BRAND DNA
- Ton : ${tone || brandDNA.editorialTone.tone}
- Mots-clés de la marque : ${brandDNA.keywords.keywords.join(', ')}
- Style : ${brandDNA.editorialTone.style_notes}
- Couleurs : primaire ${brandDNA.colors.primary}, accent ${brandDNA.colors.accent}
- Typographies : titres "${brandDNA.typography.headingFont}", corps "${brandDNA.typography.bodyFont}"

## CAMPAGNE
- Objectif : ${campaignGoal}
${campaignTrigger ? `- Événement : ${campaignTrigger}` : ''}
- CTA souhaité : ${desiredCTA || 'À déterminer selon le contexte'}
- Longueur cible : ${targetLength} mots

## BROUILLON
"""
${draft}
"""

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

  return JSON.parse(extractJSON(content.text));
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

  return JSON.parse(extractJSON(content.text));
}

/**
 * Generate email HTML/MJML design using Claude AI based on brand DNA, client, and content.
 */
export async function generateEmailDesign(params: {
  brandDNA: BrandDNA;
  client?: Client;
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
  const { brandDNA, client, textContent, visualUrls, variantNumber } = params;

  const layoutStyles = [
    'layout centré avec hero image en haut, puis texte, puis CTA',
    'layout en Z avec image à gauche et texte à droite, alternance',
    'layout minimaliste texte-centré avec accents de couleur et CTA proéminent',
  ];

  const clientBlock = client ? buildClientContext(client) : '';

  // ESP-specific merge tags
  let espInfo = '';
  if (client?.technicalPrefs?.esp) {
    const espTags: Record<string, string> = {
      mailchimp: 'Merge tags Mailchimp : *|UNSUB|*, *|FNAME|*, *|MC:SUBJECT|*',
      klaviyo: 'Merge tags Klaviyo : {{ unsubscribe_url }}, {{ first_name }}, {{ email.subject }}',
      brevo: 'Merge tags Brevo : {{ unsubscribe }}, {{ contact.FIRSTNAME }}, {{ params.subject }}',
    };
    espInfo = espTags[client.technicalPrefs.esp] || '';
  }

  const darkModeInfo = client?.technicalPrefs?.darkMode !== false
    ? '\n- Support dark mode : @media (prefers-color-scheme: dark), [data-ogsc] Outlook, color-scheme: light dark'
    : '';

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Tu es un expert en design d'emails marketing HTML. Génère un email MJML complet.

${clientBlock}

## ADN DE MARQUE
- Couleurs : primaire ${brandDNA.colors.primary}, secondaire ${brandDNA.colors.secondary}, accent ${brandDNA.colors.accent}, fond ${brandDNA.colors.background}, texte ${brandDNA.colors.text}
- Typographies : titres "${brandDNA.typography.headingFont}", corps "${brandDNA.typography.bodyFont}"
- Ton : ${brandDNA.editorialTone.tone}
- Mots-clés : ${brandDNA.keywords.keywords.join(', ')}
${espInfo ? `\n## ESP\n- ${espInfo}` : ''}

## CONTENU
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
- Poids HTML < 102 Ko
- Accessibilité : role="presentation" sur tables de layout, contraste 4.5:1${darkModeInfo}

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
