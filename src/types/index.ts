/** Core domain types for MailForge AI */

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface BrandDNA {
  id: string;
  workspaceId: string;
  siteUrl: string;
  typography: Typography;
  colors: ColorPalette;
  editorialTone: EditorialTone;
  visualStyle: VisualStyle;
  keywords: Keywords;
  isValidated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Typography {
  families: string[];
  weights: string[];
  headingFont: string;
  bodyFont: string;
  sizes: {
    h1: string;
    h2: string;
    body: string;
  };
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface EditorialTone {
  tone: string;
  style_notes: string;
  formality_level: number;
  energy_level: number;
}

export interface VisualStyle {
  visualStyle: string;
  imageTypes: string[];
  textImageRatio: string;
}

export interface Keywords {
  keywords: string[];
  slogans: string[];
  lexicalFields: string[];
}

export interface Campaign {
  id: string;
  workspaceId: string;
  brandDnaId: string;
  name: string;
  status: 'draft' | 'generating' | 'review' | 'exported';
  textSource: 'direct' | 'ai_improved' | 'url_extracted' | null;
  visualSource: 'uploaded' | 'ai_generated' | 'url_extracted' | null;
  designMode: 'ai_generated' | 'template_based' | null;
  createdAt: string;
}

export interface TextContent {
  id: string;
  campaignId: string;
  version: number;
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  sourceType: 'manual' | 'ai' | 'scraped';
  createdAt: string;
}

export interface Visual {
  id: string;
  campaignId: string;
  fileUrl: string;
  fileKey: string;
  originalFilename: string;
  width: number;
  height: number;
  fileSize: number;
  altText: string;
  sourceType: 'uploaded' | 'ai_generated' | 'scraped';
  isSelected: boolean;
  createdAt: string;
}

export interface EmailDesign {
  id: string;
  campaignId: string;
  variantNumber: number;
  htmlContent: string;
  mjmlSource: string;
  thumbnailUrl: string;
  deliverabilityScore: DeliverabilityScore;
  createdAt: string;
}

export interface DeliverabilityScore {
  spamScore: number;
  textImageRatio: number;
  subjectLength: number;
  overallScore: number;
}

export type TextSourceOption = 'direct' | 'ai_improved' | 'url_extracted';
export type VisualSourceOption = 'uploaded' | 'ai_generated' | 'url_extracted';
export type DesignModeOption = 'ai_generated' | 'template_based';
