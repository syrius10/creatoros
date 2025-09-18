import { chromium, FullConfig } from '@playwright/test';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  const storagePath = 'tests/auth.json';
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log(`Navigating to signin page: ${baseURL}/signin`);
    await page.goto(`${baseURL}/signin`, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Check if already logged in
    const hasLogoutButton = await page.$('a[href*="logout"], button:has-text("Logout")');
    if (hasLogoutButton) {
      console.log('Appears to be already logged in');
      await page.context().storageState({ path: storagePath });
      await browser.close();
      return;
    }
    
    // Try to fill email field
    const emailInput = await page.$('input[type="email"], input[name*="email"]');
    if (emailInput) {
      await emailInput.fill('test@example.com');
      console.log('Filled email field');
      
      // Try to submit
      const submitButton = await page.$('button[type="submit"], [data-testid="submit-button"]');
      if (submitButton) {
        await submitButton.click();
        console.log('Clicked submit button');
        
        // Wait for navigation
        await page.waitForURL('**/dashboard', { timeout: 30000 });
        
        // Save signed-in state
        await page.context().storageState({ path: storagePath });
        console.log('Auth state saved successfully');
      } else {
        throw new Error('No submit button found');
      }
    } else {
      throw new Error('No email input field found');
    }
  } catch (error) {
    // Save debugging information
    await page.screenshot({ path: 'global-setup-failure.png', fullPage: true });
    console.error('Global setup failed:', error instanceof Error ? error.message : String(error));
    
    // Create manual authentication instructions
    writeFileSync(resolve(__dirname, 'manual-auth-instructions.txt'), 
      `Authentication Setup Instructions:
      
1. Open your browser and go to: ${baseURL}/signin
2. Manually log in using your preferred method
3. After logging in, the browser will save your authentication state
4. Run the tests again

The browser will remain open for 2 minutes for manual login...`);
    
    // Keep the browser open for manual intervention
    console.log('Browser will remain open for 2 minutes for manual login...');
    await page.waitForTimeout(120000);
    
    // After manual login, save the state
    await page.context().storageState({ path: storagePath });
    console.log('Auth state saved after manual login');
  } finally {
    await browser.close();
  }
}

export default globalSetup;