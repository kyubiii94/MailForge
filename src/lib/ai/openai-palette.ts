import OpenAI from 'openai';
import type { ColorPalette } from '@/types';
import type { CrawledPage } from '@/lib/scraping/crawler';
import { buildPaletteInferenceContext } from '@/lib/scraping/brand-extractor';

const HEX_6 = /^#[0-9a-f]{6}$/;

function normalizeHexInput(s: string): string | null {
  let x = s.trim().toLowerCase();
  if (!x.startsWith('#')) x = `#${x}`;
  if (x.length === 4 && x[1] && x[2] && x[3]) {
    x = `#${x[1]}${x[1]}${x[2]}${x[2]}${x[3]}${x[3]}`;
  }
  if (x.length > 7) x = x.slice(0, 7);
  return HEX_6.test(x) ? x : null;
}

/**
 * Uses OpenAI on raw CSS/HTML color evidence to infer brand roles (primary, secondary, etc.).
 * Falls back to `heuristic` if OPENAI_API_KEY is missing or the call fails.
 */
export async function refinePaletteWithOpenAI(
  pages: CrawledPage[],
  heuristic: ColorPalette
): Promise<ColorPalette> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || pages.length === 0) return heuristic;

  const context = buildPaletteInferenceContext(pages);
  const model = process.env.OPENAI_PALETTE_MODEL?.trim() || 'gpt-4o-mini';

  const userPrompt = `Tu es expert en chartes graphiques et design systems web.

Données BRUTES scrapées (fréquences de couleurs, variables CSS, extraits). Rien n’est interprété pour toi :

${context}

Palette heuristique locale (souvent imprécise — ne la recopie pas aveuglément) :
primary=${heuristic.primary}, secondary=${heuristic.secondary}, accent=${heuristic.accent}, background=${heuristic.background}, text=${heuristic.text}

Tâche : déduire la palette RÉELLEMENT utilisée sur le site pour primary, secondary, accent, background et text.

Règles :
1) Réponds uniquement avec un objet JSON contenant les clés : "primary", "secondary", "accent", "background", "text".
2) Chaque valeur doit être un hex à 6 chiffres : #rrggbb (minuscules).
3) PRIORITÉ aux couleurs listées dans les sections « Couleurs fréquentes », aux variables CSS nommées (--primary, --brand, etc.), et aux extraits :root/body. Ne invente pas une couleur de marque qui n’apparaît pas dans ces données ; au pire choisis la meilleure approximation parmi les hex déjà présents.
4) primary = couleur de marque dominante (titres forts, liens principaux, logo si reflété dans le CSS).
5) secondary = deuxième couleur de structure ou sections (pas forcément très différente si le site est minimaliste).
6) accent = couleur des CTA / surbrillance (boutons importants).
7) background = fond de page dominant (blanc cassé ou sombre selon les extraits).
8) text = couleur principale du corps de texte (souvent gris très foncé ou noir selon les données).

Si plusieurs hex sont très proches (ex: #111111 vs #1a1a1a), garde celui qui est le plus attesté dans les données.`;

  try {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.15,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content:
            'Tu réponds uniquement par un objet JSON avec les clés primary, secondary, accent, background, text. Valeurs en hex minuscules.',
        },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = res.choices[0]?.message?.content?.trim();
    if (!raw) return heuristic;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pick = (key: keyof ColorPalette): string => {
      const v = parsed[key];
      const hex = typeof v === 'string' ? normalizeHexInput(v) : null;
      return hex ?? heuristic[key];
    };

    return {
      primary: pick('primary'),
      secondary: pick('secondary'),
      accent: pick('accent'),
      background: pick('background'),
      text: pick('text'),
    };
  } catch (err) {
    console.warn('[OpenAI palette]', err instanceof Error ? err.message : err);
    return heuristic;
  }
}
