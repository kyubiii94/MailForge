import { z } from 'zod';

/** Types de campagnes autorisés (doit rester aligné avec SfmcCampaignType). */
export const campaignTypeSchema = z.enum([
  'fsrbo',
  'newsletter-crm',
  'newsletter-immobiliere',
  'engagement',
  'vendeurs',
  'acheteurs',
  'journey',
  'trigger',
  'reactivation',
  'lead-nurturing',
  'transactionnel',
  'libre',
]);

export const campaignStatusSchema = z.enum(['draft', 'ready', 'exported']);

/** Création de campagne / brief SeLoger (emails & newsletters uniquement). */
export const createCampaignSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis').max(120, 'Nom trop long'),
  type: campaignTypeSchema,
  brief: z
    .string()
    .max(2000, 'Brief trop long (2000 caractères max)')
    .default('')
    .transform((s) => s.trim()),
});

export const moduleInstanceSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  enabled: z.boolean(),
  props: z.record(z.unknown()),
});

const ampAttributeSchema = z.object({ var: z.string().min(1), attr: z.string().min(1) });
const ampConstantSchema = z.object({ var: z.string().min(1), value: z.string() });
const ampLinkSchema = z.object({ var: z.string().min(1), expression: z.string().min(1) });

export const ampscriptProfileSchema = z.object({
  attributes: z.array(ampAttributeSchema),
  constants: z.array(ampConstantSchema),
  estateTypeLogic: z.boolean(),
  priceFallback: z.boolean(),
  utm: z.boolean(),
  cloudPageUnsubId: z.number().int().nullable(),
  preferenceCenter: z.boolean(),
  geoLookup: z.boolean(),
  links: z.array(ampLinkSchema),
});

/** Configuration d'un email — validée client + serveur (input-validation-first). */
export const emailConfigSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis').max(120),
  sequenceStep: z.string().trim().max(12).default('J0'),
  subject: z.string().trim().min(1, "L'objet est requis").max(200),
  preheader: z.string().max(300).default(''),
  utmTrigger: z.string().trim().min(1, 'Le trigger UTM est requis').max(120),
  footerRef: z.string().trim().min(1).max(40),
  modules: z.array(moduleInstanceSchema),
  ampscript: ampscriptProfileSchema,
  cloudPage: z.boolean().default(false),
});

export const updateEmailSchema = z.object({
  config: emailConfigSchema,
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type EmailConfigInput = z.infer<typeof emailConfigSchema>;
