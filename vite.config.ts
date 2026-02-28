import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build({
      entry: 'src/index.tsx',
    }),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  resolve: {
    alias: {
      '../../data/universities.json': '/data/universities.json',
      '../../data/custom_standard.json': '/data/custom_standard.json',
    }
  },
  json: {
    stringify: true
  }
})
