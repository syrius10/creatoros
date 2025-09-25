// tests/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { resolve } from 'path';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects?.[0]?.use?.baseURL || 'http://localhost:3000';
  const storagePath = resolve(__dirname, 'auth.json');
  const isCI = process.env.CI === 'true' || process.env.CI === '1';

  try {
    console.log('🔐 Attempting API login with fetch...');

    // Replace with your real login API payload
    const response = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'password123',
      }),
    });

    if (!response.ok) {
      throw new Error(`Login API failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API login success');

    // Launch browser to inject state
    const browser = await chromium.launch({ headless: isCI });
    const page = await browser.newPage();

    // Inject token into localStorage
    if (data.token) {
      await page.goto(baseURL);
      await page.evaluate((token) => {
        localStorage.setItem('token', token);
      }, data.token);
    }

    // Save storage state
    await page.context().storageState({ path: storagePath });
    console.log(`✅ Auth state saved to ${storagePath}`);

    await browser.close();
  } catch (error) {
    console.error('❌ API login failed, falling back to manual login flow:', error);

    // Fallback: open browser for manual login
    const browser = await chromium.launch({ headless: isCI });
    const page = await browser.newPage();
    await page.goto(`${baseURL}/signin`);

    if (!isCI) {
      console.log('🕒 Manual login required. You have 2 minutes...');
      await page.waitForTimeout(120000); // 2 minutes for manual login
      try {
        await page.context().storageState({ path: storagePath });
        console.log(`✅ Auth state saved manually to ${storagePath}`);
      } catch (saveErr) {
        console.error('❌ Failed to save manual auth state:', saveErr);
      }
    } else {
      throw new Error('Global setup failed: cannot authenticate in CI environment');
    }

    await browser.close();
  }
}

export default globalSetup;
