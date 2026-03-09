# Skills MailForge

Ce dossier contient les **skills** utilisées par MailForge pour la génération de campagnes newsletter et le respect de l’accessibilité.

## Fichiers

| Fichier | Description |
|--------|-------------|
| `newsletter-campaign.skill` | Campagnes newsletter complètes : brief, ADN, 8 types d’emails, design system, code HTML/MJML. |
| `accessibility-newsletter.skill` | Règles d’accessibilité (WCAG AA / Charte État) : contrastes, typo, images, structure, liens, dark mode, footer. |

Les fichiers `.skill` sont des archives ZIP contenant un `SKILL.md` (format Cursor/Agent).

## Intégration dans le projet

- **newsletter-campaign**  
  Intégrée via :
  - `src/lib/constants.ts` : `TEMPLATE_TYPES` (8 types), `AMBIANCE_VOCABULARY`
  - `src/lib/ai/prompts.ts` : brief, ADN, master template, templates individuels, règles HTML email

- **accessibility-newsletter**  
  Intégrée via :
  - `src/lib/ai/skills/accessibility-newsletter.ts` : règles d’accessibilité (texte injecté dans les prompts)
  - `src/lib/ai/prompts.ts` : `buildMasterTemplatePrompt` et `buildTemplatePrompt` incluent ces règles à chaque génération

Toute génération de template (master ou par type) applique donc à la fois le process campagne (newsletter-campaign) et les règles d’accessibilité (accessibility-newsletter).
