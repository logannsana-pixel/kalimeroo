import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  Package, Users, Store, Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export function AdminAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    newUsers: 0,
    revenueChange: 0,
    ordersChange: 0,
  });
  const [topRestaurants, setTopRestaurants] = useState<{ name: string; orders: number; revenue: number }[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), days);

      // Fetch orders for the period
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, status, created_at, restaurant_id")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      // Calculate daily stats
      const dailyMap = new Map<string, { orders: number; revenue: number }>();
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        dailyMap.set(date, { orders: 0, revenue: 0 });
      }

      orders?.forEach((order) => {
        const date = format(new Date(order.created_at), "yyyy-MM-dd");
        const existing = dailyMap.get(date);
        if (existing) {
          existing.orders += 1;
          existing.revenue += Number(order.total);
        }
      });

      const dailyStatsArray = Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date: format(new Date(date), "d MMM", { locale: fr }),
        ...stats,
      }));

      setDailyStats(dailyStatsArray);

      // Calculate summary stats
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const totalOrders = orders?.length || 0;

      // Get previous period for comparison
      const prevStartDate = subDays(startDate, days);
      const { data: prevOrders } = await supabase
        .from("orders")
        .select("total")
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      const prevRevenue = prevOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const prevOrdersCount = prevOrders?.length || 0;

      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const ordersChange = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;

      // Get new users
      const { count: newUsersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString());

      setSummaryStats({
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        newUsers: newUsersCount || 0,
        revenueChange,
        ordersChange,
      });

      // Orders by status
      const statusCounts = orders?.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setOrdersByStatus([
        { name: 'Livrées', value: statusCounts['delivered'] || 0 },
        { name: 'En cours', value: (statusCounts['preparing'] || 0) + (statusCounts['delivering'] || 0) },
        { name: 'En attente', value: statusCounts['pending'] || 0 },
        { name: 'Annulées', value: statusCounts['cancelled'] || 0 },
      ]);

      // Top restaurants
      const { data: restaurants } = await supabase.from("restaurants").select("id, name");
      const restaurantMap = new Map(restaurants?.map(r => [r.id, r.name]) || []);

      const restaurantStats = orders?.reduce((acc, order) => {
        const name = restaurantMap.get(order.restaurant_id) || 'Unknown';
        if (!acc[name]) acc[name] = { orders: 0, revenue: 0 };
        acc[name].orders += 1;
        acc[name].revenue += Number(order.total);
        return acc;
      }, {} as Record<string, { orders: number; revenue: number }>) || {};

      const topRestaurantsList = Object.entries(restaurantStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopRestaurants(topRestaurantsList);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Analyse des performances de la plateforme</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as '7d' | '30d' | '90d')}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold">{summaryStats.totalRevenue.toLocaleString()} F</p>
                <div className={`flex items-center gap-1 text-xs ${summaryStats.revenueChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {summaryStats.revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(summaryStats.revenueChange).toFixed(1)}%
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{summaryStats.totalOrders}</p>
                <div className={`flex items-center gap-1 text-xs ${summaryStats.ordersChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {summaryStats.ordersChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(summaryStats.ordersChange).toFixed(1)}%
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Panier moyen</p>
                <p className="text-2xl font-bold">{Math.round(summaryStats.avgOrderValue).toLocaleString()} F</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nouveaux utilisateurs</p>
                <p className="text-2xl font-bold">{summaryStats.newUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus quotidiens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} F`, 'Revenus']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes quotidiennes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Commandes']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, 'Commandes']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {ordersByStatus.map((status, index) => (
                <div key={status.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span>{status.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Restaurants */}
        <Card>
          <CardHeader>
            <CardTitle>Top Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRestaurants.map((restaurant, index) => (
                <div key={restaurant.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{restaurant.name}</p>
                    <p className="text-sm text-muted-foreground">{restaurant.orders} commandes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{restaurant.revenue.toLocaleString()} F</p>
                  </div>
                </div>
              ))}
              {topRestaurants.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucune donnée disponible</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}