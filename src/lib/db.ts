/**
 * Database access layer — Neon PostgreSQL via Drizzle ORM.
 * Exposes the same API as the old in-memory db so all routes continue to work.
 */

import { eq, and, desc, asc } from 'drizzle-orm';
import { getDb, schema } from './db/index';
import type { Campaign, NewsletterTemplate, Client } from '@/types';
import { WORKSPACE_ID } from './constants';

// ─── Clients ────────────────────────────────────────────────────────────────

export const db = {
  async createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const d = getDb();
    const [row] = await d.insert(schema.clients).values({
      workspaceId: data.workspaceId ?? WORKSPACE_ID,
      name: data.name,
      sector: data.sector ?? '',
      positioning: data.positioning ?? '',
      website: data.website ?? null,
      socialLinks: data.socialLinks ?? {},
      distribution: data.distribution ?? [],
      toneOfVoice: data.toneOfVoice ?? { style: '', language: [], do: [], dont: [] },
      technicalPrefs: data.technicalPrefs ?? { esp: null, mergeTagsFormat: '', darkMode: false, languages: [] },
      notes: data.notes ?? '',
    }).returning();
    return rowToClient(row);
  },

  async getClient(id: string): Promise<Client | undefined> {
    const d = getDb();
    const [row] = await d.select().from(schema.clients).where(eq(schema.clients.id, id)).limit(1);
    return row ? rowToClient(row) : undefined;
  },

  async listClients(): Promise<Client[]> {
    const d = getDb();
    const rows = await d.select().from(schema.clients).orderBy(desc(schema.clients.createdAt));
    return rows.map(rowToClient);
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client | undefined> {
    const d = getDb();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.sector !== undefined) updates.sector = data.sector;
    if (data.positioning !== undefined) updates.positioning = data.positioning;
    if (data.website !== undefined) updates.website = data.website;
    if (data.socialLinks !== undefined) updates.socialLinks = data.socialLinks;
    if (data.distribution !== undefined) updates.distribution = data.distribution;
    if (data.toneOfVoice !== undefined) updates.toneOfVoice = data.toneOfVoice;
    if (data.technicalPrefs !== undefined) updates.technicalPrefs = data.technicalPrefs;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.siteAnalysis !== undefined) updates.siteAnalysis = data.siteAnalysis;

    const [row] = await d.update(schema.clients).set(updates).where(eq(schema.clients.id, id)).returning();
    return row ? rowToClient(row) : undefined;
  },

  async deleteClient(id: string): Promise<void> {
    const d = getDb();
    await d.update(schema.campaigns).set({ clientId: null }).where(eq(schema.campaigns.clientId, id));
    await d.delete(schema.clients).where(eq(schema.clients.id, id));
  },

  // ─── Campaigns ──────────────────────────────────────────────────────────────

  async createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
    const d = getDb();
    const [row] = await d.insert(schema.campaigns).values({
      clientId: data.clientId ?? null,
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

  async listCampaignsByClient(clientId: string): Promise<Campaign[]> {
    const d = getDb();
    const rows = await d.select().from(schema.campaigns)
      .where(eq(schema.campaigns.clientId, clientId))
      .orderBy(desc(schema.campaigns.createdAt));
    return rows.map(rowToCampaign);
  },

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined> {
    const d = getDb();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.clientId !== undefined) updates.clientId = data.clientId;
    if (data.name !== undefined) updates.name = data.name;
    if (data.brief !== undefined) updates.brief = data.brief;
    if (data.dna !== undefined) updates.dna = data.dna;
    if (data.status !== undefined) updates.status = data.status;
    if (data.selectedTemplateTypes !== undefined) updates.selectedTemplateTypes = data.selectedTemplateTypes;

    const [row] = await d.update(schema.campaigns).set(updates).where(eq(schema.campaigns.id, id)).returning();
    return row ? rowToCampaign(row) : undefined;
  },

  async deleteCampaign(id: string): Promise<void> {
    const d = getDb();
    await d.delete(schema.templates).where(eq(schema.templates.campaignId, id));
    await d.delete(schema.campaigns).where(eq(schema.campaigns.id, id));
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
    const normalizedId = typeof id === 'string' ? id.trim().toLowerCase() : id;
    const [row] = await d.select().from(schema.templates).where(eq(schema.templates.id, normalizedId)).limit(1);
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

type ClientRow = typeof schema.clients.$inferSelect;
type CampaignRow = typeof schema.campaigns.$inferSelect;
type TemplateRow = typeof schema.templates.$inferSelect;

function rowToClient(r: ClientRow): Client {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    name: r.name,
    sector: r.sector,
    positioning: r.positioning,
    website: r.website,
    socialLinks: (r.socialLinks as Client['socialLinks']) ?? {},
    distribution: (r.distribution as string[]) ?? [],
    toneOfVoice: (r.toneOfVoice as Client['toneOfVoice']) ?? { style: '', language: [], do: [], dont: [] },
    technicalPrefs: (r.technicalPrefs as Client['technicalPrefs']) ?? { esp: null, mergeTagsFormat: '', darkMode: false, languages: [] },
    notes: r.notes,
    siteAnalysis: (r.siteAnalysis as Client['siteAnalysis']) ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function rowToCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    clientId: r.clientId,
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
