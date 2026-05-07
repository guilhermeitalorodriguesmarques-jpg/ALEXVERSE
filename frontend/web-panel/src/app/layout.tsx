import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'ALEXVERSE Life - Cyberpunk City Simulation',
  description: 'Immersive digital life simulation with AI-driven NPCs',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-cyberpunk-darker text-cyberpunk-neon-cyan overflow-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
