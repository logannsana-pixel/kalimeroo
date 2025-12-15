import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, Phone, MapPin, ShoppingBag, Calendar, Edit, Save, X,
  DollarSign, Star, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
  created_at: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  restaurant_name?: string;
}

export function UserDetailModal({ userId, isOpen, onClose, onUpdate }: UserDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0 });

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserData();
    }
  }, [userId, isOpen]);

  const fetchUserData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setUser(profile);
      setEditData(profile);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, status, created_at, restaurant_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!ordersError && ordersData) {
        const ordersWithRestaurants = await Promise.all(
          ordersData.map(async (order) => {
            const { data: restaurant } = await supabase
              .from("restaurants")
              .select("name")
              .eq("id", order.restaurant_id)
              .maybeSingle();
            return { ...order, restaurant_name: restaurant?.name || "Restaurant" };
          })
        );
        setOrders(ordersWithRestaurants);
        setStats({
          totalOrders: ordersData.length,
          totalSpent: ordersData.reduce((sum, o) => sum + Number(o.total), 0)
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editData.full_name,
          phone: editData.phone,
          address: editData.address,
          district: editData.district,
          city: editData.city
        })
        .eq("id", userId);

      if (error) throw error;
      toast.success("Profil mis à jour");
      setEditing(false);
      fetchUserData();
      onUpdate?.();
    } catch (error) {
      console.error("Error updating user:", error);
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
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Détails du client
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : user ? (
          <ScrollArea className="max-h-[70vh]">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="orders">Commandes ({stats.totalOrders})</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
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
                        <p className="text-sm text-muted-foreground">Total dépensé</p>
                        <p className="text-xl font-bold">{stats.totalSpent.toLocaleString()} F</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Profile Form */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm">Informations</CardTitle>
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
                        <Label>Nom complet</Label>
                        {editing ? (
                          <Input
                            value={editData.full_name || ""}
                            onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-medium">{user.full_name || "—"}</p>
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
                            <Phone className="w-3 h-3" /> {user.phone || "—"}
                          </p>
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
                          <p className="text-sm font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {user.city || "—"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Quartier</Label>
                        {editing ? (
                          <Input
                            value={editData.district || ""}
                            onChange={(e) => setEditData({ ...editData, district: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-medium">{user.district || "—"}</p>
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
                        <p className="text-sm font-medium">{user.address || "—"}</p>
                      )}
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Inscrit le {format(new Date(user.created_at), "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                            <p className="font-medium text-sm">{order.restaurant_name}</p>
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
          <p className="text-center py-8 text-muted-foreground">Utilisateur non trouvé</p>
        )}
      </DialogContent>
    </Dialog>
  );
}