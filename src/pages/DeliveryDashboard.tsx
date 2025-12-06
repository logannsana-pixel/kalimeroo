import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveDeliveriesTab } from "@/components/delivery/ActiveDeliveriesTab";
import { AvailableOrdersTab } from "@/components/delivery/AvailableOrdersTab";
import { DeliveryHistoryTab } from "@/components/delivery/DeliveryHistoryTab";
import { DeliveryProfileTab } from "@/components/delivery/DeliveryProfileTab";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { RefreshButton } from "@/components/RefreshButton";
import { OrderCardSkeleton } from "@/components/ui/skeleton-card";
import { NotificationBell } from "@/components/NotificationBell";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Package, Truck, History, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  phone: string;
  user_id: string;
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

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: string;
    action: 'accept' | 'pickup' | 'complete';
  }>({ open: false, orderId: '', action: 'accept' });

  const fetchOrders = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch orders with new statuses
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .or(`status.eq.pickup_pending,status.eq.pickup_accepted,status.eq.picked_up,status.eq.delivering,status.eq.delivered`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (ordersData && ordersData.length > 0) {
        const restaurantIds = [...new Set(ordersData.map(o => o.restaurant_id))];
        const userIds = [...new Set(ordersData.map(o => o.user_id))];
        
        const { data: restaurantsData } = await supabase
          .from('restaurants')
          .select('id, name, address, phone, owner_id')
          .in('id', restaurantIds);
          
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const restaurantsMap = new Map(restaurantsData?.map(r => [r.id, r]) || []);
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const ordersWithDetails = ordersData
          .filter(order => 
            order.delivery_driver_id === user.id || 
            (order.status === 'pickup_pending' && !order.delivery_driver_id)
          )
          .map(order => ({
            ...order,
            user_id: order.user_id,
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
  }, []);

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
      const { data: { user } } = await supabase.auth.getUser();
      
      let newStatus: OrderStatus;
      let successMessage: string;
      
      switch (action) {
        case 'accept':
          newStatus = 'pickup_accepted';
          successMessage = "Livraison acceptée ! Dirigez-vous vers le restaurant.";
          break;
        case 'pickup':
          newStatus = 'picked_up';
          successMessage = "Commande récupérée ! En route vers le client.";
          break;
        case 'complete':
          newStatus = 'delivered';
          successMessage = "Livraison terminée ! 🎉";
          break;
        default:
          return;
      }

      const updateData: any = { status: newStatus };
      if (action === 'accept') {
        updateData.delivery_driver_id = user?.id;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      toast.success(successMessage);
      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirmDialog = (orderId: string, action: 'accept' | 'pickup' | 'complete') => {
    setConfirmDialog({ open: true, orderId, action });
  };

  const getConfirmDialogContent = () => {
    switch (confirmDialog.action) {
      case 'accept':
        return {
          title: "Accepter cette livraison ?",
          description: "Vous vous engagez à récupérer et livrer cette commande."
        };
      case 'pickup':
        return {
          title: "Confirmer la récupération ?",
          description: "Confirmez que vous avez bien récupéré la commande au restaurant."
        };
      case 'complete':
        return {
          title: "Confirmer la livraison ?",
          description: "Confirmez que vous avez bien remis la commande au client."
        };
    }
  };

  const activeCount = orders.filter(o => ['pickup_accepted', 'picked_up', 'delivering'].includes(o.status)).length;
  const availableCount = orders.filter(o => o.status === 'pickup_pending').length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-3xl font-bold">Tableau de bord Livreur</h1>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-3xl font-bold">Tableau de bord Livreur</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <RefreshButton onClick={() => fetchOrders(true)} loading={refreshing} />
          </div>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-4">
            <TabsTrigger value="active" className="text-xs md:text-sm relative">
              <Truck className="w-4 h-4 mr-1 hidden md:inline" />
              En cours
              {activeCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {activeCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="available" className="text-xs md:text-sm relative">
              <Package className="w-4 h-4 mr-1 hidden md:inline" />
              Disponibles
              {availableCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-green-500">
                  {availableCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs md:text-sm">
              <History className="w-4 h-4 mr-1 hidden md:inline" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs md:text-sm">
              <User className="w-4 h-4 mr-1 hidden md:inline" />
              Profil
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            <ActiveDeliveriesTab 
              orders={orders} 
              onPickup={(id) => openConfirmDialog(id, 'pickup')}
              onComplete={(id) => openConfirmDialog(id, 'complete')}
              actionLoading={actionLoading}
            />
          </TabsContent>
          
          <TabsContent value="available" className="mt-6">
            <AvailableOrdersTab 
              orders={orders} 
              onAccept={(id) => openConfirmDialog(id, 'accept')}
              actionLoading={actionLoading}
            />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <DeliveryHistoryTab orders={orders} />
          </TabsContent>
          
          <TabsContent value="profile" className="mt-6">
            <DeliveryProfileTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
      <BottomNav />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={getConfirmDialogContent().title}
        description={getConfirmDialogContent().description}
        onConfirm={handleAction}
        loading={!!actionLoading}
      />
    </div>
  );
}
