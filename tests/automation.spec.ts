import { test, expect } from '@playwright/test';

test.describe('Email Automation Features', () => {
  test('should create an automation trigger', async ({ page }) => {
    await page.goto('/automations/triggers');
    
    await page.fill('[data-testid="trigger-name"], input[name*="name"]', 'Course Completion Trigger');
    await page.selectOption('[data-testid="trigger-type"], select[name*="type"]', 'course_completion');
    await page.fill('[data-testid="trigger-conditions"], textarea[name*="conditions"]', '{"course_id": "test-course"}');
    
    await page.click('[data-testid="submit-trigger"], button[type="submit"]');
    await expect(page.locator('text=Trigger created successfully')).toBeVisible({ timeout: 10000 });
  });

  test('should build an email sequence', async ({ page }) => {
    await page.goto('/automations/sequences');
    
    await page.fill('[data-testid="sequence-name"], input[name*="name"]', 'Welcome Sequence');
    await page.click('button:has-text("Add Email Step")');
    
    await page.fill('[data-testid="email-subject"], input[placeholder*="Subject"]', 'Welcome to our platform!');
    await page.click('button:has-text("Add Delay")');
    await page.fill('input[type="number"]', '2');
    
    await page.click('button:has-text("Create Sequence")');
    await expect(page.locator('text=Sequence created successfully')).toBeVisible({ timeout: 10000 });
  });

  test('should evaluate triggers on user action', async ({ page }) => {
    // Mock the trigger evaluation API
    await page.route('**/api/automations/evaluate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          triggered: true,
          journey_id: 'test-journey' 
        })
      });
    });

    // Simulate a user action that should trigger automation
    await page.goto('/courses/test-course/complete');
    await page.click('button:has-text("Complete Course")');
    
    // Check if automation was triggered
    await expect(page.locator('text=Welcome sequence started')).toBeVisible({ timeout: 10000 });
  });
});