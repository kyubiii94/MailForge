import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import type { ColorPalette } from '@/types';
import type { CrawledPage } from '@/lib/scraping/crawler';
import { buildPaletteInferenceContext } from '@/lib/scraping/brand-extractor';
import { collectPaletteCandidateImageUrls } from '@/lib/scraping/palette-image-urls';

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

function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return 'image/webp';
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  return null;
}

/** Fetch image ourselves so OpenAI doesn’t depend on CDN allowing third-party fetch. */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(14000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 400 || buf.length > 3_500_000) return null;

    let mime = res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || '';
    if (!mime.startsWith('image/')) mime = sniffImageMime(buf) || '';
    if (!mime.startsWith('image/')) return null;

    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

async function loadVisionImageDataUrls(urls: string[], maxImages: number): Promise<string[]> {
  const out: string[] = [];
  for (const url of urls) {
    if (out.length >= maxImages) break;
    const data = await fetchImageAsDataUrl(url);
    if (data) out.push(data);
  }
  return out;
}

function buildPalettePrompt(context: string, heuristic: ColorPalette, hasVision: boolean): string {
  const visionNote = hasVision
    ? `Des captures du site (hero, visuels produits, etc.) sont fournies en images. Sur les sites e-commerce / lifestyle, les couleurs de marque APPARENTES viennent souvent des PHOTOS (packaging, ambiance, eau/turquoise, rouges produits…) alors que le CSS ne contient que du noir/blanc/gris. Tu DOIS prioriser ce que montrent ces images pour primary / secondary / accent lorsque c’est manifestement la charte visible ; déduis des hex #rrggbb qui approximent ces teintes dominantes (pas besoin qu’elles figurent dans le bloc CSS).
`
    : '';

  return `Tu es expert en chartes graphiques et design systems web.

${visionNote}
Données scrapées (CSS/HTML — complémentaires, parfois trompeuses seules) :

${context}

Palette heuristique locale (souvent imprécise — surtout si le site charge peu de tokens couleur dans le CSS) :
primary=${heuristic.primary}, secondary=${heuristic.secondary}, accent=${heuristic.accent}, background=${heuristic.background}, text=${heuristic.text}

Tâche : définir une palette newsletter fidèle à ce que le site COMMunique visuellement.

Règles :
1) Réponds uniquement avec un objet JSON : "primary", "secondary", "accent", "background", "text".
2) Chaque valeur : hex #rrggbb minuscules.
3) Si des images sont jointes : primary / secondary / accent doivent refléter les couleurs marque VISIBLES (hero, packaging, accents photo). background = fond dominant des zones contenu (souvent blanc ou très clair). text = couleur du texte principal visible (noir ou gris très foncé), PAS un bleu de lien générique (#0066cc etc.) sauf si c’est clairement la couleur titres du site.
4) Sans images : privilégie les couleurs attestées dans les sections « Couleurs fréquentes » et variables CSS ; évite les bleus saturés isolés typiques des liens parsés si rien ne les désigne comme couleur titres/marque.
5) secondary peut être une deuxième couleur de marque ou un soutien harmonique déduit du même univers visuel que primary.

Si plusieurs hex sont proches, garde les plus représentatifs du rendu utilisateur final.`;
}

async function openaiPaletteJson(
  client: OpenAI,
  model: string,
  parts: ChatCompletionContentPart[]
): Promise<Record<string, unknown> | null> {
  const res = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    temperature: 0.12,
    max_tokens: 500,
    messages: [
      {
        role: 'system',
        content:
          'Tu réponds uniquement par un objet JSON avec les clés primary, secondary, accent, background, text. Valeurs en hex minuscules.',
      },
      { role: 'user', content: parts },
    ],
  });

  const raw = res.choices[0]?.message?.content?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Uses OpenAI on scraped CSS/HTML plus optional homepage/hero images (vision) to infer brand palette.
 * Vision captures photographic branding that CSS misses (e.g. cosmetics hero teal, packaging reds).
 * Falls back to `heuristic` if OPENAI_API_KEY is missing or all calls fail.
 */
export async function refinePaletteWithOpenAI(
  pages: CrawledPage[],
  heuristic: ColorPalette
): Promise<ColorPalette> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || pages.length === 0) return heuristic;

  const context = buildPaletteInferenceContext(pages);
  const envModel = process.env.OPENAI_PALETTE_MODEL?.trim();
  /** Vision-capable default when images are used */
  const visionModel = envModel || 'gpt-4o-mini';
  const textOnlyModel = envModel || 'gpt-4o-mini';

  const imageUrls = collectPaletteCandidateImageUrls(pages, 6);
  let visionDataUrls: string[] = [];
  if (imageUrls.length > 0) {
    visionDataUrls = await loadVisionImageDataUrls(imageUrls, 4);
  }
  const hasVision = visionDataUrls.length > 0;

  try {
    const client = new OpenAI({ apiKey });
    const promptText = buildPalettePrompt(context, heuristic, hasVision);

    let parsed: Record<string, unknown> | null = null;

    if (hasVision) {
      const visionParts: ChatCompletionContentPart[] = [
        { type: 'text', text: promptText },
        ...visionDataUrls.map(
          (dataUrl): ChatCompletionContentPart => ({
            type: 'image_url',
            image_url: { url: dataUrl, detail: 'low' },
          })
        ),
      ];
      try {
        parsed = await openaiPaletteJson(client, visionModel, visionParts);
      } catch (e) {
        console.warn('[OpenAI palette] vision pass failed, retrying text-only:', e instanceof Error ? e.message : e);
      }
    }

    if (!parsed) {
      parsed = await openaiPaletteJson(client, textOnlyModel, [{ type: 'text', text: buildPalettePrompt(context, heuristic, false) }]);
    }

    if (!parsed) return heuristic;

    const pick = (key: keyof ColorPalette): string => {
      const v = parsed![key];
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
