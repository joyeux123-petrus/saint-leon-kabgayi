module.exports = {
  content: [
    './*.html',
    './js/**/*.js',
    './styles/**/*.css'
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#18181b',
        softWhite: '#f3f4f6',
        'primary-blue': '#174076', // Original primary blue
        'accent-sky': '#0ea5e9',   // Original accent sky blue
        'gray-text': '#4b5563',    // A good default for body text
        'light-blue-bg': '#e3f0ff', // Original light blue background
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}