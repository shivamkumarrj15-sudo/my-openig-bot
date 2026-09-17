/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ig: {
          purple: '#833ab4',
          pink: '#fd1d1d',
          orange: '#fcb045',
          blue: '#3897f0',
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155'
        }
      },
      backgroundImage: {
        'ig-gradient': 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        'ig-gradient-subtle': 'linear-gradient(135deg, rgba(240, 148, 51, 0.1) 0%, rgba(220, 39, 67, 0.1) 50%, rgba(188, 24, 136, 0.1) 100%)'
      }
    },
  },
  plugins: [],
}
