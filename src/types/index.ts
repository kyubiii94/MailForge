/** Core domain types for MailForge — Newsletter Campaign Platform */

// ─── Client ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
  sector: string;
  positioning: string;
  website: string | null;
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    pinterest?: string;
  };
  distribution: string[];
  toneOfVoice: {
    style: string;
    language: string[];
    do: string[];
    dont: string[];
  };
  technicalPrefs: {
    esp: 'mailchimp' | 'klaviyo' | 'brevo' | 'other' | null;
    mergeTagsFormat: string;
    darkMode: boolean;
    languages: string[];
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Brief ────────────────────────────────────────────────────────────────────

export type BriefMode = 'vague' | 'precise';

export interface CampaignBrief {
  mode: BriefMode;
  brand: string;
  sector: string;
  positioning: string;
  objective: string;
  audience: string;
  ambiance: string;
  palette: string;
  siteUrl?: string;
  extraContent?: string;
  constraints?: string;
}

// ─── Campaign DNA (6 points de la Skill) ──────────────────────────────────────

export interface CampaignDNA {
  marque: { name: string; sector: string; positioning: string; toneOfVoice: string };
  objectif: string;
  audience: string;
  designSystem: {
    primaryFont: string;
    secondaryFont: string;
    borderRadius: string;
    spacingSystem: string;
    ctaStyle: string;
  };
  palette: ColorPalette;
  contraintes: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'dna_ready' | 'generating' | 'generated' | 'exported';

export interface Campaign {
  id: string;
  clientId: string | null;
  name: string;
  brief: CampaignBrief;
  dna: CampaignDNA;
  status: CampaignStatus;
  selectedTemplateTypes: number[];
  createdAt: string;
  updatedAt: string;
}

// ─── Newsletter Template ──────────────────────────────────────────────────────

export interface LayoutDescription {
  structure: string;
  heroSection: string;
  bodySections: string;
  ctaSection: string;
  footer: string;
}

export interface DesignSpecs {
  width: string;
  backgroundColor: string;
  fontStack: string;
  headingStyle: string;
  bodyStyle: string;
  ctaStyle: string;
  spacing: string;
  borderRadius: string;
  imageTreatment: string;
}

export interface NewsletterTemplate {
  id: string;
  campaignId: string;
  templateNumber: number;
  templateType: string;
  subjectLine: string;
  previewText: string;
  layoutDescription: LayoutDescription;
  designSpecs: DesignSpecs;
  htmlCode: string;
  mjmlCode: string;
  darkModeOverrides: string;
  accessibilityNotes: string;
  coherenceTips: string;
  createdAt: string;
}

// ─── Deliverability Score ─────────────────────────────────────────────────────

export interface DeliverabilityScore {
  spamScore: number;
  textImageRatio: number;
  subjectLength: number;
  overallScore: number;
}

// ─── Workspace (simplified) ───────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

// ─── Template type definitions (constant) ─────────────────────────────────────

export interface TemplateTypeInfo {
  number: number;
  type: string;
  objective: string;
  icon: string;
}
