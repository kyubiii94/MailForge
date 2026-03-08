import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import type { CampaignBrief, CampaignDNA, LayoutDescription, DesignSpecs, Client } from '@/types';

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: text('workspace_id').notNull().default('00000000-0000-0000-0000-000000000001'),
  name: text('name').notNull(),
  sector: text('sector').notNull().default(''),
  positioning: text('positioning').notNull().default(''),
  website: text('website'),
  socialLinks: jsonb('social_links').$type<Client['socialLinks']>().notNull().default({}),
  distribution: jsonb('distribution').$type<string[]>().notNull().default([]),
  toneOfVoice: jsonb('tone_of_voice').$type<Client['toneOfVoice']>().notNull().default({ style: '', language: [], do: [], dont: [] }),
  technicalPrefs: jsonb('technical_prefs').$type<Client['technicalPrefs']>().notNull().default({ esp: null, mergeTagsFormat: '', darkMode: false, languages: [] }),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  brief: jsonb('brief').$type<CampaignBrief>().notNull(),
  dna: jsonb('dna').$type<CampaignDNA>().notNull(),
  status: text('status').notNull().default('draft'),
  selectedTemplateTypes: jsonb('selected_template_types').$type<number[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  templateNumber: integer('template_number').notNull(),
  templateType: text('template_type').notNull(),
  subjectLine: text('subject_line').notNull().default(''),
  previewText: text('preview_text').notNull().default(''),
  layoutDescription: jsonb('layout_description').$type<LayoutDescription>().notNull(),
  designSpecs: jsonb('design_specs').$type<DesignSpecs>().notNull(),
  htmlCode: text('html_code').notNull().default(''),
  mjmlCode: text('mjml_code').notNull().default(''),
  darkModeOverrides: text('dark_mode_overrides').notNull().default(''),
  accessibilityNotes: text('accessibility_notes').notNull().default(''),
  coherenceTips: text('coherence_tips').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
