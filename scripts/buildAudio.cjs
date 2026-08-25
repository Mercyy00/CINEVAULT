const fs = require('fs');
const path = require('path');

const aPath = path.join(__dirname, '../public/music/a-luffy.mp3');
const sPath = path.join(__dirname, '../public/music/luffy-smile.mp3');

const aB64 = fs.readFileSync(aPath).toString('base64');
const sB64 = fs.readFileSync(sPath).toString('base64');

const content = `// Zero-Latency Base64-Embedded Luffy Sound Utility
const A_LUFFY_DATA = 'data:audio/mp3;base64,${aB64}';
const S_LUFFY_DATA = 'data:audio/mp3;base64,${sB64}';

class LuffySoundManager {
  private angryAudio: HTMLAudioElement | null = null;
  private smileAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    try {
      this.angryAudio = new Audio(A_LUFFY_DATA);
      this.angryAudio.preload = 'auto';
      this.angryAudio.volume = 1.0;

      this.smileAudio = new Audio(S_LUFFY_DATA);
      this.smileAudio.preload = 'auto';
      this.smileAudio.volume = 1.0;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Luffy audio init error:', e);
    }
  }

  public playAngry(volume = 1.0) {
    this.playAudio(this.angryAudio, A_LUFFY_DATA, '/music/a-luffy.mp3', volume);
  }

  public playSmile(volume = 1.0) {
    this.playAudio(this.smileAudio, S_LUFFY_DATA, '/music/luffy-smile.mp3', volume);
  }

  private playAudio(
    cachedElement: HTMLAudioElement | null, 
    dataUri: string, 
    fallbackUrl: string, 
    volume: number
  ) {
    try {
      // Resume Web Audio Context if suspended
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      if (cachedElement) {
        cachedElement.volume = Math.min(Math.max(volume, 0), 1);
        cachedElement.currentTime = 0;
        const promise = cachedElement.play();
        if (promise !== undefined) {
          promise.catch((err) => {
            console.warn('Cached element play error, trying fresh data URI element:', err);
            this.playFresh(dataUri, fallbackUrl, volume);
          });
        }
      } else {
        this.playFresh(dataUri, fallbackUrl, volume);
      }
    } catch (err) {
      console.warn('Audio play exception, trying fresh element:', err);
      this.playFresh(dataUri, fallbackUrl, volume);
    }
  }

  private playFresh(dataUri: string, fallbackUrl: string, volume: number) {
    try {
      const audio = new Audio(dataUri);
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Fallback to static URL
        const fallback = new Audio(fallbackUrl);
        fallback.volume = volume;
        fallback.currentTime = 0;
        fallback.play().catch(e => {
          console.warn('All audio play attempts failed:', e);
        });
      });
    } catch (e) {
      console.warn('Fresh audio error:', e);
    }
  }
}

export const luffyAudio = new LuffySoundManager();

export function playLuffySound(type: 'angry' | 'smile', volume = 1.0) {
  if (type === 'angry') {
    luffyAudio.playAngry(volume);
  } else {
    luffyAudio.playSmile(volume);
  }
}
`;

const outDir = path.join(__dirname, '../src/utils');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'luffyAudio.ts'), content, 'utf8');
console.log('Successfully generated src/utils/luffyAudio.ts');
