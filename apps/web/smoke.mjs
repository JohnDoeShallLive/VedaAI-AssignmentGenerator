import { chromium } from 'playwright';

(async () => {
  console.log('Starting Smoke Test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to /login...');
    await page.goto('http://localhost:3000/login');
    
    console.log('Waiting for login form...');
    await page.waitForSelector('input[name="email"]');
    
    console.log('Filling out credentials...');
    // We will use the test teacher account from TESTING.md
    await page.fill('input[name="email"]', 'testteacher@vedaai.dev');
    await page.fill('input[name="password"]', 'Test@12345');
    
    await page.waitForTimeout(2000);
    
    console.log('Submitting login...');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for navigation or error...');
    await Promise.race([
      page.waitForURL('**/assignments', { timeout: 15000 }),
      page.waitForURL('**/onboarding', { timeout: 15000 }),
      page.waitForSelector('.bg-red-50', { timeout: 15000 }) // Error message box
    ]);
    
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    const errorBox = await page.$('.bg-red-50');
    if (errorBox) {
      const errorText = await errorBox.textContent();
      console.log(`Login Failed with Error: ${errorText}`);
    } else {
      console.log('Login Successful! Cookie and redirect worked.');
      
      // Let's check for __session cookie
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name === '__session');
      if (sessionCookie) {
        console.log('__session cookie found:', sessionCookie.value.substring(0, 20) + '...');
      } else {
        console.log('WARNING: __session cookie NOT found!');
      }
    }
  } catch (err) {
    console.error('Smoke test encountered an error:', err);
  } finally {
    await browser.close();
  }
})();
