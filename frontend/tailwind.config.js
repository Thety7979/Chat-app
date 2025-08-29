/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6B6FEA',
        'primary-dark': '#575EDC',
        secondary: '#2CC6B6',
        accent: '#FDF3F9',
        'google-red': '#D94B45',
        'facebook-blue': '#2B4D9B',
        'microsoft-black': '#1A1A1A',
        'light-gray': '#F5F6FA',
        'text-gray': '#6B7280',
        'border-gray': '#D1D5DB',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
