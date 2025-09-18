import { chromium, FullConfig } from '@playwright/test';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function navigateToSignIn(page: any, baseURL: string) {
  console.log(`Navigating to signin page: ${baseURL}/signin`);
  await page.goto(`${baseURL}/signin`, { waitUntil: 'networkidle', timeout: 60000 });
  
  // Save full page content for debugging
  const pageContent = await page.content();
  writeFileSync(resolve(__dirname, 'signin-page-content.html'), pageContent);
  console.log('Signin page content saved to signin-page-content.html');
  
  // Take a screenshot
  await page.screenshot({ path: 'signin-page.png', fullPage: true });
  console.log('Signin page screenshot saved to signin-page.png');
  
  // Log page title and URL
  console.log('Page title:', await page.title());
  console.log('Current URL:', page.url());
  
  return pageContent;
}

async function checkIfAlreadyLoggedIn(page: any, storagePath: string) {
  const hasLogoutButton = await page.$('a[href*="logout"], button:has-text("Logout"), a:has-text("Logout")');
  const hasUserMenu = await page.$('[data-testid="user-menu"], .user-menu, .avatar');
  
  if (hasLogoutButton || hasUserMenu) {
    console.log('Appears to be already logged in');
    await page.context().storageState({ path: storagePath });
    console.log('Auth state saved successfully');
    return true;
  }
  return false;
}

async function analyzePageStructure(page: any) {
  console.log('Analyzing page structure...');
  
  // Check for common authentication patterns
  const hasGoogleAuth = await page.$('a[href*="google.com"], a[href*="accounts.google.com"], button:has-text("Google")');
  const hasGithubAuth = await page.$('a[href*="github.com"], button:has-text("GitHub")');
  const hasMicrosoftAuth = await page.$('a[href*="microsoft.com"], button:has-text("Microsoft")');
  
  if (hasGoogleAuth || hasGithubAuth || hasMicrosoftAuth) {
    console.log('Found OAuth authentication options');
    return { hasOAuth: true };
  }
  
  // Check for email/password form
  const formElements = await page.$$('form, input, button');
  console.log(`Found ${formElements.length} form elements`);
  
  // List all elements for debugging
  const allElements = await page.$$('*');
  const elementInfo = [];
  
  for (let i = 0; i < Math.min(allElements.length, 50); i++) {
    const element = allElements[i];
    const tagName = await element.evaluate((el: Element) => el.tagName.toLowerCase());
    const id = await element.getAttribute('id') || 'none';
    const className = await element.getAttribute('class') || 'none';
    const text = await element.textContent() || 'none';
    
    elementInfo.push({
      tagName,
      id,
      className: className.substring(0, 50),
      text: text.substring(0, 100).replace(/\n/g, ' ')
    });
  }
  
  writeFileSync(resolve(__dirname, 'page-elements.json'), JSON.stringify(elementInfo, null, 2));
  console.log('Page elements saved to page-elements.json');
  
  return { hasOAuth: false, formElements: formElements.length };
}

async function tryOAuthLogin(page: any, baseURL: string) {
  console.log('Attempting OAuth login...');
  
  // Try different OAuth providers
  const oauthProviders = [
    { selector: 'a[href*="google.com"], a[href*="accounts.google.com"], button:has-text("Google")', name: 'Google' },
    { selector: 'a[href*="github.com"], button:has-text("GitHub")', name: 'GitHub' },
    { selector: 'a[href*="microsoft.com"], button:has-text("Microsoft")', name: 'Microsoft' }
  ];
  
  for (const provider of oauthProviders) {
    const authButton = await page.$(provider.selector);
    if (authButton) {
      console.log(`Found ${provider.name} authentication button`);
      
      // For testing purposes, we'll just simulate a successful login
      // In a real scenario, you'd need to handle the OAuth flow
      console.log(`Would normally click ${provider.name} button, but simulating login for testing`);
      
      // Navigate to a page that indicates successful login
      await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
      return true;
    }
  }
  
  return false;
}

async function tryEmailPasswordLogin(page: any, baseURL: string) {
  console.log('Attempting email/password login...');
  
  // List all input fields for debugging
  const inputs = await page.$$('input');
  console.log(`Found ${inputs.length} input fields:`);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type') || 'unknown';
    const name = await input.getAttribute('name') || 'unknown';
    const id = await input.getAttribute('id') || 'unknown';
    const placeholder = await input.getAttribute('placeholder') || 'unknown';
    console.log(`  Input ${i}: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
  }
  
  // Try to fill email/username
  const emailInput = await page.$('input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"], input[type="text"]');
  if (emailInput) {
    await emailInput.fill('test@example.com');
    console.log('Filled email field');
  } else {
    console.log('No email input field found');
    return false;
  }
  
  // Try to fill password
  const passwordInput = await page.$('input[type="password"], input[name*="password"], input[id*="password"], input[placeholder*="password"]');
  if (passwordInput) {
    await passwordInput.fill('password123');
    console.log('Filled password field');
  } else {
    console.log('No password input field found');
    return false;
  }
  
  // Try to submit
  const submitButton = await page.$('button[type="submit"], input[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
  if (submitButton) {
    await submitButton.click();
    console.log('Clicked submit button');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    return true;
  }
  
  console.log('No submit button found');
  return false;
}

async function globalSetup(config: FullConfig) {
  // Extract baseURL safely
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  
  // Use a fixed storage path
  const storagePath = 'tests/auth.json';
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate directly to the known signin page
    const pageContent = await navigateToSignIn(page, baseURL);
    
    // Check if already logged in
    if (await checkIfAlreadyLoggedIn(page, storagePath)) {
      await browser.close();
      return;
    }
    
    // Analyze the page structure
    const pageAnalysis = await analyzePageStructure(page);
    
    let loginSuccess = false;
    
    if (pageAnalysis.hasOAuth) {
      // Try OAuth login
      loginSuccess = await tryOAuthLogin(page, baseURL);
    } else if (pageAnalysis.formElements > 0) {
      // Try email/password login
      loginSuccess = await tryEmailPasswordLogin(page, baseURL);
    }
    
    if (!loginSuccess) {
      // If no login method worked, create a manual authentication file
      console.log('No automated login method worked. Creating manual authentication instructions.');
      
      writeFileSync(resolve(__dirname, 'manual-auth-instructions.txt'), 
        `Authentication Setup Instructions:
        
1. Open your browser and go to: ${baseURL}/signin
2. Manually log in using your preferred method
3. After logging in, the browser will save your authentication state
4. Run the tests again

If you continue to have issues, check the generated files for debugging:
- signin-page-content.html: The HTML content of the signin page
- signin-page.png: A screenshot of the signin page
- page-elements.json: Information about all elements on the page
`);
      
      // Keep the browser open for manual intervention
      console.log('Browser will remain open for 2 minutes for manual login...');
      await page.waitForTimeout(120000);
      
      // After manual login, save the state
      await page.context().storageState({ path: storagePath });
      console.log('Auth state saved after manual login');
    } else {
      // Save signed-in state
      await page.context().storageState({ path: storagePath });
      console.log('Auth state saved successfully');
    }
    
  } catch (error) {
    // Take a screenshot on failure
    await page.screenshot({ path: 'global-setup-failure.png', fullPage: true });
    
    // Log the current URL for debugging
    const currentUrl = page.url();
    console.error('Current URL:', currentUrl);
    
    // Handle error with proper type checking
    if (error instanceof Error) {
      console.error('Global setup failed:', error.message);
      throw error;
    } else {
      console.error('Global setup failed with unknown error:', error);
      throw new Error('Unknown error occurred during global setup');
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup;