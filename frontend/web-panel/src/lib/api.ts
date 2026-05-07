import axios from 'axios'
import * as Types from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10000,
})

// Add auth token if exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const cityAPI = {
  getState: async (): Promise<Types.CityState> => {
    const { data } = await apiClient.get('/city/state')
    return data
  },
  getNeighborhoods: async (): Promise<Types.Neighborhood[]> => {
    const { data } = await apiClient.get('/city/neighborhoods')
    return data.neighborhoods
  },
  getWeather: async (): Promise<Types.Weather> => {
    const { data } = await apiClient.get('/city/weather')
    return data
  },
}

export const npcAPI = {
  getAll: async (limit = 100): Promise<Types.NPC[]> => {
    const { data } = await apiClient.get(`/npcs?limit=${limit}`)
    return data.npcs
  },
  getById: async (id: string): Promise<Types.NPC> => {
    const { data } = await apiClient.get(`/npc/${id}`)
    return data
  },
  getRelationships: async (id: string) => {
    const { data } = await apiClient.get(`/npc/${id}/relationships`)
    return data.relationships
  },
  sendMessage: async (id: string, message: string) => {
    const { data } = await apiClient.post(`/npc/${id}/message`, {
      message,
    })
    return data
  },
}

export const eventsAPI = {
  getRecent: async (limit = 50): Promise<Types.LifeEvent[]> => {
    const { data } = await apiClient.get(`/life/events?limit=${limit}`)
    return data.events
  },
  getGossips: async (limit = 20): Promise<Types.Gossip[]> => {
    const { data } = await apiClient.get(`/gossips?limit=${limit}`)
    return data.gossips
  },
  getDaySummaries: async (limit = 10): Promise<Types.DaySummary[]> => {
    const { data } = await apiClient.get(`/day-summaries?limit=${limit}`)
    return data.summaries
  },
}

export const godModeAPI = {
  setWeather: async (type: string, temperature: number) => {
    const { data } = await apiClient.post(
      `/god/weather/set?weather_type=${type}&temperature=${temperature}`
    )
    return data
  },
  setDrama: async (level: number) => {
    const { data } = await apiClient.post(
      `/god/drama/set?drama_level=${level}`
    )
    return data
  },
  createNPC: async (name: string, age: number, gender: string, occupation: string) => {
    const { data } = await apiClient.post('/god/npc/create', {
      name,
      age,
      gender,
      occupation,
    })
    return data
  },
  triggerParty: async (neighborhoodId: string) => {
    const { data } = await apiClient.post('/god/city/party', {
      neighborhood_id: neighborhoodId,
    })
    return data
  },
}
