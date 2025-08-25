// tests/debug-admin-page.spec.ts
import { test } from '@playwright/test'

test('debug admin page rendering', async ({ page }) => {
  // Mock auth
  await page.goto('http://localhost:3000/signin')
  await page.evaluate(() => {
    localStorage.setItem('supabase-auth-token', JSON.stringify({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      user: { 
        id: 'mock-user-id', 
        email: 'admin@example.com',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
    }))
  })
  
  // Go to the page
  await page.goto('http://localhost:3000/courses/admin')
  await page.waitForLoadState('networkidle')
  
  // Take screenshot
  await page.screenshot({ path: 'admin-page-debug.png', fullPage: true })
  
  // Check if we got redirected
  const currentUrl = page.url()
  console.log('Current URL:', currentUrl)
  
  // Check page content
  const content = await page.textContent('body')
  console.log('Page content (first 500 chars):', content?.substring(0, 500))
  
  // Check for any buttons
  const buttons = await page.$$('button')
  console.log('Number of buttons found:', buttons.length)
  
  for (const button of buttons) {
    const text = await button.textContent()
    console.log('Button text:', text?.trim())
  }
})