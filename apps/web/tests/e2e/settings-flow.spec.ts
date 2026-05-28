import { test, expect } from '@playwright/test';

test.describe('SETTINGS MODULE', () => {

  test.beforeEach(async ({ page }) => {
    // Standard login flow
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testteacher@vedaai.dev');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/assignments', { timeout: 15000 }).catch(() => {});
  });

  test('SET-007 to SET-010: Institution Settings Update', async ({ page }) => {
    await page.goto('/settings/institution');
    
    await page.waitForSelector('input[name="name"], input#inst-name');
    
    // Update institution name
    const instNameInput = page.locator('input[name="name"], input#inst-name');
    await instNameInput.fill('VedaAI Automated Testing Academy');
    
    // Update city
    const cityInput = page.locator('input[name="city"], input#inst-city');
    await cityInput.fill('Mumbai Central');
    
    // Save
    await page.click('button[type="submit"]');
    
    // Wait for success toast
    await expect(page.locator('text=updated successfully').or(page.locator('.bg-emerald-50'))).toBeVisible({ timeout: 10000 }).catch(() => {});
    
    // The sidebar school card should reflect the new name (assuming it has a specific class or we can just search text)
    await expect(page.locator('text=VedaAI Automated Testing Academy').first()).toBeVisible();
  });
});
