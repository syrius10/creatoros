import { test, expect } from '@playwright/test';

test.describe('Analytics Features', () => {
  test('should display analytics dashboard', async ({ page }) => {
    await page.goto('/analytics');
    
    // Check if analytics dashboard is displayed
    await expect(page.locator('h1:has-text("Analytics Dashboard")')).toBeVisible();
    await expect(page.locator('text=Total Views')).toBeVisible();
    await expect(page.locator('text=Enrollments')).toBeVisible();
    await expect(page.locator('text=Completions')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();
  });

  test('should show date range filters', async ({ page }) => {
    await page.goto('/analytics');
    
    // Check if date range buttons are present
    await expect(page.locator('button:has-text("7D")')).toBeVisible();
    await expect(page.locator('button:has-text("30D")')).toBeVisible();
    await expect(page.locator('button:has-text("90D")')).toBeVisible();
  });

  test('should display recent activity', async ({ page }) => {
    await page.goto('/analytics');
    
    // Check if recent activity section is present
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('should export analytics data', async ({ page }) => {
    await page.goto('/analytics');
    
    // Mock the download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Data")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('analytics-export');
  });

  test('should track events', async ({ page }) => {
    // Mock the analytics API endpoint
    await page.route('**/api/analytics/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Perform actions that should trigger events
    await page.goto('/courses');
    // Add more event-triggering actions as needed
  });
});