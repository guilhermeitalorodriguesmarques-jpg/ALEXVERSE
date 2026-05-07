'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/store'
import { FiCpu, FiUsers, FiBarChart2, FiZap } from 'react-icons/fi'

export default function Header() {
  const { city, weather } = useStore()

  if (!city || !weather) return null

  return (
    <header className="border-b border-cyberpunk-neon-cyan glass h-20 flex items-center px-6 gap-8">
      {/* Logo/Title */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1"
      >
        <h1 className="text-3xl font-bold text-glow-cyan">ALEXVERSE</h1>
        <p className="text-xs text-cyberpunk-neon-purple">Life Simulation Engine v1.0</p>
      </motion.div>

      {/* City Stats */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-8 items-center"
      >
        {/* Time */}
        <div className="border-l border-cyberpunk-neon-purple pl-4">
          <p className="text-xs text-cyberpunk-neon-purple">HORA</p>
          <p className="text-2xl font-bold text-glow-cyan">{city.current_time}:00</p>
        </div>

        {/* Mood */}
        <div className="flex items-center gap-2">
          <FiZap className="text-cyberpunk-neon-pink" />
          <div>
            <p className="text-xs text-cyberpunk-neon-purple">ÁNIMO</p>
            <p className="text-lg font-bold text-cyberpunk-neon-pink">{city.mood_index}%</p>
          </div>
        </div>

        {/* Weather */}
        <div className="flex items-center gap-2">
          <div>
            <p className="text-xs text-cyberpunk-neon-purple">CLIMA</p>
            <p className="text-sm font-bold text-cyberpunk-neon-green">
              {weather.type} {weather.temperature}°C
            </p>
          </div>
        </div>

        {/* Population */}
        <div className="flex items-center gap-2">
          <FiUsers className="text-cyberpunk-neon-green" />
          <div>
            <p className="text-xs text-cyberpunk-neon-purple">NPCs</p>
            <p className="text-lg font-bold">--</p>
          </div>
        </div>
      </motion.div>
    </header>
  )
}
