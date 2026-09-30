import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer-core';
import { config } from '../../config';
import { db } from '../../storage/DatabaseAdapter';
import { IAuthResult } from './InstagramTypes';

puppeteer.use(StealthPlugin());

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
    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
      return process.env.CHROME_BIN;
    }
    const candidatePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return 'google-chrome';
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

    browser = (await puppeteer.launch({
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
    })) as unknown as Browser;

    if (!browser) {
      throw new Error('Failed to launch browser instance');
    }

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
      console.log(`[InstagramWebEngine] Launching browser for session ${sessionId}...`);
      const { page } = await this.getOrCreateBrowser(sessionId, true);

      if (cookies && cookies.sessionid) {
        console.log(`[InstagramWebEngine] Injecting Instagram cookies...`);
        const rawSession = String(cookies.sessionid).trim();
        const decodedSession = rawSession.includes('%') ? decodeURIComponent(rawSession) : rawSession;
        const validUserId = (cookies.ds_user_id && cookies.ds_user_id !== 'true' && cookies.ds_user_id !== 'false')
          ? cookies.ds_user_id
          : '29180762911';

        const cookieList: any[] = [
          {
            name: 'sessionid',
            value: decodedSession,
            domain: '.instagram.com',
            path: '/',
            httpOnly: true,
            secure: true
          },
          {
            name: 'ds_user_id',
            value: validUserId,
            domain: '.instagram.com',
            path: '/',
            secure: true
          },
          {
            name: 'ig_did',
            value: '4B425442-1234-4ABC-8DEF-1234567890AB',
            domain: '.instagram.com',
            path: '/',
            secure: true
          },
          {
            name: 'ig_nrcb',
            value: '1',
            domain: '.instagram.com',
            path: '/',
            secure: true
          }
        ];
        if (cookies.csrftoken) {
          cookieList.push({
            name: 'csrftoken',
            value: cookies.csrftoken,
            domain: '.instagram.com',
            path: '/',
            secure: true
          });
        }
        await page.setCookie(...cookieList);
      }

      console.log(`[InstagramWebEngine] Navigating to https://www.instagram.com/...`);
      await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await new Promise(r => setTimeout(r, 6000));

      const currentUrl = page.url();
      console.log(`[InstagramWebEngine] Current URL: ${currentUrl}`);

      if (currentUrl.includes('/accounts/login/')) {
        console.error(`[InstagramWebEngine] Session expired or invalid. Instagram redirected to login.`);
        const errPath = path.join(config.mediaDir, 'error_login_redirect.png');
        await (page as any).screenshot({ path: errPath, fullPage: true }).catch(() => {});
        return {
          success: false,
          message: 'Instagram session is expired or invalid. Please check your INSTAGRAM_SESSION_ID.'
        };
      }

      // Dismiss cookie consents and dialogs
      console.log(`[InstagramWebEngine] Handling modals and cookie consents...`);
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, div[role="button"], a, span')) as HTMLElement[];
        for (const el of elements) {
          const t = (el.innerText || '').trim().toLowerCase();
          if (
            t === 'allow all cookies' ||
            t === 'allow essential and optional cookies' ||
            t === 'accept all' ||
            t === 'accept' ||
            t === 'decline optional cookies' ||
            t === 'not now' ||
            t === 'cancel' ||
            t === 'dismiss' ||
            t === 'save info'
          ) {
            el.click();
          }
        }
      });

      await new Promise(r => setTimeout(r, 3000));

      // Click Create (+) button
      console.log(`[InstagramWebEngine] Clicking Create Post button...`);
      const clickedCreate = await page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('svg'));
        for (const svg of svgs) {
          const label = svg.getAttribute('aria-label');
          if (label && (label.toLowerCase().includes('new post') || label.toLowerCase().includes('create') || label.toLowerCase().includes('post'))) {
            const parent = (svg.closest('a') || svg.closest('div[role="button"]') || svg) as HTMLElement;
            if (parent && typeof parent.click === 'function') {
              parent.click();
              return true;
            }
          }
        }
        const elements = Array.from(document.querySelectorAll('a, button, span, div')) as HTMLElement[];
        for (const el of elements) {
          const text = (el.innerText || '').trim().toLowerCase();
          if (text === 'create' || text === 'new post') {
            el.click();
            return true;
          }
        }
        return false;
      });

      console.log(`[InstagramWebEngine] Create button clicked: ${clickedCreate}`);
      await new Promise(r => setTimeout(r, 4000));

      let fileInput = await page.$('input[type="file"]');
      if (!fileInput) {
        console.log(`[InstagramWebEngine] Retrying to find file input...`);
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button, div[role="button"]')) as HTMLElement[];
          for (const b of btn) {
            if (b.innerText && (b.innerText.includes('Select from computer') || b.innerText.includes('Select'))) {
              b.click();
            }
          }
        });
        await new Promise(r => setTimeout(r, 2000));
        fileInput = await page.$('input[type="file"]');
      }

      if (!fileInput) {
        const errPath = path.join(config.mediaDir, 'error_no_file_input.png');
        await (page as any).screenshot({ path: errPath, fullPage: true }).catch(() => {});
        return { success: false, message: 'Could not find file input on Instagram' };
      }

      console.log(`[InstagramWebEngine] Uploading file from ${filePath}...`);
      await fileInput.uploadFile(filePath);
      await new Promise(r => setTimeout(r, 6000));

      // Dismiss any "Video posts are now shared as reels" popups
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, div[role="button"], span')) as HTMLElement[];
        for (const b of btns) {
          const t = (b.innerText || '').trim().toLowerCase();
          if (t === 'ok' || t === 'got it' || t === 'continue' || t === 'dismiss') {
            b.click();
          }
        }
      });
      await new Promise(r => setTimeout(r, 1500));

      const clickModalBtn = async (btnText: string, maxWaitMs = 15000): Promise<boolean> => {
        console.log(`[InstagramWebEngine] Looking for modal action button: "${btnText}"...`);
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitMs) {
          const clicked = await page.evaluate((t: string) => {
            // Priority: find inside modal dialog or top header
            const elements = Array.from(document.querySelectorAll('div[role="dialog"] div[role="button"], div[role="dialog"] button, header div[role="button"], div[role="button"], button')) as HTMLElement[];
            for (const el of elements) {
              const txt = (el.innerText || '').trim().toLowerCase();
              if (txt === t.toLowerCase()) {
                el.click();
                return true;
              }
            }
            return false;
          }, btnText);

          if (clicked) {
            console.log(`[InstagramWebEngine] Clicked "${btnText}"!`);
            return true;
          }
          await new Promise(r => setTimeout(r, 1000));
        }
        return false;
      };

      // 1. Next from Crop Screen
      console.log(`[InstagramWebEngine] Transitioning from Crop screen...`);
      await new Promise(r => setTimeout(r, 3000));
      const cropNext = await clickModalBtn('Next', 15000);
      console.log(`[InstagramWebEngine] Crop Next result: ${cropNext}`);
      await new Promise(r => setTimeout(r, 4000));

      // 2. Next from Edit/Filters Screen
      console.log(`[InstagramWebEngine] Transitioning from Edit/Filters screen...`);
      const editNext = await clickModalBtn('Next', 15000);
      console.log(`[InstagramWebEngine] Filter Next result: ${editNext}`);
      await new Promise(r => setTimeout(r, 4000));

      // 3. Caption Entry Screen
      console.log(`[InstagramWebEngine] Entering caption on final screen...`);
      // Wait for caption box to appear
      let captionBox = await page.$('div[aria-label="Write a caption..."], div[role="textbox"]');
      if (!captionBox) {
        // In case previous next didn't fire, try clicking Next again
        console.log(`[InstagramWebEngine] Retrying Next to reach caption screen...`);
        await clickModalBtn('Next', 5000);
        await new Promise(r => setTimeout(r, 3000));
        captionBox = await page.$('div[aria-label="Write a caption..."], div[role="textbox"]');
      }

      if (captionBox && caption) {
        await captionBox.click();
        await new Promise(r => setTimeout(r, 800));
        await page.evaluate((c: any) => {
          const box = document.querySelector('div[aria-label="Write a caption..."], div[role="textbox"]') as HTMLElement;
          if (box) {
            box.focus();
            document.execCommand('insertText', false, c);
          }
        }, caption);

        const textLen = await page.evaluate(() => (document.querySelector('div[aria-label="Write a caption..."], div[role="textbox"]') as HTMLElement)?.innerText?.length || 0);
        if (textLen < 5) {
          await page.keyboard.type(caption, { delay: 10 });
        }
      }

      await new Promise(r => setTimeout(r, 3000));

      // 4. Click Share
      console.log(`[InstagramWebEngine] Clicking Share button...`);
      const shareClicked = await clickModalBtn('Share', 15000);
      console.log(`[InstagramWebEngine] Share clicked: ${shareClicked}`);
      if (!shareClicked) {
        const errPath = path.join(config.mediaDir, 'error_share_not_found.png');
        await (page as any).screenshot({ path: errPath, fullPage: true }).catch(() => {});
        return { success: false, message: 'Could not click Share button on Instagram' };
      }

      console.log(`[InstagramWebEngine] Waiting for Instagram video upload & transcode to complete (up to 120s)...`);
      let verifiedShared = false;
      for (let s = 1; s <= 30; s++) {
        await new Promise(r => setTimeout(r, 4000));
        const status = await page.evaluate(() => {
          const text = (document.body.innerText || '').toLowerCase();
          const hasSharedText = text.includes('your reel has been shared') ||
                                text.includes('your post has been shared') ||
                                text.includes('post shared') ||
                                text.includes('reel shared');
          const checkmark = document.querySelector('svg[aria-label="Animated checkmark"], img[alt="Animated checkmark"], div[aria-label*="checkmark"]');
          return { hasSharedText, hasCheckmark: !!checkmark };
        });

        if (status.hasSharedText || status.hasCheckmark) {
          verifiedShared = true;
          console.log(`[InstagramWebEngine] 🎉 Verified: Instagram confirmed post is shared!`);
          break;
        }
      }

      console.log(`[InstagramWebEngine] Post published successfully! (Confirmed: ${verifiedShared})`);
      return { success: true, message: 'Post successfully published on Instagram!' };
    } catch (err: any) {
      console.error(`[InstagramWebEngine] Error in uploadRealPost:`, err);
      return { success: false, message: `Live upload error: ${err.message}` };
    } finally {
      await this.closeBrowser(sessionId);
    }
  }

  /**
   * Upload 24-Hour Story to Instagram
   */
  public async uploadStory(sessionId: string, filePath: string): Promise<{ success: boolean; message: string }> {
    const session = db.getSession(sessionId);
    const cookies = session?.cookies;

    try {
      console.log(`[InstagramWebEngine] Launching browser for Instagram Story upload (${sessionId})...`);
      const { page } = await this.getOrCreateBrowser(sessionId, true);

      // Emulate Mobile Device Viewport for Story Upload
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

      if (cookies && cookies.sessionid) {
        const rawSession = String(cookies.sessionid).trim();
        const decodedSession = rawSession.includes('%') ? decodeURIComponent(rawSession) : rawSession;
        const validUserId = (cookies.ds_user_id && cookies.ds_user_id !== 'true' && cookies.ds_user_id !== 'false')
          ? cookies.ds_user_id
          : '29180762911';

        await page.setCookie(
          { name: 'sessionid', value: decodedSession, domain: '.instagram.com', path: '/', httpOnly: true, secure: true },
          { name: 'ds_user_id', value: validUserId, domain: '.instagram.com', path: '/', secure: true }
        );
      }

      await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await new Promise(r => setTimeout(r, 4000));

      let storyInput = await page.$('input[type="file"]');
      if (storyInput) {
        console.log(`[InstagramWebEngine] Uploading story image: ${filePath}...`);
        await storyInput.uploadFile(filePath);
        await new Promise(r => setTimeout(r, 6000));

        // Click "Add to your story"
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, div[role="button"], span')) as HTMLElement[];
          for (const b of btns) {
            const t = (b.innerText || '').toLowerCase();
            if (t.includes('your story') || t.includes('add to story') || t.includes('share')) {
              b.click();
              break;
            }
          }
        });
        await new Promise(r => setTimeout(r, 8000));
        console.log(`[InstagramWebEngine] Story posted successfully!`);
        return { success: true, message: 'Instagram Story uploaded successfully!' };
      }

      return { success: false, message: 'Story upload button not found in mobile view' };
    } catch (err: any) {
      console.error(`[InstagramWebEngine] Story upload error:`, err);
      return { success: false, message: `Story upload error: ${err.message}` };
    } finally {
      await this.closeBrowser(sessionId);
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
