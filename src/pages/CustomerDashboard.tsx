import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeighborhoodInput } from "@/components/NeighborhoodInput";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { ShoppingBag, User, Package, Truck, Clock, CheckCircle } from "lucide-react";
import { OrderCardSkeleton, ProfileSkeleton } from "@/components/ui/skeleton-card";
import { RefreshButton } from "@/components/RefreshButton";
import { ChatInterface } from "@/components/ChatInterface";
import { ButtonLoader } from "@/components/ui/loading-spinner";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  delivery_driver_id: string | null;
  restaurants: {
    name: string;
    owner_id: string | null;
  } | null;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  district: string | null;
  address: string | null;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> },
  accepted: { label: "Acceptée", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> },
  preparing: { label: "Préparation", color: "bg-purple-100 text-purple-800", icon: <Package className="w-3 h-3" /> },
  ready: { label: "Prête", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  pickup_pending: { label: "Attente livreur", color: "bg-teal-100 text-teal-800", icon: <Truck className="w-3 h-3" /> },
  pickup_accepted: { label: "Livreur assigné", color: "bg-cyan-100 text-cyan-800", icon: <Truck className="w-3 h-3" /> },
  picked_up: { label: "Récupérée", color: "bg-indigo-100 text-indigo-800", icon: <Truck className="w-3 h-3" /> },
  delivering: { label: "En livraison", color: "bg-orange-100 text-orange-800", icon: <Truck className="w-3 h-3" /> },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-800", icon: <Clock className="w-3 h-3" /> },
};

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    district: "",
    address: "",
  });

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [ordersRes, profileRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, created_at, status, total, delivery_address, delivery_driver_id, restaurants(name, owner_id)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('full_name, phone, district, address')
          .eq('id', user.id)
          .single()
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setFormData({
          full_name: profileRes.data.full_name || "",
          phone: profileRes.data.phone || "",
          district: profileRes.data.district || "",
          address: profileRes.data.address || "",
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime for orders
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('customer-dashboard-orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };
    setupRealtime();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          district: formData.district,
          address: formData.address,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Profil mis à jour !");
      fetchData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const activeOrders = orders.filter(o => 
    !['delivered', 'cancelled'].includes(o.status)
  );

  const pastOrders = orders.filter(o => 
    ['delivered', 'cancelled'].includes(o.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <h1 className="text-xl md:text-3xl font-bold mb-6">Mon espace</h1>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 max-w-2xl">
        {/* Header compact */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Mon espace</h1>
          <RefreshButton onClick={() => fetchData(true)} loading={refreshing} />
        </div>
        
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 h-10 rounded-full bg-muted/50 p-1">
            <TabsTrigger value="orders" className="gap-1.5 rounded-full text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="w-3.5 h-3.5" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5 rounded-full text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <User className="w-3.5 h-3.5" />
              Profil
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="space-y-4">
            {/* Active orders */}
            {activeOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  En cours ({activeOrders.length})
                </h2>
                <div className="space-y-3">
                  {activeOrders.map((order) => {
                    const status = statusConfig[order.status];
                    return (
                      <Card key={order.id} className="border-none shadow-soft rounded-2xl overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{order.restaurants?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <Badge className={`${status.color} gap-1 shrink-0 text-xs`}>
                              {status.icon}
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            📍 {order.delivery_address}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <p className="font-bold text-primary">
                              {order.total.toFixed(0)} FCFA
                            </p>
                            <div className="flex gap-2">
                              {order.restaurants?.owner_id && (
                                <ChatInterface
                                  orderId={order.id}
                                  receiverId={order.restaurants.owner_id}
                                  receiverName={order.restaurants.name || "Restaurant"}
                                />
                              )}
                              {order.delivery_driver_id && ['pickup_accepted', 'picked_up', 'delivering'].includes(order.status) && (
                                <ChatInterface
                                  orderId={order.id}
                                  receiverId={order.delivery_driver_id}
                                  receiverName="Livreur"
                                />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past orders */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Historique</h2>
              {pastOrders.length === 0 ? (
                <Card className="border-none shadow-soft rounded-2xl">
                  <CardContent className="text-center py-10">
                    <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucune commande passée</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {pastOrders.slice(0, 10).map((order) => {
                    const status = statusConfig[order.status];
                    return (
                      <Card key={order.id} className="border-none shadow-soft rounded-xl">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{order.restaurants?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={`${status.color} text-xs`}>
                                {status.label}
                              </Badge>
                              <p className="font-semibold text-sm">
                                {order.total.toFixed(0)} F
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card className="border-none shadow-soft rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-xs text-muted-foreground">Nom complet</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="h-10 rounded-xl bg-muted/30 border-0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs text-muted-foreground">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="h-10 rounded-xl bg-muted/30 border-0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="district" className="text-xs text-muted-foreground">Quartier</Label>
                    <NeighborhoodInput
                      value={formData.district}
                      onChange={(value) => setFormData({...formData, district: value})}
                      placeholder="Saisissez votre quartier"
                      className="h-10 rounded-xl bg-muted/30 border-0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs text-muted-foreground">Adresse complète</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Numéro, rue, repère..."
                      className="h-10 rounded-xl bg-muted/30 border-0"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 rounded-xl" disabled={saving}>
                    {saving ? <ButtonLoader /> : "Enregistrer"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
