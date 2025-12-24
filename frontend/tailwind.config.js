/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Project Zomboid color palette
        zombie: {
          blood: '#8B0000',
          'blood-dark': '#5C0000',
          green: '#3A5F3A',
          'green-light': '#4A7F4A',
          'green-dark': '#2A4F2A',
          gray: '#2A2A2A',
          'gray-light': '#3A3A3A',
          'gray-dark': '#1A1A1A',
          warning: '#D4AF37',
          error: '#FF4444',
          success: '#44FF44',
        },
        terminal: {
          bg: '#0D0D0D',
          text: '#00FF00',
          border: '#00AA00',
        }
      },
      fontFamily: {
        'mono': ['Courier New', 'monospace'],
        'zombie': ['Creepster', 'cursive'],
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'blood-drip': 'blood-drip 2s ease-in-out infinite',
        'scanner': 'scanner 2s linear infinite',
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
        'flicker': 'flicker 3s linear infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'blood-drip': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        scanner: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-red': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '41.99%': { opacity: '1' },
          '42%': { opacity: '0' },
          '43%': { opacity: '0' },
          '43.01%': { opacity: '1' },
          '47.99%': { opacity: '1' },
          '48%': { opacity: '0' },
          '49%': { opacity: '0' },
          '49.01%': { opacity: '1' },
        },
      },
      boxShadow: {
        'zombie': '0 0 20px rgba(139, 0, 0, 0.5)',
        'terminal': '0 0 10px rgba(0, 255, 0, 0.3)',
        'blood': '0 4px 20px rgba(139, 0, 0, 0.7)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)',
        'noise': "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')",
      },
    },
  },
  plugins: [],
}
