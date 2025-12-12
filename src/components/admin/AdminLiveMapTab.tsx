import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Map, Truck, Package, RefreshCw, MapPin, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ActiveOrder {
  id: string;
  status: string;
  delivery_address: string;
  driver_latitude: number | null;
  driver_longitude: number | null;
  restaurant?: { name: string; address: string };
  driver?: { full_name: string | null };
  created_at: string;
}

interface ActiveDriver {
  id: string;
  full_name: string | null;
  is_available: boolean;
  phone: string | null;
  current_order?: string;
}

export function AdminLiveMapTab() {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveData();

    // Subscribe to real-time updates
    const ordersChannel = supabase
      .channel('admin-live-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchLiveData();
      })
      .subscribe();

    const interval = setInterval(fetchLiveData, 30000); // Refresh every 30s

    return () => {
      supabase.removeChannel(ordersChannel);
      clearInterval(interval);
    };
  }, []);

  const fetchLiveData = async () => {
    try {
      // Fetch active orders (not delivered or cancelled)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id, status, delivery_address, created_at, delivery_driver_id,
          restaurant:restaurants(name, address)
        `)
        .not("status", "in", "(delivered,cancelled)")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Get driver info for orders
      const ordersWithDrivers = await Promise.all((orders || []).map(async (order: any) => {
        if (order.delivery_driver_id) {
          const { data: driver } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", order.delivery_driver_id)
            .single();
          return { ...order, driver };
        }
        return order;
      }));

      setActiveOrders(ordersWithDrivers);

      // Fetch available drivers
      const { data: driverRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "delivery_driver");

      if (driverRoles && driverRoles.length > 0) {
        const { data: drivers } = await supabase
          .from("profiles")
          .select("id, full_name, is_available, phone")
          .in("id", driverRoles.map(r => r.user_id))
          .eq("is_validated", true);

        // Map orders to drivers
        const driversWithOrders = (drivers || []).map(driver => {
          const order = (orders as any[])?.find(o => o.delivery_driver_id === driver.id);
          return { ...driver, current_order: order?.id };
        });

        setActiveDrivers(driversWithOrders);
      }
    } catch (error) {
      console.error("Error fetching live data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: 'En attente', color: 'bg-yellow-500' },
      accepted: { label: 'Acceptée', color: 'bg-blue-500' },
      preparing: { label: 'Préparation', color: 'bg-orange-500' },
      pickup_pending: { label: 'Prêt', color: 'bg-purple-500' },
      pickup_accepted: { label: 'Livreur assigné', color: 'bg-indigo-500' },
      picked_up: { label: 'Récupérée', color: 'bg-cyan-500' },
      delivering: { label: 'En livraison', color: 'bg-primary' },
    };
    return config[status] || { label: status, color: 'bg-muted' };
  };

  const deliveringOrders = activeOrders.filter(o => 
    ['delivering', 'picked_up', 'pickup_accepted'].includes(o.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Carte Live</h2>
          <p className="text-muted-foreground">
            {activeOrders.length} commandes actives • {activeDrivers.filter(d => d.is_available).length} livreurs disponibles
          </p>
        </div>
        <Button variant="outline" onClick={fetchLiveData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Commandes actives</p>
                <p className="text-2xl font-bold">{activeOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">En livraison</p>
                <p className="text-2xl font-bold">{deliveringOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Livreurs disponibles</p>
                <p className="text-2xl font-bold">
                  {activeDrivers.filter(d => d.is_available && !d.current_order).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">En attente livreur</p>
                <p className="text-2xl font-bold">
                  {activeOrders.filter(o => o.status === 'pickup_pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Carte des livraisons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-xl bg-muted flex items-center justify-center">
              <div className="text-center">
                <Map className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Carte en temps réel des livraisons
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {deliveringOrders.length} livraisons en cours
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {deliveringOrders.slice(0, 5).map(order => (
                    <Badge 
                      key={order.id}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      #{order.id.slice(0, 6)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes actives</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            <div className="space-y-3">
              {activeOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune commande active
                </p>
              ) : (
                activeOrders.map((order) => {
                  const status = getStatusInfo(order.status);
                  return (
                    <div 
                      key={order.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedOrder === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono font-bold text-sm">#{order.id.slice(0, 8)}</span>
                        <Badge className={`${status.color} text-white text-xs`}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {order.restaurant?.name || 'Restaurant'}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                      {order.driver && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Truck className="w-3 h-3" />
                          <span>{order.driver.full_name || 'Livreur assigné'}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(order.created_at), "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Drivers */}
      <Card>
        <CardHeader>
          <CardTitle>Livreurs en activité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeDrivers.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-8">
                Aucun livreur actif
              </p>
            ) : (
              activeDrivers.map((driver) => (
                <div 
                  key={driver.id}
                  className={`p-4 rounded-xl border text-center ${
                    driver.is_available && !driver.current_order
                      ? 'border-success/50 bg-success/5'
                      : driver.current_order
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-muted'
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    driver.is_available ? 'bg-success/20' : 'bg-muted'
                  }`}>
                    <Truck className={`w-6 h-6 ${
                      driver.is_available ? 'text-success' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <p className="font-medium mt-2 truncate">{driver.full_name || 'Livreur'}</p>
                  <Badge 
                    variant="outline" 
                    className={`mt-1 text-xs ${
                      driver.current_order
                        ? 'text-primary'
                        : driver.is_available
                        ? 'text-success'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {driver.current_order
                      ? 'En livraison'
                      : driver.is_available
                      ? 'Disponible'
                      : 'Hors ligne'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}