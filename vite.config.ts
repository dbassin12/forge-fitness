import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/**
 * Bloom (Michal's yoga app) is a second page at /bloom/ with its own Home Screen identity. The PWA
 * plugin links Forge's manifest into every page; Bloom keeps only its own (public/bloom/).
 */
function bloomManifest(): Plugin {
  return {
    name: 'bloom-manifest',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.path.startsWith('/bloom/')) return html
        return html.replace(/<link rel="manifest" href="\/manifest\.webmanifest"[^>]*>/g, '')
      },
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        id: '/',
        name: 'Forge — Calisthenics & Nutrition Coach',
        short_name: 'Forge',
        description:
          'Your personal calisthenics, nutrition and habit coach: short personalized workouts, animated voiced exercise guides, calorie tracking and smart reminders.',
        lang: 'en',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0b0d10',
        background_color: '#0b0d10',
        categories: ['health', 'fitness', 'lifestyle', 'food'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Start today’s workout', short_name: 'Workout', url: '/#/workout' },
          { name: 'Spin the wheel', short_name: 'Spin', url: '/#/play/wheel' },
          { name: 'Log food', short_name: 'Log food', url: '/#/eat/add' },
          { name: 'Log a glass of water', short_name: 'Water', url: '/#/today?water=1' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,wasm,json}'],
        // iOS fetches launch screens itself when the app is installed; no need to precache them.
        globIgnores: ['splash/**', 'bloom/splash/**'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: { enabled: false, type: 'module' },
    }),
    bloomManifest(),
  ],
  resolve: {
    alias: {
      '@': r('./src'),
      '@shared': r('./shared'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: { main: r('./index.html'), bloom: r('./bloom/index.html') },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/visual/**/*.test.ts', 'tests/api/**/*.test.ts', 'server/**/*.test.ts', 'shared/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/unit/setup.ts'],
    restoreMocks: true,
  },
})
