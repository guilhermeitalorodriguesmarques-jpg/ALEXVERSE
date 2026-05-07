'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store'
import { cityAPI, npcAPI, eventsAPI } from '@/lib/api'
import Dashboard from '@/components/Dashboard'
import NPCManager from '@/components/NPCManager'
import CityMap from '@/components/CityMap'
import EventsPanel from '@/components/EventsPanel'
import GodMode from '@/components/GodMode'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const {
    currentTab,
    setCityState,
    setNeighborhoods,
    setWeather,
    setNPCs,
    setRecentEvents,
    setGossips,
    setDaySummaries,
  } = useStore()

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [city, neighborhoods, weather, npcs, events, gossips, summaries] =
          await Promise.all([
            cityAPI.getState(),
            cityAPI.getNeighborhoods(),
            cityAPI.getWeather(),
            npcAPI.getAll(),
            eventsAPI.getRecent(50),
            eventsAPI.getGossips(20),
            eventsAPI.getDaySummaries(10),
          ])

        setCityState(city)
        setNeighborhoods(neighborhoods)
        setWeather(weather)
        setNPCs(npcs)
        setRecentEvents(events)
        setGossips(gossips)
        setDaySummaries(summaries)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data')
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Refresh data periodically
    const interval = setInterval(loadData, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [setCityState, setNeighborhoods, setWeather, setNPCs, setRecentEvents, setGossips, setDaySummaries])

  return (
    <main className="w-screen h-screen bg-cyberpunk-darker overflow-hidden flex">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyberpunk-neon-cyan opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyberpunk-neon-pink opacity-10 blur-3xl animate-pulse" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <Header />

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="m-4 p-4 border-neon-pink bg-cyberpunk-dark rounded"
            >
              <p className="text-cyberpunk-neon-pink">⚠️ Error: {error}</p>
            </motion.div>
          )}

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center">
                <div className="text-4xl animate-glow mb-4">⚡</div>
                <p className="text-cyberpunk-neon-cyan font-bold">INICIALIZANDO ALEXVERSE...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="p-6"
            >
              {currentTab === 'dashboard' && <Dashboard />}
              {currentTab === 'npcs' && <NPCManager />}
              {currentTab === 'map' && <CityMap />}
              {currentTab === 'events' && <EventsPanel />}
              {currentTab === 'god-mode' && <GodMode />}
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
