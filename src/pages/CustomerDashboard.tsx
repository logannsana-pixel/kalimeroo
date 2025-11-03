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
import { ShoppingBag, User, Package } from "lucide-react";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  created_at: string;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  restaurants: {
    name: string;
  } | null;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  district: string | null;
  address: string | null;
}

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready: "bg-green-100 text-green-800",
  delivering: "bg-orange-100 text-orange-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    district: "",
    address: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchProfile();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, created_at, status, total, delivery_address, restaurants(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, district, address')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          district: data.district || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

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
      toast.success("Profil mis à jour");
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const activeOrders = orders.filter(o => 
    ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status)
  );

  const pastOrders = orders.filter(o => 
    ['delivered', 'cancelled'].includes(o.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
          <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Mon espace</h1>
          <p>Chargement...</p>
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
        <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Mon espace</h1>
        
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-2">
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Mes commandes
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Mon profil
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="mt-6">
            <div className="space-y-6">
              {activeOrders.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Commandes en cours
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeOrders.map((order) => (
                      <Card key={order.id}>
                        <CardHeader>
                          <CardTitle className="text-lg flex justify-between items-start">
                            <span>{order.restaurants?.name}</span>
                            <Badge className={statusColors[order.status]}>
                              {statusLabels[order.status]}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm mb-2">
                            <strong>Livraison:</strong> {order.delivery_address}
                          </p>
                          <p className="font-semibold text-lg">
                            {order.total.toFixed(2)} FCFA
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold mb-4">Historique</h2>
                {pastOrders.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-muted-foreground">Aucune commande passée</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {pastOrders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{order.restaurants?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={statusColors[order.status]}>
                                {statusLabels[order.status]}
                              </Badge>
                              <p className="font-semibold mt-1">
                                {order.total.toFixed(2)} FCFA
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="profile" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="district">Quartier</Label>
                    <Select
                      value={formData.district}
                      onValueChange={(value) => setFormData({...formData, district: value})}
                    >
                      <SelectTrigger id="district">
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
                      placeholder="Numéro, rue, etc."
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Enregistrer les modifications
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
