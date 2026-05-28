import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Starting Flow Test...');
    await page.goto('http://localhost:3000/login');
    
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', 'testteacher@vedaai.dev');
    await page.fill('input[name="password"]', 'Test@12345');
    await page.waitForTimeout(2000);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/onboarding', { timeout: 15000 });
    console.log('Onboarding reached. Filling out form...');
    
    // Fill onboarding if necessary
    try {
        await page.fill('input[name="institutionName"]', 'VedaAI Test School');
        await page.selectOption('select[name="role"]', 'Teacher');
        await page.fill('input[name="phone"]', '1234567890');
        await page.click('button:has-text("Complete Setup")');
        await page.waitForURL('**/assignments', { timeout: 15000 });
        console.log('Onboarding completed!');
    } catch(e) {
        console.log('Already onboarded or different form, proceeding...');
        await page.goto('http://localhost:3000/create');
    }

    console.log('Navigating to Create Assignment...');
    await page.goto('http://localhost:3000/create');
    await page.waitForSelector('input[name="title"]');
    
    await page.fill('input[name="title"]', 'Test Smoke Assignment');
    await page.selectOption('select[name="subject"]', 'Science');
    await page.fill('input[name="className"]', '10th Grade');
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[name="dueDate"]', dateString);
    
    await page.waitForTimeout(1000);
    console.log('Submitting assignment creation...');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for Generation page redirect or WebSockets...');
    await page.waitForURL('**/result', { timeout: 45000 });
    
    console.log('Flow Test Successful! Generation triggered and result page loaded.');
  } catch (error) {
    console.error('Flow test encountered an error:', error);
  } finally {
    await browser.close();
  }
})();
