/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B5E20',
        secondary: '#2E7D32',
        accent: '#A5D6A7',
        soft: '#E8F5E9',
        neutral: '#F9FAFB',
        dark: '#1F2937'
      }
    },
  },
  plugins: [],
}