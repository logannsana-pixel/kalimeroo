import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle, XCircle, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ReviewForm } from "@/components/ReviewForm";

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
  status: string;
  total: number;
  delivery_address: string;
  subtotal: number;
  delivery_fee: number;
  phone: string;
  notes: string | null;
  restaurants: {
    id: string;
    name: string;
  };
  order_items: OrderItem[];
  reviews: { id: string }[];
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
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
          restaurants (
            id,
            name
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
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const canReview = (order: Order) => {
    return order.status === "delivered" && order.reviews.length === 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "confirmed":
      case "preparing":
      case "on_delivery":
        return <Package className="w-5 h-5" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      preparing: "En préparation",
      on_delivery: "En livraison",
      delivered: "Livrée",
      cancelled: "Annulée",
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Mes commandes</h1>
          <p>Chargement...</p>
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
          <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Mes commandes</h1>
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Aucune commande</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8 md:py-12">
                <Package className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm md:text-base text-muted-foreground">
                  Vous n'avez pas encore passé de commande.
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
        <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Mes commandes</h1>
        
        <div className="max-w-4xl mx-auto space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg">
                    {order.restaurants.name}
                  </CardTitle>
                  <Badge variant={getStatusVariant(order.status)}>
                    <span className="flex items-center gap-1 text-xs">
                      {getStatusIcon(order.status)}
                      <span className="hidden sm:inline">{getStatusLabel(order.status)}</span>
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {format(new Date(order.created_at), "PPP", { locale: fr })}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{Number(order.total).toFixed(0)} FCFA</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  {expandedOrder === order.id ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Masquer les détails
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Voir les détails
                    </>
                  )}
                </Button>

                {expandedOrder === order.id && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="font-semibold mb-2">Articles commandés</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.menu_items.name}
                            </span>
                            <span>{Number(item.price).toFixed(0)} FCFA</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm border-t pt-2">
                      <div className="flex justify-between">
                        <span>Sous-total</span>
                        <span>{Number(order.subtotal).toFixed(0)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frais de livraison</span>
                        <span>{Number(order.delivery_fee).toFixed(0)} FCFA</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Adresse:</span>
                        <p className="mt-1">{order.delivery_address}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Téléphone:</span>
                        <p className="mt-1">{order.phone}</p>
                      </div>
                      {order.notes && (
                        <div>
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-1">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    {canReview(order) && (
                      <Button
                        onClick={() => setReviewingOrder(order)}
                        className="w-full"
                        variant="default"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Laisser un avis
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!reviewingOrder} onOpenChange={(open) => !open && setReviewingOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Laisser un avis pour {reviewingOrder?.restaurants.name}</DialogTitle>
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
