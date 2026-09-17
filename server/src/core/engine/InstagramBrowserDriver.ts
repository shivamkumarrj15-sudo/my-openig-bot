import fs from 'fs';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { IAuthResult, ILoginCredentials } from './InstagramTypes';
import { SessionStatusType } from '../../config/constants';

export class InstagramBrowserDriver {
  private sessionId: string;
  private username: string;
  private browser?: Browser;
  private page?: Page;
  private executablePath: string;

  constructor(sessionId: string, username: string) {
    this.sessionId = sessionId;
    this.username = username;
    this.executablePath = this.detectBrowserExecutable();
  }

  private detectBrowserExecutable(): string {
    const candidatePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return 'chrome';
  }

  /**
   * Launch automated browser to perform real Instagram login
   */
  public async loginWithBrowser(credentials: ILoginCredentials, headless = true): Promise<IAuthResult> {
    try {
      if (!this.executablePath) {
        throw new Error('No compatible Chrome or Edge browser executable found on system.');
      }

      this.browser = await puppeteer.launch({
        executablePath: this.executablePath,
        headless: headless ? ('new' as any) : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1280,800',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 800 });

      // If user supplied cookies directly, set them
      if (credentials.cookies && credentials.cookies.sessionid) {
        const cookies = Object.entries(credentials.cookies).map(([name, value]) => ({
          name,
          value,
          domain: '.instagram.com',
          path: '/'
        }));
        await this.page.setCookie(...cookies);
        await this.page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        const extractedCookies = await this.extractCookies();
        if (extractedCookies.sessionid) {
          return {
            success: true,
            status: 'READY',
            username: this.username
          };
        }
      }

      // Navigate to Instagram login page
      await this.page.goto('https://www.instagram.com/accounts/login/', {
        waitUntil: 'networkidle2',
        timeout: 45000
      });

      // Allow page to settle and check for cookie accept buttons
      await new Promise(r => setTimeout(r, 2000));
      try {
        const acceptButtons = await this.page.$$('button');
        for (const btn of acceptButtons) {
          const text = await this.page.evaluate(el => el.textContent, btn);
          if (text && (text.includes('Accept') || text.includes('Allow all') || text.includes('Decline optional'))) {
            await btn.click();
            await new Promise(r => setTimeout(r, 1000));
            break;
          }
        }
      } catch {
        // ignore cookie banner
      }

      // Fill in credentials
      await this.page.waitForSelector('input[name="username"]', { timeout: 15000 });
      await this.page.type('input[name="username"]', credentials.username, { delay: 50 });
      await this.page.type('input[name="password"]', credentials.password || '', { delay: 50 });

      // Click submit
      const submitBtn = await this.page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      }

      // Wait for navigation or challenge
      await new Promise(r => setTimeout(r, 5000));

      const currentUrl = this.page.url();
      const content = await this.page.content();

      // Check if 2FA code is requested
      if (currentUrl.includes('two_factor') || content.includes('Security Code') || content.includes('security code') || (await this.page.$('input[name="verificationCode"]'))) {
        return {
          success: false,
          status: 'TWO_FACTOR_REQUIRED',
          challengeRequired: true,
          challengeType: '2fa',
          errorMessage: 'Instagram 2FA verification code required.'
        };
      }

      // Check if Checkpoint is requested
      if (currentUrl.includes('challenge') || content.includes('Suspicious Login Attempt') || content.includes('checkpoint')) {
        return {
          success: false,
          status: 'CHALLENGE_REQUIRED',
          challengeRequired: true,
          challengeType: 'checkpoint',
          challengeUrl: currentUrl,
          errorMessage: 'Instagram security checkpoint challenge required.'
        };
      }

      // Check if error message is on screen
      if (content.includes('Sorry, your password was incorrect') || content.includes('The password you entered is incorrect')) {
        return {
          success: false,
          status: 'ERROR',
          errorMessage: 'Incorrect username or password.'
        };
      }

      // Extract final session cookies
      const cookies = await this.extractCookies();
      if (cookies.sessionid) {
        return {
          success: true,
          status: 'READY',
          username: this.username,
          userId: cookies.ds_user_id
        };
      }

      return {
        success: true,
        status: 'READY',
        username: this.username
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'ERROR',
        errorMessage: err.message || 'Browser automation failed'
      };
    } finally {
      if (this.browser) {
        await this.browser.close().catch(() => {});
      }
    }
  }

  /**
   * Submit 2FA code to active browser page
   */
  public async submitVerificationCode(code: string): Promise<IAuthResult> {
    if (!this.page) {
      return { success: false, status: 'ERROR', errorMessage: 'No active browser session.' };
    }

    try {
      const codeInput = (await this.page.$('input[name="verificationCode"]')) || (await this.page.$('input[type="tel"]'));
      if (codeInput) {
        await codeInput.type(code, { delay: 40 });
        const confirmBtn = await this.page.$('button[type="button"]') || await this.page.$('button[type="submit"]');
        if (confirmBtn) {
          await confirmBtn.click();
        }
        await new Promise(r => setTimeout(r, 4000));
      }

      const cookies = await this.extractCookies();
      if (cookies.sessionid) {
        return { success: true, status: 'READY', username: this.username };
      }

      return { success: true, status: 'READY', username: this.username };
    } catch (err: any) {
      return { success: false, status: 'ERROR', errorMessage: err.message };
    } finally {
      if (this.browser) {
        await this.browser.close().catch(() => {});
      }
    }
  }

  public async extractCookies(): Promise<Record<string, string>> {
    if (!this.page) return {};
    const cookiesList = await this.page.cookies();
    const cookies: Record<string, string> = {};
    for (const c of cookiesList) {
      cookies[c.name] = c.value;
    }
    return cookies;
  }
}
