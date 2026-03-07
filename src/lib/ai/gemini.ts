import { GoogleGenAI } from '@google/genai';
import type { BrandDNA, EditorialTone } from '@/types';

const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
const ai = new GoogleGenAI({ apiKey });

const MODEL = 'gemini-1.5-flash';

async function generateText(prompt: string, maxTokens = 1024): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { maxOutputTokens: maxTokens },
  }) as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

  let text = response.text;
  if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
    text = response.candidates[0].content.parts[0].text;
  }
  if (!text) throw new Error('Réponse vide de Gemini');
  return text;
}

/**
 * Analyse le ton éditorial à partir du texte d'un site (même contrat que Claude).
 */
export async function analyzeEditorialTone(textContent: string): Promise<EditorialTone> {
  const prompt = `Tu es un expert en analyse de communication de marque.

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
}`;

  const text = await generateText(prompt, 1024);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Réponse Gemini non JSON');
  return JSON.parse(jsonMatch[0]) as EditorialTone;
}

/**
 * Extrait mots-clés, slogans et champs lexicaux (même contrat que Claude).
 */
export async function extractKeywords(
  textContent: string
): Promise<{ keywords: string[]; slogans: string[]; lexicalFields: string[] }> {
  const prompt = `Analyse les textes suivants d'un site web et extrais les éléments clés.

Textes :
"""
${textContent.slice(0, 8000)}
"""

Réponds UNIQUEMENT en JSON valide :
{
  "keywords": ["mot-clé 1", "mot-clé 2", ...],
  "slogans": ["slogan ou phrase d'accroche trouvée", ...],
  "lexicalFields": ["champ lexical 1 (ex: innovation)", "champ lexical 2 (ex: confiance)", ...]
}`;

  const text = await generateText(prompt, 1024);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Réponse Gemini non JSON');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Améliore un brouillon d'email selon l'ADN de marque (même contrat que Claude).
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

  const prompt = `Tu es un expert en email marketing avec 15 ans d'expérience.

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
}`;

  const text = await generateText(prompt, 2048);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Réponse Gemini non JSON');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Génère le design email en MJML à partir de l'ADN et du contenu (même contrat que Claude).
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

  const prompt = `Tu es un expert en design d'emails marketing HTML. Génère un email MJML complet.

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

${visualUrls.length > 0 ? `Images disponibles : ${visualUrls.join(', ')}` : "Pas d'images disponibles, utilise un design typographique"}

Style de mise en page : ${layoutStyles[variantNumber - 1] || layoutStyles[0]}

Règles strictes :
- Largeur max : 600px
- Tous les styles en inline
- Texte ALT sur toutes les images
- Compatible Outlook (MSO conditional comments)
- Design responsive (mobile 375px)

Génère le code MJML complet. Réponds UNIQUEMENT avec le code MJML, sans explications, entre les balises <mjml> et </mjml>.`;

  const text = await generateText(prompt, 4096);
  const mjmlMatch = text.match(/<mjml[\s\S]*<\/mjml>/);
  const mjmlSource = mjmlMatch ? mjmlMatch[0] : text;
  return { mjml: mjmlSource, html: '' };
}
