// Push Notification Service for browser and PWA notifications

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
  silent?: boolean;
}

class PushService {
  private isEnabled = true;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.initFromStorage();
    this.checkPermission();
  }

  private initFromStorage() {
    try {
      const stored = localStorage.getItem('kalimero_push_enabled');
      if (stored !== null) {
        this.isEnabled = stored === 'true';
      }
    } catch {
      // Ignore storage errors
    }
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  async show(options: PushNotificationOptions): Promise<Notification | null> {
    if (!this.isEnabled || !this.isSupported()) {
      return null;
    }

    if (this.permission !== 'granted') {
      const newPermission = await this.requestPermission();
      if (newPermission !== 'granted') {
        return null;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/pwa-192x192.png',
        badge: options.badge || '/pwa-192x192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
      };

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('kalimero_push_enabled', String(enabled));
    } catch {
      // Ignore storage errors
    }
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  async test(): Promise<boolean> {
    const notification = await this.show({
      title: 'Test Notification',
      body: 'Les notifications fonctionnent correctement ! 🎉',
      tag: 'test',
    });
    return notification !== null;
  }
}

export const pushService = new PushService();
