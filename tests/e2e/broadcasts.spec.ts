import { test, expect } from '@playwright/test';

test.describe('Broadcasts', () => {
  test('should display broadcasts page', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(120000);
    
    // Navigate directly to the broadcasts page
    await page.goto('/dashboard/broadcasts');
    console.log('Direct navigation to broadcasts, URL:', page.url());
    
    // Check if we're on the broadcasts page or got redirected
    const currentUrl = page.url();
    
    if (currentUrl.includes('/signin') || currentUrl.includes('/auth')) {
      console.log('Redirected to authentication page');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-auth-redirect.png' });
      
      // Look for OAuth buttons (Google, GitHub, etc.)
      const oauthButtons = await page.locator('button:has-text("Google"), button:has-text("GitHub"), button:has-text("OAuth")').count();
      
      // Look for magic link/email input
      const emailOnlyInput = await page.locator('input[type="email"]:not([name*="password"])').count();
      
      if (oauthButtons > 0) {
        console.log('OAuth authentication detected');
        // For OAuth, we might need to mock the authentication or use test credentials
        // This is complex and might require a different approach
        throw new Error('OAuth authentication detected. Manual intervention needed for testing.');
      } else if (emailOnlyInput > 0) {
        console.log('Magic link authentication detected');
        // Fill email and submit for magic link
        const emailInput = page.locator('input[type="email"]').first();
        await emailInput.fill('test@example.com');
        
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        
        // Magic link flow is hard to test automatically
        console.log('Magic link requested. Manual verification needed.');
        throw new Error('Magic link authentication detected. Manual intervention needed for testing.');
      } else {
        console.log('Unknown authentication method');
        throw new Error('Unknown authentication method. Please check your auth setup.');
      }
    } else if (currentUrl.includes('/dashboard/broadcasts')) {
      console.log('Successfully accessed broadcasts page without authentication');
      // We're already on the broadcasts page, continue with the test
    } else {
      console.log('Unexpected redirect. Current URL:', currentUrl);
      throw new Error(`Unexpected redirect to: ${currentUrl}`);
    }
    
    // Check if we're on the broadcasts page
    const pageTitle = await page.title();
    const h1Content = await page.locator('h1').textContent().catch(() => '');
    
    console.log('Page title:', pageTitle);
    console.log('H1 content:', h1Content);
    
    // Take a final screenshot
    await page.screenshot({ path: 'debug-final.png' });
    
    // Check if we're on the right page using optional chaining
    if (h1Content?.includes('Broadcasts')) {
      console.log('Successfully reached broadcasts page');
      
      // Look for create button with multiple selectors
      const createButtonSelectors = [
        'button:has-text("Create Broadcast")',
        'a:has-text("Create Broadcast")',
        '[data-testid="create-broadcast"]',
        '.create-broadcast-button'
      ];
      
      const createButton = page.locator(createButtonSelectors.join(', ')).first();
      await expect(createButton).toBeVisible({ timeout: 15000 });
    } else {
      throw new Error(`Failed to reach broadcasts page. Current page: ${pageTitle}`);
    }
  });
});