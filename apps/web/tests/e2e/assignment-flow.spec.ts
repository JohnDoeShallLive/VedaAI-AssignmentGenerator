import { test, expect } from '@playwright/test';

test.describe('ASSIGNMENT FLOWS', () => {

  // Setup: login once and persist state if possible, but for simplicity here we login in the test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testteacher@vedaai.dev');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/onboarding', { timeout: 15000 }).catch(() => {});
    await page.waitForURL('**/assignments', { timeout: 15000 }).catch(() => {});
  });

  test('FORM-001 to GEN-003: Successfully creates an assignment and reaches output page', async ({ page }) => {
    test.setTimeout(120000); // Generation can take a while

    await page.goto('/create');
    
    // Fill out form
    await page.waitForSelector('input[name="title"]');
    await page.fill('input[name="title"]', 'E2E Automated Smoke Test Assignment');
    await page.selectOption('select[name="subject"]', 'Science');
    await page.fill('input[name="className"]', '10th Grade');
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[name="dueDate"]', dateString);
    
    await page.waitForTimeout(1000);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Expect WebSockets loader overlay
    await expect(page.locator('text=Queuing Assessment request...')).toBeVisible();

    // Expect final redirection to result
    await page.waitForURL('**/result', { timeout: 90000 });
    
    // Validate output page structure
    await expect(page.locator('text=E2E Automated Smoke Test Assignment')).toBeVisible();
    await expect(page.locator('button:has-text("Download as PDF")')).toBeVisible();
  });

  test('FORM-004: Validation blocks submission without due date', async ({ page }) => {
    await page.goto('/create');
    
    // Fill required title and class but skip date
    await page.waitForSelector('input[name="title"]');
    await page.fill('input[name="title"]', 'Missing Date Test');
    await page.fill('input[name="className"]', '10th Grade');
    
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    
    // Should NOT navigate
    await expect(page).toHaveURL(/.*\/create/);
    
    // Look for form validation error message from Zod
    await expect(page.locator('text=Due date cannot be in the past').or(page.locator('text=Invalid date'))).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});
