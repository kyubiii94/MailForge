import type { SfmcCampaignType } from '../types';
import { ARTICLE_LAYOUTS } from '../modules/article';
import { STRUCTURE_TEMPLATES } from './structure-templates';

export interface AiBrief {
  campaignType: SfmcCampaignType;
  campaignName: string;
  emailName: string;
  /** Brief saisi à la création (contexte SeLoger). */
  campaignBrief: string;
  instructions: string;
}

/**
 * Prompt de l'assistant de contenu CRM SeLoger.
 * RÈGLE ABSOLUE : l'IA ne produit QUE du contenu éditorial + des choix de templates
 * parmi un catalogue figé. Elle ne génère JAMAIS de HTML / AMPscript / SFMC.
 */
export function buildContentPrompt(brief: AiBrief): string {
  const editorial =
    [brief.campaignBrief, brief.instructions].filter((s) => s && s.trim()).join('\n\n') ||
    '(aucune précision : propose un contenu pertinent pour ce type d’email SeLoger)';

  const layoutsCatalog = ARTICLE_LAYOUTS.map(
    (l) => `- "${l.id}" : ${l.label} — ${l.description}`
  ).join('\n');

  const structuresCatalog = STRUCTURE_TEMPLATES.map(
    (t) =>
      `- "${t.id}" : ${t.label} — ${t.description} (modules: ${t.moduleOrder.join(' → ')}, layout article: ${t.defaultArticleLayout})`
  ).join('\n');

  return `Tu es un concepteur-rédacteur ET directeur artistique CRM pour SeLoger (immobilier, France, B2C).
Tu proposes UNIQUEMENT du contenu éditorial + des choix de templates d'affichage, jamais de code.

INTERDICTIONS ABSOLUES :
- Ne génère AUCUN code HTML, AMPscript, SSJS, CSS ou balise.
- N'invente pas de variables techniques ni de liens de tracking.
- Ne propose pas de contenu pour une autre marque que SeLoger.
- Ne crée PAS de layout ou de structure hors catalogue : utilise UNIQUEMENT les ids listés.
- Retourne STRICTEMENT un objet JSON valide, sans texte autour, sans balises markdown.

CONTEXTE :
- Marque : SeLoger uniquement
- Type d'envoi : ${brief.campaignType}
- Nom de la campagne : ${brief.campaignName}
- Email concerné : ${brief.emailName}
- Brief éditorial : ${editorial}

CATALOGUE — templates d'affichage article (champ article.layout) :
${layoutsCatalog}

CATALOGUE — structures d'email (champ structures[].id) :
${structuresCatalog}

MISSION — sois FORCE DE PROPOSITION :
1. Propose un contenu éditorial complet (objet, hero, CTA, conseils, ARTICLE DE BLOG).
2. Propose EXACTEMENT 3 structures différentes (ids du catalogue), classées de la plus recommandée à la plus alternative, avec une justification courte.
3. Pour chaque structure, indique le layout article le plus adapté (id du catalogue layouts).
4. Le bloc article est OBLIGATOIRE dans ta réponse (title + teaser accrocheurs, ton SeLoger).

Réponds avec cet objet JSON exact :
{
  "subject": "objet de l'email (max 80 caractères, accrocheur)",
  "preheader": "pré-header (max 120 caractères)",
  "utmTrigger": "identifiant court en minuscules, tirets/underscores uniquement",
  "heroTitle": "titre principal court",
  "heroText": "1 à 2 phrases d'introduction",
  "ctaLabel": "libellé du bouton principal (max 30 caractères)",
  "advice": [
    { "title": "titre du conseil", "text": "1 phrase", "linkLabel": "libellé du lien" }
  ],
  "article": {
    "title": "titre de l'article de blog (max 90 caractères)",
    "teaser": "teaser 1 à 2 phrases qui donne envie de lire",
    "layout": "horizontal"
  },
  "structures": [
    {
      "id": "hero-cta-article",
      "articleLayout": "horizontal",
      "rationale": "Pourquoi cette structure convient (1 phrase)"
    }
  ],
  "recommendedStructureId": "hero-cta-article"
}

Contraintes :
- Ton : clair, rassurant, orienté action, sans jargon.
- "advice" : 0 à 3 éléments.
- "structures" : exactement 3 objets, ids DISTINCTS issus du catalogue.
- "article.layout" et "structures[].articleLayout" ∈ ids du catalogue layouts.
- "recommendedStructureId" doit être l'un des 3 ids proposés.
- Contexte immobilier SeLoger (estimation, vente, achat, agences, marché).`;
}
