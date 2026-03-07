import { GoogleGenAI } from '@google/genai';
import type { BrandDNA, EditorialTone } from '@/types';

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('GEMINI_API_KEY est vide ou absente');
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: key });
  }
  return _client;
}

function getErrorCode(err: unknown): number | undefined {
  const e = err as { status?: number; statusCode?: number; code?: number; httpCode?: number } | undefined;
  if (typeof e?.status === 'number') return e.status;
  if (typeof e?.statusCode === 'number') return e.statusCode;
  if (typeof e?.code === 'number') return e.code;
  if (typeof e?.httpCode === 'number') return e.httpCode;
  const msg = err instanceof Error ? err.message : String(err);
  const codeMatch = msg.match(/"code"\s*:\s*(\d{3})/);
  if (codeMatch) return parseInt(codeMatch[1], 10);
  return undefined;
}

function isModelNotFoundError(err: unknown): boolean {
  const code = getErrorCode(err);
  if (code === 404) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes('is not found') || msg.includes('model not found') || (msg.includes('models/') && msg.includes('not found'));
}

function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return raw.trim();
}

/**
 * Attempt to repair truncated JSON (unterminated strings, missing closing braces).
 */
function repairJson(raw: string): string {
  let s = raw.trim();
  // Close any unterminated string
  const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) s += '"';
  // Balance braces and brackets
  let braces = 0;
  let brackets = 0;
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && (i === 0 || s[i - 1] !== '\\')) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }
  // Remove trailing comma before closing
  s = s.replace(/,\s*$/, '');
  while (brackets > 0) { s += ']'; brackets--; }
  while (braces > 0) { s += '}'; braces--; }
  return s;
}

function safeJsonParse<T>(raw: string): T {
  const jsonStr = extractJson(raw);
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    console.warn('[Gemini] JSON.parse failed, attempting repair...');
    const repaired = repairJson(jsonStr);
    return JSON.parse(repaired) as T;
  }
}

async function generateJson<T>(prompt: string, maxTokens = 2048): Promise<T> {
  const client = getClient();
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      console.log(`[Gemini] Trying model: ${model} (JSON mode, ${maxTokens} max tokens)`);
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: maxTokens,
        },
      }) as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

      let text = response.text;
      if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }
      if (!text) throw new Error('Réponse vide de Gemini');

      console.log(`[Gemini] Raw response (${text.length} chars): ${text.slice(0, 300)}`);
      const parsed = safeJsonParse<T>(text);
      console.log(`[Gemini] JSON parsed OK with model ${model}`);
      return parsed;
    } catch (err) {
      const code = getErrorCode(err);
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Gemini] Model ${model} failed (HTTP ${code ?? '?'}):`, msg.slice(0, 300));
      lastError = err;
      if (isModelNotFoundError(err)) continue;
      throw err;
    }
  }
  throw lastError;
}

async function generateText(prompt: string, maxTokens = 4096): Promise<string> {
  const client = getClient();
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      console.log(`[Gemini] Trying model: ${model} (text mode)`);
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: { maxOutputTokens: maxTokens },
      }) as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

      let text = response.text;
      if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }
      if (!text) throw new Error('Réponse vide de Gemini');
      console.log(`[Gemini] Success with model ${model} (${text.length} chars)`);
      return text;
    } catch (err) {
      const code = getErrorCode(err);
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Gemini] Model ${model} failed (HTTP ${code ?? '?'}):`, msg.slice(0, 300));
      lastError = err;
      if (isModelNotFoundError(err)) continue;
      throw err;
    }
  }
  throw lastError;
}

/**
 * Test minimal pour vérifier que la clé API fonctionne.
 */
export async function testConnection(): Promise<{ ok: boolean; model: string; error?: string; details?: Record<string, string> }> {
  const client = getClient();
  const details: Record<string, string> = {};
  for (const model of MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: 'Reply with exactly: ok',
        config: { maxOutputTokens: 10 },
      }) as { text?: string };
      if (response.text) {
        return { ok: true, model, details };
      }
      details[model] = 'Réponse vide';
    } catch (err) {
      const code = getErrorCode(err);
      const msg = err instanceof Error ? err.message : String(err);
      details[model] = `HTTP ${code ?? '?'}: ${msg.slice(0, 150)}`;
      if (isModelNotFoundError(err)) continue;
      return { ok: false, model, error: msg.slice(0, 200), details };
    }
  }
  return { ok: false, model: MODELS.join(', '), error: 'Aucun modèle accessible', details };
}

