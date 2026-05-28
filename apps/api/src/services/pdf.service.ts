import puppeteer from 'puppeteer';

export async function generatePDF(assignmentId: string, sessionToken?: string): Promise<Buffer> {
  console.log(`[pdf-service]: Starting Puppeteer PDF rendering for assignment ${assignmentId}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const targetUrl = `${frontendUrl}/assignments/${assignmentId}/result?print=true`;
    
    // Inject NextAuth session token cookies to authenticate Puppeteer headless browser securely
    if (sessionToken) {
      const hostname = new URL(frontendUrl).hostname;
      const cookieNames = ['__session'];
      
      for (const name of cookieNames) {
        await page.setCookie({
          name,
          value: sessionToken,
          domain: hostname,
          path: '/',
        });
      }
      console.log('[pdf-service]: Authenticated session cookie successfully injected into Puppeteer context');
    }

    console.log(`[pdf-service]: Navigating to result page: ${targetUrl}`);
    
    // Go to the printed layout route and wait until network is completely idle
    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 20000, // 20s timeout
    });

    // Emulate screen media to ensure printed look is captured
    await page.emulateMediaType('print');

    console.log('[pdf-service]: Exporting page to PDF buffer...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
    });

    console.log('[pdf-service]: PDF buffer generated successfully');
    return Buffer.from(pdfBuffer);
  } catch (error: any) {
    console.error('[pdf-service]: Puppeteer rendering failed:', error.message || error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
