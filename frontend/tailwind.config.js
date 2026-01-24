/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
      },
      // Using Standard Tailwind Slate 950 for background

    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
