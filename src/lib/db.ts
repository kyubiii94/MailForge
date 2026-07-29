/**
 * Couche d'accès aux données — Neon PostgreSQL via Drizzle ORM.
 * Domaine : campagnes CRM SeLoger et leurs emails SFMC.
 */

import { eq, asc, desc } from 'drizzle-orm';
import { getDb, schema } from './db/index';
import { renderEmail } from '@/features/sfmc';
import type {
  SfmcCampaign,
  SfmcCampaignType,
  SfmcCampaignStatus,
  SfmcEmail,
  SfmcEmailConfig,
} from '@/features/sfmc';

type CampaignRow = typeof schema.sfmcCampaigns.$inferSelect;
type EmailRow = typeof schema.sfmcEmails.$inferSelect;

export const db = {
  // ─── Campagnes ──────────────────────────────────────────────────────────────

  async createCampaign(data: {
    name: string;
    type: SfmcCampaignType;
    brief?: string;
  }): Promise<SfmcCampaign> {
    const d = getDb();
    const [row] = await d
      .insert(schema.sfmcCampaigns)
      .values({
        name: data.name,
        type: data.type,
        brief: data.brief ?? '',
        status: 'draft',
      })
      .returning();
    return rowToCampaign(row);
  },

  async getCampaign(id: string): Promise<SfmcCampaign | undefined> {
    const d = getDb();
    const [row] = await d.select().from(schema.sfmcCampaigns).where(eq(schema.sfmcCampaigns.id, id)).limit(1);
    return row ? rowToCampaign(row) : undefined;
  },

  async listCampaigns(): Promise<SfmcCampaign[]> {
    const d = getDb();
    const rows = await d.select().from(schema.sfmcCampaigns).orderBy(desc(schema.sfmcCampaigns.createdAt));
    return rows.map(rowToCampaign);
  },

  async updateCampaign(
    id: string,
    data: Partial<{ name: string; status: SfmcCampaignStatus }>
  ): Promise<SfmcCampaign | undefined> {
    const d = getDb();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.status !== undefined) updates.status = data.status;
    const [row] = await d
      .update(schema.sfmcCampaigns)
      .set(updates)
      .where(eq(schema.sfmcCampaigns.id, id))
      .returning();
    return row ? rowToCampaign(row) : undefined;
  },

  async deleteCampaign(id: string): Promise<void> {
    const d = getDb();
    await d.delete(schema.sfmcEmails).where(eq(schema.sfmcEmails.campaignId, id));
    await d.delete(schema.sfmcCampaigns).where(eq(schema.sfmcCampaigns.id, id));
  },

  // ─── Emails ──────────────────────────────────────────────────────────────────

  async createEmail(campaignId: string, config: SfmcEmailConfig, position = 0): Promise<SfmcEmail> {
    const d = getDb();
    const rendered = renderEmail(config);
    const [row] = await d
      .insert(schema.sfmcEmails)
      .values({ campaignId, position, config, rendered })
      .returning();
    return rowToEmail(row);
  },

  async getEmail(id: string): Promise<SfmcEmail | undefined> {
    const d = getDb();
    const [row] = await d.select().from(schema.sfmcEmails).where(eq(schema.sfmcEmails.id, id)).limit(1);
    return row ? rowToEmail(row) : undefined;
  },

  async listEmailsByCampaign(campaignId: string): Promise<SfmcEmail[]> {
    const d = getDb();
    const rows = await d
      .select()
      .from(schema.sfmcEmails)
      .where(eq(schema.sfmcEmails.campaignId, campaignId))
      .orderBy(asc(schema.sfmcEmails.position), asc(schema.sfmcEmails.createdAt));
    return rows.map(rowToEmail);
  },

  /** Met à jour la config d'un email et déclenche un re-render déterministe + QA. */
  async updateEmailConfig(id: string, config: SfmcEmailConfig): Promise<SfmcEmail | undefined> {
    const d = getDb();
    const rendered = renderEmail(config);
    const [row] = await d
      .update(schema.sfmcEmails)
      .set({ config, rendered, updatedAt: new Date() })
      .where(eq(schema.sfmcEmails.id, id))
      .returning();
    return row ? rowToEmail(row) : undefined;
  },

  async deleteEmail(id: string): Promise<void> {
    const d = getDb();
    await d.delete(schema.sfmcEmails).where(eq(schema.sfmcEmails.id, id));
  },
};

function rowToCampaign(r: CampaignRow): SfmcCampaign {
  return {
    id: r.id,
    name: r.name,
    type: r.type as SfmcCampaignType,
    status: r.status as SfmcCampaignStatus,
    brief: r.brief ?? '',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function rowToEmail(r: EmailRow): SfmcEmail {
  return {
    id: r.id,
    campaignId: r.campaignId,
    config: r.config,
    rendered: r.rendered,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
