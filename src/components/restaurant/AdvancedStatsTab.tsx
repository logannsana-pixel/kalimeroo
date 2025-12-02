import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, DollarSign, Clock, TrendingUp, Users, Star, CalendarDays, ShoppingBag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  totalOrders: number;
  weeklyOrders: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  topItems: { name: string; count: number }[];
  weeklyData: { day: string; orders: number; revenue: number }[];
  statusDistribution: { status: string; count: number; color: string }[];
  hourlyData: { hour: string; orders: number }[];
  growthRate: number;
}

const STATUS_COLORS = {
  pending: "hsl(45, 93%, 47%)",
  confirmed: "hsl(200, 98%, 39%)",
  preparing: "hsl(262, 83%, 58%)",
  ready: "hsl(173, 80%, 40%)",
  delivering: "hsl(25, 95%, 53%)",
  delivered: "hsl(142, 71%, 45%)",
  cancelled: "hsl(0, 84%, 60%)",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "Préparation",
  ready: "Prête",
  delivering: "Livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const AdvancedStatsTab = () => {
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalOrders: 0,
    weeklyOrders: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
    topItems: [],
    weeklyData: [],
    statusDistribution: [],
    hourlyData: [],
    growthRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurantData) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const lastMonthStart = new Date(today);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 2);

      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(menu_item_id, quantity, menu_items(name))')
        .eq('restaurant_id', restaurantData.id);

      if (orders) {
        const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
        const weeklyOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
        const monthlyOrders = orders.filter(o => new Date(o.created_at) >= monthAgo);
        const lastMonthOrders = orders.filter(o => {
          const date = new Date(o.created_at);
          return date >= lastMonthStart && date < monthAgo;
        });

        // Calculate growth rate
        const currentMonthRevenue = monthlyOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const growthRate = lastMonthRevenue > 0 
          ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : 0;

        // Unique customers
        const uniqueCustomers = new Set(orders.map(o => o.user_id)).size;

        // Status distribution
        const statusCounts: Record<string, number> = {};
        orders.forEach(o => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
          status: STATUS_LABELS[status] || status,
          count,
          color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "hsl(240, 5%, 64%)",
        }));

        // Weekly data
        const weeklyData: { day: string; orders: number; revenue: number }[] = [];
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayOrders = orders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.toDateString() === date.toDateString();
          });
          weeklyData.push({
            day: dayNames[date.getDay()],
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          });
        }

        // Hourly distribution (last 7 days)
        const hourlyData: { hour: string; orders: number }[] = [];
        for (let h = 8; h <= 23; h++) {
          const hourOrders = weeklyOrders.filter(o => {
            const orderDate = new Date(o.created_at);
            return orderDate.getHours() === h;
          });
          hourlyData.push({
            hour: `${h}h`,
            orders: hourOrders.length,
          });
        }

        // Top items
        const itemCounts: Record<string, number> = {};
        orders.forEach(order => {
          (order.order_items as any[])?.forEach(item => {
            const name = item.menu_items?.name || 'Unknown';
            itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
          });
        });
        const topItems = Object.entries(itemCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        setStats({
          todayOrders: todayOrders.length,
          todayRevenue: todayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'preparing').length,
          totalOrders: orders.length,
          weeklyOrders: weeklyOrders.length,
          monthlyRevenue: currentMonthRevenue,
          averageOrderValue: orders.length > 0 
            ? orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length 
            : 0,
          totalCustomers: uniqueCustomers,
          topItems,
          weeklyData,
          statusDistribution,
          hourlyData,
          growthRate,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const chartConfig = {
    orders: { label: "Commandes", color: "hsl(var(--chart-1))" },
    revenue: { label: "Revenus", color: "hsl(var(--chart-2))" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Tableau de bord Analytics
        </h2>
        <span className="text-sm text-muted-foreground">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
        </span>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes aujourd'hui</CardTitle>
            <div className="p-2 bg-primary/20 rounded-lg">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.weeklyOrders} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-accent/10 to-accent/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus aujourd'hui</CardTitle>
            <div className="p-2 bg-accent/20 rounded-lg">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayRevenue.toLocaleString('fr-FR')} <span className="text-lg">FCFA</span></div>
            <div className="flex items-center gap-1 mt-1">
              {stats.growthRate >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(stats.growthRate).toFixed(1)}% vs mois dernier
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              À traiter maintenant
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-secondary/10 to-secondary/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -mr-10 -mt-10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <div className="p-2 bg-secondary/20 rounded-lg">
              <ShoppingBag className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.averageOrderValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span className="text-lg">FCFA</span></div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalCustomers} clients uniques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance hebdomadaire
            </CardTitle>
            <CardDescription>Commandes et revenus des 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorOrders)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-accent" />
              Heures de pointe
            </CardTitle>
            <CardDescription>Distribution des commandes par heure</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourlyData}>
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} fontSize={11} />
                  <YAxis axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="orders" 
                    fill="hsl(var(--chart-2))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Statuts des commandes</CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {stats.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-2">
                            <p className="font-medium">{payload[0].payload.status}</p>
                            <p className="text-sm text-muted-foreground">{payload[0].value} commandes</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {stats.statusDistribution.map((status, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                  <span>{status.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Plats les plus populaires
            </CardTitle>
            <CardDescription>Top 5 des articles les plus commandés</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Pas encore de données</p>
            ) : (
              <div className="space-y-4">
                {stats.topItems.map((item, index) => {
                  const maxCount = stats.topItems[0]?.count || 1;
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">#{index + 1}</span>
                          <span className="font-medium truncate max-w-[200px]">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {item.count} vendus
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary-foreground/50 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
        <CardHeader>
          <CardTitle>Résumé mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.totalOrders}</p>
              <p className="text-sm text-muted-foreground">Commandes totales</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{stats.monthlyRevenue.toLocaleString('fr-FR')}</p>
              <p className="text-sm text-muted-foreground">Revenus du mois (FCFA)</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary">{stats.totalCustomers}</p>
              <p className="text-sm text-muted-foreground">Clients uniques</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Croissance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
