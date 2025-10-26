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
import { Package, Clock, CheckCircle } from "lucide-react";

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  delivery_address: string;
  phone: string;
  notes: string;
  profiles: {
    full_name: string;
  };
}

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
      // Set up realtime subscription
      const channel = supabase
        .channel("restaurant-orders")
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
      // Get restaurant owned by current user
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user?.id)
        .single();

      if (!restaurant) {
        setLoading(false);
        return;
      }

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map(o => o.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const ordersWithProfiles = ordersData.map(order => ({
          ...order,
          profiles: profilesMap.get(order.user_id) || { full_name: "Utilisateur" }
        }));
        
        setOrders(ordersWithProfiles);
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

  const updateOrderStatus = async (orderId: string, status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Statut mis à jour");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
      case "preparing":
        return <Package className="w-4 h-4" />;
      case "on_delivery":
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getNextStatus = (currentStatus: string): { next: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled"; label: string } | undefined => {
    const statusFlow: Record<string, { next: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled"; label: string }> = {
      pending: { next: "confirmed", label: "Confirmer" },
      confirmed: { next: "preparing", label: "En préparation" },
      preparing: { next: "delivering", label: "Prêt pour livraison" },
    };
    return statusFlow[currentStatus];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Tableau de bord Restaurant</h1>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tableau de bord Restaurant</h1>
          <p className="text-muted-foreground">
            Gérez vos commandes et mettez à jour leur statut
          </p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune commande pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
              {orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Commande #{order.id.slice(0, 8)}
                      </CardTitle>
                      <Badge variant="secondary">
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status === "pending" && "En attente"}
                          {order.status === "confirmed" && "Confirmée"}
                          {order.status === "preparing" && "En préparation"}
                          {order.status === "delivering" && "En livraison"}
                          {order.status === "delivered" && "Livrée"}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Client</p>
                          <p className="font-medium">{order.profiles.full_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{order.phone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Adresse</p>
                          <p className="font-medium">{order.delivery_address}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {format(new Date(order.created_at), "PPp", { locale: fr })}
                          </p>
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
                        {nextStatus && order.status !== "delivering" && (
                          <Button
                            onClick={() => updateOrderStatus(order.id, nextStatus.next)}
                          >
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
      </main>
      <Footer />
    </div>
  );
}
