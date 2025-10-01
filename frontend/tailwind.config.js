/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'text-yellow-600',
    'text-blue-600',
    'text-green-600',
    'text-purple-600',
    'text-orange-600',
    'bg-blue-600',
    'bg-green-600',
    'bg-yellow-500',
    'bg-purple-600',
    'bg-blue-100',
    'bg-yellow-50',
    'bg-green-50',
    'bg-blue-50',
    'border-yellow-400',
    'border-blue-300',
    'border-green-400',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
