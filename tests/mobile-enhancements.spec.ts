import { test, expect } from '@playwright/test';

test.describe('Mobile App Enhancements', () => {
  test('should download content for offline access', async ({ page }) => {
    await page.goto('/course/test-course');
    
    await page.click('[data-testid="download-button"], button:has-text("Download")');
    await expect(page.locator('text=Downloading for offline access')).toBeVisible();
    
    // Verify content appears in offline library
    await page.goto('/library/offline');
    await expect(page.locator('text=Test Course')).toBeVisible();
  });

  test('should handle offline mode gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.goto('/course/test-course');
    await expect(page.locator('text=Offline Mode')).toBeVisible();
    await expect(page.locator('text=Available offline')).toBeVisible();
  });

  test('should sync data when coming online', async ({ page }) => {
    // Go offline and make changes
    await page.context().setOffline(true);
    await page.goto('/course/test-course');
    await page.click('button:has-text("Complete Lesson")');
    
    // Go back online
    await page.context().setOffline(false);
    await expect(page.locator('text=Syncing data')).toBeVisible();
    await expect(page.locator('text=Sync complete')).toBeVisible({ timeout: 10000 });
  });

  test('should handle push notification preferences', async ({ page }) => {
    await page.goto('/settings/notifications');
    
    await page.click('[data-testid="push-toggle"]');
    await page.click('[data-testid="course-updates-toggle"]');
    
    await expect(page.locator('text=Notification preferences saved')).toBeVisible();
  });

  test('should display enhanced media player', async ({ page }) => {
    await page.goto('/course/test-course/video/1');
    
    await expect(page.locator('[data-testid="media-player"]')).toBeVisible();
    await expect(page.locator('button:has-text("Play")')).toBeVisible();
    await expect(page.locator('button:has-text("Fullscreen")')).toBeVisible();
    
    // Test playback controls
    await page.click('button:has-text("Play")');
    await page.click('button:has-text("Pause")');
  });
});