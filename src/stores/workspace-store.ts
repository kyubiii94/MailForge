import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, BrandDNA, Campaign } from '@/types';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  brandDNA: BrandDNA | null;
  campaigns: Campaign[];
  isLoading: boolean;

  setCurrentWorkspace: (workspace: Workspace) => void;
  setBrandDNA: (dna: BrandDNA) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      brandDNA: null,
      campaigns: [],
      isLoading: false,

      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setBrandDNA: (dna) => set({ brandDNA: dna }),
      setCampaigns: (campaigns) => set({ campaigns }),
      addCampaign: (campaign) =>
        set((state) => ({ campaigns: [...state.campaigns, campaign] })),
      updateCampaign: (id, data) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      reset: () =>
        set({
          currentWorkspace: null,
          brandDNA: null,
          campaigns: [],
          isLoading: false,
        }),
    }),
    { name: 'mailforge-workspace' }
  )
);
