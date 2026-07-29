/**
 * Module SFMC — CRM Campaign Builder SeLoger (point d'entrée unique).
 * Moteur de rendu déterministe : source de vérité du code Salesforce Marketing Cloud.
 */

// Marque & constantes
export { SELOGER_BRAND, SELOGER_CLIENT, esc, raw, type SelogerBrand } from './brand';

// Types domaine
export type {
  SfmcCampaign,
  SfmcCampaignType,
  SfmcCampaignStatus,
  SfmcEmail,
  SfmcEmailConfig,
  RenderedArtifacts,
  QaResult,
  CampaignTypeInfo,
} from './types';

// Modules
export type {
  ModuleDef,
  ModuleField,
  ModuleInstance,
  RenderContext,
  ModuleRenderResult,
} from './modules/types';
export { MODULE_REGISTRY, ALL_MODULE_DEFS, getModuleDef, renderModuleInstance } from './modules/registry';

// AMPscript
export type { AmpscriptProfile, AmpAttribute, AmpConstant, AmpLink } from './ampscript/profile';
export { buildAmpscriptHeader } from './ampscript/build-header';
export { FSRBO_AMPSCRIPT_PROFILE, SELOGER_BASE_PROFILE, cloneProfile } from './ampscript/seloger-defaults';

// Rendu
export { renderEmail } from './render/render-email';
export { toPreviewHTML } from './render/preview';
export { renderChassis } from './chassis/seloger-chassis';

// QA
export { runChecklist, hasBlockingIssues } from './qa/checklist';

// Presets
export { CAMPAIGN_PRESETS, CAMPAIGN_TYPES, PRESET_CATEGORIES, getPreset, type CampaignPreset } from './presets';
export type { SfmcPresetCategory } from './types';

// Schémas Zod partagés
export {
  createCampaignSchema,
  emailConfigSchema,
  updateEmailSchema,
  campaignTypeSchema,
  campaignStatusSchema,
  moduleInstanceSchema,
  ampscriptProfileSchema,
  type CreateCampaignInput,
  type EmailConfigInput,
} from './schemas/campaign';

// IA (assistant de contenu — jamais de code SFMC)
export { suggestContent, type AiContentSuggestion, type AiAdviceSuggestion, type AiArticleSuggestion, type AiStructureSuggestion } from './ai/content-assistant';
export { type AiBrief } from './ai/prompt';
export { STRUCTURE_TEMPLATES, getStructureTemplate, type StructureTemplate, type StructureTemplateId } from './ai/structure-templates';
export { ARTICLE_LAYOUTS, ARTICLE_LAYOUT_IDS, type ArticleLayout, type ArticleLayoutInfo } from './modules/article';

// Export
export { buildExport, type ExportFormat, type ExportResult } from './export/package';
