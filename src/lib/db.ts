/**
 * In-memory database for MVP.
 * Replace with PostgreSQL/Supabase in production.
 */

import type { Campaign, NewsletterTemplate, Workspace } from '@/types';
import { generateId } from './utils';

class InMemoryDB {
  workspaces: Map<string, Workspace> = new Map();
  campaigns: Map<string, Campaign> = new Map();
  templates: Map<string, NewsletterTemplate> = new Map();

  constructor() {
    const defaultWorkspace: Workspace = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Mon Workspace',
      createdAt: new Date().toISOString(),
    };
    this.workspaces.set(defaultWorkspace.id, defaultWorkspace);
  }

  // ─── Campaigns ────────────────────────────────────────────────────────────

  createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign {
    const campaign: Campaign = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id);
  }

  listCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  updateCampaign(id: string, data: Partial<Campaign>): Campaign | undefined {
    const existing = this.campaigns.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.campaigns.set(id, updated);
    return updated;
  }

  // ─── Newsletter Templates ─────────────────────────────────────────────────

  createTemplate(data: Omit<NewsletterTemplate, 'id' | 'createdAt'>): NewsletterTemplate {
    const template: NewsletterTemplate = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    this.templates.set(template.id, template);
    return template;
  }

  getTemplate(id: string): NewsletterTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplateByCampaignAndNumber(campaignId: string, templateNumber: number): NewsletterTemplate | undefined {
    return Array.from(this.templates.values()).find(
      (t) => t.campaignId === campaignId && t.templateNumber === templateNumber
    );
  }

  getTemplatesByCampaign(campaignId: string): NewsletterTemplate[] {
    return Array.from(this.templates.values())
      .filter((t) => t.campaignId === campaignId)
      .sort((a, b) => a.templateNumber - b.templateNumber);
  }

  updateTemplate(id: string, data: Partial<NewsletterTemplate>): NewsletterTemplate | undefined {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.templates.set(id, updated);
    return updated;
  }

  deleteTemplatesByCampaign(campaignId: string): void {
    const toDelete: string[] = [];
    this.templates.forEach((t, id) => {
      if (t.campaignId === campaignId) toDelete.push(id);
    });
    toDelete.forEach((id) => this.templates.delete(id));
  }
}

export const db = new InMemoryDB();
