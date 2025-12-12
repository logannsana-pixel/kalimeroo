import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle, XCircle, Star, ChevronDown, ChevronUp, Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ReviewForm } from "@/components/ReviewForm";
import { ChatInterface } from "@/components/ChatInterface";
import { RefreshButton } from "@/components/RefreshButton";
import { Database } from "@/integrations/supabase/types";
import { HorizontalCard, HorizontalCardSkeleton } from "@/components/ui/horizontal-card";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menu_items: {
    name: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  subtotal: number;
  delivery_fee: number;
  phone: string;
  notes: string | null;
  delivery_driver_id: string | null;
  restaurants: {
    id: string;
    name: string;
    owner_id: string | null;
    image_url: string | null;
  };
  order_items: OrderItem[];
  reviews: { id: string }[];
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success"; icon: React.ReactNode }> = {
  pending: { label: "En attente", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
  accepted: { label: "Acceptée", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  confirmed: { label: "Confirmée", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  preparing: { label: "En préparation", variant: "default", icon: <Package className="w-3 h-3" /> },
  ready: { label: "Prête", variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
  pickup_pending: { label: "En attente livreur", variant: "secondary", icon: <Truck className="w-3 h-3" /> },
  pickup_accepted: { label: "Livreur en route", variant: "default", icon: <Truck className="w-3 h-3" /> },
  picked_up: { label: "Récupérée", variant: "default", icon: <Truck className="w-3 h-3" /> },
  delivering: { label: "En livraison", variant: "default", icon: <Truck className="w-3 h-3" /> },
  delivered: { label: "Livrée", variant: "success", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Annulée", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);

  const fetchOrders = async (showRefresh = false) => {
    if (!user) return;
    if (showRefresh) setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          total,
          subtotal,
          delivery_fee,
          delivery_address,
          phone,
          notes,
          delivery_driver_id,
          restaurants (
            id,
            name,
            owner_id,
            image_url
          ),
          order_items (
            id,
            quantity,
            price,
            menu_items (
              name
            )
          ),
          reviews (
            id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();

      // Realtime subscription
      const channel = supabase
        .channel('customer-orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          () => fetchOrders()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const canReview = (order: Order) => {
    return order.status === "delivered" && order.reviews.length === 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-3xl font-bold">Mes commandes</h1>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <HorizontalCardSkeleton key={i} variant="default" />
            ))}
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-3xl font-bold">Mes commandes</h1>
            <RefreshButton onClick={() => fetchOrders(true)} loading={refreshing} />
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="py-12 md:py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                <p className="text-sm text-muted-foreground">
                  Vos commandes apparaîtront ici
                </p>
              </CardContent>
            </Card>
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
          <h1 className="text-xl md:text-3xl font-bold">Mes commandes</h1>
          <RefreshButton onClick={() => fetchOrders(true)} loading={refreshing} />
        </div>
        
        <div className="max-w-4xl mx-auto space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const isExpanded = expandedOrder === order.id;
            
            return (
              <Card key={order.id} className="overflow-hidden">
                <div
                  className="cursor-pointer"
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  <HorizontalCard
                    imageUrl={order.restaurants.image_url || "/placeholder.svg"}
                    title={order.restaurants.name}
                    subtitle={format(new Date(order.created_at), "PPP 'à' HH:mm", { locale: fr })}
                    description={`${order.order_items.length} article${order.order_items.length > 1 ? 's' : ''}`}
                    price={Number(order.total)}
                    badge={status.label}
                    badgeVariant={status.variant}
                    ctaText={isExpanded ? "Masquer" : "Détails"}
                    variant="default"
                    className="border-0 shadow-none"
                  />
                </div>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-4 border-t mx-4 pb-4">
                    <div className="pt-4">
                      <h4 className="font-semibold mb-2 text-sm">Articles</h4>
                      <div className="space-y-1">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.quantity}x {item.menu_items.name}
                            </span>
                            <span>{Number(item.price).toFixed(0)} FCFA</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 text-sm border-t pt-3">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Sous-total</span>
                        <span>{Number(order.subtotal).toFixed(0)} FCFA</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Livraison</span>
                        <span>{Number(order.delivery_fee).toFixed(0)} FCFA</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm border-t pt-3">
                      <div>
                        <span className="text-muted-foreground">Adresse:</span>
                        <p className="mt-0.5">{order.delivery_address}</p>
                      </div>
                      {order.notes && (
                        <div>
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-0.5">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Chat buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {order.restaurants.owner_id && (
                        <ChatInterface
                          orderId={order.id}
                          receiverId={order.restaurants.owner_id}
                          receiverName={order.restaurants.name}
                        />
                      )}
                      {order.delivery_driver_id && ['pickup_accepted', 'picked_up', 'delivering'].includes(order.status) && (
                        <ChatInterface
                          orderId={order.id}
                          receiverId={order.delivery_driver_id}
                          receiverName="Livreur"
                        />
                      )}
                    </div>

                    {canReview(order) && (
                      <Button
                        onClick={() => setReviewingOrder(order)}
                        className="w-full rounded-full"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Laisser un avis
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <Dialog open={!!reviewingOrder} onOpenChange={(open) => !open && setReviewingOrder(null)}>
          <DialogContent className="mx-4 max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle>Avis pour {reviewingOrder?.restaurants.name}</DialogTitle>
            </DialogHeader>
            {reviewingOrder && (
              <ReviewForm
                restaurantId={reviewingOrder.restaurants.id}
                orderId={reviewingOrder.id}
                onSuccess={() => {
                  setReviewingOrder(null);
                  fetchOrders();
                }}
                onCancel={() => setReviewingOrder(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
