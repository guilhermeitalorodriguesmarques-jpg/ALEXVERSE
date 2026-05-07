'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/store'

export default function EventsPanel() {
  const { recentEvents, gossips, daySummaries } = useStore()

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Events */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass border border-cyberpunk-neon-cyan rounded p-4">
        <h3 className="text-lg font-bold text-glow-cyan mb-4">Eventos</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentEvents.map((event) => (
            <div key={event.id} className="p-2 bg-cyberpunk-darker rounded border-l border-cyberpunk-neon-pink text-xs">
              <p className="font-semibold text-cyberpunk-neon-green">{event.event_type}</p>
              <p className="text-cyberpunk-neon-purple text-xs">{event.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gossips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass border border-cyberpunk-neon-purple rounded p-4">
        <h3 className="text-lg font-bold text-glow-cyan mb-4">Chismes</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {gossips.map((gossip) => (
            <div key={gossip.id} className="p-2 bg-cyberpunk-darker rounded border-l border-cyberpunk-neon-pink text-xs">
              <p className="text-cyberpunk-neon-pink">{gossip.text}</p>
              <p className="text-cyberpunk-neon-purple text-xs mt-1">Intensidad: {gossip.intensity}%</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Summaries */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass border border-cyberpunk-neon-green rounded p-4">
        <h3 className="text-lg font-bold text-glow-cyan mb-4">Resúmenes</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {daySummaries.map((summary) => (
            <div key={summary.id} className="p-2 bg-cyberpunk-darker rounded border-l border-cyberpunk-neon-green text-xs">
              <p className="text-cyberpunk-neon-green font-semibold">Día {summary.city_day}</p>
              <p className="text-cyberpunk-neon-cyan text-xs mt-1">{summary.summary_text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
