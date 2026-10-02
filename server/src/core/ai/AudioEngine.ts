import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { config as appConfig } from '../../config';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export interface ITrendingAudioTrack {
  id: string;
  category: string;
  title: string;
  artist: string;
  mood: string;
  audioUrl: string;
  localPath?: string;
  durationSeconds: number;
}

export class AudioEngine {
  private static instance: AudioEngine;
  private audioDir: string;

  private constructor() {
    this.audioDir = path.join(appConfig.dataDir, 'audio');
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Library of Curated Trending Emotional Background Audio Tracks (20-Second Topic Matched)
   */
  public getTrendingAudioLibrary(): ITrendingAudioTrack[] {
    return [
      {
        id: 'track_anime_shinkai_piano',
        category: 'anime_aesthetic',
        title: 'Shinkai Twilight Piano & Shooting Star Melodies',
        artist: 'Anime Chill Piano',
        mood: 'Nostalgic, Dreamy & Anime Aesthetic (एनीमे सुकून)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c93a027961.mp3?filename=piano-moment-124976.mp3',
        durationSeconds: 20
      },
      {
        id: 'track_anime_lofi_rain',
        category: 'anime_aesthetic',
        title: 'Midnight Lofi Rain & Vinyl Warmth',
        artist: 'Tokyo Lofi Station',
        mood: 'Chill Lofi & Deep Thoughts (शांत रात और बारिश)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=lofi-study-112191.mp3',
        durationSeconds: 20
      },
      {
        id: 'track_stoic_warrior_bass',
        category: 'silent_hustle',
        title: 'Dark Stoic Warrior & Deep Cinematic Resonance',
        artist: 'Vagabond Dark Soundscapes',
        mood: 'Dark Motivation & Self Discipline (योद्धा का संकल्प)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_245e54ae8a.mp3?filename=dark-ambient-124741.mp3',
        durationSeconds: 20
      },
      {
        id: 'track_life_reality_bansuri',
        category: 'life_reality',
        title: 'Soulful Bansuri & Melancholic Rain Chords',
        artist: 'Trending Soulful Beats',
        mood: 'Deep Reflection & Life Truth (ज़िंदगी का सच)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=sad-soul-112342.mp3',
        durationSeconds: 20
      },
      {
        id: 'track_time_trust_acoustic',
        category: 'time_trust',
        title: 'Sad Acoustic Guitar & Soft Ambient Heartbeat',
        artist: 'Emotional Acoustic Strings',
        mood: 'Patience, Faith & Time (सब्र और भरोसा)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=sad-piano-ambient-122485.mp3',
        durationSeconds: 20
      },
      {
        id: 'track_silent_hustle_epic',
        category: 'silent_hustle',
        title: 'Dark Cinematic Motivational Crescendo',
        artist: 'Hustle Beats & Bass',
        mood: 'Silent Grind & Self-Made Pride (खामोश मेहनत)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cinematic-time-lapse-115672.mp3',
        durationSeconds: 20
      },
      {
        id: 'track_heartbreak_violin',
        category: 'heartbreak_healing',
        title: 'Heart-touching Violin & Deep Cello Melody',
        artist: 'Soulful Strings',
        mood: 'Heartbreak, Healing & Solitude (दिल का दर्द और हीलिंग)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=emotional-piano-sad-10708.mp3',
        durationSeconds: 20
      },
      {
        id: 'track_mindset_zen_synth',
        category: 'mindset_psychology',
        title: 'Calm Wisdom & Ethereal Synth Harmony',
        artist: 'Zen Mindset Audio',
        mood: 'Mental Peace & High Vibration (मजबूत सोच)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc84e0fb42.mp3?filename=ambient-piano-calm-10825.mp3',
        durationSeconds: 20
      },
      {
        id: 'track_sad_nostalgia_flute',
        category: 'maa_baap_family',
        title: 'Tearful Soulful Flute & Emotional Chords',
        artist: 'Indian Classical Moods',
        mood: 'Parents Sacrifice & Pure Love (माँ-बाप का प्यार)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=sad-moment-9173.mp3',
        durationSeconds: 20
      },
      {
        id: 'track_alone_dark_shadow',
        category: 'fake_people',
        title: 'Cold Dark Ambient Strings & Deep Reverb',
        artist: 'Deep Shadow Beats',
        mood: 'Two-Faced People & Reality of World (मतलबी दुनिया)',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/09/audio_c8b9393fa1.mp3?filename=deep-sad-piano-10526.mp3',
        durationSeconds: 20
      }
    ];
  }

  /**
   * Get Audio Track by Specific ID
   */
  public getAudioById(trackId: string): ITrendingAudioTrack {
    const library = this.getTrendingAudioLibrary();
    const match = library.find(t => t.id === trackId);
    return match || this.getAudioForCategory('anime_aesthetic');
  }

  /**
   * Get Best Trending Audio for a Specific Quote Category (Randomized for Variety)
   */
  public getAudioForCategory(category: string): ITrendingAudioTrack {
    const library = this.getTrendingAudioLibrary();
    const matches = library.filter(t => t.category === category);
    if (matches.length > 0) {
      return matches[Math.floor(Math.random() * matches.length)];
    }
    // Random track from entire library for maximum variety
    return library[Math.floor(Math.random() * library.length)];
  }

  /**
   * Download or Generate Harmonic Audio File Locally
   */
  public async ensureAudioFile(track: ITrendingAudioTrack): Promise<string> {
    const filename = `${track.id}.mp3`;
    const localPath = path.join(this.audioDir, filename);

    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000) {
      return localPath;
    }

    try {
      console.log(`[AudioEngine] Downloading trending audio track: "${track.title}"...`);
      await this.downloadFile(track.audioUrl, localPath);
      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1000) {
        return localPath;
      }
    } catch (err: any) {
      console.warn(`[AudioEngine] Download failed (${err.message}), synthesizing harmonic ambient tone...`);
    }

