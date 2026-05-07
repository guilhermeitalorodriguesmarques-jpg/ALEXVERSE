import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cyberpunk': {
          'dark': '#0a0e27',
          'darker': '#050812',
          'neon-pink': '#ff006e',
          'neon-cyan': '#00f5ff',
          'neon-purple': '#b537f2',
          'neon-green': '#39ff14',
          'neon-blue': '#0080ff',
          'neon-orange': '#ff6600',
        },
      },
      fontFamily: {
        'sans': ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        'mono': ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
        'cyberpunk': ['Orbitron', 'monospace'],
      },
      boxShadow: {
        'neon-pink': '0 0 20px #ff006e, 0 0 40px #ff006e',
        'neon-cyan': '0 0 20px #00f5ff, 0 0 40px #00f5ff',
        'neon-purple': '0 0 20px #b537f2, 0 0 40px #b537f2',
        'neon-green': '0 0 20px #39ff14, 0 0 40px #39ff14',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-neon': 'pulse-neon 1.5s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { textShadow: '0 0 10px #00f5ff, 0 0 20px #00f5ff' },
          '50%': { textShadow: '0 0 20px #00f5ff, 0 0 30px #00f5ff, 0 0 40px #00f5ff' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        flicker: {
          '0%': { opacity: '0.95' },
          '5%': { opacity: '0.8' },
          '10%': { opacity: '0.95' },
          '15%': { opacity: '0.9' },
          '20%': { opacity: '0.95' },
          '25%': { opacity: '1' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
