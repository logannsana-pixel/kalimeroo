import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Package, Search, Eye, MoreHorizontal, RefreshCw, 
  User, Store, Truck, Clock, MapPin, Phone, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  delivery_fee: number;
  delivery_address: string;
  phone: string;
  notes: string | null;
  created_at: string;
  user_id: string;
  restaurant_id: string;
  delivery_driver_id: string | null;
  restaurant?: { name: string; address: string };
  customer?: { full_name: string | null; phone: string | null };
  driver?: { full_name: string | null; phone: string | null };
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  accepted: { label: 'Acceptée', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  preparing: { label: 'Préparation', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
  pickup_pending: { label: 'Prêt', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  pickup_accepted: { label: 'Livreur assigné', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' },
  picked_up: { label: 'Récupérée', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' },
  ready: { label: 'Prête', color: 'bg-teal-500/10 text-teal-600 border-teal-500/30' },
  delivering: { label: 'En livraison', color: 'bg-primary/10 text-primary border-primary/30' },
  delivered: { label: 'Livrée', color: 'bg-success/10 text-success border-success/30' },
  cancelled: { label: 'Annulée', color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export function AdminOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          restaurant:restaurants(name, address)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch customer and driver info separately (no FK between orders and profiles)
      const ordersWithDetails = await Promise.all((data || []).map(async (order) => {
        let customer = null;
        let driver = null;

        // Fetch customer info
        if (order.user_id) {
          const { data: customerData } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", order.user_id)
            .maybeSingle();
          customer = customerData;
        }

        // Fetch driver info
        if (order.delivery_driver_id) {
          const { data: driverData } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", order.delivery_driver_id)
            .maybeSingle();
          driver = driverData;
        }

        return { ...order, customer, driver } as Order;
      }));

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Real-time subscription
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Statut mis à jour");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && o.status === statusFilter;
  });

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-warning/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">En cours</p>
            <p className="text-2xl font-bold text-warning">{activeOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card className="border-success/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Livrées</p>
            <p className="text-2xl font-bold text-success">{orders.filter(o => o.status === 'delivered').length}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Annulées</p>
            <p className="text-2xl font-bold text-destructive">{orders.filter(o => o.status === 'cancelled').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une commande..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchOrders}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-28" />
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune commande trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const status = statusConfig[order.status];
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-mono font-bold">#{order.id.slice(0, 8)}</span>
                        <Badge className={status.color}>{status.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "d MMM HH:mm", { locale: fr })}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Store className="w-4 h-4 shrink-0" />
                          <span className="truncate">{order.restaurant?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4 shrink-0" />
                          <span className="truncate">{order.customer?.full_name || 'Client'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Truck className="w-4 h-4 shrink-0" />
                          <span className="truncate">{order.driver?.full_name || 'Non assigné'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-lg">{Number(order.total).toLocaleString()} F</span>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-lg">#{selectedOrder.id.slice(0, 8)}</span>
                <Badge className={statusConfig[selectedOrder.status].color}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-muted">
                <div className="flex items-start gap-3">
                  <Store className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedOrder.restaurant?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.restaurant?.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedOrder.customer?.full_name || 'Client'}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{selectedOrder.delivery_address}</p>
                </div>

                {selectedOrder.driver && (
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{selectedOrder.driver.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.driver.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 p-4 rounded-xl border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{Number(selectedOrder.subtotal).toLocaleString()} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>{Number(selectedOrder.delivery_fee).toLocaleString()} F</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{Number(selectedOrder.total).toLocaleString()} F</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-4 rounded-xl bg-muted">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'cancelled');
                      setShowDetailModal(false);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => setShowDetailModal(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}