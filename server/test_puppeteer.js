const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Launching System Chrome with Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ]
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  
  await page.setCookie(
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
  );

  console.log('Navigating to Instagram...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 45000 });
  
  console.log('Current URL:', page.url());
  
  // Wait 10 seconds to inspect
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
}

main().catch(err => console.error('Error:', err));
