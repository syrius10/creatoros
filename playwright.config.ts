import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  globalSetup: require.resolve('./tests/global-setup'),
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // Timeout settings
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    storageState: 'tests/auth.json', // Added for global setup
    trace: 'on-first-retry',
    
    // Timeouts for actions and navigation
    actionTimeout: 10000,
    navigationTimeout: 30000,
    headless: true,
    viewport: { width: 1280, height: 720 }
  },

  // Multi-browser configuration
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
});