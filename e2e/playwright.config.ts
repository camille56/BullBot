import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'cd .. && make dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
