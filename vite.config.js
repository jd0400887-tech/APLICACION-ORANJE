import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import commonjs from '@rollup/plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Hotel Manager PWA',
        short_name: 'HotelPWA',
        description: 'A PWA for Hotel Management',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
  ],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^/api/, ''),
      },
    },
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable'],
  },
})