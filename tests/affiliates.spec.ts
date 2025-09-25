// tests/affiliates.spec.ts
import { test, expect, Page } from '@playwright/test';
import { ensureNotSignedOut } from './auth-helpers';

// Utility for safe screenshots & debugging
async function saveDebugArtifacts(page: Page, name: string) {
  try {
    if (!page.isClosed()) {
      await page.screenshot({
        path: `test-debug-${name}-${Date.now()}.png`,
        fullPage: true,
      });
      console.log(`✅ Saved debug screenshot: test-debug-${name}.png`);
    }
  } catch (err) {
    console.warn(`⚠️ Could not save screenshot for ${name}:`, err);
  }
}

test.describe('Affiliate Program Features', () => {
  test.beforeEach(async ({ page }) => {
    await ensureNotSignedOut(page);
  });

  test('should create an affiliate program', async ({ page }) => {
    await page.goto('/affiliates/programs');

    const form = page.locator('[data-testid="affiliate-form"], form');

    try {
      await expect(form).toBeVisible({ timeout: 30000 });
    } catch (e) {
      console.error('❌ Affiliate form not visible. Current DOM:');
      console.error(await page.content());
      await saveDebugArtifacts(page, 'affiliate-form-missing');
      throw e;
    }

    await page.fill('[data-testid="program-name"], input[name*="name"], #name', 'Test Affiliate Program');
    await page.fill('[data-testid="program-description"], textarea[name*="description"], #description', 'Test description');

    await page.click('[data-testid="program-submit"], button[type="submit"], button:has-text("Create")');

    await expect(page.locator('text=Test Affiliate Program')).toBeVisible({ timeout: 20000 });
  });

  test('should calculate commissions on purchase', async ({ page }) => {
    await page.goto('/checkout');

    const purchaseButton = page.locator(
      '[data-testid="complete-purchase"], button:has-text("Complete Purchase"), button:has-text("Buy Now")'
    );

    try {
      await expect(purchaseButton).toBeVisible({ timeout: 30000 });
    } catch (e) {
      console.error('❌ Purchase button not visible. Current DOM:');
      console.error(await page.content());
      await saveDebugArtifacts(page, 'purchase-button-missing');
      throw e;
    }

    await purchaseButton.click();

    const commissionMessage = page.locator('text=Commission earned, text=$15.00');
    await expect(commissionMessage).toBeVisible({ timeout: 20000 });
  });
});
