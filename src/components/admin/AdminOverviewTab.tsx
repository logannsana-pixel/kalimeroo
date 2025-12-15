import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Store, Package, TrendingUp, Truck, Clock, 
  CheckCircle, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Stats {
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  todayOrders: number;
  todayRevenue: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingValidations: number;
  openTickets: number;
}

interface AdminOverviewTabProps {
  stats: Stats;
  recentOrders: any[];
  loading: boolean;
}

const statCards = [
  { key: 'totalUsers', label: 'Utilisateurs', icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { key: 'totalRestaurants', label: 'Restaurants', icon: Store, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { key: 'totalDrivers', label: 'Livreurs', icon: Truck, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { key: 'totalOrders', label: 'Commandes', icon: Package, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
];

export function AdminOverviewTab({ stats, recentOrders, loading }: AdminOverviewTabProps) {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      accepted: { label: 'Acceptée', variant: 'outline' },
      preparing: { label: 'Préparation', variant: 'default' },
      pickup_pending: { label: 'Prêt', variant: 'outline' },
      delivering: { label: 'Livraison', variant: 'default' },
      delivered: { label: 'Livrée', variant: 'outline' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
    };
    const c = config[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof Stats] || 0;
          return (
            <Card key={card.key} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-lg font-bold mt-0.5">{value.toLocaleString()}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenus totaux</p>
                <p className="text-lg font-bold">{stats.totalRevenue.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-success/20 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                <p className="text-lg font-bold">{stats.todayOrders} cmd</p>
                <p className="text-xs text-success font-medium">{stats.todayRevenue.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-warning/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">En cours</p>
                <p className="text-lg font-bold">{stats.pendingOrders}</p>
                <p className="text-xs text-muted-foreground">actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <div>
              <p className="text-[10px] text-muted-foreground">Livrées</p>
              <p className="font-bold text-sm">{stats.deliveredOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Livreurs actifs</p>
              <p className="font-bold text-sm">{stats.activeDrivers || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            <div>
              <p className="text-[10px] text-muted-foreground">Validations</p>
              <p className="font-bold text-sm">{stats.pendingValidations || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-[10px] text-muted-foreground">Tickets</p>
              <p className="font-bold text-sm">{stats.openTickets || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-1.5">
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-xs">Aucune commande récente</p>
            ) : (
              recentOrders.slice(0, 8).map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">#{order.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(order.created_at), "d MMM HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                    <span className="font-bold text-xs">
                      {Number(order.total).toLocaleString()} F
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}