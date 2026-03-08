import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, Client, BrandDNA, Campaign } from '@/types';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  clients: Client[];
  currentClient: Client | null;
  brandDNA: BrandDNA | null;
  campaigns: Campaign[];
  isLoading: boolean;

  setCurrentWorkspace: (workspace: Workspace) => void;
  setClients: (clients: Client[]) => void;
  setCurrentClient: (client: Client | null) => void;
  addClient: (client: Client) => void;
  updateClientInStore: (id: string, data: Partial<Client>) => void;
  removeClient: (id: string) => void;
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
      clients: [],
      currentClient: null,
      brandDNA: null,
      campaigns: [],
      isLoading: false,

      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setClients: (clients) => set({ clients }),
      setCurrentClient: (client) => set({ currentClient: client }),
      addClient: (client) =>
        set((state) => ({ clients: [...state.clients, client] })),
      updateClientInStore: (id, data) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
          currentClient:
            state.currentClient?.id === id
              ? { ...state.currentClient, ...data }
              : state.currentClient,
        })),
      removeClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          currentClient: state.currentClient?.id === id ? null : state.currentClient,
        })),
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
          clients: [],
          currentClient: null,
          brandDNA: null,
          campaigns: [],
          isLoading: false,
        }),
    }),
    { name: 'mailforge-workspace' }
  )
);
