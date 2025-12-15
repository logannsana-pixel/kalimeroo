import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, CheckCircle, MapPin, Phone, User, X, AlertTriangle } from "lucide-react";
import { VoiceNotePlayer } from "@/components/voice/VoiceNotePlayer";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { ChatInterface } from "@/components/ChatInterface";
import { OrderCardSkeleton } from "@/components/ui/skeleton-card";
import { ButtonLoader } from "@/components/ui/loading-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RefreshButton } from "@/components/RefreshButton";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  phone: string;
  notes: string | null;
  voice_note_url: string | null;
  user_id: string;
  profiles: {
    full_name: string | null;
  } | null;
}

interface Restaurant {
  id: string;
  latitude: number | null;
  longitude: number | null;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  accepted: { label: "Acceptée", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  preparing: { label: "En préparation", color: "bg-purple-100 text-purple-800", icon: Package },
  ready: { label: "Prête", color: "bg-green-100 text-green-800", icon: CheckCircle },
  pickup_pending: { label: "Attente livreur", color: "bg-teal-100 text-teal-800", icon: Package },
  pickup_accepted: { label: "Livreur assigné", color: "bg-cyan-100 text-cyan-800", icon: Package },
  picked_up: { label: "Récupérée", color: "bg-indigo-100 text-indigo-800", icon: Package },
  delivering: { label: "En livraison", color: "bg-orange-100 text-orange-800", icon: MapPin },
  delivered: { label: "Livrée", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-800", icon: X },
};

export const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: string;
    newStatus: OrderStatus | null;
    action: string;
  }>({ open: false, orderId: '', newStatus: null, action: '' });

  // Check if restaurant has GPS configured
  const hasGPS = restaurant?.latitude && restaurant?.longitude;

  const fetchOrders = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id, latitude, longitude')
        .eq('owner_id', user.id)
        .single();

      if (!restaurantData) return;
      setRestaurant(restaurantData);

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
            user_id: order.user_id,
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
      setRefreshing(false);
    }
  }, []);

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
  }, [fetchOrders]);

  const handleStatusUpdate = async () => {
    const { orderId, newStatus } = confirmDialog;
    if (!newStatus) return;
    
    setActionLoading(orderId);
    setConfirmDialog({ ...confirmDialog, open: false });

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
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirmDialog = (orderId: string, newStatus: OrderStatus, action: string) => {
    // Block order acceptance if GPS not configured
    if (!hasGPS && newStatus === 'accepted') {
      toast.error("Configurez d'abord la position GPS de votre restaurant dans l'onglet Profil pour pouvoir accepter des commandes.");
      return;
    }
    setConfirmDialog({ open: true, orderId, newStatus, action });
  };

  const getNextStatus = (currentStatus: OrderStatus): { next: OrderStatus; label: string } | null => {
    switch (currentStatus) {
      case 'pending': return { next: 'accepted', label: 'Accepter' };
      case 'accepted': return { next: 'preparing', label: 'Commencer préparation' };
      case 'preparing': return { next: 'pickup_pending', label: 'Prête - Attente livreur' };
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <RefreshButton onClick={() => {}} loading={true} />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const pendingOrders = orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status));
  const readyOrders = orders.filter(o => ['pickup_pending', 'pickup_accepted', 'picked_up', 'delivering'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-5">
      {/* GPS Warning */}
      {!hasGPS && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl">
          <CardContent className="p-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Position GPS non configurée</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Configurez votre position GPS dans l'onglet <strong>Profil</strong> pour accepter des commandes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <RefreshButton onClick={() => fetchOrders(true)} loading={refreshing} />
      </div>

      {/* Pending orders */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          À traiter ({pendingOrders.length})
        </h2>
        {pendingOrders.length === 0 ? (
          <Card className="border-none shadow-soft rounded-2xl">
            <CardContent className="text-center py-8 text-muted-foreground text-sm">
              Aucune commande en attente
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pendingOrders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;
              const isLoading = actionLoading === order.id;
              
              return (
              <Card key={order.id} className="border-none shadow-soft rounded-2xl overflow-hidden border-l-4 border-l-primary">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm">#{order.id.slice(0, 8)}</CardTitle>
                      <Badge className={`${config.color} text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{order.profiles?.full_name || 'Client'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <a href={`tel:${order.phone}`} className="text-primary">{order.phone}</a>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                        <span className="line-clamp-2">{order.delivery_address}</span>
                      </div>
                      {order.notes && (
                        <p className="text-xs bg-muted/50 p-2 rounded-xl">
                          <strong>Note:</strong> {order.notes}
                        </p>
                      )}
                      {order.voice_note_url && (
                        <VoiceNotePlayer
                          audioUrl={order.voice_note_url}
                          duration={30}
                          showDelete={false}
                        />
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border/30">
                        <span className="font-bold text-primary">{order.total.toFixed(0)} FCFA</span>
                        <div className="flex gap-2">
                          <ChatInterface
                            orderId={order.id}
                            receiverId={order.user_id}
                            receiverName={order.profiles?.full_name || "Client"}
                          />
                          {order.status === 'pending' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="h-8 rounded-xl text-xs"
                              onClick={() => openConfirmDialog(order.id, 'cancelled', 'Refuser cette commande')}
                              disabled={isLoading}
                            >
                              Refuser
                            </Button>
                          )}
                          {nextStatus && (
                            <Button 
                              size="sm"
                              className="h-8 rounded-xl text-xs"
                              onClick={() => openConfirmDialog(order.id, nextStatus.next, nextStatus.label)}
                              disabled={isLoading || (!hasGPS && nextStatus.next === 'accepted')}
                              title={!hasGPS && nextStatus.next === 'accepted' ? "Configurez le GPS d'abord" : ""}
                            >
                              {isLoading ? <ButtonLoader /> : nextStatus.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Ready/In transit orders */}
      {readyOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            En livraison ({readyOrders.length})
          </h2>
          <div className="space-y-2">
            {readyOrders.map((order) => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;
              
              return (
                <Card key={order.id} className="border-none shadow-soft rounded-xl opacity-80">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium">#{order.id.slice(0, 8)}</span>
                      <Badge className={`${config.color} text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{order.profiles?.full_name || 'Client'}</span>
                      </div>
                      <span className="font-semibold text-sm">{order.total.toFixed(0)} F</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed orders */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Historique récent</h2>
        {completedOrders.length === 0 ? (
          <Card className="border-none shadow-soft rounded-2xl">
            <CardContent className="text-center py-8 text-muted-foreground text-sm">
              Aucune commande terminée
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {completedOrders.slice(0, 5).map((order) => {
              const config = statusConfig[order.status];
              
              return (
                <Card key={order.id} className="border-none shadow-soft rounded-xl opacity-60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-xs">#{order.id.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {order.profiles?.full_name || 'Client'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${config.color} text-xs`} variant="outline">
                          {config.label}
                        </Badge>
                        <span className="font-semibold text-xs">{order.total.toFixed(0)} F</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.action}
        description="Êtes-vous sûr de vouloir effectuer cette action ?"
        onConfirm={handleStatusUpdate}
        loading={!!actionLoading}
        variant={confirmDialog.newStatus === 'cancelled' ? 'destructive' : 'default'}
      />
    </div>
  );
};