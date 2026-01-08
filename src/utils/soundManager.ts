// Sound Manager for WatchWicket ScoreBox
// Handles cricket match sound effects

export type SoundType = 'four' | 'six' | 'wicket';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  animations: boolean; // Toggle celebration animations
}

const STORAGE_KEY = 'ww_sound_settings';

// Default settings
const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.7,
  animations: true,
};

// Simple beep-based sounds using Web Audio API
class SoundManager {
  private audioContext: AudioContext | null = null;
  private settings: SoundSettings;

  constructor() {
    this.settings = this.loadSettings();

    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  private loadSettings(): SoundSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading sound settings:', e);
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...settings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Error saving sound settings:', e);
    }
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.settings.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(this.settings.volume * 0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }

  private playBatImpact(intensity: 'light' | 'heavy') {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Bat impact: quick thud sound
    oscillator.frequency.value = intensity === 'heavy' ? 80 : 120;
    oscillator.type = 'square';

    const startGain = this.settings.volume * (intensity === 'heavy' ? 0.5 : 0.3);
    gainNode.gain.setValueAtTime(startGain, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.08);
  }

  private playCrowdCheer(intensity: 'medium' | 'high') {
    if (!this.audioContext) return;

    // Crowd cheer: white noise filtered
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gainNode = this.audioContext.createGain();

    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    filter.type = 'bandpass';
    filter.frequency.value = intensity === 'high' ? 1500 : 1200;
    filter.Q.value = 1;

    const startGain = this.settings.volume * (intensity === 'high' ? 0.15 : 0.08);
    gainNode.gain.setValueAtTime(startGain, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    noise.start();
    noise.stop(this.audioContext.currentTime + 0.5);
  }

  public playFour() {
    if (!this.settings.enabled) return;

    // Bat impact + lighter cheer
    this.playBatImpact('light');
    setTimeout(() => this.playCrowdCheer('medium'), 50);

    // Musical accent
    setTimeout(() => this.playTone(659.25, 0.12), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.15), 180); // G5
  }

  public playSix() {
    if (!this.settings.enabled) return;

    // Heavy bat impact + big cheer + ball woosh
    this.playBatImpact('heavy');
    setTimeout(() => this.playCrowdCheer('high'), 70);

    // Musical fanfare - louder and more dramatic
    setTimeout(() => this.playTone(523.25, 0.1, 'square'), 100); // C5
    setTimeout(() => this.playTone(659.25, 0.12, 'square'), 170); // E5
    setTimeout(() => this.playTone(783.99, 0.14, 'square'), 240); // G5
    setTimeout(() => this.playTone(1046.50, 0.3, 'square'), 320); // C6 - big finish!

    // Woosh sound (high frequency sweep)
    setTimeout(() => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);

      gain.gain.setValueAtTime(this.settings.volume * 0.15, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.3);
    }, 100);
  }

  public playWicket() {
    if (!this.settings.enabled) return;

    // Ball hitting stumps: sharp crack
    if (this.audioContext) {
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioContext.destination);

      osc1.type = 'square';
      osc1.frequency.value = 200;
      osc2.type = 'sawtooth';
      osc2.frequency.value = 150;

      gain.gain.setValueAtTime(this.settings.volume * 0.4, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      osc1.start();
      osc1.stop(this.audioContext.currentTime + 0.1);
      osc2.start();
      osc2.stop(this.audioContext.currentTime + 0.1);
    }

    // Crowd gasp/reaction
    setTimeout(() => {
      this.playTone(440, 0.08); // A4
      setTimeout(() => this.playTone(349.23, 0.12), 50); // F4
      setTimeout(() => this.playTone(293.66, 0.15, 'sawtooth'), 110); // D4
    }, 80);
  }

  public play(type: SoundType) {
    switch (type) {
      case 'four':
        this.playFour();
        break;
      case 'six':
        this.playSix();
        break;
      case 'wicket':
        this.playWicket();
        break;
    }
  }

  public toggleEnabled() {
    this.saveSettings({ enabled: !this.settings.enabled });
  }

  public setVolume(volume: number) {
    this.saveSettings({ volume: Math.max(0, Math.min(1, volume)) });
  }

  public toggleAnimations() {
    this.saveSettings({ animations: !this.settings.animations });
  }
}

// Singleton instance
export const soundManager = new SoundManager();
