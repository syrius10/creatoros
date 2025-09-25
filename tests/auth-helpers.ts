// tests/utils/auth-helpers.ts
import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const storagePath = path.resolve(__dirname, '../auth.json');

/**
 * Ensures the user is not signed out. 
 * If auth.json exists, loads it into the browser context.
 */
export async function ensureNotSignedOut(page: Page) {
  if (fs.existsSync(storagePath)) {
    try {
      await page.context().addCookies(
        JSON.parse(fs.readFileSync(storagePath, 'utf-8')).cookies || []
      );
      console.log('✅ Restored cookies from auth.json');
    } catch (err) {
      console.warn('⚠️ Failed to restore cookies from auth.json:', err);
    }
  } else {
    console.warn('⚠️ No auth.json found — user may not be signed in');
  }
}
