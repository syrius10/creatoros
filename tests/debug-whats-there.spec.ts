// tests/debug-whats-there.spec.ts
import { test } from '@playwright/test'

test('see what is actually on courses admin page', async ({ page }) => {
  // Mock auth
  await page.goto('http://localhost:3000/signin')
  await page.evaluate(() => {
    localStorage.setItem('supabase-auth-token', JSON.stringify({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      user: { 
        id: 'mock-user-id', 
        email: 'admin@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
    }))
  })
  
  // Go to courses admin page
  await page.goto('http://localhost:3000/courses/admin')
  await page.waitForLoadState('networkidle')
  
  // Take screenshot
  await page.screenshot({ path: 'whats-really-there.png', fullPage: true })
  
  // Get ALL text content to see what's actually there
  const allText = await page.textContent('body')
  console.log('=== ALL TEXT ON PAGE ===')
  console.log(allText)
  
  // Check if we're on the right page
  const pageTitle = await page.title()
  const currentUrl = page.url()
  console.log('=== PAGE INFO ===')
  console.log('Title:', pageTitle)
  console.log('URL:', currentUrl)
  
  // Check for any error messages
  const errorElements = await page.$$('[class*="error"], [class*="Error"], [class*="empty"], [class*="Empty"]')
  console.log('=== ERROR OR EMPTY STATES ===')
  for (const element of errorElements) {
    console.log(await element.textContent())
  }
})