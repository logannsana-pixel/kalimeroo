import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveDeliveriesTab } from "@/components/delivery/ActiveDeliveriesTab";
import { AvailableOrdersTab } from "@/components/delivery/AvailableOrdersTab";
import { DeliveryHistoryTab } from "@/components/delivery/DeliveryHistoryTab";
import { DeliveryProfileTab } from "@/components/delivery/DeliveryProfileTab";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  phone: string;
  restaurants: {
    name: string;
    address: string;
    phone: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
}

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .or(`status.eq.delivering,status.eq.preparing,status.eq.delivered`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (ordersData && ordersData.length > 0) {
        const restaurantIds = [...new Set(ordersData.map(o => o.restaurant_id))];
        const userIds = [...new Set(ordersData.map(o => o.user_id))];
        
        const { data: restaurantsData } = await supabase
          .from('restaurants')
          .select('id, name, address, phone')
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
            (order.status === 'preparing' && !order.delivery_driver_id)
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
    }
  };

  const acceptDelivery = async (orderId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_driver_id: user?.id,
          status: 'delivering' 
        })
        .eq('id', orderId);

      if (error) throw error;
      toast.success("Livraison acceptée");
      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erreur");
    }
  };

  const completeDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);

      if (error) throw error;
      toast.success("Livraison complétée");
      fetchOrders();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erreur");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Tableau de bord Livreur</h1>
          <p>Chargement...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord Livreur</h1>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="active">En cours</TabsTrigger>
            <TabsTrigger value="available">Disponibles</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            <ActiveDeliveriesTab orders={orders} onComplete={completeDelivery} />
          </TabsContent>
          
          <TabsContent value="available" className="mt-6">
            <AvailableOrdersTab orders={orders} onAccept={acceptDelivery} />
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
    </div>
  );
}
