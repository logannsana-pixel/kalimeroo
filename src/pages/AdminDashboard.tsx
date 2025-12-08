import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, Store, Package, TrendingUp, Clock, CheckCircle, 
  BarChart3, LogOut, Shield, Truck, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { OrderCardSkeleton } from "@/components/ui/skeleton-card";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

const menuItems = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
  { id: 'restaurants', label: 'Restaurants', icon: Store },
  { id: 'drivers', label: 'Livreurs', icon: Truck },
  { id: 'orders', label: 'Commandes', icon: Package },
  { id: 'users', label: 'Utilisateurs', icon: Users },
];

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0, totalRestaurants: 0, totalOrders: 0, totalRevenue: 0,
    pendingOrders: 0, deliveredOrders: 0, todayOrders: 0, todayRevenue: 0, totalDrivers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        { count: usersCount },
        { data: restaurantsData, count: restaurantsCount },
        { data: ordersData },
        { count: driversCount }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("restaurants").select("*", { count: "exact" }),
        supabase.from("orders").select("id, status, total, created_at, restaurant_id, user_id").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "delivery_driver")
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalRevenue = ordersData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const todayOrdersData = ordersData?.filter(o => new Date(o.created_at) >= today) || [];

      setStats({
        totalUsers: usersCount || 0,
        totalRestaurants: restaurantsCount || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        pendingOrders: ordersData?.filter(o => ['pending', 'preparing'].includes(o.status)).length || 0,
        deliveredOrders: ordersData?.filter(o => o.status === "delivered").length || 0,
        todayOrders: todayOrdersData.length,
        todayRevenue: todayOrdersData.reduce((sum, o) => sum + Number(o.total), 0),
        totalDrivers: driversCount || 0,
      });

      setRestaurants(restaurantsData || []);
      setRecentOrders(ordersData?.slice(0, 10) || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string }> = {
      pending: { label: 'En attente', class: 'status-pending' },
      preparing: { label: 'Préparation', class: 'status-active' },
      delivering: { label: 'Livraison', class: 'status-active' },
      delivered: { label: 'Livrée', class: 'status-success' },
      cancelled: { label: 'Annulée', class: 'status-error' },
    };
    const c = config[status] || { label: status, class: '' };
    return <Badge className={c.class}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <OrderCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-destructive-foreground" />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold">Admin</p>
                <p className="text-xs text-muted-foreground">Panneau de contrôle</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton onClick={() => setActiveTab(item.id)} isActive={activeTab === item.id}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-2">
            <SidebarTrigger className="w-full justify-center" />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
            <div className="flex items-center justify-between h-14 px-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="font-semibold hidden md:block">Administration</h1>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Button variant="ghost" size="icon" onClick={fetchAllData}><RefreshCw className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Utilisateurs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Restaurants</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalRestaurants}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Livreurs</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalDrivers}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Commandes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalOrders}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Revenus</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} F</div></CardContent></Card>
            </div>

            {/* Today stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-primary/5"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Aujourd'hui</p><p className="text-3xl font-bold">{stats.todayOrders} <span className="text-base font-normal">commandes</span></p></CardContent></Card>
              <Card className="bg-primary/5"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Revenus du jour</p><p className="text-3xl font-bold">{stats.todayRevenue.toLocaleString()} <span className="text-base font-normal">FCFA</span></p></CardContent></Card>
            </div>

            {/* Recent orders */}
            <Card>
              <CardHeader><CardTitle>Commandes récentes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div><p className="font-medium">#{order.id.slice(0, 8)}</p><p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "Pp", { locale: fr })}</p></div>
                      <div className="flex items-center gap-2">{getStatusBadge(order.status)}<span className="font-bold">{Number(order.total).toLocaleString()} F</span></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}