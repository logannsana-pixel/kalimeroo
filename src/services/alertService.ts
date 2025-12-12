// Alert Service - Central orchestration for all notifications
import { soundService, SoundType } from './soundService';
import { vibrationService, VibrationPattern } from './vibrationService';
import { pushService, PushNotificationOptions } from './pushService';
import { toast } from 'sonner';

export type AlertType = 
  | 'order_new'              // New order received
  | 'order_accepted'         // Order accepted
  | 'order_preparing'        // Order being prepared
  | 'order_ready'            // Order ready for pickup
  | 'order_picked_up'        // Order picked up by driver
  | 'order_delivering'       // Order on the way
  | 'order_delivered'        // Order delivered
  | 'order_cancelled'        // Order cancelled
  | 'message_received'       // New message
  | 'driver_assigned'        // Driver assigned to order
  | 'delivery_available'     // New delivery available for drivers
  | 'admin_urgent'           // Urgent admin alert
  | 'success'                // Generic success
  | 'error';                 // Generic error

export type UserRole = 'customer' | 'restaurant_owner' | 'delivery_driver' | 'admin';

interface AlertConfig {
  sound: SoundType | null;
  vibration: VibrationPattern | null;
  push: boolean;
  toast: 'success' | 'error' | 'info' | 'warning' | null;
  toastDuration?: number;
  urgentModal?: boolean;
}

// Configuration based on user role and alert type
const ALERT_CONFIGS: Record<UserRole, Partial<Record<AlertType, AlertConfig>>> = {
  customer: {
    order_accepted: {
      sound: 'order_new_customer',
      vibration: 'notification',
      push: true,
      toast: 'success',
    },
    order_preparing: {
      sound: 'order_status_update',
      vibration: 'notification',
      push: true,
      toast: 'info',
    },
    order_ready: {
      sound: 'order_status_update',
      vibration: 'notification',
      push: true,
      toast: 'info',
    },
    order_picked_up: {
      sound: 'order_status_update',
      vibration: 'notification',
      push: true,
      toast: 'info',
    },
    order_delivering: {
      sound: 'order_status_update',
      vibration: 'notification',
      push: true,
      toast: 'info',
    },
    order_delivered: {
      sound: 'success',
      vibration: 'success',
      push: true,
      toast: 'success',
    },
    order_cancelled: {
      sound: 'error',
      vibration: 'error',
      push: true,
      toast: 'error',
    },
    message_received: {
      sound: 'message_received',
      vibration: 'notification',
      push: true,
      toast: 'info',
    },
    driver_assigned: {
      sound: 'order_status_update',
      vibration: 'notification',
      push: true,
      toast: 'info',
    },
  },
  restaurant_owner: {
    order_new: {
      sound: 'order_new_restaurant',
      vibration: 'order_new_restaurant',
      push: true,
      toast: 'warning',
      toastDuration: 10000,
      urgentModal: true,
    },
    order_cancelled: {
      sound: 'error',
      vibration: 'error',
      push: true,
      toast: 'error',
    },
    message_received: {
      sound: 'message_received',
      vibration: 'notification',
      push: true,
      toast: 'info',
    },
  },
  delivery_driver: {
    delivery_available: {
      sound: 'order_new_driver',
      vibration: 'order_new_driver',
      push: true,
      toast: 'warning',
      toastDuration: 8000,
    },
    order_ready: {
      sound: 'order_new_driver',
      vibration: 'notification',
      push: true,
      toast: 'info',
    },
    message_received: {
      sound: 'message_received',
      vibration: 'notification',
      push: true,
      toast: 'info',
    },
  },
  admin: {
    admin_urgent: {
      sound: 'admin_alert',
      vibration: 'urgent',
      push: true,
      toast: 'error',
      toastDuration: 15000,
      urgentModal: true,
    },
    order_cancelled: {
      sound: 'error',
      vibration: 'error',
      push: true,
      toast: 'warning',
    },
    error: {
      sound: 'error',
      vibration: 'error',
      push: true,
      toast: 'error',
    },
  },
};

// Default config for unspecified combinations
const DEFAULT_CONFIG: AlertConfig = {
  sound: 'success',
  vibration: 'notification',
  push: false,
  toast: 'info',
};

interface TriggerAlertOptions {
  type: AlertType;
  role: UserRole;
  title: string;
  message: string;
  data?: Record<string, any>;
  url?: string;
}

// Throttle map to prevent spam
const throttleMap = new Map<string, number>();
const THROTTLE_MS = 2000;

