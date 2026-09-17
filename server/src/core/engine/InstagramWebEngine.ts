import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { config } from '../../config';
import { db } from '../../storage/DatabaseAdapter';
import { IAuthResult } from './InstagramTypes';

export class InstagramWebEngine {
  private static instance: InstagramWebEngine;
  private activeBrowsers: Map<string, Browser> = new Map();
  private activePages: Map<string, Page> = new Map();

  private constructor() {}

  public static getInstance(): InstagramWebEngine {
    if (!InstagramWebEngine.instance) {
      InstagramWebEngine.instance = new InstagramWebEngine();
    }
    return InstagramWebEngine.instance;
  }

  public detectBrowserExecutable(): string {
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

  public getSessionProfileDir(sessionId: string): string {
    const dir = path.join(config.dataDir, 'sessions', sessionId, 'browser_profile');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * 1-Click Launch Real Interactive Chrome Window for Human Login
   * (Matches OpenWA browser authentication)
   */
  public launchInteractiveWindow(sessionId: string): { success: boolean; message: string } {
    const executable = this.detectBrowserExecutable();
    const profileDir = this.getSessionProfileDir(sessionId);

    try {
      const chromeProcess = spawn(
        executable,
        [
          `--user-data-dir=${profileDir}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          'https://www.instagram.com/'
        ],
        { detached: true, stdio: 'ignore' }
      );
      chromeProcess.unref();

      db.addAuditLog({
        level: 'info',
        category: 'session',
        sessionId,
        message: 'Launched interactive Chrome window for Instagram authentication.'
      });

      return {
        success: true,
        message: 'Chrome window launched! Please log into Instagram in the opened browser. Your session will be saved permanently.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to launch browser: ${err.message}`
      };
    }
  }

  /**
   * Launch / Connect Headless Persistent Browser for Session
   */
  public async getOrCreateBrowser(sessionId: string, headless = true): Promise<{ browser: Browser; page: Page }> {
    let browser = this.activeBrowsers.get(sessionId);
    let page = this.activePages.get(sessionId);

    if (browser && page && !page.isClosed()) {
      return { browser, page };
    }

    const executable = this.detectBrowserExecutable();
    const profileDir = this.getSessionProfileDir(sessionId);

    browser = await puppeteer.launch({
      executablePath: executable,
      userDataDir: profileDir,
      headless: headless ? ('new' as any) : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=1280,800',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      ]
    });

    const pages = await browser.pages();
    page = pages.length > 0 ? pages[0] : await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    this.activeBrowsers.set(sessionId, browser);
    this.activePages.set(sessionId, page);

    return { browser, page };
  }

  /**
   * Sync Session & Check Authenticated State
   */
  public async syncSessionState(sessionId: string): Promise<IAuthResult> {
    try {
      const { page } = await this.getOrCreateBrowser(sessionId, true);
      await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 35000 });

      const cookies = await page.cookies();
      const cookieMap: Record<string, string> = {};
      for (const c of cookies) {
        cookieMap[c.name] = c.value;
      }

      if (cookieMap.sessionid) {
        const session = db.getSession(sessionId);
        if (session) {
          session.status = 'READY';
          session.cookies = cookieMap;
          session.userDataDir = this.getSessionProfileDir(sessionId);
          db.upsertSession(session);
        }

        return {
          success: true,
          status: 'READY',
          userId: cookieMap.ds_user_id
        };
      }

      return {
        success: false,
        status: 'DISCONNECTED',
        errorMessage: 'Not logged into Instagram in browser profile.'
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'ERROR',
        errorMessage: err.message
      };
    }
  }

  /**
   * Capture Live Browser Screenshot for Web Dashboard
   */
  public async captureScreenshot(sessionId: string): Promise<string | null> {
    try {
      const { page } = await this.getOrCreateBrowser(sessionId, true);
      const buffer = await (page as any).screenshot({ type: 'jpeg', quality: 80 });
      return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
    } catch (err) {
      return null;
    }
  }

  /**
   * Upload Real Live Post to Instagram
   */
  public async uploadRealPost(sessionId: string, filePath: string, caption: string): Promise<{ success: boolean; message: string }> {
    const session = db.getSession(sessionId);
    const cookies = session?.cookies;

    try {
      const { page } = await this.getOrCreateBrowser(sessionId, true);

      if (cookies && cookies.sessionid) {
        await page.setCookie(
          {
            name: 'sessionid',
            value: cookies.sessionid,
            domain: '.instagram.com',
            path: '/',
            httpOnly: true,
            secure: true
          },
          {
            name: 'ds_user_id',
            value: cookies.ds_user_id || '29180762911',
            domain: '.instagram.com',
            path: '/',
            secure: true
          }
        );
      }

      await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await new Promise(r => setTimeout(r, 5000));

      // Dismiss dialogs
      try {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, div[role="button"]')) as HTMLElement[];
          for (const b of buttons) {
            const t = (b.innerText || '').trim().toLowerCase();
            if (t === 'not now' || t === 'cancel' || t === 'dismiss') {
              b.click();
            }
          }
        });
      } catch (e) {}

      // Click Create button
      await page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('svg'));
        for (const svg of svgs) {
          const label = svg.getAttribute('aria-label');
          if (label && (label.toLowerCase().includes('new post') || label.toLowerCase().includes('create'))) {
            const parent = (svg.closest('a') || svg.closest('div[role="button"]') || svg) as HTMLElement;
            if (parent && typeof parent.click === 'function') {
              parent.click();
              return;
            }
          }
        }
        const elements = Array.from(document.querySelectorAll('a, button, span, div')) as HTMLElement[];
        for (const el of elements) {
          if (el.innerText && el.innerText.trim() === 'Create') {
            el.click();
            return;
          }
        }
      });

      await new Promise(r => setTimeout(r, 4000));

      const fileInput = await page.$('input[type="file"]');
      if (!fileInput) {
        return { success: false, message: 'Could not find file input on Instagram' };
      }

      await fileInput.uploadFile(filePath);
      await new Promise(r => setTimeout(r, 4000));

      const clickBtn = async (text: string) => {
        await page.evaluate((t) => {
          const btns = Array.from(document.querySelectorAll('button, div[role="button"], span')) as HTMLElement[];
          for (const b of btns) {
            if (b.innerText && b.innerText.trim().toLowerCase() === t.toLowerCase()) {
              b.click();
              return;
            }
          }
        }, text);
      };

      // Next (Crop)
      await clickBtn('Next');
      await new Promise(r => setTimeout(r, 3000));

      // Next (Filter)
      await clickBtn('Next');
      await new Promise(r => setTimeout(r, 3000));

      // Caption
      const captionBox = await page.$('div[aria-label="Write a caption..."], div[role="textbox"]');
      if (captionBox && caption) {
        await captionBox.click();
        await page.keyboard.type(caption, { delay: 20 });
      }

      await new Promise(r => setTimeout(r, 2000));

      // Share
      await clickBtn('Share');
      await new Promise(r => setTimeout(r, 15000));

      return { success: true, message: 'Post successfully published on Instagram!' };
    } catch (err: any) {
      return { success: false, message: `Live upload error: ${err.message}` };
    }
  }

  public async closeBrowser(sessionId: string): Promise<void> {
    const browser = this.activeBrowsers.get(sessionId);
    if (browser) {
      await browser.close().catch(() => {});
      this.activeBrowsers.delete(sessionId);
      this.activePages.delete(sessionId);
    }
  }
}

export const instagramWebEngine = InstagramWebEngine.getInstance();
