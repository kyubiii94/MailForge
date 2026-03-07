import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Campaign } from '@/types';

interface WorkspaceState {
  campaigns: Campaign[];
  isLoading: boolean;

  setCampaigns: (campaigns: Campaign[]) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      campaigns: [],
      isLoading: false,

      setCampaigns: (campaigns) => set({ campaigns }),
      addCampaign: (campaign) =>
        set((state) => ({ campaigns: [campaign, ...state.campaigns] })),
      updateCampaign: (id, data) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      reset: () => set({ campaigns: [], isLoading: false }),
    }),
    { name: 'mailforge-workspace' }
  )
);
