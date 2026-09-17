const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function main() {
  console.log('Launching Chrome with Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\\Google\\\Chrome\\\Application\\\chrome.exe',
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized'
    ]
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.setViewport({ width: 1280, height: 900 });

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
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  const imagePath = 'C:\\\Users\\\lenovo\\\.gemini\\\antigravity\\\brain\\\dabfe1ce-557b-4603-8bc4-4c65a98294ac\\\.user_uploaded\\\media_1789575877647.png';
  console.log('Target Image Path:', imagePath, 'Exists:', fs.existsSync(imagePath));

  // Find Create button
  console.log('Looking for Create / New Post button...');
  const createClicked = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg'));
    for (const svg of svgs) {
      const label = svg.getAttribute('aria-label');
      if (label === 'New post' || label === 'Create' || label === 'New Post') {
        const clickable = svg.closest('a') || svg.closest('div['role="button"]') || svg;
        clickable.click();
        return true;
      }
    }
    const spans = Array.from(document.querySelectorAll('span, a, div'));
    for (const el of spans) {
      if (el.innerText && (el.innerText.trim() === 'Create' || el.innerText.trim() === 'New post')) {
        el.click();
        return true;
      }
    }
    return false;
  });

  console.log('Create clicked:', createClicked);
  await new Promise(r => setTimeout(r, 3000));

  // Look for file input
  console.log('Checking for file input...');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    console.log('Found file input! Uploading image...');
    await fileInput.uploadFile(imagePath);
    await new Promise(r => setTimeout(r, 4000));

    async function clickButtonWithText(targetText) {
      return await page.evaluate((textToFind) => {
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span'));
        for (const b of buttons) {
          if (b.innerText && b.innerText.trim().lowerCase() === textToFind.toLowerCase()) {
            b.click();
            return true;
          }
        }
        return false;
      }, targetText);
    }

    // Step 1: Click "Next" on Crop modal
    console.log('Clicking Next (1/2)...');
    await clickButtonWithText('Next');
    await new Promise(r => setTimeout(r, 3000));

    // Step 2: Click "Next" on Filters modal
    console.log('Clicking Next (2/2)...');
    await clickButtonWithText('Next');
    await new Promise(r => setTimeout(r, 3000));

    // Step 3: Type Caption into textbox
    console.log('Typing Caption...');
    const captionBox = await page.$('div[aria-label="Write a caption..."], div['role="textbox"]');
    if (captionBox) {
      await captionBox.click();
      const captionText = 'SMART MONEY CONCEPT & LIQUIDITY HUNT EXPLAINED!\n\n1-Day & 1-Week Liquidity Hunt confirmation ke baad fresh big buyer entry!\n\n#PriceAction #SmartMoneyConcepts #TradingStrategy #StockMarketIndia #LiquidityHunt';
      await page.keyboard.type(captionText, { delay: 25 });
    }

    await new Promise(r => setTimeout(r, 2000));

    // Step 4: Click "Share"
    console.log('Clicking Share button...');
    const shared = await clickButtonWithText('Share');
    console.log('Share button clicked:', shared);

    console.log('Waiting 15 seconds for upload to complete on Instagram servers...');
    await new Promise(r => setTimeout(r, 15000));

    console.log('Done! Check Instagram profile.');
  } else {
    console.log('File input not found.');
  }

  await browser.close();
}

main().catch(err => console.error('Upload Error:', err));
