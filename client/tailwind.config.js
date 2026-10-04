/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080d1a',
          surface: '#0d1527',
          card: '#121d33',
          border: '#1f2e4d',
          neonCyan: '#00f2fe',
          neonViolet: '#8b5cf6',
          neonGreen: '#10b981',
          neonRed: '#ef4444',
          neonAmber: '#f59e0b',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 242, 254, 0.4)',
        'glow-violet': '0 0 20px -3px rgba(139, 92, 246, 0.4)',
        'glow-green': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.4)',
      },
    },
  },
  plugins: [],
};
