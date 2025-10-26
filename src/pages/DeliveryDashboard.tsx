import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Package, MapPin, Phone } from "lucide-react";

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  delivery_address: string;
  phone: string;
  notes: string;
  restaurants: {
    name: string;
    address: string;
  };
  profiles: {
    full_name: string;
  };
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
      // Set up realtime subscription
      const channel = supabase
        .channel("delivery-orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      // Fetch orders ready for delivery or assigned to this driver
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .or(`status.eq.delivering,and(status.eq.preparing,delivery_driver_id.is.null)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch restaurants and profiles separately
      if (ordersData && ordersData.length > 0) {
        const restaurantIds = [...new Set(ordersData.map(o => o.restaurant_id))];
        const userIds = [...new Set(ordersData.map(o => o.user_id))];
        
        const { data: restaurantsData } = await supabase
          .from("restaurants")
          .select("id, name, address")
          .in("id", restaurantIds);
          
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const restaurantsMap = new Map(restaurantsData?.map(r => [r.id, r]) || []);
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const ordersWithDetails = ordersData.map(order => ({
          ...order,
          restaurants: restaurantsMap.get(order.restaurant_id) || { name: "Restaurant", address: "" },
          profiles: profilesMap.get(order.user_id) || { full_name: "Utilisateur" }
        }));
        
        setOrders(ordersWithDetails);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const acceptDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          delivery_driver_id: user?.id,
          status: "delivering" 
        })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Livraison acceptée");
      fetchOrders();
    } catch (error) {
      console.error("Error accepting delivery:", error);
      toast.error("Erreur lors de l'acceptation");
    }
  };

  const completeDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "delivered" })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Livraison complétée");
      fetchOrders();
    } catch (error) {
      console.error("Error completing delivery:", error);
      toast.error("Erreur lors de la complétion");
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

  const availableOrders = orders.filter(o => o.status === "preparing");
  const activeDeliveries = orders.filter(o => o.status === "delivering");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tableau de bord Livreur</h1>
          <p className="text-muted-foreground">
            Acceptez et gérez vos livraisons
          </p>
        </div>

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Livraisons en cours</h2>
            <div className="grid gap-4">
              {activeDeliveries.map((order) => (
                <Card key={order.id} className="border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Commande #{order.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant="default">En livraison</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <div className="flex items-start gap-2">
                          <Package className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Restaurant</p>
                            <p className="font-medium">{order.restaurants.name}</p>
                            <p className="text-sm">{order.restaurants.address}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Livraison à</p>
                            <p className="font-medium">{order.profiles.full_name}</p>
                            <p className="text-sm">{order.delivery_address}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Téléphone</p>
                            <p className="font-medium">{order.phone}</p>
                          </div>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Notes:</p>
                          <p className="text-sm">{order.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <p className="font-bold text-lg">
                          Total: {Number(order.total).toFixed(2)}€
                        </p>
                        <Button onClick={() => completeDelivery(order.id)}>
                          Marquer comme livrée
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Orders */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Commandes disponibles</h2>
          {availableOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucune commande disponible</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {availableOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Commande #{order.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant="secondary">Prête</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Restaurant</p>
                          <p className="font-medium">{order.restaurants.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Livraison à</p>
                          <p className="font-medium">{order.delivery_address}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <p className="font-bold text-lg">
                          Total: {Number(order.total).toFixed(2)}€
                        </p>
                        <Button onClick={() => acceptDelivery(order.id)}>
                          Accepter la livraison
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
