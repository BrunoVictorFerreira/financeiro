import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: "/financeiro/",
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.png', 'icon512.png'],
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
            src: '/financeiro/icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/financeiro/icon512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/financeiro/icon512.png',
            sizes: '512x512',
            type: 'image/png',
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
