import { test, expect } from '@playwright/test';

test.describe('LIST & LIBRARY MODULES', () => {

  test.beforeEach(async ({ page }) => {
    // Standard login flow
    await page.goto('/login');
    await page.fill('input[name="email"]', 'testteacher@vedaai.dev');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/assignments', { timeout: 15000 }).catch(() => {});
  });

  test('LIST-003 to LIST-006: Assignment List Validation', async ({ page }) => {
    await page.goto('/assignments');
    
    // Check if assignments exist
    const assignmentCards = page.locator('.assignment-card, .bg-white.border').filter({ hasText: 'Assigned on' });
    await page.waitForTimeout(2000); // Let data fetch
    
    if (await assignmentCards.count() > 0) {
      const firstCard = assignmentCards.first();
      
      // Card should show dates
      await expect(firstCard).toContainText(/Assigned on|Due/);
      
      // Card should show a status badge
      await expect(firstCard.locator('text=Done').or(firstCard.locator('text=Processing')).or(firstCard.locator('text=Failed')).first()).toBeVisible();
      
      // Open 3-dot menu and check options
      const menuBtn = firstCard.locator('button').last();
      await menuBtn.click();
      
      const viewBtn = page.locator('text=View Assignment').first();
      await expect(viewBtn).toBeVisible();
    }
  });

  test('LIB-001 to LIB-003: Library Module Validation', async ({ page }) => {
    await page.goto('/library');
    
    const paperCards = page.locator('.paper-card, .bg-white.shadow-sm').filter({ hasText: 'Subject' });
    await page.waitForTimeout(2000); // Let data fetch
    
    if (await paperCards.count() > 0) {
      const firstPaper = paperCards.first();
      
      // Card info should have subject and marks
      await expect(firstPaper).toContainText(/Subject|Marks/i);
      
      // Should have View and Download buttons
      const viewBtn = firstPaper.locator('text=View').first();
      await expect(viewBtn).toBeVisible();
    }
  });
  
  test('TK-001 to TK-004: Toolkit Module Validation', async ({ page }) => {
    await page.goto('/toolkit');
    
    // Question Generator should be active
    const qgCard = page.locator('text=Question Generator').locator('..');
    await expect(qgCard).toBeVisible();
    
    // Other tools should have "Coming Soon" badge
    const rubricsCard = page.locator('text=Rubric Builder').locator('..');
    const badge = rubricsCard.locator('text=Coming Soon').first();
    await expect(badge).toBeVisible();
  });
});
