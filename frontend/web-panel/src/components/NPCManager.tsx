'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '@/store'
import { npcAPI } from '@/lib/api'

export default function NPCManager() {
  const { npcs, selectedNPC, setSelectedNPC } = useStore()
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isChatting, setIsChatting] = useState(false)

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedNPC) return

    setIsChatting(true)
    try {
      const response = await npcAPI.sendMessage(selectedNPC.id, chatMessage)
      setChatHistory(prev => [...prev, { user: chatMessage, npc: response.npc_response }])
      setChatMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsChatting(false)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* NPC List */}
      <div className="space-y-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-glow-cyan">NPCs</h2>
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

      {/* NPC Details & Chat */}
      <div className="glass border border-cyberpunk-neon-cyan rounded p-6">
        {selectedNPC ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-32 h-32 bg-cyberpunk-darker rounded-full mx-auto flex items-center justify-center border-2 border-cyberpunk-neon-cyan">
                <span className="text-4xl">👤</span>
              </div>
              <h3 className="text-2xl font-bold text-glow-cyan mt-4">{selectedNPC.name}</h3>
              <p className="text-cyberpunk-neon-purple">{selectedNPC.occupation}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-cyberpunk-neon-green">Edad: {selectedNPC.age}</p>
                <p className="text-cyberpunk-neon-pink">Género: {selectedNPC.gender}</p>
              </div>
              <div>
                <p className="text-cyberpunk-neon-cyan">Energía: {selectedNPC.energy_level}%</p>
                <p className="text-cyberpunk-neon-purple">Necesidad Social: {selectedNPC.social_need}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-cyberpunk-neon-cyan">Personalidad</h4>
              <div className="text-xs space-y-1">
                {Object.entries(selectedNPC.personality_profile || {}).map(([trait, value]) => (
                  <div key={trait} className="flex justify-between">
                    <span className="capitalize">{trait}:</span>
                    <div className="w-20 bg-cyberpunk-darker rounded h-1">
                      <div className="bg-cyberpunk-neon-pink h-full rounded" style={{width: `${value}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-cyberpunk-neon-purple">
            Selecciona un NPC para ver detalles
          </div>
        )}
      </div>

      {/* Chat Panel */}
      <div className="glass border border-cyberpunk-neon-cyan rounded p-6 flex flex-col">
        <h3 className="font-bold text-glow-cyan mb-4">Chat con NPC</h3>
        {selectedNPC ? (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-xs text-cyberpunk-neon-purple">Tú: {msg.user}</div>
                  <div className="text-sm bg-cyberpunk-darker p-2 rounded text-cyberpunk-neon-cyan">
                    {selectedNPC.name}: {msg.npc}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-cyberpunk-darker border border-cyberpunk-neon-cyan rounded px-3 py-2 text-sm focus:outline-none focus:border-cyberpunk-neon-pink"
                disabled={isChatting}
              />
              <button
                onClick={handleSendMessage}
                disabled={isChatting || !chatMessage.trim()}
                className="px-4 py-2 bg-cyberpunk-neon-cyan text-cyberpunk-darker rounded font-bold hover:bg-cyberpunk-neon-pink transition-colors disabled:opacity-50"
              >
                {isChatting ? '...' : 'Enviar'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-cyberpunk-neon-purple">
            Selecciona un NPC para chatear
          </div>
        )}
      </div>
    </div>
  )
}
