import { create } from 'zustand'
import * as Types from '@/types'

interface AlexverseStore {
  // City State
  city: Types.CityState | null
  neighborhoods: Types.Neighborhood[]
  weather: Types.Weather | null
  
  // NPCs
  npcs: Types.NPC[]
  selectedNPC: Types.NPC | null
  
  // Events & Narrative
  recentEvents: Types.LifeEvent[]
  gossips: Types.Gossip[]
  daySummaries: Types.DaySummary[]
  
  // UI State
  currentTab: 'dashboard' | 'npcs' | 'map' | 'events' | 'god-mode'
  isGodMode: boolean
  sidebarOpen: boolean
  selectedNPCId: string | null
  
  // Authentication
  isAuthenticated: boolean
  userRole: 'admin' | 'observer' | 'bot'
  
  // Methods
  setCityState: (city: Types.CityState) => void
  setNeighborhoods: (neighborhoods: Types.Neighborhood[]) => void
  setWeather: (weather: Types.Weather) => void
  setNPCs: (npcs: Types.NPC[]) => void
  setSelectedNPC: (npc: Types.NPC | null) => void
  setRecentEvents: (events: Types.LifeEvent[]) => void
  setGossips: (gossips: Types.Gossip[]) => void
  setDaySummaries: (summaries: Types.DaySummary[]) => void
  setCurrentTab: (tab: Any) => void
  setIsGodMode: (gm: boolean) => void
  setAuthenticated: (auth: boolean, role?: 'admin' | 'observer' | 'bot') => void
  setSidebarOpen: (open: boolean) => void
}

export const useStore = create<AlexverseStore>((set) => ({
  // Initial state
  city: null,
  neighborhoods: [],
  weather: null,
  npcs: [],
  selectedNPC: null,
  recentEvents: [],
  gossips: [],
  daySummaries: [],
  currentTab: 'dashboard',
  isGodMode: false,
  sidebarOpen: true,
  selectedNPCId: null,
  isAuthenticated: false,
  userRole: 'observer',
  
  // Methods
  setCityState: (city) => set({ city }),
  setNeighborhoods: (neighborhoods) => set({ neighborhoods }),
  setWeather: (weather) => set({ weather }),
  setNPCs: (npcs) => set({ npcs }),
  setSelectedNPC: (npc) => set({ selectedNPC: npc, selectedNPCId: npc?.id || null }),
  setRecentEvents: (recentEvents) => set({ recentEvents }),
  setGossips: (gossips) => set({ gossips }),
  setDaySummaries: (daySummaries) => set({ daySummaries }),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setIsGodMode: (isGodMode) => set({ isGodMode }),
  setAuthenticated: (isAuthenticated, userRole = 'observer') =>
    set({ isAuthenticated, userRole }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
