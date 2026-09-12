/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eef6ff', 500: '#1a73e8', 600: '#1557b0' },
        surface: { 50: '#f8f9fa', 100: '#f1f3f4', 200: '#e8eaed' },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
      },
    },
  },
  plugins: [],
}
