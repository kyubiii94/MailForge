import { create } from 'zustand';
import type { TextContent, Visual, EmailDesign } from '@/types';

interface CampaignEditorState {
  currentCampaignId: string | null;
  textContent: TextContent | null;
  textVersions: TextContent[];
  visuals: Visual[];
  designs: EmailDesign[];
  activeStep: 'text' | 'visuals' | 'design';
  isGenerating: boolean;

  setCurrentCampaign: (id: string) => void;
  setTextContent: (content: TextContent) => void;
  setTextVersions: (versions: TextContent[]) => void;
  setVisuals: (visuals: Visual[]) => void;
  addVisual: (visual: Visual) => void;
  removeVisual: (id: string) => void;
  toggleVisualSelection: (id: string) => void;
  setDesigns: (designs: EmailDesign[]) => void;
  setActiveStep: (step: 'text' | 'visuals' | 'design') => void;
  setGenerating: (generating: boolean) => void;
  reset: () => void;
}

export const useCampaignStore = create<CampaignEditorState>((set) => ({
  currentCampaignId: null,
  textContent: null,
  textVersions: [],
  visuals: [],
  designs: [],
  activeStep: 'text',
  isGenerating: false,

  setCurrentCampaign: (id) => set({ currentCampaignId: id }),
  setTextContent: (content) => set({ textContent: content }),
  setTextVersions: (versions) => set({ textVersions: versions }),
  setVisuals: (visuals) => set({ visuals }),
  addVisual: (visual) =>
    set((state) => ({ visuals: [...state.visuals, visual] })),
  removeVisual: (id) =>
    set((state) => ({ visuals: state.visuals.filter((v) => v.id !== id) })),
  toggleVisualSelection: (id) =>
    set((state) => ({
      visuals: state.visuals.map((v) =>
        v.id === id ? { ...v, isSelected: !v.isSelected } : v
      ),
    })),
  setDesigns: (designs) => set({ designs }),
  setActiveStep: (step) => set({ activeStep: step }),
  setGenerating: (generating) => set({ isGenerating: generating }),
  reset: () =>
    set({
      currentCampaignId: null,
      textContent: null,
      textVersions: [],
      visuals: [],
      designs: [],
      activeStep: 'text',
      isGenerating: false,
    }),
}));
