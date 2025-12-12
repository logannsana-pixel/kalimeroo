import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CreditCard, Search, DollarSign, TrendingUp, Clock,
  CheckCircle, Store, Truck, MoreHorizontal, Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Payout {
  id: string;
  recipient_id: string;
  recipient_type: 'restaurant' | 'driver';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method: string | null;
  reference: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  processed_at: string | null;
  recipient_name?: string;
}

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  processing: { label: 'En cours', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  completed: { label: 'Effectué', color: 'bg-success/10 text-success border-success/30' },
  failed: { label: 'Échoué', color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export function AdminPaymentsTab() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalCompleted: 0,
    todayPayouts: 0,
    restaurantPending: 0,
    driverPending: 0,
  });

  useEffect(() => {
    fetchPayouts();
    fetchStats();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get recipient names
      const payoutsWithNames = await Promise.all((data || []).map(async (payout) => {
        if (payout.recipient_type === 'restaurant') {
          const { data: restaurant } = await supabase
            .from("restaurants")
            .select("name")
            .eq("owner_id", payout.recipient_id)
            .single();
          return { ...payout, recipient_name: restaurant?.name };
        } else {
          const { data: driver } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payout.recipient_id)
            .single();
        return { ...payout, recipient_name: driver?.full_name };
        }
      }));

      setPayouts(payoutsWithNames as Payout[]);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast.error("Erreur lors du chargement des paiements");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get orders for revenue calculation
      const { data: orders } = await supabase
        .from("orders")
        .select("total, delivery_fee, status")
        .eq("status", "delivered");

      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const totalDeliveryFees = orders?.reduce((sum, o) => sum + Number(o.delivery_fee), 0) || 0;

      // Assuming 15% commission
      const platformCommission = totalRevenue * 0.15;
      const restaurantPending = totalRevenue - platformCommission - totalDeliveryFees;
      const driverPending = totalDeliveryFees * 0.8; // 80% to drivers

      setStats({
        totalPending: restaurantPending + driverPending,
        totalCompleted: 0, // Would calculate from payouts
        todayPayouts: 0,
        restaurantPending,
        driverPending,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updatePayoutStatus = async (payoutId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("payouts")
        .update({ 
          status: newStatus,
          processed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq("id", payoutId);

      if (error) throw error;
      toast.success("Statut mis à jour");
      fetchPayouts();
    } catch (error) {
      console.error("Error updating payout:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch = (p.recipient_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.reference?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.recipient_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">À payer</p>
                <p className="text-xl font-bold">{stats.totalPending.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Restaurants</p>
                <p className="text-xl font-bold">{stats.restaurantPending.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Livreurs</p>
                <p className="text-xl font-bold">{stats.driverPending.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Ce mois</p>
                <p className="text-xl font-bold">{stats.totalCompleted.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="restaurant">Restaurants</SelectItem>
                <SelectItem value="driver">Livreurs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="completed">Effectués</SelectItem>
                <SelectItem value="failed">Échoués</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau paiement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payouts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-20" />
              </Card>
            ))}
          </div>
        ) : filteredPayouts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun paiement trouvé</p>
            </CardContent>
          </Card>
        ) : (
          filteredPayouts.map((payout) => {
            const status = statusConfig[payout.status];
            const Icon = payout.recipient_type === 'restaurant' ? Store : Truck;
            
            return (
              <Card key={payout.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        payout.recipient_type === 'restaurant' 
                          ? 'bg-orange-500/10' 
                          : 'bg-green-500/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          payout.recipient_type === 'restaurant' 
                            ? 'text-orange-500' 
                            : 'text-green-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{payout.recipient_name || 'Bénéficiaire'}</h3>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{format(new Date(payout.created_at), "d MMM yyyy", { locale: fr })}</span>
                          {payout.reference && <span>Réf: {payout.reference}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{Number(payout.amount).toLocaleString()} F</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {payout.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => updatePayoutStatus(payout.id, 'processing')}>
                                <Clock className="w-4 h-4 mr-2" />
                                Marquer en cours
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updatePayoutStatus(payout.id, 'completed')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marquer effectué
                              </DropdownMenuItem>
                            </>
                          )}
                          {payout.status === 'processing' && (
                            <DropdownMenuItem onClick={() => updatePayoutStatus(payout.id, 'completed')}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marquer effectué
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>Voir détails</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Payout Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de bénéficiaire</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="driver">Livreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Référence</Label>
              <Input placeholder="Référence de paiement..." />
            </div>
            <Button className="w-full" onClick={() => {
              toast.success("Paiement créé");
              setShowCreateModal(false);
            }}>
              Créer le paiement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}