import { TrendingUp, Package, Clock, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DriverOrder } from "@/pages/DeliveryDashboard";
import { startOfDay, startOfWeek, startOfMonth, isAfter } from "date-fns";

interface DriverEarningsTabProps {
  orders: DriverOrder[];
}

export function DriverEarningsTab({ orders }: DriverEarningsTabProps) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const todayOrders = orders.filter(o => isAfter(new Date(o.created_at), todayStart));
  const weekOrders = orders.filter(o => isAfter(new Date(o.created_at), weekStart));
  const monthOrders = orders.filter(o => isAfter(new Date(o.created_at), monthStart));

  const calcEarnings = (orderList: DriverOrder[]) => {
    // Assume driver earns 15% of order total
    return orderList.reduce((sum, o) => sum + (o.total * 0.15), 0);
  };

  const stats = [
    {
      label: "Aujourd'hui",
      icon: Clock,
      earnings: calcEarnings(todayOrders),
      deliveries: todayOrders.length,
      color: "text-primary"
    },
    {
      label: "Cette semaine",
      icon: Calendar,
      earnings: calcEarnings(weekOrders),
      deliveries: weekOrders.length,
      color: "text-blue-500"
    },
    {
      label: "Ce mois",
      icon: TrendingUp,
      earnings: calcEarnings(monthOrders),
      deliveries: monthOrders.length,
      color: "text-purple-500"
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-bold">Mes gains</h2>

      {/* Main earnings card */}
      <Card className="p-6 bg-secondary text-secondary-foreground">
        <p className="text-sm opacity-80">Gains du jour</p>
        <p className="text-4xl font-bold mt-1">
          {calcEarnings(todayOrders).toFixed(0)} <span className="text-xl">FCFA</span>
        </p>
        <div className="flex items-center gap-4 mt-4 text-sm opacity-80">
          <span className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            {todayOrders.length} livraisons
          </span>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="font-bold">{stat.earnings.toFixed(0)} FCFA</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stat.deliveries}</p>
                  <p className="text-xs text-muted-foreground">livraisons</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 Les gains sont calculés à 15% du montant de chaque commande livrée.
        </p>
      </Card>
    </div>
  );
}