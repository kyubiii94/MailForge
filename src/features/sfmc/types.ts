import type { ModuleInstance } from './modules/types';
import type { AmpscriptProfile } from './ampscript/profile';

/** Types de campagnes CRM SeLoger (presets). */
export type SfmcCampaignType =
  | 'fsrbo'
  | 'newsletter-crm'
  | 'newsletter-immobiliere'
  | 'engagement'
  | 'vendeurs'
  | 'acheteurs'
  | 'journey'
  | 'trigger'
  | 'reactivation'
  | 'lead-nurturing'
  | 'transactionnel'
  | 'libre';

export type SfmcCampaignStatus = 'draft' | 'ready' | 'exported';

/** Configuration éditable d'un email SFMC. */
export interface SfmcEmailConfig {
  name: string;
  /** Étape de séquence (ex. "J1", "J20"). */
  sequenceStep: string;
  subject: string;
  preheader: string;
  /** Code utm_content / trigger. */
  utmTrigger: string;
  /** Référence campagne footer (ex. "FSRBO"). */
  footerRef: string;
  modules: ModuleInstance[];
  ampscript: AmpscriptProfile;
  /** Générer aussi les artefacts CloudPage + SSJS. */
  cloudPage: boolean;
}

export interface QaResult {
  ok: boolean;
  label: string;
  detail: string;
}

/** Artefacts SFMC produits par le renderer déterministe. */
export interface RenderedArtifacts {
  /** HTML du châssis seul (avec tokens AMPscript). */
  html: string;
  /** Bloc AMPscript (header). */
  ampscript: string;
  /** Script SSJS (CloudPage / lookups). */
  ssjs: string;
  /** HTML CloudPage (landing). */
  cloudPage: string;
  /** Package complet copier-coller (AMPscript + HTML). */
  package: string;
  /** HTML preview avec tokens substitués. */
  preview: string;
  qa: QaResult[];
}

export interface SfmcEmail {
  id: string;
  campaignId: string;
  config: SfmcEmailConfig;
  rendered: RenderedArtifacts;
  createdAt: string;
  updatedAt: string;
}

export type SfmcPresetCategory = 'newsletter' | 'email' | 'parcours';

export interface SfmcCampaign {
  id: string;
  name: string;
  type: SfmcCampaignType;
  status: SfmcCampaignStatus;
  /** Brief éditorial saisi à la création (contenu SeLoger uniquement). */
  brief: string;
  createdAt: string;
  updatedAt: string;
}

/** Métadonnées d'un type de campagne (UI + preset). */
export interface CampaignTypeInfo {
  type: SfmcCampaignType;
  label: string;
  description: string;
  icon: string;
  /** Famille UI : newsletter, email CRM, ou parcours multi-emails. */
  category: SfmcPresetCategory;
}
