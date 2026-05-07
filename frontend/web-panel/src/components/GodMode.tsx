'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { godModeAPI } from '@/lib/api'
import { useStore } from '@/store'
import { FiSliders, FiZap, FiCloud, FiPlus } from 'react-icons/fi'

export default function GodMode() {
  const { city } = useStore()
  const [drama, setDrama] = useState(city?.drama_level || 50)
  const [loading, setLoading] = useState(false)

  const handleSetDrama = async () => {
    try {
      setLoading(true)
      await godModeAPI.setDrama(drama)
      alert('Drama level updated!')
    } catch (error) {
      alert('Error updating drama level')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerParty = async () => {
    try {
      setLoading(true)
      await godModeAPI.triggerParty('downtown')
      alert('Party triggered!')
    } catch (error) {
      alert('Error triggering party')
    } finally {
      setLoading(false)
    }
  }

  const handleSetWeather = async (type: string) => {
    try {
      setLoading(true)
      const temp = type === 'lluvia' ? 15 : type === 'ola_calor' ? 35 : 22
      await godModeAPI.setWeather(type, temp)
      alert(`Weather changed to ${type}!`)
    } catch (error) {
      alert('Error changing weather')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-glow-pink">⚡ MODO DIOS</h2>

      {/* Drama Control */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass border border-neon-pink rounded p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiSliders className="text-cyberpunk-neon-pink text-2xl" />
          <h3 className="text-2xl font-bold text-glow-pink">Control de Drama</h3>
        </div>
        <div className="space-y-4">
          <input
            type="range"
            min="0"
            max="100"
            value={drama}
            onChange={(e) => setDrama(parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-center text-lg font-bold text-cyberpunk-neon-pink">{drama}%</p>
          <button
            onClick={handleSetDrama}
            disabled={loading}
            className="w-full py-3 bg-cyberpunk-neon-pink text-cyberpunk-darker font-bold rounded hover:shadow-neon-pink transition-all disabled:opacity-50"
          >
            {loading ? 'ACTIVANDO...' : 'ACTIVAR'}
          </button>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weather Controls */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass border border-neon-cyan rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiCloud className="text-cyberpunk-neon-cyan" />
            <h4 className="font-bold text-glow-cyan">Clima</h4>
          </div>
          <div className="space-y-2">
            {['soleado', 'lluvia', 'tormenta', 'ola_calor'].map((weather) => (
              <button
                key={weather}
                onClick={() => handleSetWeather(weather)}
                disabled={loading}
                className="w-full py-2 border border-cyberpunk-neon-cyan rounded hover:bg-cyberpunk-darker transition-all disabled:opacity-50 text-sm"
              >
                {weather}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Events */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass border border-neon-green rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiZap className="text-cyberpunk-neon-green" />
            <h4 className="font-bold text-glow-green">Eventos</h4>
          </div>
          <button
            onClick={handleTriggerParty}
            disabled={loading}
            className="w-full py-2 border border-cyberpunk-neon-green rounded hover:bg-cyberpunk-darker transition-all disabled:opacity-50"
          >
            🎉 Fiesta Masiva
          </button>
        </motion.div>
      </div>
    </div>
  )
}
