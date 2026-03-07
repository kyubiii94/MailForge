import { z } from 'zod';

export const briefSchema = z.object({
  mode: z.enum(['vague', 'precise']),
  brand: z.string().min(1, 'Le nom de la marque est requis'),
  sector: z.string().optional().default(''),
  positioning: z.string().optional().default(''),
  objective: z.string().min(1, 'L\'objectif est requis'),
  audience: z.string().optional().default(''),
  ambiance: z.string().optional().default(''),
  palette: z.string().optional().default(''),
  siteUrl: z.string().url().optional().or(z.literal('')),
  extraContent: z.string().optional(),
  constraints: z.string().optional(),
});

export const generateTemplatesSchema = z.object({
  selectedTypes: z.array(z.number().min(1).max(8)).min(1, 'Au moins un type de template requis'),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  dna: z.object({
    marque: z.object({
      name: z.string(),
      sector: z.string(),
      positioning: z.string(),
      toneOfVoice: z.string(),
    }),
    objectif: z.string(),
    audience: z.string(),
    designSystem: z.object({
      primaryFont: z.string(),
      secondaryFont: z.string(),
      borderRadius: z.string(),
      spacingSystem: z.string(),
      ctaStyle: z.string(),
    }),
    palette: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string(),
      text: z.string(),
    }),
    contraintes: z.string(),
  }).optional(),
  selectedTemplateTypes: z.array(z.number().min(1).max(8)).optional(),
  status: z.enum(['draft', 'dna_ready', 'generating', 'generated', 'exported']).optional(),
});

export type BriefInput = z.infer<typeof briefSchema>;
export type GenerateTemplatesInput = z.infer<typeof generateTemplatesSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
