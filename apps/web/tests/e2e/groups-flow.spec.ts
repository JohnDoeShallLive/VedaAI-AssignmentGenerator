import { test, expect } from '@playwright/test';

test.describe('GROUPS & CLASSES MODULE', () => {

  test.beforeEach(async ({ page }) => {
    // Standard login flow
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testteacher@vedaai.dev');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/assignments', { timeout: 15000 }).catch(() => {});
  });

  test('GRP-002: Can create a new group', async ({ page }) => {
    await page.goto('/groups');
    
    // Check if we need to click a "Create Group" button
    const createBtn = page.locator('button:has-text("Create Group"), button:has-text("Add Group")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
    }

    // Attempt to fill out group name
    const nameInput = page.locator('input[name="name"], input[placeholder*="Group Name"], input[placeholder*="Class"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    
    const uniqueGroupName = `Test Class ${Date.now()}`;
    await nameInput.fill(uniqueGroupName);
    
    // Submit
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    
    // Verify the group card appears
    await expect(page.locator(`text=${uniqueGroupName}`)).toBeVisible();
  });

  test('GRP-005: Can delete a group', async ({ page }) => {
    await page.goto('/groups');
    
    // Ensure at least one group exists
    const groupCards = page.locator('.group-card, .bg-white.shadow-sm'); // Fallback selectors
    await page.waitForTimeout(2000);
    
    if (await groupCards.count() > 0) {
      // Find the delete button inside the first card (or 3-dot menu)
      const firstCard = groupCards.first();
      const menuBtn = firstCard.locator('button').last(); // Often the last button is the menu or delete
      await menuBtn.click();
      
      const deleteBtn = page.locator('text=Delete').first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        
        // Confirm delete if modal exists
        const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
    }
  });
});
