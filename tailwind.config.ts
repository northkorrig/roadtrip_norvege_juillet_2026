import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: '#0D1B2A', deep: '#091421', soft: '#13263B', line: '#1E3650' },
        glacier: { DEFAULT: '#5BBFBA', soft: '#8AD4D0', dim: '#2E6E6B' },
        cream: { DEFAULT: '#F0EDE6', dim: '#B7C2CC' },
        ember: { DEFAULT: '#E8824A', soft: '#F0A175' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(4, 12, 22, 0.45)',
        glow: '0 0 24px rgba(91, 191, 186, 0.35)',
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
