import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { alertService, AlertType, UserRole } from '@/services/alertService';
import { UrgentAlertModal } from './UrgentAlertModal';
import { toast } from 'sonner';

interface UrgentAlert {
  type: AlertType;
  role: UserRole;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export function AlertEngine() {
  const { user, userRole } = useAuth();
  const [urgentAlert, setUrgentAlert] = useState<UrgentAlert | null>(null);

  // Handle urgent modal alerts
  useEffect(() => {
    alertService.setUrgentModalCallback((options) => {
      setUrgentAlert({
        type: options.type,
        role: options.role,
        title: options.title,
        message: options.message,
        data: options.data,
      });
    });

    return () => {
      alertService.setUrgentModalCallback(() => {});
    };
  }, []);

  // Subscribe to real-time events based on user role
  useEffect(() => {
    if (!user || !userRole) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Restaurant owner: Listen for new orders
    if (userRole === 'restaurant_owner') {
      const fetchRestaurantId = async () => {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (restaurant) {
          const orderChannel = supabase
            .channel(`restaurant-orders-${restaurant.id}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `restaurant_id=eq.${restaurant.id}`,
              },
              (payload) => {
                alertService.orderNew('restaurant_owner', payload.new.id);
              }
            )
            .subscribe();
          channels.push(orderChannel);
        }
      };
      fetchRestaurantId();
    }

    // Delivery driver: Listen for available deliveries
    if (userRole === 'delivery_driver') {
      const deliveryChannel = supabase
        .channel(`driver-orders-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `status=eq.pickup_pending`,
          },
          (payload) => {
            if (!payload.new.delivery_driver_id) {
              alertService.deliveryAvailable(
                payload.new.id,
                payload.new.delivery_address || 'Adresse inconnue'
              );
            }
          }
        )
        .subscribe();
      channels.push(deliveryChannel);
    }

    // Customer: Listen for order updates
    if (userRole === 'customer') {
      const customerOrderChannel = supabase
        .channel(`customer-orders-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const oldStatus = payload.old?.status;
            const newStatus = payload.new.status;
            
            if (oldStatus !== newStatus) {
              alertService.orderStatusUpdate('customer', newStatus, payload.new.id);
            }
          }
        )
        .subscribe();
      channels.push(customerOrderChannel);
    }

    // Admin: Listen for cancelled orders and system events
    if (userRole === 'admin') {
      const adminOrderChannel = supabase
        .channel(`admin-orders-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            const newStatus = payload.new.status;
            
            // Alert on cancelled orders
            if (newStatus === 'cancelled') {
              alertService.adminUrgent(
                'Commande annulée',
                `La commande #${payload.new.id.slice(0, 8)} a été annulée`
              );
            }
          }
        )
        .subscribe();
      channels.push(adminOrderChannel);

      // Listen for new restaurants
      const adminRestaurantChannel = supabase
        .channel(`admin-restaurants-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'restaurants',
          },
          (payload) => {
            alertService.trigger({
              type: 'admin_urgent',
              role: 'admin',
              title: 'Nouveau restaurant',
              message: `${payload.new.name} vient de s'inscrire`,
            });
          }
        )
        .subscribe();
      channels.push(adminRestaurantChannel);
    }

    // All roles: Listen for messages
    const messageChannel = supabase
      .channel(`messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          // Get sender name
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.sender_id)
            .single();

          alertService.newMessage(
            userRole as UserRole,
            sender?.full_name || 'Quelqu\'un',
            payload.new.content
          );
        }
      )
      .subscribe();
    channels.push(messageChannel);

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, userRole]);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Show a subtle prompt after a delay
      const timer = setTimeout(() => {
        toast.info('Activez les notifications', {
          description: 'Pour ne manquer aucune commande ou mise à jour',
          action: {
            label: 'Activer',
            onClick: () => {
              Notification.requestPermission();
            },
          },
          duration: 10000,
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <UrgentAlertModal
        isOpen={urgentAlert !== null}
        onClose={() => setUrgentAlert(null)}
        title={urgentAlert?.title || ''}
        message={urgentAlert?.message || ''}
        type={urgentAlert?.type || 'order_new'}
      />
    </>
  );
}