/**
 * Analyse le ton éditorial à partir du texte d'un site.
 */
export async function analyzeEditorialTone(textContent: string): Promise<EditorialTone> {
  const prompt = `Tu es un expert en analyse de communication de marque.
Analyse le ton éditorial des textes suivants extraits d'un site web.

Textes du site :
"""
${textContent.slice(0, 8000)}
"""

Réponds en JSON avec exactement cette structure (pas de texte autour, uniquement le JSON) :
{
  "tone": "le ton principal détecté",
  "style_notes": "description détaillée du style en 2-3 phrases",
  "formality_level": 5,
  "energy_level": 5
}

Règles :
- tone : un mot ou expression courte (formel, décontracté, inspirationnel, technique, chaleureux, professionnel, etc.)
- style_notes : 2-3 phrases décrivant le style de communication
- formality_level : entier de 1 (très informel) à 10 (très formel)
- energy_level : entier de 1 (calme/posé) à 10 (dynamique/enthousiaste)`;

  return generateJson<EditorialTone>(prompt, 2048);
}

/**
 * Extrait mots-clés, slogans et champs lexicaux.
 */
export async function extractKeywords(
  textContent: string
): Promise<{ keywords: string[]; slogans: string[]; lexicalFields: string[] }> {
  const prompt = `Analyse les textes suivants d'un site web et extrais les éléments clés de la marque.

Textes :
"""
${textContent.slice(0, 8000)}
"""

Réponds en JSON avec exactement cette structure :
{
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3"],
  "slogans": ["slogan ou phrase d'accroche trouvée sur le site"],
  "lexicalFields": ["champ lexical 1", "champ lexical 2"]
}

Règles :
- keywords : 5 à 15 mots-clés représentatifs de la marque
- slogans : les phrases d'accroche ou taglines trouvées dans le texte
- lexicalFields : 3 à 8 champs lexicaux dominants (ex: innovation, confiance, luxe, nature)`;

  return generateJson<{ keywords: string[]; slogans: string[]; lexicalFields: string[] }>(prompt, 2048);
}

/**
 * Améliore un brouillon d'email selon l'ADN de marque.
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

ADN de la marque :
- Ton : ${tone || brandDNA.editorialTone.tone}
- Mots-clés : ${brandDNA.keywords.keywords.join(', ')}
- Style : ${brandDNA.editorialTone.style_notes}
- Couleur dominante : ${brandDNA.colors.primary}

Brouillon du client :
"""
${draft}
"""

Objectif : ${campaignGoal}
CTA souhaité : ${desiredCTA || 'À déterminer selon le contexte'}
Longueur cible : ${targetLength} mots

Génère un email marketing optimisé en respectant le ton et le vocabulaire de la marque.

Réponds en JSON :
{
  "subject": "Objet de l'email (max 60 caractères)",
  "preheader": "Pré-header (max 100 caractères)",
  "headline": "Titre principal accrocheur",
  "body": "Corps de l'email en HTML simple (p, ul, strong)",
  "ctaText": "Texte du bouton CTA (max 30 caractères)"
}`;

  return generateJson<{
    subject: string;
    preheader: string;
    headline: string;
    body: string;
    ctaText: string;
  }>(prompt, 2048);
}

/**
 * Génère le design email en MJML à partir de l'ADN et du contenu.
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

Génère le code MJML complet. Réponds UNIQUEMENT avec le code MJML entre les balises <mjml> et </mjml>, sans explications.`;

  const text = await generateText(prompt, 4096);
  const mjmlMatch = text.match(/<mjml[\s\S]*<\/mjml>/);
  const mjmlSource = mjmlMatch ? mjmlMatch[0] : text;
  return { mjml: mjmlSource, html: '' };
}
