const { defineConfig } = require('vite');
const tailwindcss = require('@tailwindcss/vite').default;

module.exports = defineConfig({
  root: 'src',
  plugins: [tailwindcss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
