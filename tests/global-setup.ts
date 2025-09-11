import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to login page
  await page.goto(`${baseURL}/login`);
  
  // Try different selectors for login form
  const emailSelectors = [
    'input[name="email"]',
    'input[type="email"]',
    'input[id="email"]',
    'input[data-testid="email"]'
  ];
  
  const passwordSelectors = [
    'input[name="password"]',
    'input[type="password"]',
    'input[id="password"]',
    'input[data-testid="password"]'
  ];
  
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Sign In")',
    'button:has-text("Login")',
    'input[type="submit"]'
  ];
  
  // Try to fill email with the first matching selector
  for (const selector of emailSelectors) {
    if (await page.$(selector)) {
      await page.fill(selector, 'test@example.com');
      break;
    }
  }
  
  // Try to fill password with the first matching selector
  for (const selector of passwordSelectors) {
    if (await page.$(selector)) {
      await page.fill(selector, 'password123');
      break;
    }
  }
  
  // Try to click submit with the first matching selector
  for (const selector of submitSelectors) {
    if (await page.$(selector)) {
      await page.click(selector);
      break;
    }
  }
  
  // Wait for navigation to complete
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  
  // Save signed-in state
  await page.context().storageState({ path: storageState as string });
  await browser.close();
}

export default globalSetup;