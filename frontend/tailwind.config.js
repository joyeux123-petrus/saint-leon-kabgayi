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
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
