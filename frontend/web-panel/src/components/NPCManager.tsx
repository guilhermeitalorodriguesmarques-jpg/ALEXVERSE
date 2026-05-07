'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/store'

export default function NPCManager() {
  const { npcs, selectedNPC, setSelectedNPC } = useStore()

  return (
    <div className="grid grid-cols-4 gap-4">
      {npcs.map((npc) => (
        <motion.div
          key={npc.id}
          whileHover={{ scale: 1.05 }}
          onClick={() => setSelectedNPC(npc)}
          className={`glass border rounded p-4 cursor-pointer transition-all ${
            selectedNPC?.id === npc.id
              ? 'border-neon-cyan'
              : 'border-cyberpunk-neon-purple hover:border-cyberpunk-neon-pink'
          }`}
        >
          <div className="mb-3 w-full h-24 bg-cyberpunk-darker rounded flex items-center justify-center border border-dashed border-cyberpunk-neon-cyan">
            <span className="text-2xl">👤</span>
          </div>
          <h3 className="font-bold text-cyberpunk-neon-cyan">{npc.name}</h3>
          <p className="text-xs text-cyberpunk-neon-purple">{npc.occupation}</p>
          <div className="mt-2 text-xs space-y-1">
            <p>Edad: <span className="text-cyberpunk-neon-green">{npc.age}</span></p>
            <p>Ánimo: <span className={npc.mood_state === 'feliz' ? 'text-cyberpunk-neon-green' : 'text-cyberpunk-neon-pink'}>{npc.mood_state}</span></p>
            <p>Energía: <span className="text-cyberpunk-neon-cyan">{npc.energy_level}%</span></p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
