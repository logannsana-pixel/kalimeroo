// Sound Service for Alert Notifications
// Different sounds for different user roles and event types

export type SoundType = 
  | 'order_new_restaurant'      // Restaurant: BUZZER FORT
  | 'order_new_driver'          // Driver: DING + vibration
  | 'order_new_customer'        // Customer: doux
  | 'message_received'          // Tous: notification douce
  | 'order_status_update'       // Customer: mise à jour
  | 'admin_alert'               // Admin: alerte urgente
  | 'success'                   // Tous: action réussie
  | 'error';                    // Tous: erreur

// Base64 encoded short sounds (avoiding external files for reliability)
const SOUNDS: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; pattern?: number[] }> = {
  order_new_restaurant: { frequency: 880, duration: 500, type: 'square', pattern: [200, 100, 200, 100, 200] },
  order_new_driver: { frequency: 1200, duration: 300, type: 'sine', pattern: [150, 50, 150] },
  order_new_customer: { frequency: 600, duration: 200, type: 'sine' },
  message_received: { frequency: 800, duration: 150, type: 'sine' },
  order_status_update: { frequency: 700, duration: 250, type: 'sine', pattern: [125, 50, 125] },
  admin_alert: { frequency: 440, duration: 800, type: 'sawtooth', pattern: [200, 100, 200, 100, 200, 100, 200] },
  success: { frequency: 523, duration: 200, type: 'sine', pattern: [100, 50, 150] },
  error: { frequency: 220, duration: 400, type: 'square', pattern: [200, 100, 200] },
};

class SoundService {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private volume = 0.5;

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    try {
      const stored = localStorage.getItem('kalimero_sound_enabled');
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
      const volume = localStorage.getItem('kalimero_sound_volume');
      if (volume !== null) {
        this.volume = parseFloat(volume);
      }
    } catch {
      // Ignore storage errors
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  async unlock(): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Play a silent sound to unlock audio
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.001);
      return true;
    } catch (error) {
      console.error('Failed to unlock audio:', error);
      return false;
    }
  }

  async play(type: SoundType): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const soundConfig = SOUNDS[type];
      const pattern = soundConfig.pattern || [soundConfig.duration];
      
      let currentTime = ctx.currentTime;
      
      for (let i = 0; i < pattern.length; i++) {
        if (i % 2 === 0) {
          // Play tone
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.type = soundConfig.type;
          oscillator.frequency.setValueAtTime(soundConfig.frequency, currentTime);
          
          gainNode.gain.setValueAtTime(this.volume, currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + pattern[i] / 1000);
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.start(currentTime);
          oscillator.stop(currentTime + pattern[i] / 1000);
        }
        currentTime += pattern[i] / 1000;
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('kalimero_sound_enabled', String(enabled));
    } catch {
      // Ignore storage errors
    }
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    try {
      localStorage.setItem('kalimero_sound_volume', String(this.volume));
    } catch {
      // Ignore storage errors
    }
  }

  getVolume(): number {
    return this.volume;
  }

  async testSound(type: SoundType = 'success'): Promise<void> {
    const wasEnabled = this.isEnabled;
    this.isEnabled = true;
    await this.play(type);
    this.isEnabled = wasEnabled;
  }
}

export const soundService = new SoundService();
