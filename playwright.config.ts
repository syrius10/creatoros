import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // Add these timeout settings
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    
    // Add these timeouts to the use section
    actionTimeout: 10000,
    navigationTimeout: 30000,
    headless: true,           // Optional: add if you want always headless
    viewport: { width: 1280, height: 720 } // Optional: consistent viewport
  },
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000  // Add this timeout for web server
  },
})