// tests/debug.spec.ts
import { test } from '@playwright/test'

test('debug courses admin page', async ({ page }) => {
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
  
  // Take screenshot to see what's there
  await page.screenshot({ path: 'debug-admin-page.png' })
  
  // List all buttons on the page
  const buttons = await page.$$('button')
  console.log('=== BUTTONS ON PAGE ===')
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent()
    console.log(`Button ${i}: "${text}"`)
  }
  
  // List all inputs
  const inputs = await page.$$('input, textarea')
  console.log('=== INPUTS ON PAGE ===')
  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type')
    const name = await inputs[i].getAttribute('name')
    const placeholder = await inputs[i].getAttribute('placeholder')
    console.log(`Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}`)
  }
  
  // Check if we're actually authenticated
  const pageContent = await page.textContent('body')
  console.log('=== PAGE CONTENT ===')
  console.log(pageContent)
})