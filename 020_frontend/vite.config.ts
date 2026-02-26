import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      workbox: {
        // Erhöhe das Limit auf 3MB oder 4MB
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'vite.svg'],
      manifest: {
        name: 'Musig Elgg',
        short_name: 'Musig Elgg',
        description: 'Musig Elgg Member Area',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/login',
        scope: '/',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      },
    },
  },
})
