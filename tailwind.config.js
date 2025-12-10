/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  safelist: [
    'bg-[#1157d3]', // <- safelisting custom color
    'text-white',
    'hover:bg-[#3a79e4]',
    'text-white/90',
    'text-white/70',
    'bg-white',
    'text-[#1157d3]'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}