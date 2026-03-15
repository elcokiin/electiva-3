const { defineConfig } = require('vite');
const tailwindcss = require('@tailwindcss/vite').default;
const { resolve } = require('path');

module.exports = defineConfig({
  root: 'src',
  publicDir: resolve(__dirname, 'public'),
  plugins: [tailwindcss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        expenses: resolve(__dirname, 'src/expenses.html'),
        budget: resolve(__dirname, 'src/budget.html'),
        deudas: resolve(__dirname, 'src/deudas.html'),
        settings: resolve(__dirname, 'src/settings.html'),
      },
    },
  },
});
