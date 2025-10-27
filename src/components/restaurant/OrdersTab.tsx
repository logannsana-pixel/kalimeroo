import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, CheckCircle, MapPin, Phone, User } from "lucide-react";
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
  notes: string | null;
  profiles: {
    full_name: string | null;
  } | null;
}

export const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('restaurant_orders')
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

      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurantData) return;

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersWithProfiles = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', order.user_id)
            .single();

          return {
            ...order,
            profiles: profileData
          };
        })
      );

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success("Statut de la commande mis à jour");
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'preparing': return <Package className="w-4 h-4" />;
      case 'delivering': return <MapPin className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getNextStatus = (currentStatus: OrderStatus) => {
    switch (currentStatus) {
      case 'pending': return { next: 'preparing' as OrderStatus, label: 'Accepter' };
      case 'preparing': return { next: 'delivering' as OrderStatus, label: 'Prête à livrer' };
      default: return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'delivering' || o.status === 'delivered');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Commandes en attente</h2>
        {pendingOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Aucune commande en attente
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">Commande #{order.id.slice(0, 8)}</CardTitle>
                      <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{order.profiles?.full_name || 'Client'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{order.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{order.delivery_address}</span>
                      </div>
                      {order.notes && (
                        <p className="text-sm text-muted-foreground">Note: {order.notes}</p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="font-semibold text-lg">{order.total.toFixed(2)} FCFA</span>
                        {nextStatus && (
                          <Button onClick={() => updateOrderStatus(order.id, nextStatus.next)}>
                            {nextStatus.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Commandes en cours / terminées</h2>
        {completedOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Aucune commande
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {completedOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Commande #{order.id.slice(0, 8)}</CardTitle>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{order.profiles?.full_name || 'Client'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="font-semibold">{order.total.toFixed(2)} FCFA</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
