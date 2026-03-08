import { z } from 'zod';

/** Validation schemas for API requests */

export const extractBrandDNASchema = z.object({
  siteUrl: z.string().url('Please enter a valid URL'),
  workspaceId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
});

export const updateBrandDNASchema = z.object({
  typography: z.object({
    families: z.array(z.string()),
    weights: z.array(z.string()),
    headingFont: z.string(),
    bodyFont: z.string(),
    sizes: z.object({
      h1: z.string(),
      h2: z.string(),
      body: z.string(),
    }),
  }).optional(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
  }).optional(),
  editorialTone: z.object({
    tone: z.string(),
    style_notes: z.string(),
    formality_level: z.number().min(1).max(10),
    energy_level: z.number().min(1).max(10),
  }).optional(),
  visualStyle: z.object({
    visualStyle: z.string(),
    imageTypes: z.array(z.string()),
    textImageRatio: z.string(),
  }).optional(),
  keywords: z.object({
    keywords: z.array(z.string()),
    slogans: z.array(z.string()),
    lexicalFields: z.array(z.string()),
  }).optional(),
  isValidated: z.boolean().optional(),
});

export const improveTextSchema = z.object({
  draft: z.string().min(1, 'Draft text is required'),
  brandDnaId: z.string().uuid(),
  campaignId: z.string().uuid(),
  campaignGoal: z.string().min(1, 'Campaign goal is required'),
  desiredCTA: z.string().optional().default(''),
  targetLength: z.number().min(50).max(2000).optional().default(300),
  tone: z.string().optional(),
});

export const parseTextSchema = z.object({
  text: z.string().min(1, 'Text content is required'),
  campaignId: z.string().uuid(),
});

export const extractTextFromUrlSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  campaignId: z.string().uuid(),
});

export const generateDesignSchema = z.object({
  campaignId: z.string().uuid(),
  brandDnaId: z.string().uuid(),
  textContentId: z.string().uuid(),
  visualIds: z.array(z.string().uuid()).optional().default([]),
  variants: z.number().min(1).max(3).optional().default(2),
});

export const createCampaignSchema = z.object({
  workspaceId: z.string().uuid(),
  clientId: z.string().uuid(),
  brandDnaId: z.string().uuid(),
  name: z.string().min(1, 'Campaign name is required').max(255),
  trigger: z.string().max(500).optional(),
  objective: z.string().max(500).optional(),
  period: z.object({
    start: z.string().nullable().default(null),
    end: z.string().nullable().default(null),
    frequency: z.string().nullable().default(null),
  }).optional(),
});

export const createClientSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1, 'Client name is required').max(255),
  sector: z.string().min(1).max(255),
  positioning: z.string().max(500).optional().default(''),
  website: z.string().url().nullable().optional().default(null),
  socialLinks: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    linkedin: z.string().optional(),
    pinterest: z.string().optional(),
  }).optional().default({}),
  distribution: z.array(z.string()).optional().default([]),
  toneOfVoice: z.object({
    style: z.string(),
    language: z.array(z.string()).default(['fr']),
    do: z.array(z.string()).default([]),
    dont: z.array(z.string()).default([]),
  }).optional(),
  technicalPrefs: z.object({
    esp: z.enum(['mailchimp', 'klaviyo', 'brevo', 'other']).nullable().default(null),
    mergeTagsFormat: z.string().default('*|TAG|*'),
    darkMode: z.boolean().default(true),
    languages: z.array(z.string()).default(['fr']),
  }).optional(),
  notes: z.string().max(2000).optional().default(''),
});

export const updateClientSchema = createClientSchema.partial().omit({ workspaceId: true });

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(255),
});

export type ExtractBrandDNAInput = z.infer<typeof extractBrandDNASchema>;
export type UpdateBrandDNAInput = z.infer<typeof updateBrandDNASchema>;
export type ImproveTextInput = z.infer<typeof improveTextSchema>;
export type ParseTextInput = z.infer<typeof parseTextSchema>;
export type ExtractTextFromUrlInput = z.infer<typeof extractTextFromUrlSchema>;
export type GenerateDesignInput = z.infer<typeof generateDesignSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
