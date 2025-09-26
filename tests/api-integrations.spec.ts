import { test, expect } from '@playwright/test';

test.describe('API & Integration Platform', () => {
  let apiKey: string;

  test('should create and manage API keys', async ({ page }) => {
    await page.goto('/integrations/api-keys');
    
    await page.click('button:has-text("Create New Key")');
    await page.fill('input[placeholder="Production API Key"]', 'Test API Key');
    await page.fill('textarea', 'For testing purposes');
    await page.click('input[type="checkbox"]:first-child');
    
    await page.click('button:has-text("Create Key")');
    await expect(page.locator('text=API Key Created!')).toBeVisible();
    
    // Verify key is displayed (should be hidden after creation)
    const keyElement = page.locator('code').first();
    apiKey = await keyElement.textContent() || '';
    expect(apiKey).toContain('sk_');
  });

  test('should authenticate with API key', async ({ request }) => {
    const response = await request.get('/api/v1/courses', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    expect(response.status()).toBe(200);
  });

  test('should reject invalid API key', async ({ request }) => {
    const response = await request.get('/api/v1/courses', {
      headers: {
        'Authorization': 'Bearer invalid_key'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('should enforce rate limiting', async ({ request }) => {
    const requests = Array(10).fill(0).map(() => 
      request.get('/api/v1/courses', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
    );
    
    const responses = await Promise.all(requests);
    // Some requests should be rate limited
    expect(responses.some(r => r.status() === 429)).toBeTruthy();
  });

  test('should create and trigger webhooks', async ({ page }) => {
    await page.goto('/integrations/webhooks');
    
    await page.click('button:has-text("Create Webhook")');
    await page.fill('input[name="name"]', 'Test Webhook');
    await page.fill('input[name="url"]', 'https://webhook.site/test');
    await page.click('input[value="user.signup"]');
    
    await page.click('button:has-text("Create Webhook")');
    await expect(page.locator('text=Webhook created successfully')).toBeVisible();
  });

  test('should install and configure integrations', async ({ page }) => {
    await page.goto('/integrations/marketplace');
    
    await page.click('button:has-text("Zapier")');
    await page.click('button:has-text("Install")');
    
    await expect(page.locator('text=Integration installed successfully')).toBeVisible();
    await expect(page.locator('text=Zapier')).toBeVisible();
  });
});