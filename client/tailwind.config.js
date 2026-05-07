module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shield: {
          sidebar: '#0F172A',
          accent: '#6C3BFF',
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#22C55E',
          info: '#3B82F6',
        }
      }
    }
  },
  plugins: []
}
