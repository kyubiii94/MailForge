import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { crawlMainPages } from '@/lib/scraping/crawler';
import { extractColorPalette, extractTypography } from '@/lib/scraping/brand-extractor';
import { safeJsonParse } from '@/lib/ai/gemini';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 120;

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

async function analyzeWithGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('GEMINI_API_KEY manquante');
  const client = new GoogleGenAI({ apiKey: key });

  for (const model of MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', maxOutputTokens: 4096 },
      }) as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      const code = (err as { status?: number })?.status;
      if (code === 404) continue;
      throw err;
    }
  }
  throw new Error('Aucun modèle Gemini accessible');
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const client = await db.getClient(id);
    if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }

    if (!client.website) {
      return NextResponse.json({ error: 'Aucun site web renseigné pour ce client.' }, { status: 400 });
    }

    console.log(`[Analyze] Crawling ${client.website} for client ${client.name}...`);
    const pages = await crawlMainPages(client.website);

    let colorsStr = '';
    let fontsStr = '';
    let textContent = '';

    if (pages.length > 0) {
      const colors = extractColorPalette(pages);
      const typography = extractTypography(pages);
      textContent = pages.map((p) => p.textContent).join('\n').slice(0, 8000);
      colorsStr = `primary: ${colors.primary}, secondary: ${colors.secondary}, accent: ${colors.accent}, bg: ${colors.background}, text: ${colors.text}`;
      fontsStr = `heading: ${typography.headingFont}, body: ${typography.bodyFont}, families: ${typography.families.join(', ')}`;
      console.log(`[Analyze] Crawl OK: ${pages.length} pages`);
    }

    const title = pages[0]?.title || client.name;
    const metaDesc = pages[0]?.metaDescription || '';

    const prompt = `Tu es un expert en stratégie de marque et email marketing.
Analyse les données suivantes extraites du site web "${client.website}" et déduis les informations de la marque.

Titre du site : ${title}
Description meta : ${metaDesc}
Couleurs trouvées : ${colorsStr || 'aucune'}
Polices trouvées : ${fontsStr || 'aucune'}
Extraits de texte du site :
${textContent.slice(0, 5000)}

Réponds en JSON avec exactement cette structure :
{
  "sector": "secteur d'activité détecté",
  "positioning": "positionnement de la marque en une phrase",
  "toneOfVoice": "description du ton de voix en 2-3 phrases",
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"],
  "audience": "description de l'audience cible probable",
  "ambiance": "ambiance visuelle / style de communication (ex: luxe éditorial, tech moderne, lifestyle chaleureux...)",
  "colors": "résumé de la palette détectée (primary, secondary, accent avec hex)",
  "fonts": "polices principales détectées avec fallbacks web-safe"
}

Sois précis et concret. Base-toi sur le contenu réel du site, pas sur des suppositions génériques.`;

    console.log('[Analyze] Calling Gemini for site analysis...');
    const rawResponse = await analyzeWithGemini(prompt);

    let analysis: {
      sector: string;
      positioning: string;
      toneOfVoice: string;
      keywords: string[];
      audience: string;
      ambiance: string;
      colors: string;
      fonts: string;
    };

    try {
      analysis = safeJsonParse<typeof analysis>(rawResponse);
    } catch {
      console.error('[Analyze] Failed to parse Gemini response:', rawResponse.slice(0, 500));
      return NextResponse.json({ error: 'Réponse IA non valide. Réessayez.' }, { status: 500 });
    }

    const siteAnalysis = {
      colors: analysis.colors || colorsStr,
      fonts: analysis.fonts || fontsStr,
      toneOfVoice: analysis.toneOfVoice || '',
      keywords: analysis.keywords || [],
      audience: analysis.audience || '',
      ambiance: analysis.ambiance || '',
      analyzedAt: new Date().toISOString(),
    };

    const updateData: Record<string, unknown> = { siteAnalysis };
    if (!client.sector && analysis.sector) updateData.sector = analysis.sector;
    if (!client.positioning && analysis.positioning) updateData.positioning = analysis.positioning;

    const updated = await db.updateClient(id, updateData as Partial<typeof client>);
    console.log(`[Analyze] Client ${client.name} updated with site analysis`);

    return NextResponse.json({ client: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de l\'analyse';
    console.error('[Analyze] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
