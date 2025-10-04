import { test, expect } from '@playwright/test';

test.describe('AI Features', () => {
  test('should generate content summary', async ({ request }) => {
    const response = await request.post('/api/ai/summarize', {
      data: {
        content: 'This is a long piece of educational content that needs to be summarized for better understanding and quick review.',
        maxLength: 100,
        orgId: 'test-org-id'
      }
    });
    
    expect(response.status()).toBe(200);
    const { summary } = await response.json();
    expect(summary).toBeTruthy();
    expect(summary.length).toBeLessThanOrEqual(100);
  });

  test('should get personalized recommendations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for recommendations to load
    await page.waitForSelector('[data-testid="recommendation-item"]', { timeout: 10000 });
    
    const recommendations = await page.$$('[data-testid="recommendation-item"]');
    expect(recommendations.length).toBeGreaterThan(0);
  });

  test('should create learning path with AI', async ({ page }) => {
    await page.goto('/learning-paths');
    
    await page.click('button:has-text("Create New Path")');
    await page.fill('input[name="goals"]', 'Learn web development, Build portfolio projects');
    
    await page.click('button:has-text("Generate with AI")');
    
    // Wait for AI generation
    await expect(page.locator('text=Learning path generated successfully')).toBeVisible({ timeout: 15000 });
    
    // Verify path was created
    await expect(page.locator('[data-testid="learning-path"]')).toBeVisible();
  });

  test('should use AI assistant chat', async ({ page }) => {
    await page.goto('/courses');
    
    // Open AI assistant
    await page.click('[data-testid="ai-assistant-button"]');
    
    // Send message
    await page.fill('[data-testid="ai-chat-input"]', 'What courses do you recommend for beginners?');
    await page.click('[data-testid="ai-chat-send"]');
    
    // Wait for response
    await expect(page.locator('[data-testid="ai-message"]').last()).toContainText('recommend', { timeout: 10000 });
  });

  test('should display AI-generated feedback on submissions', async ({ page }) => {
    await page.goto('/submissions/quiz-1');
    
    // Check for AI feedback section
    await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible();
    
    // Verify feedback content
    const feedback = await page.locator('[data-testid="ai-feedback"]').textContent();
    expect(feedback?.length).toBeGreaterThan(0);
  });
});