'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { godModeAPI, logsAPI } from '@/lib/api'
import { useStore } from '@/store'
import { FiSliders, FiZap, FiCloud, FiPlus, FiEye } from 'react-icons/fi'

export default function GodMode() {
  const { city } = useStore()
  const [drama, setDrama] = useState(city?.drama_level || 50)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [notifications, setNotifications] = useState<string[]>([])
  const [npcThoughts, setNpcThoughts] = useState<any[]>([])

  useEffect(() => {
    const loadThoughts = async () => {
      try {
        const thoughts = await logsAPI.getNPCToughts(10)
        setNpcThoughts(thoughts)
      } catch (error) {
        console.error('Error loading NPC thoughts:', error)
      }
    }
    loadThoughts()
    const interval = setInterval(loadThoughts, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message])
    setTimeout(() => setNotifications(prev => prev.slice(1)), 3000)
  }

  const handleSetDrama = async () => {
    setLoading(prev => ({ ...prev, drama: true }))
    try {
      await godModeAPI.setDrama(drama)
      addNotification('✅ Nivel de drama actualizado')
    } catch (error) {
      addNotification('❌ Error actualizando drama')
    } finally {
      setLoading(prev => ({ ...prev, drama: false }))
    }
  }

  const handleTriggerParty = async () => {
    setLoading(prev => ({ ...prev, party: true }))
    try {
      await godModeAPI.triggerParty('downtown')
      addNotification('🎉 Fiesta masiva iniciada')
    } catch (error) {
      addNotification('❌ Error iniciando fiesta')
    } finally {
      setLoading(prev => ({ ...prev, party: false }))
    }
  }

  const handleSetWeather = async (type: string) => {
    setLoading(prev => ({ ...prev, weather: true }))
    try {
      const temp = type === 'lluvia' ? 15 : type === 'tormenta' ? 10 : type === 'ola_calor' ? 35 : 22
      await godModeAPI.setWeather(type, temp)
      addNotification(`🌤️ Clima cambiado a ${type}`)
    } catch (error) {
      addNotification('❌ Error cambiando clima')
    } finally {
      setLoading(prev => ({ ...prev, weather: false }))
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
            disabled={loading.drama}
            className="w-full py-3 bg-cyberpunk-neon-pink text-cyberpunk-darker font-bold rounded hover:shadow-neon-pink transition-all disabled:opacity-50"
          >
            {loading.drama ? 'ACTIVANDO...' : 'ACTIVAR'}
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
                disabled={loading.weather}
                className="w-full py-2 border border-cyberpunk-neon-cyan rounded hover:bg-cyberpunk-darker transition-all disabled:opacity-50 text-sm"
              >
                {loading.weather ? '...' : weather}
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
          <div className="space-y-2">
            <button
              onClick={handleTriggerParty}
              disabled={loading.party}
              className="w-full py-2 border border-cyberpunk-neon-green rounded hover:bg-cyberpunk-darker transition-all disabled:opacity-50"
            >
              {loading.party ? '🎉...' : '🎉 Fiesta Masiva'}
            </button>
            <button
              onClick={() => godModeAPI.triggerBlackout('downtown')}
              disabled={loading}
              className="w-full py-2 border border-cyberpunk-neon-purple rounded hover:bg-cyberpunk-darker transition-all disabled:opacity-50"
            >
              ⚡ Apagón
            </button>
          </div>
        </motion.div>
      </div>

      {/* Advanced Controls */}
      <div className="grid grid-cols-3 gap-4">
        {/* NPC Creation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass border border-neon-cyan rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiPlus className="text-cyberpunk-neon-cyan" />
            <h4 className="font-bold text-glow-cyan">Crear NPC</h4>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nombre"
              className="w-full bg-cyberpunk-darker border border-cyberpunk-neon-cyan rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              placeholder="Edad"
              className="w-full bg-cyberpunk-darker border border-cyberpunk-neon-cyan rounded px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="Trabajo"
              className="w-full bg-cyberpunk-darker border border-cyberpunk-neon-cyan rounded px-2 py-1 text-sm"
            />
            <button className="w-full py-2 bg-cyberpunk-neon-cyan text-cyberpunk-darker font-bold rounded hover:shadow-neon-cyan transition-all">
              CREAR
            </button>
          </div>
        </motion.div>

        {/* Relationship Control */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass border border-neon-pink rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiSliders className="text-cyberpunk-neon-pink" />
            <h4 className="font-bold text-glow-pink">Relaciones</h4>
          </div>
          <div className="space-y-2">
            <select className="w-full bg-cyberpunk-darker border border-cyberpunk-neon-pink rounded px-2 py-1 text-sm">
              <option>Seleccionar NPC 1</option>
            </select>
            <select className="w-full bg-cyberpunk-darker border border-cyberpunk-neon-pink rounded px-2 py-1 text-sm">
              <option>Seleccionar NPC 2</option>
            </select>
            <input
              type="range"
              min="-100"
              max="100"
              defaultValue="0"
              className="w-full"
            />
            <button className="w-full py-2 bg-cyberpunk-neon-pink text-cyberpunk-darker font-bold rounded hover:shadow-neon-pink transition-all">
              MODIFICAR
            </button>
          </div>
        </motion.div>

        {/* City Controls */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass border border-neon-purple rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiZap className="text-cyberpunk-neon-purple" />
            <h4 className="font-bold text-glow-purple">Ciudad</h4>
          </div>
          <div className="space-y-2">
            <button className="w-full py-2 border border-cyberpunk-neon-purple rounded hover:bg-cyberpunk-darker transition-all">
              💥 Drama Máximo
            </button>
            <button className="w-full py-2 border border-cyberpunk-neon-purple rounded hover:bg-cyberpunk-darker transition-all">
              💕 Romance Máximo
            </button>
            <button className="w-full py-2 border border-cyberpunk-neon-purple rounded hover:bg-cyberpunk-darker transition-all">
              ⚔️ Conflictos Máximos
            </button>
          </div>
        </motion.div>
      </div>

      {/* NPC Thoughts Monitor */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass border border-neon-cyan rounded p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiEye className="text-cyberpunk-neon-cyan" />
          <h4 className="font-bold text-glow-cyan">Pensamientos de NPCs</h4>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {npcThoughts.map((thought, idx) => (
            <div key={idx} className="p-2 bg-cyberpunk-darker rounded border-l-2 border-cyberpunk-neon-cyan text-xs">
              <div className="font-semibold text-cyberpunk-neon-cyan">{thought.npc_name}:</div>
              <div className="text-cyberpunk-neon-purple">{thought.thought}</div>
              <div className="text-xs text-cyberpunk-neon-green mt-1">
                {thought.memory_type} • Importancia: {thought.importance}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 space-y-2 z-50"
        >
          {notifications.map((note, idx) => (
            <div key={idx} className="bg-cyberpunk-darker border border-cyberpunk-neon-cyan rounded p-3 text-sm">
              {note}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
