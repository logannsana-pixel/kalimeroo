import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Store, Package, TrendingUp, Clock, CheckCircle, 
  BarChart3, LogOut, Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { RefreshButton } from "@/components/RefreshButton";
import { OrderCardSkeleton } from "@/components/ui/skeleton-card";

interface Stats {
  totalUsers: number;
  totalRestaurants: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

interface RecentOrder {
  id: string;
  created_at: string;
  status: string;
  total: number;
  restaurants: { name: string } | null;
  profiles: { full_name: string | null } | null;
}

interface Restaurant {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  owner_id: string;
  city: string | null;
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch restaurants
      const { data: restaurantsData, count: restaurantsCount } = await supabase
        .from("restaurants")
        .select("*", { count: "exact" });

      // Fetch orders with stats
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, status, total, created_at")
        .order("created_at", { ascending: false });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalRevenue = ordersData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const pendingOrders = ordersData?.filter(o => o.status === "pending" || o.status === "preparing").length || 0;
      const deliveredOrders = ordersData?.filter(o => o.status === "delivered").length || 0;
      const todayOrdersData = ordersData?.filter(o => new Date(o.created_at) >= today) || [];
      const todayRevenue = todayOrdersData.reduce((sum, o) => sum + Number(o.total), 0);

      // Fetch recent orders with details
      const { data: recentOrdersData } = await supabase
        .from("orders")
        .select("id, created_at, status, total, restaurant_id, user_id")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch restaurant and profile details for recent orders
      if (recentOrdersData && recentOrdersData.length > 0) {
        const restaurantIds = [...new Set(recentOrdersData.map(o => o.restaurant_id))];
        const userIds = [...new Set(recentOrdersData.map(o => o.user_id))];

        const { data: restaurantsInfo } = await supabase
          .from("restaurants")
          .select("id, name")
          .in("id", restaurantIds);

        const { data: profilesInfo } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const restaurantsMap = new Map(restaurantsInfo?.map(r => [r.id, r]) || []);
        const profilesMap = new Map(profilesInfo?.map(p => [p.id, p]) || []);

        const enrichedOrders = recentOrdersData.map(order => ({
          ...order,
          restaurants: restaurantsMap.get(order.restaurant_id) || null,
          profiles: profilesMap.get(order.user_id) || null,
        }));

        setRecentOrders(enrichedOrders);
      }

      setStats({
        totalUsers: usersCount || 0,
        totalRestaurants: restaurantsCount || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        pendingOrders,
        deliveredOrders,
        todayOrders: todayOrdersData.length,
        todayRevenue,
      });

      setRestaurants(restaurantsData || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      preparing: "secondary",
      delivering: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "En attente",
      preparing: "En préparation",
      delivering: "En livraison",
      delivered: "Livré",
      cancelled: "Annulé",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Administration</h1>
                <p className="text-xs text-muted-foreground">Chargement...</p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header simplifié du portail Admin */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Administration</h1>
              <p className="text-xs text-muted-foreground">Panneau de contrôle</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <RefreshButton onClick={fetchAllData} />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total des utilisateurs</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Restaurants</CardTitle>
              <Store className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.totalRestaurants}</div>
              <p className="text-xs text-muted-foreground">Restaurants actifs</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Commandes</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.totalOrders}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {stats.pendingOrders} en attente
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Revenus</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FCFA</div>
              <p className="text-xs text-muted-foreground">Revenus totaux</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Stats */}
        <div className="grid gap-4 grid-cols-2 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.todayOrders}</p>
                  <p className="text-xs text-muted-foreground">commandes</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.todayRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</p>
                  <p className="text-xs text-muted-foreground">livrées</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
                  <p className="text-xs text-muted-foreground">en cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Commandes récentes</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Dernières commandes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune commande</p>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">#{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.restaurants?.name || "Restaurant inconnu"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "PPp", { locale: fr })}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          {getStatusBadge(order.status)}
                          <p className="font-semibold">{Number(order.total).toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restaurants">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Liste des restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                {restaurants.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun restaurant</p>
                ) : (
                  <div className="space-y-4">
                    {restaurants.map((restaurant) => (
                      <div key={restaurant.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{restaurant.name}</p>
                          <p className="text-sm text-muted-foreground">{restaurant.city || "Ville non spécifiée"}</p>
                          <p className="text-xs text-muted-foreground">
                            Créé le {format(new Date(restaurant.created_at), "PP", { locale: fr })}
                          </p>
                        </div>
                        <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                          {restaurant.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
