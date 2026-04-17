import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@payload-config': resolve(__dirname, './payload.config.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    // The full Next.js/Payload/jsdom suite can exceed Vitest's default 5s
    // per-test budget on Windows even when the underlying assertions are green.
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/app/api/**', 'src/components/**', 'src/access/**'],
    },
  },
})
