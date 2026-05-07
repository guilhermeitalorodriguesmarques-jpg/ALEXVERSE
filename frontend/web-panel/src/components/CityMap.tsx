'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/store'

export default function CityMap() {
  const { neighborhoods } = useStore()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-glow-cyan">Mapa de la Ciudad</h2>
      <div className="grid grid-cols-2 gap-4">
        {neighborhoods.map((nb) => (
          <motion.div
            key={nb.id}
            whileHover={{ scale: 1.02 }}
            className="glass border border-cyberpunk-neon-purple rounded p-6"
          >
            <h3 className="text-xl font-bold text-cyberpunk-neon-cyan">{nb.name}</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Riqueza:</span>
                <div className="w-32 bg-cyberpunk-darker rounded h-2"><div className="bg-cyberpunk-neon-green h-full rounded" style={{width: `${nb.wealth_level}%`}}></div></div>
              </div>
              <div className="flex justify-between">
                <span>Seguridad:</span>
                <div className="w-32 bg-cyberpunk-darker rounded h-2"><div className="bg-cyberpunk-neon-blue h-full rounded" style={{width: `${nb.safety_level}%`}}></div></div>
              </div>
              <div className="flex justify-between">
                <span>Felicidad:</span>
                <div className="w-32 bg-cyberpunk-darker rounded h-2"><div className="bg-cyberpunk-neon-pink h-full rounded" style={{width: `${nb.happiness_level}%`}}></div></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
