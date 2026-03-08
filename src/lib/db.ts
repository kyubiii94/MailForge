/**
 * Database layer backed by Neon PostgreSQL via Drizzle ORM.
 * Maintains the same API surface as the previous in-memory implementation
 * so all API routes work unchanged.
 */

import { eq, desc, asc } from 'drizzle-orm';
import { getDb } from './drizzle';
import * as schema from './schema';
import type {
  Workspace,
  Client,
  BrandDNA,
  Campaign,
  TextContent,
  Visual,
  EmailDesign,
} from '@/types';
import { generateId } from './utils';

// Helper: convert DB row timestamps to ISO strings for API compatibility
function toIso(d: Date | null): string {
  return d ? d.toISOString() : new Date().toISOString();
}

// Helper: map a workspace row to the Workspace type
function mapWorkspace(row: typeof schema.workspaces.$inferSelect): Workspace {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    plan: row.plan as Workspace['plan'],
    createdAt: toIso(row.createdAt),
  };
}

function mapClient(row: typeof schema.clients.$inferSelect): Client {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    sector: row.sector,
    positioning: row.positioning,
    website: row.website,
    socialLinks: (row.socialLinks ?? {}) as Client['socialLinks'],
    distribution: (row.distribution ?? []) as string[],
    toneOfVoice: (row.toneOfVoice ?? { style: '', language: [], do: [], dont: [] }) as Client['toneOfVoice'],
    technicalPrefs: (row.technicalPrefs ?? { esp: null, mergeTagsFormat: '', darkMode: true, languages: [] }) as Client['technicalPrefs'],
    notes: row.notes,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapBrandDNA(row: typeof schema.brandDnas.$inferSelect): BrandDNA {
  return {
    id: row.id,
    clientId: row.clientId,
    workspaceId: row.workspaceId,
    siteUrl: row.siteUrl,
    typography: row.typography as BrandDNA['typography'],
    colors: row.colors as BrandDNA['colors'],
    editorialTone: row.editorialTone as BrandDNA['editorialTone'],
    visualStyle: row.visualStyle as BrandDNA['visualStyle'],
    keywords: row.keywords as BrandDNA['keywords'],
    isValidated: row.isValidated,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function mapCampaign(row: typeof schema.campaigns.$inferSelect): Campaign {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    clientId: row.clientId,
    brandDnaId: row.brandDnaId,
    name: row.name,
    trigger: row.trigger,
    objective: row.objective,
    period: row.period as Campaign['period'],
    status: row.status as Campaign['status'],
    textSource: row.textSource as Campaign['textSource'],
    visualSource: row.visualSource as Campaign['visualSource'],
    designMode: row.designMode as Campaign['designMode'],
    createdAt: toIso(row.createdAt),
  };
}

function mapTextContent(row: typeof schema.textContents.$inferSelect): TextContent {
  return {
    id: row.id,
    campaignId: row.campaignId,
    version: row.version,
    subject: row.subject,
    preheader: row.preheader,
    headline: row.headline,
    body: row.body,
    ctaText: row.ctaText,
    ctaUrl: row.ctaUrl,
    sourceType: row.sourceType as TextContent['sourceType'],
    createdAt: toIso(row.createdAt),
  };
}

function mapVisual(row: typeof schema.visuals.$inferSelect): Visual {
  return {
    id: row.id,
    campaignId: row.campaignId,
    fileUrl: row.fileUrl,
    fileKey: row.fileKey,
    originalFilename: row.originalFilename,
    width: row.width,
    height: row.height,
    fileSize: row.fileSize,
    altText: row.altText,
    sourceType: row.sourceType as Visual['sourceType'],
    isSelected: row.isSelected,
    createdAt: toIso(row.createdAt),
  };
}

function mapEmailDesign(row: typeof schema.emailDesigns.$inferSelect): EmailDesign {
  return {
    id: row.id,
    campaignId: row.campaignId,
    variantNumber: row.variantNumber,
    htmlContent: row.htmlContent,
    mjmlSource: row.mjmlSource,
    thumbnailUrl: row.thumbnailUrl,
    deliverabilityScore: row.deliverabilityScore as EmailDesign['deliverabilityScore'],
    createdAt: toIso(row.createdAt),
  };
}

// ============================================================
// Database class with the same method signatures as InMemoryDB
// ============================================================

class NeonDB {
  // --- Workspaces ---
  async createWorkspace(name: string, ownerId: string = 'default-user'): Promise<Workspace> {
    const id = generateId();
    const [row] = await getDb().insert(schema.workspaces).values({
      id,
      name,
      ownerId,
      plan: 'free',
    }).returning();
    return mapWorkspace(row);
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [row] = await getDb().select().from(schema.workspaces).where(eq(schema.workspaces.id, id));
    return row ? mapWorkspace(row) : undefined;
  }

  async listWorkspaces(): Promise<Workspace[]> {
    const rows = await getDb().select().from(schema.workspaces);
    return rows.map(mapWorkspace);
  }

  // --- Clients ---
  async createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const id = generateId();
    const [row] = await getDb().insert(schema.clients).values({
      id,
      workspaceId: data.workspaceId,
      name: data.name,
      sector: data.sector,
      positioning: data.positioning,
      website: data.website,
      socialLinks: data.socialLinks,
      distribution: data.distribution,
      toneOfVoice: data.toneOfVoice,
      technicalPrefs: data.technicalPrefs,
      notes: data.notes,
    }).returning();
    return mapClient(row);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [row] = await getDb().select().from(schema.clients).where(eq(schema.clients.id, id));
    return row ? mapClient(row) : undefined;
  }

  async listClients(workspaceId: string): Promise<Client[]> {
    const rows = await getDb().select().from(schema.clients).where(eq(schema.clients.workspaceId, workspaceId));
    return rows.map(mapClient);
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sector !== undefined) updateData.sector = data.sector;
    if (data.positioning !== undefined) updateData.positioning = data.positioning;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
    if (data.distribution !== undefined) updateData.distribution = data.distribution;
    if (data.toneOfVoice !== undefined) updateData.toneOfVoice = data.toneOfVoice;
    if (data.technicalPrefs !== undefined) updateData.technicalPrefs = data.technicalPrefs;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [row] = await getDb().update(schema.clients).set(updateData).where(eq(schema.clients.id, id)).returning();
    return row ? mapClient(row) : undefined;
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await getDb().delete(schema.clients).where(eq(schema.clients.id, id)).returning();
    return result.length > 0;
  }

  // --- Brand DNA ---
  async createBrandDNA(data: Omit<BrandDNA, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandDNA> {
    const id = generateId();
    const [row] = await getDb().insert(schema.brandDnas).values({
      id,
      clientId: data.clientId,
      workspaceId: data.workspaceId,
      siteUrl: data.siteUrl,
      typography: data.typography,
      colors: data.colors,
      editorialTone: data.editorialTone,
      visualStyle: data.visualStyle,
      keywords: data.keywords,
      isValidated: data.isValidated,
    }).returning();
    return mapBrandDNA(row);
  }

  async getBrandDNA(id: string): Promise<BrandDNA | undefined> {
    const [row] = await getDb().select().from(schema.brandDnas).where(eq(schema.brandDnas.id, id));
    return row ? mapBrandDNA(row) : undefined;
  }

  async getBrandDNAByWorkspace(workspaceId: string): Promise<BrandDNA | undefined> {
    const [row] = await getDb().select().from(schema.brandDnas).where(eq(schema.brandDnas.workspaceId, workspaceId));
    return row ? mapBrandDNA(row) : undefined;
  }

  async getBrandDNAByClient(clientId: string): Promise<BrandDNA | undefined> {
    const [row] = await getDb().select().from(schema.brandDnas).where(eq(schema.brandDnas.clientId, clientId));
    return row ? mapBrandDNA(row) : undefined;
  }

  async updateBrandDNA(id: string, data: Partial<BrandDNA>): Promise<BrandDNA | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.siteUrl !== undefined) updateData.siteUrl = data.siteUrl;
    if (data.typography !== undefined) updateData.typography = data.typography;
    if (data.colors !== undefined) updateData.colors = data.colors;
    if (data.editorialTone !== undefined) updateData.editorialTone = data.editorialTone;
    if (data.visualStyle !== undefined) updateData.visualStyle = data.visualStyle;
    if (data.keywords !== undefined) updateData.keywords = data.keywords;
    if (data.isValidated !== undefined) updateData.isValidated = data.isValidated;

    const [row] = await getDb().update(schema.brandDnas).set(updateData).where(eq(schema.brandDnas.id, id)).returning();
    return row ? mapBrandDNA(row) : undefined;
  }

  // --- Campaigns ---
  async createCampaign(data: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> {
    const id = generateId();
    const [row] = await getDb().insert(schema.campaigns).values({
      id,
      workspaceId: data.workspaceId,
      clientId: data.clientId,
      brandDnaId: data.brandDnaId,
      name: data.name,
      trigger: data.trigger,
      objective: data.objective,
      period: data.period,
      status: data.status,
      textSource: data.textSource,
      visualSource: data.visualSource,
      designMode: data.designMode,
    }).returning();
    return mapCampaign(row);
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [row] = await getDb().select().from(schema.campaigns).where(eq(schema.campaigns.id, id));
    return row ? mapCampaign(row) : undefined;
  }

  async listCampaigns(workspaceId: string): Promise<Campaign[]> {
    const rows = await getDb().select().from(schema.campaigns).where(eq(schema.campaigns.workspaceId, workspaceId));
    return rows.map(mapCampaign);
  }

  async listCampaignsByClient(clientId: string): Promise<Campaign[]> {
    const rows = await getDb().select().from(schema.campaigns).where(eq(schema.campaigns.clientId, clientId));
    return rows.map(mapCampaign);
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.trigger !== undefined) updateData.trigger = data.trigger;
    if (data.objective !== undefined) updateData.objective = data.objective;
    if (data.period !== undefined) updateData.period = data.period;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.textSource !== undefined) updateData.textSource = data.textSource;
    if (data.visualSource !== undefined) updateData.visualSource = data.visualSource;
    if (data.designMode !== undefined) updateData.designMode = data.designMode;
    if (data.brandDnaId !== undefined) updateData.brandDnaId = data.brandDnaId;

    const [row] = await getDb().update(schema.campaigns).set(updateData).where(eq(schema.campaigns.id, id)).returning();
    return row ? mapCampaign(row) : undefined;
  }

  // --- Text Contents ---
  async createTextContent(data: Omit<TextContent, 'id' | 'createdAt'>): Promise<TextContent> {
    const id = generateId();
    const [row] = await getDb().insert(schema.textContents).values({
      id,
      campaignId: data.campaignId,
      version: data.version,
      subject: data.subject,
      preheader: data.preheader,
      headline: data.headline,
      body: data.body,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      sourceType: data.sourceType,
    }).returning();
    return mapTextContent(row);
  }

  async getTextContent(id: string): Promise<TextContent | undefined> {
    const [row] = await getDb().select().from(schema.textContents).where(eq(schema.textContents.id, id));
    return row ? mapTextContent(row) : undefined;
  }

  async getTextContentsByCampaign(campaignId: string): Promise<TextContent[]> {
    const rows = await getDb().select().from(schema.textContents)
      .where(eq(schema.textContents.campaignId, campaignId))
      .orderBy(desc(schema.textContents.version));
    return rows.map(mapTextContent);
  }

  // --- Visuals ---
  async createVisual(data: Omit<Visual, 'id' | 'createdAt'>): Promise<Visual> {
    const id = generateId();
    const [row] = await getDb().insert(schema.visuals).values({
      id,
      campaignId: data.campaignId,
      fileUrl: data.fileUrl,
      fileKey: data.fileKey,
      originalFilename: data.originalFilename,
      width: data.width,
      height: data.height,
      fileSize: data.fileSize,
      altText: data.altText,
      sourceType: data.sourceType,
      isSelected: data.isSelected,
    }).returning();
    return mapVisual(row);
  }

  async getVisual(id: string): Promise<Visual | undefined> {
    const [row] = await getDb().select().from(schema.visuals).where(eq(schema.visuals.id, id));
    return row ? mapVisual(row) : undefined;
  }

  async getVisualsByCampaign(campaignId: string): Promise<Visual[]> {
    const rows = await getDb().select().from(schema.visuals).where(eq(schema.visuals.campaignId, campaignId));
    return rows.map(mapVisual);
  }

  async updateVisual(id: string, data: Partial<Visual>): Promise<Visual | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.altText !== undefined) updateData.altText = data.altText;
    if (data.isSelected !== undefined) updateData.isSelected = data.isSelected;

    const [row] = await getDb().update(schema.visuals).set(updateData).where(eq(schema.visuals.id, id)).returning();
    return row ? mapVisual(row) : undefined;
  }

  async deleteVisual(id: string): Promise<boolean> {
    const result = await getDb().delete(schema.visuals).where(eq(schema.visuals.id, id)).returning();
    return result.length > 0;
  }

  // --- Email Designs ---
  async createEmailDesign(data: Omit<EmailDesign, 'id' | 'createdAt'>): Promise<EmailDesign> {
    const id = generateId();
    const [row] = await getDb().insert(schema.emailDesigns).values({
      id,
      campaignId: data.campaignId,
      variantNumber: data.variantNumber,
      htmlContent: data.htmlContent,
      mjmlSource: data.mjmlSource,
      thumbnailUrl: data.thumbnailUrl,
      deliverabilityScore: data.deliverabilityScore,
    }).returning();
    return mapEmailDesign(row);
  }

  async getEmailDesign(id: string): Promise<EmailDesign | undefined> {
    const [row] = await getDb().select().from(schema.emailDesigns).where(eq(schema.emailDesigns.id, id));
    return row ? mapEmailDesign(row) : undefined;
  }

  async getDesignsByCampaign(campaignId: string): Promise<EmailDesign[]> {
    const rows = await getDb().select().from(schema.emailDesigns)
      .where(eq(schema.emailDesigns.campaignId, campaignId))
      .orderBy(asc(schema.emailDesigns.variantNumber));
    return rows.map(mapEmailDesign);
  }
}

// Singleton instance
export const db = new NeonDB();
