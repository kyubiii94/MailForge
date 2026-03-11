/**
 * Generates style prompts by analyzing newsletters in a style using Gemini AI.
 */

import { GoogleGenAI } from '@google/genai';
import type { NewsletterInspiration } from '@/types/library';

const STYLE_ANALYSIS_PROMPT = `Tu es un expert en design de newsletters email. Analyse les newsletters suivantes qui constituent un "style" de référence. Génère une description détaillée et structurée de ce style qui pourra être utilisée comme directive de design pour générer de nouvelles newsletters similaires.

Ta description doit couvrir :
- PALETTE : couleurs dominantes, accents, contrastes (avec codes hex estimés)
- TYPOGRAPHIE : type de polices (serif/sans-serif), hiérarchie, tailles relatives, graisse
- LAYOUT : structure des sections, ratio texte/image, nombre de colonnes, espacement
- VISUELS : style photographique (lifestyle, packshot, éditorial...), traitement des images (plein cadre, arrondis, ombres...)
- CTA : style des boutons (forme, couleur, casse, position)
- TON / AMBIANCE : impression générale (luxe, minimaliste, corporate, playful, brutalist...)
- ÉLÉMENTS DISTINCTIFS : tout ce qui rend ce style unique et reconnaissable

Formule ta réponse comme une directive de design concise et actionnable, directement utilisable comme instruction pour un générateur de templates. Ne dépasse pas 500 mots. Sois précis sur les valeurs (couleurs, tailles, espacements).`;

function getClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('GEMINI_API_KEY est vide ou absente');
  return new GoogleGenAI({ apiKey: key });
}

export async function generateStylePrompt(
  styleName: string,
  inspirations: NewsletterInspiration[]
): Promise<string> {
  const client = getClient();

  // Build content parts with HTML samples and image references
  const contentParts: string[] = [
    STYLE_ANALYSIS_PROMPT,
    `\nNom du style : "${styleName}"`,
    `\nNewsletter(s) de référence (${inspirations.length}) :\n`,
  ];

  for (const insp of inspirations) {
    contentParts.push(`--- ${insp.title} ${insp.sourceBrand ? `(${insp.sourceBrand})` : ''} ---`);

    if (insp.fileType === 'html' && insp.htmlContent) {
      // Send HTML source for analysis (truncated to avoid token limits)
      const htmlSample = insp.htmlContent.slice(0, 8000);
      contentParts.push(`[Code HTML]:\n${htmlSample}`);
    } else if (insp.fileType === 'image') {
      contentParts.push(`[Image newsletter uploadée — URL : ${insp.filePath}]`);
      if (insp.description) {
        contentParts.push(`Description : ${insp.description}`);
      }
    }
    contentParts.push('');
  }

  const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const thinkingConfig = model.includes('2.5') ? { thinkingBudget: 0 } : undefined;
      const response = await client.models.generateContent({
        model,
        contents: contentParts.join('\n'),
        config: {
          maxOutputTokens: 2048,
          ...(thinkingConfig ? { thinkingConfig } : {}),
        },
      }) as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

      let text = response.text;
      if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }
      if (!text) throw new Error('Réponse vide de Gemini');
      return text.trim();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('not found') || msg.includes('404')) continue;
      throw err;
    }
  }

  throw lastError;
}

/**
 * Builds the style injection block to prepend to a generation prompt.
 */
export function buildStyleInjection(style: { name: string; stylePrompt: string | null; inspirations?: NewsletterInspiration[] }): string {
  if (!style.stylePrompt) return '';

  let injection = `[STYLE DE RÉFÉRENCE]
L'utilisateur a sélectionné le style "${style.name}" comme référence.

Voici la directive de design à suivre :

${style.stylePrompt}

Génère le template newsletter en respectant scrupuleusement ce style visuel. Les choix de couleurs, typographie, layout et ambiance doivent correspondre à cette directive.`;

  // Add HTML samples if available
  const htmlInspirations = style.inspirations?.filter(i => i.fileType === 'html' && i.htmlContent) ?? [];
  if (htmlInspirations.length > 0) {
    const sample = htmlInspirations[0];
    injection += `\n\n[EXEMPLE DE CODE HTML DE RÉFÉRENCE]\nVoici un extrait HTML d'une newsletter de référence pour ce style :\n${sample.htmlContent!.slice(0, 4000)}`;
  }

  return injection;
}
