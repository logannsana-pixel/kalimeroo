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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof Stats] || 0;
          return (
            <Card key={card.key} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.todayOrders} commandes</p>
                <p className="text-sm text-success font-medium">{stats.todayRevenue.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                <p className="text-sm text-muted-foreground">commandes actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Livrées</p>
              <p className="font-bold">{stats.deliveredOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Truck className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Livreurs actifs</p>
              <p className="font-bold">{stats.activeDrivers || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Validations</p>
              <p className="font-bold">{stats.pendingValidations || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Tickets ouverts</p>
              <p className="font-bold">{stats.openTickets || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune commande récente</p>
            ) : (
              recentOrders.slice(0, 8).map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "d MMM HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="font-bold text-sm">
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