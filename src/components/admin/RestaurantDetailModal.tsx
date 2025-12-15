import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Store, Phone, MapPin, ShoppingBag, Calendar, Edit, Save, X,
  DollarSign, Star, Loader2, Utensils, Clock, User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RestaurantDetailModalProps {
  restaurantId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string | null;
  phone: string | null;
  cuisine_type: string | null;
  delivery_time: string | null;
  delivery_fee: number | null;
  min_order: number | null;
  rating: number | null;
  is_active: boolean;
  is_validated: boolean;
  created_at: string;
  owner_id: string | null;
  image_url: string | null;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  is_available: boolean;
}

export function RestaurantDetailModal({ restaurantId, isOpen, onClose, onUpdate }: RestaurantDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<{ full_name: string; phone: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Restaurant>>({});
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, menuCount: 0 });

  useEffect(() => {
    if (restaurantId && isOpen) {
      fetchRestaurantData();
    }
  }, [restaurantId, isOpen]);

  const fetchRestaurantData = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);
      setEditData(restaurantData);

      // Fetch owner profile
      if (restaurantData.owner_id) {
        const { data: owner } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", restaurantData.owner_id)
          .maybeSingle();
        setOwnerProfile(owner);
      }

      // Fetch orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, total, status, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (ordersData) {
        setOrders(ordersData);
        setStats(prev => ({
          ...prev,
          totalOrders: ordersData.length,
          totalRevenue: ordersData.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.total), 0)
        }));
      }

      // Fetch menu items
      const { data: menuData } = await supabase
        .from("menu_items")
        .select("id, name, price, category, is_available")
        .eq("restaurant_id", restaurantId);

      if (menuData) {
        setMenuItems(menuData);
        setStats(prev => ({ ...prev, menuCount: menuData.length }));
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: editData.name,
          description: editData.description,
          address: editData.address,
          city: editData.city,
          phone: editData.phone,
          cuisine_type: editData.cuisine_type,
          delivery_time: editData.delivery_time,
          delivery_fee: editData.delivery_fee,
          min_order: editData.min_order
        })
        .eq("id", restaurantId);

      if (error) throw error;
      toast.success("Restaurant mis à jour");
      setEditing(false);
      fetchRestaurantData();
      onUpdate?.();
    } catch (error) {
      console.error("Error updating restaurant:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: "bg-green-500/10 text-green-600",
      pending: "bg-yellow-500/10 text-yellow-600",
      cancelled: "bg-red-500/10 text-red-600",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Détails du restaurant
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : restaurant ? (
          <ScrollArea className="max-h-[70vh]">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="menu">Menu ({stats.menuCount})</TabsTrigger>
                <TabsTrigger value="orders">Commandes ({stats.totalOrders})</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Commandes</p>
                        <p className="text-xl font-bold">{stats.totalOrders}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Revenus</p>
                        <p className="text-xl font-bold">{stats.totalRevenue.toLocaleString()} F</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Note</p>
                        <p className="text-xl font-bold">{restaurant.rating?.toFixed(1) || "—"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Owner Info */}
                {ownerProfile && (
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{ownerProfile.full_name || "Propriétaire"}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {ownerProfile.phone || "—"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Restaurant Form */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm">Détails</CardTitle>
                    {editing ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        {editing ? (
                          <Input
                            value={editData.name || ""}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-medium">{restaurant.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        {editing ? (
                          <Input
                            value={editData.phone || ""}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {restaurant.phone || "—"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Cuisine</Label>
                        {editing ? (
                          <Input
                            value={editData.cuisine_type || ""}
                            onChange={(e) => setEditData({ ...editData, cuisine_type: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-medium">{restaurant.cuisine_type || "—"}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        {editing ? (
                          <Input
                            value={editData.city || ""}
                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-medium">{restaurant.city || "—"}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Temps livraison</Label>
                        {editing ? (
                          <Input
                            value={editData.delivery_time || ""}
                            onChange={(e) => setEditData({ ...editData, delivery_time: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {restaurant.delivery_time || "—"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Frais livraison</Label>
                        {editing ? (
                          <Input
                            type="number"
                            value={editData.delivery_fee || ""}
                            onChange={(e) => setEditData({ ...editData, delivery_fee: Number(e.target.value) })}
                          />
                        ) : (
                          <p className="text-sm font-medium">{restaurant.delivery_fee?.toLocaleString() || "0"} F</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Adresse</Label>
                      {editing ? (
                        <Input
                          value={editData.address || ""}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {restaurant.address}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      {editing ? (
                        <Textarea
                          value={editData.description || ""}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm">{restaurant.description || "—"}</p>
                      )}
                    </div>
                    <div className="pt-2 border-t flex items-center gap-4">
                      <Badge variant={restaurant.is_validated ? "default" : "secondary"}>
                        {restaurant.is_validated ? "Validé" : "En attente"}
                      </Badge>
                      <Badge variant={restaurant.is_active ? "outline" : "destructive"}>
                        {restaurant.is_active ? "Actif" : "Inactif"}
                      </Badge>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Créé le {format(new Date(restaurant.created_at), "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="menu" className="space-y-3">
                {menuItems.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aucun plat</p>
                    </CardContent>
                  </Card>
                ) : (
                  menuItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.category || "Sans catégorie"}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{Number(item.price).toLocaleString()} F</p>
                            <Badge variant={item.is_available ? "outline" : "secondary"}>
                              {item.is_available ? "Disponible" : "Indisponible"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="orders" className="space-y-3">
                {orders.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aucune commande</p>
                    </CardContent>
                  </Card>
                ) : (
                  orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(order.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{Number(order.total).toLocaleString()} F</p>
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
        ) : (
          <p className="text-center py-8 text-muted-foreground">Restaurant non trouvé</p>
        )}
      </DialogContent>
    </Dialog>
  );
}