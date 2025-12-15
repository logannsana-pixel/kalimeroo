import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, TrendingUp, Clock, CheckCircle, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OrderCardSkeleton } from "@/components/ui/skeleton-card";
import { startOfDay, format } from "date-fns";
import { fr } from "date-fns/locale";

interface RestaurantOverviewProps {
  restaurantId: string;
}

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  totalOrders: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  status: string;
  total: number;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export function RestaurantOverview({ restaurantId }: RestaurantOverviewProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) return;

      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total, created_at, user_id')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (orders) {
        const today = startOfDay(new Date());
        const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
        
        // Fetch profiles for recent orders
        const recentOrdersData = orders.slice(0, 5);
        const userIds = [...new Set(recentOrdersData.map(o => o.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        setRecentOrders(recentOrdersData.map(o => ({
          ...o,
          profiles: profilesMap.get(o.user_id) || null
        })));

        setStats({
          todayOrders: todayOrders.length,
          todayRevenue: todayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          pendingOrders: orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status)).length,
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [restaurantId]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string }> = {
      pending: { label: 'En attente', class: 'status-pending' },
      accepted: { label: 'Acceptée', class: 'status-active' },
      preparing: { label: 'En préparation', class: 'status-active' },
      pickup_pending: { label: 'Prête', class: 'status-success' },
      delivered: { label: 'Livrée', class: 'status-success' },
      cancelled: { label: 'Annulée', class: 'status-error' },
    };
    const c = config[status] || { label: status, class: '' };
    return <Badge className={c.class}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <OrderCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
            <CardTitle className="text-xs font-medium">Aujourd'hui</CardTitle>
            <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold">{stats.todayOrders}</div>
            <p className="text-[10px] text-muted-foreground">commandes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
            <CardTitle className="text-xs font-medium">Revenus</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold">{stats.todayRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
            <CardTitle className="text-xs font-medium">En attente</CardTitle>
            <Clock className="h-3.5 w-3.5 text-warning" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold text-warning">{stats.pendingOrders}</div>
            <p className="text-[10px] text-muted-foreground">à traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
            <CardTitle className="text-xs font-medium">Total</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg font-bold">{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground">FCFA ({stats.totalOrders} cmd)</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune commande</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.profiles?.full_name || 'Client'} • {format(new Date(order.created_at), 'HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="font-bold">{Number(order.total).toLocaleString()} F</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}