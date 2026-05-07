'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/store'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FiTrendingUp, FiUsers, FiZap, FiAlertCircle } from 'react-icons/fi'

export default function Dashboard() {
  const { city, neighborhoods, npcs, recentEvents } = useStore()

  if (!city) return null

  const statCards = [
    { icon: FiUsers, label: 'Total NPCs', value: npcs.length, color: 'text-cyberpunk-neon-cyan' },
    { icon: FiZap, label: 'City Mood', value: `${city.mood_index}%`, color: 'text-cyberpunk-neon-pink' },
    { icon: FiTrendingUp, label: 'Drama Level', value: `${city.drama_level}%`, color: 'text-cyberpunk-neon-purple' },
    { icon: FiAlertCircle, label: 'Events Today', value: recentEvents.length, color: 'text-cyberpunk-neon-green' },
  ]

  const moodData = [
    { time: '0:00', mood: 50 },
    { time: '6:00', mood: 45 },
    { time: '12:00', mood: city.mood_index },
    { time: '18:00', mood: city.mood_index - 5 },
    { time: '23:00', mood: city.mood_index - 10 },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass border border-cyberpunk-neon-cyan rounded p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-cyberpunk-neon-purple uppercase">{card.label}</p>
                  <p className="text-2xl font-bold mt-2 text-glow-cyan">{card.value}</p>
                </div>
                <Icon className={`${card.color} text-2xl opacity-50`} />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Mood Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass border border-cyberpunk-neon-cyan rounded p-4"
        >
          <h3 className="text-lg font-bold text-glow-cyan mb-4">Tendencia de Ánimo</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00f5ff" opacity={0.1} />
              <XAxis dataKey="time" stroke="#00f5ff" />
              <YAxis stroke="#00f5ff" />
              <Tooltip contentStyle={{ backgroundColor: '#0a0e27', border: '1px solid #00f5ff' }} />
              <Line type="monotone" dataKey="mood" stroke="#ff006e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Neighborhoods Happiness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass border border-cyberpunk-neon-cyan rounded p-4"
        >
          <h3 className="text-lg font-bold text-glow-cyan mb-4">Felicidad por Barrio</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={neighborhoods}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00f5ff" opacity={0.1} />
              <XAxis dataKey="name" stroke="#00f5ff" fontSize={12} />
              <YAxis stroke="#00f5ff" />
              <Tooltip contentStyle={{ backgroundColor: '#0a0e27', border: '1px solid #00f5ff' }} />
              <Bar dataKey="happiness_level" fill="#39ff14" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass border border-cyberpunk-neon-cyan rounded p-4"
      >
        <h3 className="text-lg font-bold text-glow-cyan mb-4">Eventos Recientes</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recentEvents.slice(0, 5).map((event) => (
            <div key={event.id} className="p-3 bg-cyberpunk-darker rounded border-l-2 border-cyberpunk-neon-pink text-sm">
              <p className="font-semibold text-cyberpunk-neon-cyan">{event.event_type}</p>
              <p className="text-xs text-cyberpunk-neon-purple">{event.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
