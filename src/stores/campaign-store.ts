import { create } from 'zustand';
import type { Campaign, NewsletterTemplate } from '@/types';

interface CampaignEditorState {
  currentCampaign: Campaign | null;
  templates: NewsletterTemplate[];
  isGenerating: boolean;

  setCurrentCampaign: (campaign: Campaign | null) => void;
  setTemplates: (templates: NewsletterTemplate[]) => void;
  addTemplate: (template: NewsletterTemplate) => void;
  updateTemplate: (id: string, data: Partial<NewsletterTemplate>) => void;
  setGenerating: (generating: boolean) => void;
  reset: () => void;
}

export const useCampaignStore = create<CampaignEditorState>((set) => ({
  currentCampaign: null,
  templates: [],
  isGenerating: false,

  setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),
  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  updateTemplate: (id, data) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...data } : t
      ),
    })),
  setGenerating: (generating) => set({ isGenerating: generating }),
  reset: () =>
    set({
      currentCampaign: null,
      templates: [],
      isGenerating: false,
    }),
}));
