import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle, XCircle, Star, Truck, MapPin, User, RefreshCw, ChevronLeft, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ReviewForm } from "@/components/ReviewForm";
import { DriverRatingForm } from "@/components/DriverRatingForm";
import { ChatInterface } from "@/components/ChatInterface";
import { Database } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PageTransition } from "@/components/PageTransition";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const OrderTrackingMap = lazy(() => import("@/components/tracking/OrderTrackingMap"));

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderItem { id: string; quantity: number; price: number; menu_items: { name: string }; }

interface Order {
  id: string; created_at: string; status: OrderStatus; total: number; delivery_address: string;
  subtotal: number; delivery_fee: number; phone: string; notes: string | null;
  delivery_driver_id: string | null; driver_latitude?: number | null; driver_longitude?: number | null;
  restaurants: { id: string; name: string; owner_id: string | null; image_url: string | null; latitude?: number | null; longitude?: number | null; };
  order_items: OrderItem[]; reviews: { id: string }[]; driver_reviews: { id: string }[];
  driver_profile?: { full_name: string | null; phone: string | null; driver_rating?: number | null; } | null;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode; emoji: string }> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: <Clock className="w-3 h-3" />, emoji: "⏳" },
  accepted: { label: "Acceptée", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <CheckCircle className="w-3 h-3" />, emoji: "✅" },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" />, emoji: "✅" },
  preparing: { label: "En préparation", color: "bg-primary/10 text-primary", icon: <Package className="w-3 h-3" />, emoji: "🍳" },
  ready: { label: "Prête", color: "bg-accent/10 text-accent", icon: <CheckCircle className="w-3 h-3" />, emoji: "✅" },
  pickup_pending: { label: "Attente livreur", color: "bg-purple-100 text-purple-800", icon: <Truck className="w-3 h-3" />, emoji: "📦" },
  pickup_accepted: { label: "Livreur en route", color: "bg-indigo-100 text-indigo-800", icon: <Truck className="w-3 h-3" />, emoji: "🛵" },
  picked_up: { label: "Récupérée", color: "bg-cyan-100 text-cyan-800", icon: <Truck className="w-3 h-3" />, emoji: "🛵" },
  delivering: { label: "En livraison", color: "bg-primary/15 text-primary", icon: <Truck className="w-3 h-3" />, emoji: "🚀" },
  delivered: { label: "Livrée", color: "bg-accent/10 text-accent", icon: <CheckCircle className="w-3 h-3" />, emoji: "✅" },
  cancelled: { label: "Annulée", color: "bg-destructive/10 text-destructive", icon: <XCircle className="w-3 h-3" />, emoji: "❌" },
};

const activeStatuses: OrderStatus[] = ['pending', 'accepted', 'confirmed', 'preparing', 'ready', 'pickup_pending', 'pickup_accepted', 'picked_up', 'delivering'];
const TIMELINE_STEPS: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'pickup_accepted', 'delivering', 'delivered'];

