import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'jsdom', include: ['test/**/*.test.ts'] }, define: { __VERSION__: '"test"', __DEV__: 'false', __DEMO__: 'false' } });
