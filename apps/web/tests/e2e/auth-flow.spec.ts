import { test, expect } from '@playwright/test';

test.describe('AUTH FLOWS', () => {
  
  test('AUTH-008: Successful login redirects to onboarding or assignments', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'testteacher@vedaai.dev');
    await page.fill('input[name="password"]', 'Test@12345');
    
    // Allow React to hydrate
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    
    // Expect redirection
    await Promise.race([
      expect(page).toHaveURL(/.*\/assignments/),
      expect(page).toHaveURL(/.*\/onboarding/)
    ]);
  });

  test('AUTH-009: Invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'testteacher@vedaai.dev');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    
    // Expect error toast or error message box
    const errorBox = page.locator('.bg-red-50');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText(/Invalid|Error|credential/i);
  });
  
  test('AUTH-013: Protected routes bounce unauthenticated users', async ({ page }) => {
    // Clear any potential cookies
    await page.context().clearCookies();
    
    // Attempt direct access
    await page.goto('/assignments');
    
    // Expect middleware redirect
    await expect(page).toHaveURL(/.*\/login/);
  });
});
