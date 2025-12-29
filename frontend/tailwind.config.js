/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['Playfair Display', 'Georgia', 'serif'],
      },
      screens: {
        'tablet': {'min': '768px', 'max': '1023px'}, // Better range for iPad and landscape tablets
        'laptop': {'min': '1024px', 'max': '1279px'}, // Standard 13" laptop range
        'desktop': {'min': '1280px'},                 // Professional laptops and monitors
      },
      colors: {
        primary: {
          DEFAULT: '#061E29', // indigo-600 - main primary color
          dark: '#1D546D',     // indigo-700 - hover state
          darker: '#3730a3',   // indigo-800 - active/pressed state
          light: '#6366f1',    // indigo-500 - lighter variant
        },
      },
    },
  },
  plugins: [],
}

