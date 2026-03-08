/**
 * Database access layer — Neon PostgreSQL via Drizzle ORM.
 * Exposes the same API as the old in-memory db so all routes continue to work.
 */

import { eq, and, desc, asc } from 'drizzle-orm';
import { getDb, schema } from './db/index';
import type { Campaign, NewsletterTemplate } from '@/types';

// ─── Campaigns ──────────────────────────────────────────────────────────────

export const db = {
  async createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
    const d = getDb();
    const [row] = await d.insert(schema.campaigns).values({
      name: data.name,
      brief: data.brief,
      dna: data.dna,
      status: data.status,
      selectedTemplateTypes: data.selectedTemplateTypes,
    }).returning();
    return rowToCampaign(row);
  },

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const d = getDb();
    const [row] = await d.select().from(schema.campaigns).where(eq(schema.campaigns.id, id)).limit(1);
    return row ? rowToCampaign(row) : undefined;
  },

  async listCampaigns(): Promise<Campaign[]> {
    const d = getDb();
    const rows = await d.select().from(schema.campaigns).orderBy(desc(schema.campaigns.createdAt));
    return rows.map(rowToCampaign);
  },

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined> {
    const d = getDb();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.brief !== undefined) updates.brief = data.brief;
    if (data.dna !== undefined) updates.dna = data.dna;
    if (data.status !== undefined) updates.status = data.status;
    if (data.selectedTemplateTypes !== undefined) updates.selectedTemplateTypes = data.selectedTemplateTypes;

    const [row] = await d.update(schema.campaigns).set(updates).where(eq(schema.campaigns.id, id)).returning();
    return row ? rowToCampaign(row) : undefined;
  },

  // ─── Templates ──────────────────────────────────────────────────────────────

  async createTemplate(data: Omit<NewsletterTemplate, 'id' | 'createdAt'>): Promise<NewsletterTemplate> {
    const d = getDb();
    const [row] = await d.insert(schema.templates).values({
      campaignId: data.campaignId,
      templateNumber: data.templateNumber,
      templateType: data.templateType,
      subjectLine: data.subjectLine,
      previewText: data.previewText,
      layoutDescription: data.layoutDescription,
      designSpecs: data.designSpecs,
      htmlCode: data.htmlCode,
      mjmlCode: data.mjmlCode,
      darkModeOverrides: data.darkModeOverrides,
      accessibilityNotes: data.accessibilityNotes,
      coherenceTips: data.coherenceTips,
    }).returning();
    return rowToTemplate(row);
  },

  async getTemplate(id: string): Promise<NewsletterTemplate | undefined> {
    const d = getDb();
    const [row] = await d.select().from(schema.templates).where(eq(schema.templates.id, id)).limit(1);
    return row ? rowToTemplate(row) : undefined;
  },

  async getTemplateByCampaignAndNumber(campaignId: string, templateNumber: number): Promise<NewsletterTemplate | undefined> {
    const d = getDb();
    const [row] = await d.select().from(schema.templates)
      .where(and(eq(schema.templates.campaignId, campaignId), eq(schema.templates.templateNumber, templateNumber)))
      .limit(1);
    return row ? rowToTemplate(row) : undefined;
  },

  async getTemplatesByCampaign(campaignId: string): Promise<NewsletterTemplate[]> {
    const d = getDb();
    const rows = await d.select().from(schema.templates)
      .where(eq(schema.templates.campaignId, campaignId))
      .orderBy(asc(schema.templates.templateNumber));
    return rows.map(rowToTemplate);
  },

  async updateTemplate(id: string, data: Partial<NewsletterTemplate>): Promise<NewsletterTemplate | undefined> {
    const d = getDb();
    const updates: Record<string, unknown> = {};
    if (data.subjectLine !== undefined) updates.subjectLine = data.subjectLine;
    if (data.previewText !== undefined) updates.previewText = data.previewText;
    if (data.layoutDescription !== undefined) updates.layoutDescription = data.layoutDescription;
    if (data.designSpecs !== undefined) updates.designSpecs = data.designSpecs;
    if (data.htmlCode !== undefined) updates.htmlCode = data.htmlCode;
    if (data.mjmlCode !== undefined) updates.mjmlCode = data.mjmlCode;
    if (data.darkModeOverrides !== undefined) updates.darkModeOverrides = data.darkModeOverrides;
    if (data.accessibilityNotes !== undefined) updates.accessibilityNotes = data.accessibilityNotes;
    if (data.coherenceTips !== undefined) updates.coherenceTips = data.coherenceTips;

    const [row] = await d.update(schema.templates).set(updates).where(eq(schema.templates.id, id)).returning();
    return row ? rowToTemplate(row) : undefined;
  },

  async deleteTemplatesByCampaign(campaignId: string): Promise<void> {
    const d = getDb();
    await d.delete(schema.templates).where(eq(schema.templates.campaignId, campaignId));
  },
};

// ─── Row mappers ──────────────────────────────────────────────────────────────

type CampaignRow = typeof schema.campaigns.$inferSelect;
type TemplateRow = typeof schema.templates.$inferSelect;

function rowToCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    name: r.name,
    brief: r.brief,
    dna: r.dna,
    status: r.status as Campaign['status'],
    selectedTemplateTypes: r.selectedTemplateTypes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function rowToTemplate(r: TemplateRow): NewsletterTemplate {
  return {
    id: r.id,
    campaignId: r.campaignId,
    templateNumber: r.templateNumber,
    templateType: r.templateType,
    subjectLine: r.subjectLine,
    previewText: r.previewText,
    layoutDescription: r.layoutDescription,
    designSpecs: r.designSpecs,
    htmlCode: r.htmlCode,
    mjmlCode: r.mjmlCode,
    darkModeOverrides: r.darkModeOverrides,
    accessibilityNotes: r.accessibilityNotes,
    coherenceTips: r.coherenceTips,
    createdAt: r.createdAt.toISOString(),
  };
}
