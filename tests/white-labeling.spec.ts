import { test, expect } from '@playwright/test';

test.describe('White-Labeling & Custom Domains', () => {
  test('should customize branding colors and fonts', async ({ page }) => {
    await page.goto('/settings/branding');
    
    // Change primary color
    await page.fill('input[placeholder="Your Brand Name"]', 'Test Academy');
    await page.click('input[type="color"]');
    await page.fill('input[type="color"] + input', '#FF0000');
    
    await page.click('button:has-text("Save Configuration")');
    await expect(page.locator('text=Branding configuration saved successfully')).toBeVisible();
  });

  test('should apply theme preset', async ({ page }) => {
    await page.goto('/settings/branding');
    
    // Click on a theme preset
    await page.click('text=Ocean Blue');
    
    // Verify colors are applied
    await expect(page.locator('input[value="#2563EB"]')).toBeVisible();
    await page.click('button:has-text("Save Configuration")');
  });

  test('should add and verify custom domain', async ({ page }) => {
    await page.goto('/settings/domains');
    
    // Add domain
    await page.fill('input[placeholder="yourdomain.com"]', 'test.example.com');
    await page.click('button:has-text("Add Domain")');
    
    await expect(page.locator('text=test.example.com')).toBeVisible();
    await expect(page.locator('text=DNS Configuration Required')).toBeVisible();
    
    // Verify domain (mock verification)
    await page.click('button:has-text("Verify")');
    // This would normally show verification status
  });

  test('should preview branding changes', async ({ page }) => {
    await page.goto('/settings/branding');
    
    await page.click('button:has-text("Show Preview")');
    await expect(page.locator('text=Welcome to your customized academy')).toBeVisible();
    
    // Change color and see preview update
    await page.fill('input[value="#3B82F6"]', '#FF0000');
    await expect(page.locator('.brand-primary')).toHaveCSS('color', 'rgb(255, 0, 0)');
  });

  test('should load custom domain with branding', async ({ page, context }) => {
    // Mock the domain resolution
    await context.route('**/api/white-label/config?domain=test.example.com', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          brand_name: 'Test Academy',
          primary_color: '#FF0000',
          font_family: 'Roboto'
        })
      });
    });

    // Navigate to custom domain
    await page.goto('http://test.example.com');
    
    // Verify branding is applied
    await expect(page.locator('text=Test Academy')).toBeVisible();
  });
});