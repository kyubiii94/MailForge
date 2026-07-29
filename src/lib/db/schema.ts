import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import type { SfmcEmailConfig, RenderedArtifacts } from '@/features/sfmc';

/** Comptes d'accès à la plateforme (Auth.js, credentials). */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull().default(''),
  role: text('role').notNull().default('admin'), // 'admin' | 'editor'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Campagnes CRM SeLoger (client unique — emails & newsletters uniquement). */
export const sfmcCampaigns = pgTable('sfmc_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('libre'),
  status: text('status').notNull().default('draft'), // draft | ready | exported
  brief: text('brief').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Emails d'une campagne (plusieurs par campagne pour les Journeys). */
export const sfmcEmails = pgTable('sfmc_emails', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull().references(() => sfmcCampaigns.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  config: jsonb('config').$type<SfmcEmailConfig>().notNull(),
  rendered: jsonb('rendered').$type<RenderedArtifacts>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
