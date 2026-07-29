import { geminiGenerateJson } from '@/lib/ai/gemini';
import { buildContentPrompt, type AiBrief } from './prompt';
import { ARTICLE_LAYOUT_IDS, type ArticleLayout } from '../modules/article';
import {
  getStructureTemplate,
  STRUCTURE_TEMPLATE_IDS,
  type StructureTemplateId,
} from './structure-templates';

export interface AiAdviceSuggestion {
  title: string;
  text: string;
  linkLabel: string;
}

export interface AiArticleSuggestion {
  title: string;
  teaser: string;
  layout: ArticleLayout;
}

export interface AiStructureSuggestion {
  id: StructureTemplateId;
  label: string;
  description: string;
  moduleOrder: string[];
  articleLayout: ArticleLayout;
  rationale: string;
  recommended: boolean;
}

export interface AiContentSuggestion {
  subject: string;
  preheader: string;
  utmTrigger: string;
  heroTitle: string;
  heroText: string;
  ctaLabel: string;
  advice: AiAdviceSuggestion[];
  article: AiArticleSuggestion;
  structures: AiStructureSuggestion[];
  recommendedStructureId: StructureTemplateId | null;
}

const CODE_PATTERNS = /<\/?[a-z][\s\S]*>|%%|AMPscript|CloudPagesURL|RedirectTo|runat=/i;

function sanitize(s: unknown): string {
  const str = typeof s === 'string' ? s : '';
  return CODE_PATTERNS.test(str) ? str.replace(/<[^>]*>/g, '').replace(/%%/g, '').trim() : str.trim();
}

function asLayout(value: unknown, fallback: ArticleLayout = 'horizontal'): ArticleLayout {
  return ARTICLE_LAYOUT_IDS.includes(value as ArticleLayout) ? (value as ArticleLayout) : fallback;
}

function asStructureId(value: unknown): StructureTemplateId | null {
  return STRUCTURE_TEMPLATE_IDS.includes(value as StructureTemplateId)
    ? (value as StructureTemplateId)
    : null;
}

interface RawStructure {
  id?: unknown;
  articleLayout?: unknown;
  rationale?: unknown;
}

interface RawSuggestion {
  subject?: unknown;
  preheader?: unknown;
  utmTrigger?: unknown;
  heroTitle?: unknown;
  heroText?: unknown;
  ctaLabel?: unknown;
  advice?: Array<{ title?: unknown; text?: unknown; linkLabel?: unknown }>;
  article?: { title?: unknown; teaser?: unknown; layout?: unknown };
  structures?: RawStructure[];
  recommendedStructureId?: unknown;
}

/**
 * Assistant de contenu IA : props éditoriales + choix de templates d'affichage.
 * Ne renvoie jamais de code SFMC (double garde-fou : prompt + sanitation + catalogue).
 */
export async function suggestContent(brief: AiBrief): Promise<AiContentSuggestion> {
  const prompt = buildContentPrompt(brief);
  const raw = await geminiGenerateJson<RawSuggestion>(prompt, 4096);

  const advice = Array.isArray(raw.advice)
    ? raw.advice.slice(0, 3).map((a) => ({
        title: sanitize(a?.title),
        text: sanitize(a?.text),
        linkLabel: sanitize(a?.linkLabel),
      }))
    : [];

  const articleLayout = asLayout(raw.article?.layout, 'horizontal');
  const article: AiArticleSuggestion = {
    title: sanitize(raw.article?.title) || 'À lire sur SeLoger',
    teaser: sanitize(raw.article?.teaser),
    layout: articleLayout,
  };

  const recommendedId = asStructureId(raw.recommendedStructureId);
  const seen = new Set<string>();
  const structures: AiStructureSuggestion[] = [];

  for (const item of Array.isArray(raw.structures) ? raw.structures : []) {
    const id = asStructureId(item?.id);
    if (!id || seen.has(id)) continue;
    const tpl = getStructureTemplate(id);
    if (!tpl) continue;
    seen.add(id);
    structures.push({
      id,
      label: tpl.label,
      description: tpl.description,
      moduleOrder: [...tpl.moduleOrder],
      articleLayout: asLayout(item?.articleLayout, tpl.defaultArticleLayout),
      rationale: sanitize(item?.rationale) || tpl.description,
      recommended: id === recommendedId,
    });
    if (structures.length >= 3) break;
  }

  // Complète si l'IA a renvoyé moins de 3 structures valides
  if (structures.length < 3) {
    for (const tpl of [
      getStructureTemplate('hero-cta-article'),
      getStructureTemplate('editorial-story'),
      getStructureTemplate('conseils-plus-article'),
      getStructureTemplate('visuel-impact'),
    ]) {
      if (!tpl || seen.has(tpl.id)) continue;
      structures.push({
        id: tpl.id,
        label: tpl.label,
        description: tpl.description,
        moduleOrder: [...tpl.moduleOrder],
        articleLayout: tpl.defaultArticleLayout,
        rationale: tpl.description,
        recommended: structures.length === 0,
      });
      seen.add(tpl.id);
      if (structures.length >= 3) break;
    }
  }

  if (structures.length && !structures.some((s) => s.recommended)) {
    structures[0].recommended = true;
  }

  return {
    subject: sanitize(raw.subject),
    preheader: sanitize(raw.preheader),
    utmTrigger: sanitize(raw.utmTrigger).toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    heroTitle: sanitize(raw.heroTitle),
    heroText: sanitize(raw.heroText),
    ctaLabel: sanitize(raw.ctaLabel),
    advice,
    article,
    structures,
    recommendedStructureId: structures.find((s) => s.recommended)?.id ?? structures[0]?.id ?? null,
  };
}
