const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Testing Playwright browser launch...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  
  await context.addCookies([
    {
      name: 'sessionid',
      value: '29180762911%3A8GHBcWmlbEFceL%3A23%3AAYlJwNdrLqQwzCb8JiwPoU_CJ_3y6CJGmzFfRNHACg',
      domain: '.instagram.com',
      path: '/',
      httpOnly: true,
      secure: true
    },
    {
      name: 'ds_user_id',
      value: '29180762911',
      domain: '.instagram.com',
      path: '/',
      secure: true
    }
  ]);

  const page = await context.newPage();
  console.log('Navigating to Instagram...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle', timeout: 45000 });
  
  const currentUrl = page.url();
  console.log('Page URL:', currentUrl);

  // Take screenshot for debug
  await page.screenshot({ path: 'ig_login_check.png' });
  console.log('Screenshot saved to ig_login_check.png');

  await browser.close();
}

main().catch(err => console.error('Error:', err));
