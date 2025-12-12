// Vibration Service for haptic feedback on mobile devices

export type VibrationPattern = 
  | 'order_new_restaurant'   // Long strong vibration
  | 'order_new_driver'       // Medium vibration
  | 'notification'           // Short gentle vibration
  | 'success'                // Quick double vibration
  | 'error'                  // Triple short vibration
  | 'urgent';                // Long continuous vibration

const PATTERNS: Record<VibrationPattern, number[]> = {
  order_new_restaurant: [300, 100, 300, 100, 300],
  order_new_driver: [200, 50, 200],
  notification: [100],
  success: [50, 50, 100],
  error: [100, 50, 100, 50, 100],
  urgent: [500, 100, 500, 100, 500],
};

class VibrationService {
  private isEnabled = true;
  private isSupported = false;

  constructor() {
    this.isSupported = 'vibrate' in navigator;
    this.initFromStorage();
  }

  private initFromStorage() {
    try {
      const stored = localStorage.getItem('kalimero_vibration_enabled');
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    } catch {
      // Ignore storage errors
    }
  }

  vibrate(pattern: VibrationPattern): boolean {
    if (!this.isEnabled || !this.isSupported) return false;

    try {
      return navigator.vibrate(PATTERNS[pattern]);
    } catch (error) {
      console.error('Vibration failed:', error);
      return false;
    }
  }

  vibrateCustom(pattern: number[]): boolean {
    if (!this.isEnabled || !this.isSupported) return false;

    try {
      return navigator.vibrate(pattern);
    } catch (error) {
      console.error('Vibration failed:', error);
      return false;
    }
  }

  stop(): boolean {
    if (!this.isSupported) return false;

    try {
      return navigator.vibrate(0);
    } catch {
      return false;
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('kalimero_vibration_enabled', String(enabled));
    } catch {
      // Ignore storage errors
    }
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  getSupported(): boolean {
    return this.isSupported;
  }

  async test(): Promise<boolean> {
    const wasEnabled = this.isEnabled;
    this.isEnabled = true;
    const result = this.vibrate('success');
    this.isEnabled = wasEnabled;
    return result;
  }
}

export const vibrationService = new VibrationService();
