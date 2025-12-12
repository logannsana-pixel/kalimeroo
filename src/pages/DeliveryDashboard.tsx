import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { DriverHeader } from "@/components/driver/DriverHeader";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { DriverHomeTab } from "@/components/driver/DriverHomeTab";
import { DriverOrdersTab } from "@/components/driver/DriverOrdersTab";
import { DriverEarningsTab } from "@/components/driver/DriverEarningsTab";
import { DriverProfileTab } from "@/components/driver/DriverProfileTab";
import { DriverActiveOrder } from "@/components/driver/DriverActiveOrder";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OrderCardSkeleton } from "@/components/ui/skeleton-card";
import { ValidationLockScreen } from "@/components/validation/ValidationLockScreen";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface DriverOrder {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  phone: string;
  user_id: string;
  delivery_driver_id: string | null;
  restaurants: {
    name: string;
    address: string;
    phone: string | null;
    owner_id: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
}

interface DriverProfile {
  full_name: string | null;
  is_available: boolean;
  is_validated: boolean;
  validation_notes: string | null;
}

export default function DeliveryDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'earnings' | 'profile'>('home');
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile>({ 
    full_name: null, 
    is_available: true,
    is_validated: false,
    validation_notes: null
  });
  const [activeOrderView, setActiveOrderView] = useState<DriverOrder | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: string;
    action: 'accept' | 'pickup' | 'complete';
  }>({ open: false, orderId: '', action: 'accept' });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, is_available, is_validated, validation_notes')
        .eq('id', user.id)
        .single();
      if (data) {
        setDriverProfile(data);
      }
      setProfileLoading(false);
    };
    fetchProfile();

    // Real-time subscription for validation status changes
    if (user) {
      const channel = supabase
        .channel('driver-validation')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          setDriverProfile(prev => ({
            ...prev,
            is_validated: payload.new.is_validated as boolean,
            validation_notes: payload.new.validation_notes as string | null
          }));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (!user) return;
    try {
      if (showRefresh) setRefreshing(true);

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .or(`status.eq.pickup_pending,status.eq.pickup_accepted,status.eq.picked_up,status.eq.delivering,status.eq.delivered`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (ordersData && ordersData.length > 0) {
        const restaurantIds = [...new Set(ordersData.map(o => o.restaurant_id))];
        const userIds = [...new Set(ordersData.map(o => o.user_id))];
        
        const [{ data: restaurantsData }, { data: profilesData }] = await Promise.all([
          supabase.from('restaurants').select('id, name, address, phone, owner_id').in('id', restaurantIds),
          supabase.from('profiles').select('id, full_name').in('id', userIds)
        ]);

        const restaurantsMap = new Map(restaurantsData?.map(r => [r.id, r]) || []);
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const ordersWithDetails = ordersData
          .filter(order => 
            order.delivery_driver_id === user.id || 
            (order.status === 'pickup_pending' && !order.delivery_driver_id)
          )
          .map(order => ({
            ...order,
            restaurants: restaurantsMap.get(order.restaurant_id) || null,
            profiles: profilesMap.get(order.user_id) || null
          }));
        
        setOrders(ordersWithDetails);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('delivery_orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const handleAction = async () => {
    const { orderId, action } = confirmDialog;
    setActionLoading(orderId);
    setConfirmDialog({ ...confirmDialog, open: false });

    try {
      let newStatus: OrderStatus;
      let successMessage: string;
      
      switch (action) {
        case 'accept':
          newStatus = 'pickup_accepted';
          successMessage = "Livraison acceptée !";
          break;
        case 'pickup':
          newStatus = 'picked_up';
          successMessage = "Commande récupérée !";
          break;
        case 'complete':
          newStatus = 'delivered';
          successMessage = "Livraison terminée ! 🎉";
          break;
        default:
          return;
      }

      const updateData: { status: OrderStatus; delivery_driver_id?: string } = { status: newStatus };
      if (action === 'accept' && user) {
        updateData.delivery_driver_id = user.id;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      toast.success(successMessage);
      if (action === 'complete') setActiveOrderView(null);
      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAvailability = async () => {
    if (!user) return;
    const newStatus = !driverProfile.is_available;
    const { error } = await supabase
      .from('profiles')
      .update({ is_available: newStatus })
      .eq('id', user.id);
    
    if (!error) {
      setDriverProfile(prev => ({ ...prev, is_available: newStatus }));
      toast.success(newStatus ? "Vous êtes maintenant en ligne" : "Vous êtes hors ligne");
    }
  };

  const openConfirmDialog = (orderId: string, action: 'accept' | 'pickup' | 'complete') => {
    setConfirmDialog({ open: true, orderId, action });
  };

  const getConfirmContent = () => {
    switch (confirmDialog.action) {
      case 'accept': return { title: "Accepter cette livraison ?", desc: "Vous vous engagez à récupérer et livrer cette commande." };
      case 'pickup': return { title: "Confirmer la récupération ?", desc: "Confirmez que vous avez récupéré la commande." };
      case 'complete': return { title: "Confirmer la livraison ?", desc: "Confirmez que vous avez remis la commande." };
    }
  };

  const availableOrders = orders.filter(o => o.status === 'pickup_pending');
  const activeOrders = orders.filter(o => ['pickup_accepted', 'picked_up', 'delivering'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');

  const handleRequestRevalidation = async () => {
    if (!user) return;
    
    // Clear rejection notes to mark as pending again
    await supabase
      .from("profiles")
      .update({ validation_notes: null })
      .eq("id", user.id);
    
    setDriverProfile(prev => ({ ...prev, validation_notes: null }));
  };

  // Show loading while checking profile
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show lock screen if not validated
  if (!driverProfile.is_validated) {
    return (
      <ValidationLockScreen
        type="driver"
        isValidated={driverProfile.is_validated}
        validationNotes={driverProfile.validation_notes}
        onLogout={signOut}
        onRequestRevalidation={handleRequestRevalidation}
        entityName={driverProfile.full_name || "Livreur"}
      />
    );
  }

  // Show active order full-screen view
  if (activeOrderView) {
    return (
      <DriverActiveOrder
        order={activeOrderView}
        onBack={() => setActiveOrderView(null)}
        onPickup={() => openConfirmDialog(activeOrderView.id, 'pickup')}
        onComplete={() => openConfirmDialog(activeOrderView.id, 'complete')}
        actionLoading={actionLoading}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DriverHeader 
          driverName="" 
          isOnline={false} 
          onToggleOnline={() => {}} 
          onLogout={signOut}
          onRefresh={() => {}}
          refreshing={false}
        />
        <main className="flex-1 p-4 pb-24 space-y-4">
          {[1, 2, 3].map(i => <OrderCardSkeleton key={i} />)}
        </main>
        <DriverBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DriverHeader 
        driverName={driverProfile.full_name || "Livreur"} 
        isOnline={driverProfile.is_available} 
        onToggleOnline={toggleAvailability}
        onLogout={signOut}
        onRefresh={() => fetchOrders(true)}
        refreshing={refreshing}
      />
      
      <main className="flex-1 overflow-auto pb-24">
        {activeTab === 'home' && (
          <DriverHomeTab
            availableOrders={availableOrders}
            activeOrders={activeOrders}
            onAccept={(id) => openConfirmDialog(id, 'accept')}
            onViewActive={setActiveOrderView}
            actionLoading={actionLoading}
          />
        )}
        {activeTab === 'orders' && (
          <DriverOrdersTab
            orders={completedOrders}
          />
        )}
        {activeTab === 'earnings' && (
          <DriverEarningsTab orders={completedOrders} />
        )}
        {activeTab === 'profile' && (
          <DriverProfileTab />
        )}
      </main>

      <DriverBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={getConfirmContent().title}
        description={getConfirmContent().desc}
        onConfirm={handleAction}
        loading={!!actionLoading}
      />
    </div>
  );
}