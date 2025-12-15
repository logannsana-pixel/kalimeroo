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
  Truck, Phone, MapPin, ShoppingBag, Calendar, Edit, Save, X,
  DollarSign, Star, Loader2, Car, Wallet
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DriverDetailModalProps {
  driverId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface Driver {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  district: string | null;
  city: string | null;
  vehicle_type: string | null;
  license_number: string | null;
  is_available: boolean;
  is_validated: boolean;
  driver_rating: number | null;
  driver_reviews_count: number | null;
  created_at: string;
}

interface Delivery {
  id: string;
  total: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  restaurant_name?: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_type: string;
  created_at: string;
}

export function DriverDetailModal({ driverId, isOpen, onClose, onUpdate }: DriverDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Driver>>({});
  const [stats, setStats] = useState({ totalDeliveries: 0, totalEarnings: 0, pendingBalance: 0 });

  useEffect(() => {
    if (driverId && isOpen) {
      fetchDriverData();
    }
  }, [driverId, isOpen]);

  const fetchDriverData = async () => {
    if (!driverId) return;
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", driverId)
        .single();

      if (profileError) throw profileError;
      setDriver(profile);
      setEditData(profile);

      // Fetch deliveries
      const { data: deliveriesData } = await supabase
        .from("orders")
        .select("id, total, delivery_fee, status, created_at, restaurant_id")
        .eq("delivery_driver_id", driverId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (deliveriesData) {
        const deliveriesWithRestaurants = await Promise.all(
          deliveriesData.map(async (d) => {
            const { data: restaurant } = await supabase
              .from("restaurants")
              .select("name")
              .eq("id", d.restaurant_id)
              .maybeSingle();
            return { ...d, restaurant_name: restaurant?.name || "Restaurant" };
          })
        );
        setDeliveries(deliveriesWithRestaurants);
        
        const deliveredOrders = deliveriesData.filter(d => d.status === 'delivered');
        const totalEarnings = deliveredOrders.reduce((sum, d) => {
          const fee = Number(d.delivery_fee) || 1500;
          return sum + (fee * 0.70);
        }, 0);
        
        setStats(prev => ({
          ...prev,
          totalDeliveries: deliveredOrders.length,
          totalEarnings
        }));
      }

      // Fetch payouts
      const { data: payoutsData } = await supabase
        .from("payouts")
        .select("*")
        .eq("recipient_id", driverId)
        .eq("recipient_type", "driver")
        .order("created_at", { ascending: false })
        .limit(20);

      if (payoutsData) {
        setPayouts(payoutsData);
        const paidAmount = payoutsData
          .filter(p => ['paid', 'completed', 'approved'].includes(p.status || ''))
          .reduce((sum, p) => sum + Number(p.amount), 0);
        
        setStats(prev => ({
          ...prev,
          pendingBalance: Math.max(0, prev.totalEarnings - paidAmount)
        }));
      }
    } catch (error) {
      console.error("Error fetching driver:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!driverId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editData.full_name,
          phone: editData.phone,
          address: editData.address,
          district: editData.district,
          city: editData.city,
          vehicle_type: editData.vehicle_type,
          license_number: editData.license_number
        })
        .eq("id", driverId);

      if (error) throw error;
      toast.success("Profil mis à jour");
      setEditing(false);
      fetchDriverData();
      onUpdate?.();
    } catch (error) {
      console.error("Error updating driver:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: "bg-green-500/10 text-green-600",
      paid: "bg-green-500/10 text-green-600",
      pending: "bg-yellow-500/10 text-yellow-600",
      approved: "bg-blue-500/10 text-blue-600",
      rejected: "bg-red-500/10 text-red-600",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Détails du livreur
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : driver ? (
          <ScrollArea className="max-h-[70vh]">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="deliveries">Livraisons ({stats.totalDeliveries})</TabsTrigger>
                <TabsTrigger value="payouts">Paiements</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Livraisons</p>
                        <p className="text-xl font-bold">{stats.totalDeliveries}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total gagné</p>
                        <p className="text-xl font-bold">{stats.totalEarnings.toLocaleString()} F</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Solde dû</p>
                        <p className="text-xl font-bold">{stats.pendingBalance.toLocaleString()} F</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rating */}
                {(driver.driver_rating || driver.driver_reviews_count) && (
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold">{driver.driver_rating?.toFixed(1) || "—"}</p>
                        <p className="text-sm text-muted-foreground">{driver.driver_reviews_count || 0} avis</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                          <p className="text-sm font-medium">{driver.full_name || "—"}</p>
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
                            <Phone className="w-3 h-3" /> {driver.phone || "—"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Type de véhicule</Label>
                        {editing ? (
                          <Input
                            value={editData.vehicle_type || ""}
                            onChange={(e) => setEditData({ ...editData, vehicle_type: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Car className="w-3 h-3" /> {driver.vehicle_type || "—"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>N° permis</Label>
                        {editing ? (
                          <Input
                            value={editData.license_number || ""}
                            onChange={(e) => setEditData({ ...editData, license_number: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm font-medium">{driver.license_number || "—"}</p>
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
                            <MapPin className="w-3 h-3" /> {driver.city || "—"}
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
                          <p className="text-sm font-medium">{driver.district || "—"}</p>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 border-t flex items-center gap-4">
                      <Badge variant={driver.is_validated ? "default" : "secondary"}>
                        {driver.is_validated ? "Validé" : "En attente"}
                      </Badge>
                      <Badge variant={driver.is_available ? "outline" : "destructive"}>
                        {driver.is_available ? "En ligne" : "Hors ligne"}
                      </Badge>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Inscrit le {format(new Date(driver.created_at), "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deliveries" className="space-y-3">
                {deliveries.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aucune livraison</p>
                    </CardContent>
                  </Card>
                ) : (
                  deliveries.map((delivery) => (
                    <Card key={delivery.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{delivery.restaurant_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(delivery.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{((Number(delivery.delivery_fee) || 1500) * 0.7).toLocaleString()} F</p>
                            <Badge variant="outline" className={getStatusColor(delivery.status)}>
                              {delivery.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="payouts" className="space-y-3">
                {payouts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aucun paiement</p>
                    </CardContent>
                  </Card>
                ) : (
                  payouts.map((payout) => (
                    <Card key={payout.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm capitalize">{payout.payout_type?.replace('_', ' ') || "Paiement"}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payout.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{Number(payout.amount).toLocaleString()} F</p>
                            <Badge variant="outline" className={getStatusColor(payout.status || '')}>
                              {payout.status}
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
          <p className="text-center py-8 text-muted-foreground">Livreur non trouvé</p>
        )}
      </DialogContent>
    </Dialog>
  );
}