export default function Orders() {
  useDocumentTitle("Mes commandes | Kalimero");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coordinates } = useLocationContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [ratingDriverOrder, setRatingDriverOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const fetchOrders = async (showRefresh = false) => {
    if (!user) return;
    if (showRefresh) setRefreshing(true);
    try {
      const { data: ordersData, error } = await supabase.from("orders")
        .select(`id, created_at, status, total, subtotal, delivery_fee, delivery_address, phone, notes, delivery_driver_id, restaurants (id, name, owner_id, image_url, latitude, longitude), order_items (id, quantity, price, menu_items (name)), reviews (id)`)
        .eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      const { data: driverReviews } = await supabase.from("driver_reviews").select("id, order_id").eq("user_id", user.id);
      const driverReviewsByOrder = new Map(driverReviews?.map(r => [r.order_id, r]) || []);
      let data = (ordersData || []).map(order => ({ ...order, driver_reviews: driverReviewsByOrder.has(order.id) ? [{ id: driverReviewsByOrder.get(order.id)!.id }] : [] }));
      if (data.length > 0) {
        const driverIds = [...new Set(data.filter(o => o.delivery_driver_id).map(o => o.delivery_driver_id!))];
        if (driverIds.length > 0) {
          const { data: driversData } = await supabase.from("profiles").select("id, full_name, phone, latitude, longitude, driver_rating").in("id", driverIds);
          const driversMap = new Map(driversData?.map(d => [d.id, d]) || []);
          data = data.map(order => ({
            ...order,
            driver_latitude: order.delivery_driver_id ? driversMap.get(order.delivery_driver_id)?.latitude : null,
            driver_longitude: order.delivery_driver_id ? driversMap.get(order.delivery_driver_id)?.longitude : null,
            driver_profile: order.delivery_driver_id ? { full_name: driversMap.get(order.delivery_driver_id)?.full_name || null, phone: driversMap.get(order.delivery_driver_id)?.phone || null, driver_rating: driversMap.get(order.delivery_driver_id)?.driver_rating || null } : null
          }));
        }
      }
      setOrders(data as Order[]);
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      const channel = supabase.channel('customer-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, (payload: any) => {
          fetchOrders();
          if (payload.new?.status && payload.old?.status !== payload.new.status) {
            const status = statusConfig[payload.new.status as OrderStatus];
            if (status) toast.info(`${status.emoji} Commande ${status.label.toLowerCase()}`);
          }
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const activeOrders = orders.filter(o => activeStatuses.includes(o.status));
  const historyOrders = orders.filter(o => !activeStatuses.includes(o.status));
  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-20 bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="w-8 h-8 flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold">Mes commandes</h1>
        </header>
        <div className="px-4 py-4 space-y-3">{[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl p-4 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
        ))}</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="w-8 h-8 flex items-center justify-center md:hidden"><ChevronLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold flex-1">Mes commandes</h1>
          <button onClick={() => fetchOrders(true)} className={cn("w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted", refreshing && "animate-spin")}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </header>

        <div className="flex px-4 pt-3 gap-2">
          <button onClick={() => setActiveTab('active')} className={cn("flex-1 py-2 rounded-full text-xs font-medium transition-all", activeTab === 'active' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            En cours {activeOrders.length > 0 && `(${activeOrders.length})`}
          </button>
          <button onClick={() => setActiveTab('history')} className={cn("flex-1 py-2 rounded-full text-xs font-medium transition-all", activeTab === 'history' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            Historique
          </button>
        </div>

        <main className="flex-1 px-4 py-3 max-w-2xl mx-auto w-full">
          {displayOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">{activeTab === 'active' ? '📦' : '📋'}</div>
              <h3 className="text-base font-semibold mb-1">{activeTab === 'active' ? "Aucune commande en cours" : "Aucun historique"}</h3>
              <p className="text-sm text-muted-foreground mb-4">{activeTab === 'active' ? "Vos commandes actives apparaîtront ici" : "Vos commandes passées apparaîtront ici"}</p>
              {activeTab === 'active' && <Button onClick={() => navigate("/home")} className="rounded-full text-sm">Découvrir les restaurants</Button>}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {displayOrders.map((order, i) => {
                  const status = statusConfig[order.status];
                  const isExpanded = expandedOrder === order.id;
                  const isActive = activeStatuses.includes(order.status);
                  const currentStep = TIMELINE_STEPS.indexOf(order.status);

                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={cn("bg-card rounded-2xl overflow-hidden shadow-sm", isActive && "ring-1 ring-primary/20")}>
                      <button className="w-full p-4 text-left" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                            <img src={order.restaurants.image_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-sm truncate">{order.restaurants.name}</h3>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1", status.color)}>
                                {status.icon}{status.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
                              {' · '}{order.order_items.length} article{order.order_items.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-sm font-bold text-primary mt-1">{Number(order.total).toLocaleString('fr-FR')} F</p>
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3 overflow-hidden">
                            {/* Timeline for active */}
                            {isActive && currentStep >= 0 && (
                              <div className="flex items-center gap-1">
                                {TIMELINE_STEPS.slice(0, -1).map((step, si) => (
                                  <div key={step} className={cn("h-1.5 flex-1 rounded-full transition-all",
                                    si <= currentStep ? "bg-primary" : "bg-muted"
                                  )} />
                                ))}
                              </div>
                            )}
                            {/* Items */}
                            <div className="space-y-1">
                              {order.order_items.map(item => (
                                <div key={item.id} className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">{item.quantity}x {item.menu_items.name}</span>
                                  <span>{Number(item.price).toLocaleString('fr-FR')} F</span>
                                </div>
                              ))}
                            </div>
                            {isActive && ['pickup_accepted', 'picked_up', 'delivering'].includes(order.status) && (
                              <Button onClick={() => setTrackingOrder(order)} variant="outline" className="w-full rounded-full text-xs h-9">
                                <MapPin className="w-3.5 h-3.5 mr-1.5" />Suivre ma commande
                              </Button>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {order.restaurants.owner_id && <ChatInterface orderId={order.id} receiverId={order.restaurants.owner_id} receiverName={order.restaurants.name} />}
                              {order.delivery_driver_id && ['pickup_accepted', 'picked_up', 'delivering'].includes(order.status) && (
                                <ChatInterface orderId={order.id} receiverId={order.delivery_driver_id} receiverName="Livreur" />
                              )}
                            </div>
                            {order.status === 'delivered' && (
                              <Button onClick={() => navigate(`/restaurant/${order.restaurants.id}`)} variant="outline" className="w-full rounded-full text-xs h-9">
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Recommander
                              </Button>
                            )}
                            {order.status === 'delivered' && order.reviews.length === 0 && (
                              <Button onClick={() => setReviewingOrder(order)} className="w-full rounded-full text-xs h-9">
                                <Star className="w-3.5 h-3.5 mr-1.5" />Laisser un avis
                              </Button>
                            )}
                            {order.status === 'delivered' && order.delivery_driver_id && order.driver_reviews.length === 0 && (
                              <Button onClick={() => setRatingDriverOrder(order)} variant="outline" className="w-full rounded-full text-xs h-9">
                                <User className="w-3.5 h-3.5 mr-1.5" />Noter le livreur
                              </Button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </main>

        <Dialog open={!!reviewingOrder} onOpenChange={open => !open && setReviewingOrder(null)}>
          <DialogContent className="mx-4 max-w-md rounded-3xl">
            <DialogHeader><DialogTitle>Avis pour {reviewingOrder?.restaurants.name}</DialogTitle></DialogHeader>
            {reviewingOrder && <ReviewForm restaurantId={reviewingOrder.restaurants.id} orderId={reviewingOrder.id} onSuccess={() => { setReviewingOrder(null); fetchOrders(); }} onCancel={() => setReviewingOrder(null)} />}
          </DialogContent>
        </Dialog>

        <Dialog open={!!ratingDriverOrder} onOpenChange={open => !open && setRatingDriverOrder(null)}>
          <DialogContent className="mx-4 max-w-md rounded-3xl">
            <DialogHeader><DialogTitle>Noter le livreur</DialogTitle></DialogHeader>
            {ratingDriverOrder && ratingDriverOrder.delivery_driver_id && (
              <DriverRatingForm driverId={ratingDriverOrder.delivery_driver_id} orderId={ratingDriverOrder.id} driverName={ratingDriverOrder.driver_profile?.full_name || "Livreur"} onSuccess={() => { setRatingDriverOrder(null); fetchOrders(); }} onCancel={() => setRatingDriverOrder(null)} />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!trackingOrder} onOpenChange={open => !open && setTrackingOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto rounded-3xl p-4">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" />Suivi en temps réel</DialogTitle></DialogHeader>
            {trackingOrder && (
              <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
                <OrderTrackingMap orderId={trackingOrder.id}
                  driverLocation={trackingOrder.driver_latitude && trackingOrder.driver_longitude ? { lat: trackingOrder.driver_latitude, lng: trackingOrder.driver_longitude } : null}
                  restaurantLocation={trackingOrder.restaurants?.latitude && trackingOrder.restaurants?.longitude ? { lat: trackingOrder.restaurants.latitude, lng: trackingOrder.restaurants.longitude } : null}
                  customerLocation={coordinates?.latitude && coordinates?.longitude ? { lat: coordinates.latitude, lng: coordinates.longitude } : null}
                  status={trackingOrder.status} driverName={trackingOrder.driver_profile?.full_name || undefined}
                  driverPhone={trackingOrder.driver_profile?.phone || undefined} estimatedTime="15-20 min" />
              </Suspense>
            )}
          </DialogContent>
        </Dialog>

        <Footer className="hidden md:block" />
        <BottomNav />
      </div>
    </PageTransition>
  );
}