class AlertService {
  private urgentModalCallback: ((options: TriggerAlertOptions) => void) | null = null;

  setUrgentModalCallback(callback: (options: TriggerAlertOptions) => void) {
    this.urgentModalCallback = callback;
  }

  async trigger(options: TriggerAlertOptions): Promise<void> {
    const { type, role, title, message, data, url } = options;
    
    // Throttle check
    const throttleKey = `${role}-${type}`;
    const now = Date.now();
    const lastTrigger = throttleMap.get(throttleKey);
    
    if (lastTrigger && now - lastTrigger < THROTTLE_MS) {
      return;
    }
    throttleMap.set(throttleKey, now);

    const config = ALERT_CONFIGS[role]?.[type] || DEFAULT_CONFIG;

    // Play sound
    if (config.sound) {
      await soundService.play(config.sound);
    }

    // Vibrate
    if (config.vibration) {
      vibrationService.vibrate(config.vibration);
    }

    // Show toast
    if (config.toast) {
      const toastFn = toast[config.toast] || toast.info;
      toastFn(title, {
        description: message,
        duration: config.toastDuration || 5000,
      });
    }

    // Push notification
    if (config.push) {
      await pushService.show({
        title,
        body: message,
        data: { ...data, url },
      });
    }

    // Urgent modal
    if (config.urgentModal && this.urgentModalCallback) {
      this.urgentModalCallback(options);
    }
  }

  // Convenience methods for common alerts
  async orderNew(role: UserRole, orderId: string, restaurantName?: string) {
    await this.trigger({
      type: 'order_new',
      role,
      title: '🔔 Nouvelle Commande !',
      message: restaurantName 
        ? `Nouvelle commande de ${restaurantName}`
        : 'Vous avez une nouvelle commande à traiter',
      data: { orderId },
      url: role === 'restaurant_owner' ? '/restaurant-dashboard' : undefined,
    });
  }

  async orderStatusUpdate(role: UserRole, status: string, orderId: string) {
    const statusMessages: Record<string, { title: string; message: string; type: AlertType }> = {
      accepted: { title: '✅ Commande acceptée', message: 'Votre commande a été acceptée', type: 'order_accepted' },
      preparing: { title: '👨‍🍳 En préparation', message: 'Votre commande est en cours de préparation', type: 'order_preparing' },
      ready: { title: '✨ Commande prête', message: 'Votre commande est prête', type: 'order_ready' },
      picked_up: { title: '🚗 Commande récupérée', message: 'Le livreur a récupéré votre commande', type: 'order_picked_up' },
      delivering: { title: '🛵 En livraison', message: 'Votre commande est en route', type: 'order_delivering' },
      delivered: { title: '🎉 Livré !', message: 'Votre commande a été livrée. Bon appétit !', type: 'order_delivered' },
      cancelled: { title: '❌ Annulée', message: 'Votre commande a été annulée', type: 'order_cancelled' },
    };

    const info = statusMessages[status] || { 
      title: 'Mise à jour', 
      message: `Statut: ${status}`,
      type: 'order_accepted' as AlertType,
    };

    await this.trigger({
      type: info.type,
      role,
      title: info.title,
      message: info.message,
      data: { orderId, status },
      url: '/orders',
    });
  }

  async newMessage(role: UserRole, senderName: string, preview: string) {
    await this.trigger({
      type: 'message_received',
      role,
      title: `💬 Message de ${senderName}`,
      message: preview.slice(0, 50) + (preview.length > 50 ? '...' : ''),
    });
  }

  async deliveryAvailable(orderId: string, address: string) {
    await this.trigger({
      type: 'delivery_available',
      role: 'delivery_driver',
      title: '🚗 Nouvelle livraison disponible !',
      message: `Livraison vers ${address}`,
      data: { orderId },
      url: '/delivery-dashboard',
    });
  }

  async adminUrgent(title: string, message: string) {
    await this.trigger({
      type: 'admin_urgent',
      role: 'admin',
      title: `⚠️ ${title}`,
      message,
    });
  }

  async success(role: UserRole, message: string) {
    await this.trigger({
      type: 'success',
      role,
      title: '✅ Succès',
      message,
    });
  }

  async error(role: UserRole, message: string) {
    await this.trigger({
      type: 'error',
      role,
      title: '❌ Erreur',
      message,
    });
  }
}

export const alertService = new AlertService();

// Global access for debugging and external triggers
if (typeof window !== 'undefined') {
  (window as any).alertEngine = alertService;
}
