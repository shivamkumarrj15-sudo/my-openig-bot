import fs from 'fs';
import path from 'path';
import http from 'http';
import { config as appConfig } from '../../config';

export interface IMoneyPrinterGenerateOptions {
  subject: string;
  script: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  language?: string;
  voiceName?: string;
  bgmType?: string;
  bgmVolume?: number;
  subtitleEnabled?: boolean;
}

export interface IMoneyPrinterResult {
  success: boolean;
  videoPath?: string;
  videoUrl?: string;
  taskId?: string;
  script?: string;
  message?: string;
}

export class MoneyPrinterEngine {
  private static instance: MoneyPrinterEngine;
  private baseUrl: string;
  private apiKey: string;
  private mediaDir: string;

  private constructor() {
    this.baseUrl = process.env.MPT_BASE_URL?.trim() || 'http://127.0.0.1:8080';
    this.apiKey = process.env.MPT_API_KEY?.trim() || 'mpt_live_140e25df1d8ab23058c1ea62b3c732aa';
    this.mediaDir = appConfig.mediaDir;
    if (!fs.existsSync(this.mediaDir)) {
      fs.mkdirSync(this.mediaDir, { recursive: true });
    }
  }

  public static getInstance(): MoneyPrinterEngine {
    if (!MoneyPrinterEngine.instance) {
      MoneyPrinterEngine.instance = new MoneyPrinterEngine();
    }
    return MoneyPrinterEngine.instance;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Health Check for MoneyPrinter Turbo Server
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const url = new URL(this.baseUrl);
      return await new Promise<boolean>((resolve) => {
        const req = http.request(
          {
            hostname: url.hostname,
            port: url.port || 8080,
            path: '/docs',
            method: 'GET',
            timeout: 4000
          },
          (res) => {
            resolve(res.statusCode === 200 || res.statusCode === 404);
          }
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        req.end();
      });
    } catch {
      return false;
    }
  }

  /**
   * Generate Full AI Video with Stock Footage, Hindi Voiceover, Subtitles & Music
   */
  public async generateAIVideo(options: IMoneyPrinterGenerateOptions): Promise<IMoneyPrinterResult> {
    console.log(`[MoneyPrinterEngine] Initiating AI video generation on ${this.baseUrl}...`);
    console.log(`🎬 Subject: "${options.subject}"`);
    console.log(`📜 Script: "${options.script.substring(0, 80)}..."`);

    const payload = {
      video_subject: options.subject,
      video_script: options.script,
      video_aspect: options.aspectRatio || '9:16',
      video_language: options.language || 'hi-IN',
      voice_name: options.voiceName || 'hi-IN-SwaraNeural-Female',
      bgm_type: options.bgmType || 'random',
      bgm_volume: options.bgmVolume ?? 0.2,
      subtitle_enabled: options.subtitleEnabled ?? true,
      video_source: 'pexels',
      video_clip_duration: 3,
      paragraph_number: 1
    };

    try {
      const startRes = await this.httpPost('/api/v1/videos', payload);
      if (!startRes || startRes.status !== 200 || !startRes.data?.task_id) {
        throw new Error(startRes?.message || 'Failed to trigger video generation task');
      }

      const taskId = startRes.data.task_id;
      console.log(`[MoneyPrinterEngine] Task started successfully! Task ID: ${taskId}`);

      // Poll task until finished
      const taskData = await this.pollTask(taskId, 360000); // Max 6 minutes
      console.log(`[MoneyPrinterEngine] Video rendering completed! State: ${taskData.state}`);

      const remoteVideoRelPath = (taskData.videos && taskData.videos.length > 0)
        ? taskData.videos[0]
        : `/tasks/${taskId}/final-1.mp4`;

      const filename = `mpt_ai_reel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.mp4`;
      const localDestPath = path.join(this.mediaDir, filename);

      // Check if local storage file is directly reachable on Windows
      const directLocalCandidate = path.join(
        process.env.USERPROFILE || 'C:\\Users\\lenovo',
        '.vscode',
        'MoneyPrinterTurbo',
        'storage',
        'tasks',
        taskId,
        'final-1.mp4'
      );

      if (fs.existsSync(directLocalCandidate) && fs.statSync(directLocalCandidate).size > 10000) {
        console.log(`[MoneyPrinterEngine] Copying direct rendered file from: ${directLocalCandidate}`);
        fs.copyFileSync(directLocalCandidate, localDestPath);
      } else {
        console.log(`[MoneyPrinterEngine] Downloading video from API endpoint: ${remoteVideoRelPath}...`);
        const cleanPath = remoteVideoRelPath.replace(/^\/tasks\//, '');
        const downloadEndpoint = `/api/v1/download/${cleanPath}`;
        await this.downloadFile(downloadEndpoint, localDestPath);
      }

      if (!fs.existsSync(localDestPath) || fs.statSync(localDestPath).size < 10000) {
        throw new Error('Video file not saved or empty');
      }

      console.log(`🎬 [MoneyPrinterEngine] Video ready! Saved to ${localDestPath} (${(fs.statSync(localDestPath).size / (1024 * 1024)).toFixed(2)} MB)`);

      return {
        success: true,
        videoPath: localDestPath,
        videoUrl: `/media/${filename}`,
        taskId,
        script: options.script
      };
    } catch (err: any) {
      console.error(`[MoneyPrinterEngine] Generation error:`, err);
      return {
        success: false,
        message: err.message
      };
    }
  }

  /**
   * Poll Task Until Finished
   */
  private async pollTask(taskId: string, timeoutMs = 360000): Promise<any> {
    const startTime = Date.now();
    const endpoint = `/api/v1/tasks/${taskId}`;

    while (Date.now() - startTime < timeoutMs) {
      await new Promise(r => setTimeout(r, 4000));
      const res = await this.httpGet(endpoint);

      if (res && res.data) {
        const { state, progress, error, videos } = res.data;
        console.log(`[MoneyPrinterEngine] Task ${taskId} => Progress: ${progress}% (State: ${state})`);

        if (error) {
          throw new Error(`MoneyPrinter Turbo Error: ${error}`);
        }

        if (state === 1 || progress === 100 || (videos && videos.length > 0)) {
          return res.data;
        }
      }
    }

    throw new Error('MoneyPrinter Turbo rendering timed out after 3 minutes');
  }

  /**
   * HTTP POST Helper with API Key
   */
  private httpPost(pathUrl: string, body: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl);
      const postData = JSON.stringify(body);

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 8080,
          path: pathUrl,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': this.apiKey,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 25000
        },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HTTP request timeout'));
      });
      req.write(postData);
      req.end();
    });
  }

  /**
   * HTTP GET Helper with API Key
   */
  private httpGet(pathUrl: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl);

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 8080,
          path: pathUrl,
          method: 'GET',
          headers: {
            'X-Api-Key': this.apiKey
          },
          timeout: 25000
        },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HTTP GET timeout'));
      });
      req.end();
    });
  }

  /**
   * Download Binary Video File via HTTP
   */
  private downloadFile(pathUrl: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl);
      const file = fs.createWriteStream(dest);

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 8080,
          path: pathUrl,
          method: 'GET',
          headers: {
            'X-Api-Key': this.apiKey
          },
          timeout: 60000
        },
        (res) => {
          if (res.statusCode !== 200) {
            file.close();
            fs.unlink(dest, () => {});
            return reject(new Error(`Download failed with status: ${res.statusCode}`));
          }
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }
      );

      req.on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
      req.end();
    });
  }
}

export const moneyPrinterEngine = MoneyPrinterEngine.getInstance();