    // Fallback: Generate a high quality synthesized ambient tone using FFmpeg lavfi
    return await this.synthesizeAmbientTone(track.id, localPath, track.durationSeconds || 20);
  }

  /**
   * Helper to download remote file with redirect support
   */
  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      const request = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            this.downloadFile(redirectUrl, dest).then(resolve).catch(reject);
            return;
          }
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`Server responded with status code ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      });
      request.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
      request.setTimeout(12000, () => {
        request.destroy();
        fs.unlink(dest, () => {});
        reject(new Error('Download timeout'));
      });
    });
  }

  /**
   * Synthesize Soothing Ambient Meditation Audio using FFmpeg tone synthesis (20 seconds)
   */
  private synthesizeAmbientTone(trackId: string, dest: string, duration = 20): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!ffmpegPath) {
        return reject(new Error('FFmpeg not available'));
      }

      // Mood-specific harmonic resonance frequencies (Solffeggio & Brainwave Harmonics)
      let freq1 = 432;
      let freq2 = 216;
      if (trackId.includes('time_trust')) {
        freq1 = 396;
        freq2 = 198;
      } else if (trackId.includes('silent_hustle')) {
        freq1 = 144;
        freq2 = 288;
      } else if (trackId.includes('heartbreak_healing')) {
        freq1 = 528;
        freq2 = 264;
      } else if (trackId.includes('mindset_psychology')) {
        freq1 = 639;
        freq2 = 319;
      } else if (trackId.includes('maa_baap_family')) {
        freq1 = 432;
        freq2 = 288;
      } else if (trackId.includes('fake_people')) {
        freq1 = 108;
        freq2 = 216;
      }

      ffmpeg()
        .input(`sine=frequency=${freq1}:duration=${duration}`)
        .inputFormat('lavfi')
        .input(`sine=frequency=${freq2}:duration=${duration}`)
        .inputFormat('lavfi')
        .complexFilter([
          '[0:a][1:a]amix=inputs=2:duration=first[aout]',
          `[aout]afade=t=in:ss=0:d=1.5,afade=t=out:st=${duration - 2}:d=2[final]`
        ])
        .outputOptions(['-map [final]', '-c:a libmp3lame', '-b:a 192k'])
        .output(dest)
        .on('end', () => {
          console.log(`[AudioEngine] Ambient audio synthesized successfully: ${dest}`);
          resolve(dest);
        })
        .on('error', (err: any) => {
          console.error(`[AudioEngine] Error synthesizing audio:`, err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Create Cinematic Motion Reel Video with Music & Ken Burns Breathing Effect (20 Seconds Full Duration)
   * Supports 9:16 Fullscreen Vertical (1080x1920) or 1:1 Square (1080x1080)
   */
  public async createCinematicQuoteVideo(
    imagePath: string,
    audioPath: string,
    durationSeconds = 20,
    aspectRatio: '9:16' | '1:1' = '9:16'
  ): Promise<string> {
    const videoFilename = `quote_reel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.mp4`;
    const outputPath = path.join(appConfig.mediaDir, videoFilename);

    return new Promise((resolve, reject) => {
      if (!ffmpegPath) {
        return reject(new Error('FFmpeg not available for video rendering'));
      }

      const isVertical = aspectRatio === '9:16';
      const outWidth = isVertical ? 1080 : 1080;
      const outHeight = isVertical ? 1920 : 1080;

      console.log(`[AudioEngine] Rendering 20-Second Cinematic Motion Reel Video (${outWidth}x${outHeight}) with Music...`);
      console.log(`🖼️ Input Image: ${imagePath}`);
      console.log(`🎵 Input Audio: ${audioPath}`);

      const totalFrames = durationSeconds * 30;

      // Subtle slow zoom in for gripping visual retention & easy reading over 20 seconds
      const scaleFilter = isVertical
        ? `[0:v]scale=1080:1920,zoompan=z='min(zoom+0.00025,1.05)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30[vzoom]`
        : `[0:v]scale=1080:1080,zoompan=z='min(zoom+0.0003,1.06)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1080:fps=30[vzoom]`;

      ffmpeg()
        .input(imagePath)
        .loop(durationSeconds)
        .input(audioPath)
        .complexFilter([
          scaleFilter,
          `[1:a]afade=t=in:ss=0:d=1.5,afade=t=out:st=${durationSeconds - 2}:d=2[aout]`
        ])
        .outputOptions([
          '-map [vzoom]',
          '-map [aout]',
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-r 30',
          '-c:a aac',
          '-b:a 192k',
          `-t ${durationSeconds}`
        ])
        .output(outputPath)
        .on('end', () => {
          console.log(`🎬 20-Second Video Reel generated successfully: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err: any) => {
          console.error(`[AudioEngine] Error rendering video reel:`, err);
          reject(err);
        })
        .run();
    });
  }
}

export const audioEngine = AudioEngine.getInstance();
