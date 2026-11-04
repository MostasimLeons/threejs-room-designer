import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Unit tests for the plain logic (state, saving, furniture maths). They run in
// Node, without a browser or WebGL, so they're fast.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }),
)
