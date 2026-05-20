import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[PROXY] Error:', err.message)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[PROXY] Sending Request:', req.method, req.url, '→', proxyReq.path)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[PROXY] Received Response:', req.method, req.url, '→', proxyRes.statusCode)
          })
        },
      },
    },
  },
})
