/**
 * In-memory database for MVP.
 * Replace with PostgreSQL (e.g., Drizzle ORM or Prisma) in production.
 */

import type {
  Workspace,
  BrandDNA,
  Campaign,
  TextContent,
  Visual,
  EmailDesign,
} from '@/types';
import { generateId } from './utils';

class InMemoryDB {
  workspaces: Map<string, Workspace> = new Map();
  brandDNAs: Map<string, BrandDNA> = new Map();
  campaigns: Map<string, Campaign> = new Map();
  textContents: Map<string, TextContent> = new Map();
  visuals: Map<string, Visual> = new Map();
  emailDesigns: Map<string, EmailDesign> = new Map();

  constructor() {
    // Seed with a default workspace
    const defaultWorkspace: Workspace = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Mon Workspace',
      ownerId: 'default-user',
      plan: 'free',
      createdAt: new Date().toISOString(),
    };
    this.workspaces.set(defaultWorkspace.id, defaultWorkspace);
  }

  // --- Workspaces ---
  createWorkspace(name: string, ownerId: string = 'default-user'): Workspace {
    const workspace: Workspace = {
      id: generateId(),
      name,
      ownerId,
      plan: 'free',
      createdAt: new Date().toISOString(),
    };
    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  listWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  // --- Brand DNA ---
  createBrandDNA(data: Omit<BrandDNA, 'id' | 'createdAt' | 'updatedAt'>): BrandDNA {
    const dna: BrandDNA = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.brandDNAs.set(dna.id, dna);
    return dna;
  }

  getBrandDNA(id: string): BrandDNA | undefined {
    return this.brandDNAs.get(id);
  }

  getBrandDNAByWorkspace(workspaceId: string): BrandDNA | undefined {
    return Array.from(this.brandDNAs.values()).find(
      (dna) => dna.workspaceId === workspaceId
    );
  }

  updateBrandDNA(id: string, data: Partial<BrandDNA>): BrandDNA | undefined {
    const existing = this.brandDNAs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.brandDNAs.set(id, updated);
    return updated;
  }

  // --- Campaigns ---
  createCampaign(data: Omit<Campaign, 'id' | 'createdAt'>): Campaign {
    const campaign: Campaign = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  getCampaign(id: string): Campaign | undefined {
    return this.campaigns.get(id);
  }

  listCampaigns(workspaceId: string): Campaign[] {
    return Array.from(this.campaigns.values()).filter(
      (c) => c.workspaceId === workspaceId
    );
  }

  updateCampaign(id: string, data: Partial<Campaign>): Campaign | undefined {
    const existing = this.campaigns.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.campaigns.set(id, updated);
    return updated;
  }

  // --- Text Contents ---
  createTextContent(data: Omit<TextContent, 'id' | 'createdAt'>): TextContent {
    const content: TextContent = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    this.textContents.set(content.id, content);
    return content;
  }

  getTextContent(id: string): TextContent | undefined {
    return this.textContents.get(id);
  }

  getTextContentsByCampaign(campaignId: string): TextContent[] {
    return Array.from(this.textContents.values())
      .filter((t) => t.campaignId === campaignId)
      .sort((a, b) => b.version - a.version);
  }

  // --- Visuals ---
  createVisual(data: Omit<Visual, 'id' | 'createdAt'>): Visual {
    const visual: Visual = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    this.visuals.set(visual.id, visual);
    return visual;
  }

  getVisual(id: string): Visual | undefined {
    return this.visuals.get(id);
  }

  getVisualsByCampaign(campaignId: string): Visual[] {
    return Array.from(this.visuals.values()).filter(
      (v) => v.campaignId === campaignId
    );
  }

  updateVisual(id: string, data: Partial<Visual>): Visual | undefined {
    const existing = this.visuals.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.visuals.set(id, updated);
    return updated;
  }

  deleteVisual(id: string): boolean {
    return this.visuals.delete(id);
  }

  // --- Email Designs ---
  createEmailDesign(data: Omit<EmailDesign, 'id' | 'createdAt'>): EmailDesign {
    const design: EmailDesign = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    this.emailDesigns.set(design.id, design);
    return design;
  }

  getEmailDesign(id: string): EmailDesign | undefined {
    return this.emailDesigns.get(id);
  }

  getDesignsByCampaign(campaignId: string): EmailDesign[] {
    return Array.from(this.emailDesigns.values())
      .filter((d) => d.campaignId === campaignId)
      .sort((a, b) => a.variantNumber - b.variantNumber);
  }
}

// Singleton instance
export const db = new InMemoryDB();
