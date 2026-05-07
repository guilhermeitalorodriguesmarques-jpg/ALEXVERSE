'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/store'
import {
  FiHome,
  FiUsers,
  FiMap,
  FiTrendingUp,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi'
import { MdGpsFixed } from 'react-icons/md'

export default function Sidebar() {
  const { currentTab, setCurrentTab, sidebarOpen, setSidebarOpen, userRole } = useStore()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'npcs', label: 'NPCs', icon: FiUsers },
    { id: 'map', label: 'Mapa', icon: FiMap },
    { id: 'events', label: 'Eventos', icon: FiTrendingUp },
  ]

  if (userRole === 'admin') {
    menuItems.push({ id: 'god-mode', label: 'Modo Dios', icon: MdGpsFixed })
  }

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-cyberpunk-dark border-r border-cyberpunk-neon-cyan glass h-screen flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-cyberpunk-neon-purple">
        <h2 className="text-xl font-bold text-glow-cyan">MENU</h2>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, idx) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full px-4 py-3 rounded flex items-center gap-3 transition-all ${
                isActive
                  ? 'border-neon-cyan bg-cyberpunk-darker text-glow-cyan'
                  : 'hover:border-l-2 hover:border-cyberpunk-neon-pink hover:text-cyberpunk-neon-pink'
              }`}
            >
              <Icon size={20} />
              <span className="font-semibold">{item.label}</span>
              {isActive && <div className="ml-auto animate-pulse text-cyberpunk-neon-green">●</div>}
            </motion.button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-cyberpunk-neon-purple space-y-2">
        <button className="w-full px-4 py-2 rounded border border-cyberpunk-neon-purple hover:border-cyberpunk-neon-pink transition-all flex items-center gap-2 justify-center">
          <FiSettings size={18} />
          Settings
        </button>
        <button className="w-full px-4 py-2 rounded border border-cyberpunk-neon-purple hover:border-cyberpunk-neon-green transition-all flex items-center gap-2 justify-center">
          <FiLogOut size={18} />
          Logout
        </button>
      </div>
    </motion.aside>
  )
}
