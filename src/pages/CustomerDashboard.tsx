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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allDistricts } from "@/data/congoDistricts";
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
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-3xl font-bold">Mon espace</h1>
          <RefreshButton onClick={() => fetchData(true)} loading={refreshing} />
        </div>
        
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="space-y-6">
            {/* Active orders */}
            {activeOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  En cours ({activeOrders.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeOrders.map((order) => {
                    const status = statusConfig[order.status];
                    return (
                      <Card key={order.id}>
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-base truncate flex-1">
                              {order.restaurants?.name}
                            </CardTitle>
                            <Badge className={`${status.color} gap-1 shrink-0`}>
                              {status.icon}
                              <span className="text-xs">{status.label}</span>
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm truncate">
                            📍 {order.delivery_address}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-lg">
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
            <div>
              <h2 className="text-lg font-semibold mb-4">Historique</h2>
              {pastOrders.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Aucune commande passée</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pastOrders.slice(0, 10).map((order) => {
                    const status = statusConfig[order.status];
                    return (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{order.restaurants?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge className={`${status.color} text-xs mb-1`}>
                                {status.label}
                              </Badge>
                              <p className="font-semibold">
                                {order.total.toFixed(0)} FCFA
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
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="district">Quartier</Label>
                    <Select
                      value={formData.district}
                      onValueChange={(value) => setFormData({...formData, district: value})}
                    >
                      <SelectTrigger id="district" className="mt-1">
                        <SelectValue placeholder="Sélectionnez votre quartier" />
                      </SelectTrigger>
                      <SelectContent>
                        {allDistricts.map((item) => (
                          <SelectItem key={`${item.city}-${item.district}`} value={`${item.city} - ${item.district}`}>
                            {item.city} - {item.district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="address">Adresse complète</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Numéro, rue, repère..."
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={saving}>
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
