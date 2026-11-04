import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// Production builds are served from GitHub Pages at /histoquest/. Override with BASE_PATH if hosted elsewhere.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? (process.env.BASE_PATH ?? '/histoquest/') : '/',
  plugins: [
    react(),
    {
      // GitHub Pages has no SPA rewrites: serving index.html as 404.html lets deep links like /histoquest/learn/L-01 load.
      name: 'spa-404-fallback',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
  ],
}))
