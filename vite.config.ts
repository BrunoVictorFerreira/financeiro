import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: "/financeiro/",
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.jpg', 'icon512.jpg'],
      manifest: {
        name: 'Clara Wallet',
        short_name: 'Clara Wallet',
        description: 'Clara Wallet - Seu PWA de Orçamento pessoal por voz.',
        theme_color: '#0a1610',
        background_color: '#0a1610',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/financeiro/',
        scope: "/financeiro/",
        lang: 'pt-BR',
        icons: [
          {
            src: '/financeiro/icon.jpg',
            sizes: '192x192',
            type: 'image/jpg',
            purpose: 'any',
          },
          {
            src: '/financeiro/icon512.jpg',
            sizes: '512x512',
            type: 'image/jpg',
            purpose: 'any',
          },
          {
            src: '/financeiro/icon512.jpg',
            sizes: '512x512',
            type: 'image/jpg',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
});
