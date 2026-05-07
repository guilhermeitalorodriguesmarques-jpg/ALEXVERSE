'use client'

import { useEffect } from 'react'
import { useStore } from '@/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const { city, setDarkMode } = useStore()

  useEffect(() => {
    if (city) {
      // Dark mode based on simulation time (night: 22-6, day: 7-21)
      const isNight = city.current_time >= 22 || city.current_time <= 6
      setDarkMode(isNight)
    }
  }, [city, setDarkMode])

  return <>{children}</>
}
