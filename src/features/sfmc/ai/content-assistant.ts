import { geminiGenerateJson } from '@/lib/ai/gemini';
import { buildContentPrompt, type AiBrief } from './prompt';

export interface AiAdviceSuggestion {
  title: string;
  text: string;
  linkLabel: string;
}

export interface AiContentSuggestion {
  subject: string;
  preheader: string;
  utmTrigger: string;
  heroTitle: string;
  heroText: string;
  ctaLabel: string;
  advice: AiAdviceSuggestion[];
}

const CODE_PATTERNS = /<\/?[a-z][\s\S]*>|%%|AMPscript|CloudPagesURL|RedirectTo|runat=/i;

function sanitize(s: unknown): string {
  const str = typeof s === 'string' ? s : '';
  // Garde-fou : neutralise toute tentative de code renvoyée par l'IA.
  return CODE_PATTERNS.test(str) ? str.replace(/<[^>]*>/g, '').replace(/%%/g, '').trim() : str.trim();
}

/**
 * Assistant de contenu IA : propose des `props` éditoriales structurées.
 * Ne renvoie jamais de code SFMC (double garde-fou : prompt + sanitation).
 */
export async function suggestContent(brief: AiBrief): Promise<AiContentSuggestion> {
  const prompt = buildContentPrompt(brief);
  const raw = await geminiGenerateJson<Partial<AiContentSuggestion>>(prompt, 2048);

  const advice = Array.isArray(raw.advice)
    ? raw.advice.slice(0, 3).map((a) => ({
        title: sanitize(a?.title),
        text: sanitize(a?.text),
        linkLabel: sanitize(a?.linkLabel),
      }))
    : [];

  return {
    subject: sanitize(raw.subject),
    preheader: sanitize(raw.preheader),
    utmTrigger: sanitize(raw.utmTrigger).toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    heroTitle: sanitize(raw.heroTitle),
    heroText: sanitize(raw.heroText),
    ctaLabel: sanitize(raw.ctaLabel),
    advice,
  };
}
