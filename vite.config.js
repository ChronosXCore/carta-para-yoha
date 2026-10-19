import { defineConfig } from 'vite';

/**
 * vite.config.js — Configuración de Vite
 * Sitio 100% estático, compatible con Vercel y GitHub Pages
 */
export default defineConfig({
  base: './',

  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: './index.html',
        roseLab: './rose-lab.html'
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          if (id.includes('node_modules/gsap')) {
            return 'gsap';
          }
        },
      },
    },
  },

  // Servidor de desarrollo accesible en red local para pruebas en iPhone 11
  server: {
    host: '0.0.0.0',
    port: 5173,
  },

  optimizeDeps: {
    include: ['three', 'gsap'],
  },
});
