import { test } from '@playwright/test';

test('Capture homepage screenshot', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.screenshot({ 
    path: 'homepage-screenshot.png',
    fullPage: true
  });
});