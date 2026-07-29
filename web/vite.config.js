import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@regintel/api': path.resolve(__dirname, '../packages/api/index.ts'),
      '@regintel/auth': path.resolve(__dirname, '../packages/auth/index.ts'),
      '@regintel/ui-tokens': path.resolve(__dirname, '../packages/ui-tokens/index.ts'),
      '@regintel/types': path.resolve(__dirname, '../packages/types/index.ts'),
      '@regintel/utils': path.resolve(__dirname, '../packages/utils/index.ts'),
      '@regintel/hooks': path.resolve(__dirname, '../packages/hooks/index.ts'),
      '@regintel/config': path.resolve(__dirname, '../packages/config/index.ts'),
      '@regintel/validation': path.resolve(__dirname, '../packages/validation/index.ts'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
