import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  real,
} from 'drizzle-orm/pg-core';

// --- Workspaces ---
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().default('default-user'),
  plan: text('plan').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Clients ---
export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sector: text('sector').notNull(),
  positioning: text('positioning').notNull().default(''),
  website: text('website'),
  socialLinks: jsonb('social_links').notNull().default({}),
  distribution: jsonb('distribution').notNull().default([]),
  toneOfVoice: jsonb('tone_of_voice').notNull().default({}),
  technicalPrefs: jsonb('technical_prefs').notNull().default({}),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Brand DNA ---
export const brandDnas = pgTable('brand_dnas', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  siteUrl: text('site_url').notNull(),
  typography: jsonb('typography').notNull().default({}),
  colors: jsonb('colors').notNull().default({}),
  editorialTone: jsonb('editorial_tone').notNull().default({}),
  visualStyle: jsonb('visual_style').notNull().default({}),
  keywords: jsonb('keywords').notNull().default({}),
  isValidated: boolean('is_validated').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Campaigns ---
export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  brandDnaId: text('brand_dna_id').notNull().default(''),
  name: text('name').notNull(),
  trigger: text('trigger'),
  objective: text('objective'),
  period: jsonb('period'),
  status: text('status').notNull().default('draft'),
  textSource: text('text_source'),
  visualSource: text('visual_source'),
  designMode: text('design_mode'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Text Contents ---
export const textContents = pgTable('text_contents', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  version: integer('version').notNull().default(1),
  subject: text('subject').notNull().default(''),
  preheader: text('preheader').notNull().default(''),
  headline: text('headline').notNull().default(''),
  body: text('body').notNull().default(''),
  ctaText: text('cta_text').notNull().default(''),
  ctaUrl: text('cta_url').notNull().default(''),
  sourceType: text('source_type').notNull().default('manual'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Visuals ---
export const visuals = pgTable('visuals', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileKey: text('file_key').notNull().default(''),
  originalFilename: text('original_filename').notNull().default(''),
  width: integer('width').notNull().default(0),
  height: integer('height').notNull().default(0),
  fileSize: integer('file_size').notNull().default(0),
  altText: text('alt_text').notNull().default(''),
  sourceType: text('source_type').notNull().default('uploaded'),
  isSelected: boolean('is_selected').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Email Designs ---
export const emailDesigns = pgTable('email_designs', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  variantNumber: integer('variant_number').notNull().default(1),
  htmlContent: text('html_content').notNull().default(''),
  mjmlSource: text('mjml_source').notNull().default(''),
  thumbnailUrl: text('thumbnail_url').notNull().default(''),
  deliverabilityScore: jsonb('deliverability_score').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
