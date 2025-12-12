import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, Search, DollarSign, TrendingUp, Clock,
  CheckCircle, Store, Truck, MoreHorizontal, Plus, 
  XCircle, Banknote, ArrowUpRight, ArrowDownLeft, Settings
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";

interface Payout {
  id: string;
  recipient_id: string;
  recipient_type: string;
  payout_type: string;
  amount: number;
  status: string;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  recipient_name?: string;
}

interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
}

interface Driver {
  id: string;
  full_name: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  approved: { label: 'Approuvé', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  processing: { label: 'En cours', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  completed: { label: 'Effectué', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  paid: { label: 'Payé', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  rejected: { label: 'Rejeté', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

const DRIVER_EARNING_RATE = 0.70;
const RESTAURANT_EARNING_RATE = 0.85; // Restaurant gets 85%, platform keeps 15%

export function AdminPaymentsTab() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [stats, setStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    driverWithdrawals: 0,
    driverCashDeposits: 0,
    restaurantPayouts: 0,
    pendingDriverBalance: 0,
    pendingRestaurantBalance: 0,
  });

  // Create payout form state
  const [newPayout, setNewPayout] = useState({
    recipientType: '',
    recipientId: '',
    amount: '',
    paymentMethod: 'mobile_money',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchPayouts(),
      fetchStats(),
      fetchRestaurants(),
      fetchDrivers()
    ]);
    setLoading(false);
  };

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get recipient names
      const payoutsWithNames = await Promise.all((data || []).map(async (payout) => {
        let recipientName = 'Inconnu';
        
        if (payout.recipient_type === 'restaurant') {
          const { data: restaurant } = await supabase
            .from("restaurants")
            .select("name")
            .eq("owner_id", payout.recipient_id)
            .maybeSingle();
          recipientName = restaurant?.name || 'Restaurant';
        } else if (payout.recipient_type === 'driver') {
          const { data: driver } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payout.recipient_id)
            .maybeSingle();
          recipientName = driver?.full_name || 'Livreur';
        }
        
        return { ...payout, recipient_name: recipientName };
      }));

      setPayouts(payoutsWithNames as Payout[]);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast.error("Erreur lors du chargement des paiements");
    }
  };

  const fetchStats = async () => {
    try {
      // Get delivered orders for calculations
      const { data: orders } = await supabase
        .from("orders")
        .select("total, delivery_fee, status, restaurant_id, delivery_driver_id")
        .eq("status", "delivered");

      if (!orders) return;

      // Calculate pending balances
      const driverEarnings: Record<string, number> = {};
      const restaurantEarnings: Record<string, number> = {};

      orders.forEach(order => {
        const deliveryFee = Number(order.delivery_fee) || 1500;
        const driverEarning = deliveryFee * DRIVER_EARNING_RATE;
        const restaurantEarning = (Number(order.total) - Number(order.delivery_fee)) * RESTAURANT_EARNING_RATE;

        if (order.delivery_driver_id) {
          driverEarnings[order.delivery_driver_id] = (driverEarnings[order.delivery_driver_id] || 0) + driverEarning;
        }
        if (order.restaurant_id) {
          restaurantEarnings[order.restaurant_id] = (restaurantEarnings[order.restaurant_id] || 0) + restaurantEarning;
        }
      });

      // Get paid amounts
      const { data: paidPayouts } = await supabase
        .from("payouts")
        .select("recipient_id, recipient_type, amount, status")
        .in("status", ["completed", "paid", "approved"]);

      const paidToDrivers: Record<string, number> = {};
      const paidToRestaurants: Record<string, number> = {};

      paidPayouts?.forEach(p => {
        if (p.recipient_type === 'driver') {
          paidToDrivers[p.recipient_id] = (paidToDrivers[p.recipient_id] || 0) + Number(p.amount);
        } else if (p.recipient_type === 'restaurant') {
          paidToRestaurants[p.recipient_id] = (paidToRestaurants[p.recipient_id] || 0) + Number(p.amount);
        }
      });

      // Calculate pending
      let pendingDriverBalance = 0;
      let pendingRestaurantBalance = 0;

      Object.entries(driverEarnings).forEach(([id, earned]) => {
        const paid = paidToDrivers[id] || 0;
        pendingDriverBalance += Math.max(0, earned - paid);
      });

      Object.entries(restaurantEarnings).forEach(([id, earned]) => {
        const paid = paidToRestaurants[id] || 0;
        pendingRestaurantBalance += Math.max(0, earned - paid);
      });

      // Count by type
      const { data: allPayouts } = await supabase.from("payouts").select("*");
      
      const pending = allPayouts?.filter(p => p.status === 'pending') || [];
      const paid = allPayouts?.filter(p => ['completed', 'paid'].includes(p.status || '')) || [];
      const withdrawals = allPayouts?.filter(p => p.payout_type === 'withdrawal') || [];
      const cashDeposits = allPayouts?.filter(p => p.payout_type === 'cash_deposit') || [];
      const restaurantPayouts = allPayouts?.filter(p => p.recipient_type === 'restaurant') || [];

      setStats({
        totalPending: pending.reduce((sum, p) => sum + Number(p.amount), 0),
        totalPaid: paid.reduce((sum, p) => sum + Number(p.amount), 0),
        driverWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
        driverCashDeposits: cashDeposits.filter(c => c.status === 'pending').length,
        restaurantPayouts: restaurantPayouts.filter(r => r.status === 'pending').length,
        pendingDriverBalance,
        pendingRestaurantBalance,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRestaurants = async () => {
    const { data } = await supabase.from("restaurants").select("id, owner_id, name");
    if (data) setRestaurants(data);
  };

  const fetchDrivers = async () => {
    const { data: driverRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "delivery_driver");

    if (driverRoles) {
      const driverIds = driverRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", driverIds);
      
      if (profiles) setDrivers(profiles);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayout || !user) return;

    try {
      const { error } = await supabase
        .from("payouts")
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq("id", selectedPayout.id);

      if (error) throw error;
      
      toast.success("Paiement approuvé");
      setShowApproveModal(false);
      setSelectedPayout(null);
      fetchAll();
    } catch (error) {
      console.error("Error approving payout:", error);
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async () => {
    if (!selectedPayout || !user || !rejectionReason) return;

    try {
      const { error } = await supabase
        .from("payouts")
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: user.id,
          rejection_reason: rejectionReason
        })
        .eq("id", selectedPayout.id);

      if (error) throw error;
      
      toast.success("Paiement rejeté");
      setShowRejectModal(false);
      setSelectedPayout(null);
      setRejectionReason("");
      fetchAll();
    } catch (error) {
      console.error("Error rejecting payout:", error);
      toast.error("Erreur lors du rejet");
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    try {
      const { error } = await supabase
        .from("payouts")
        .update({ 
          status: 'paid',
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq("id", payoutId);

      if (error) throw error;
      toast.success("Marqué comme payé");
      fetchAll();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur");
    }
  };

  const handleCreatePayout = async () => {
    if (!newPayout.recipientId || !newPayout.amount) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      const { error } = await supabase
        .from("payouts")
        .insert({
          recipient_id: newPayout.recipientId,
          recipient_type: newPayout.recipientType,
          payout_type: 'earnings_payout',
          amount: parseFloat(newPayout.amount),
          status: 'pending',
          payment_method: newPayout.paymentMethod,
          reference: newPayout.reference || null,
          notes: newPayout.notes || null
        });

      if (error) throw error;

      toast.success("Paiement créé");
      setShowCreateModal(false);
      setNewPayout({
        recipientType: '',
        recipientId: '',
        amount: '',
        paymentMethod: 'mobile_money',
        reference: '',
        notes: ''
      });
      fetchAll();
    } catch (error) {
      console.error("Error creating payout:", error);
      toast.error("Erreur lors de la création");
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch = (p.recipient_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.reference?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    let matchesTab = true;
    if (activeTab === 'withdrawals') matchesTab = p.payout_type === 'withdrawal';
    else if (activeTab === 'cash_deposits') matchesTab = p.payout_type === 'cash_deposit';
    else if (activeTab === 'restaurants') matchesTab = p.recipient_type === 'restaurant';
    else if (activeTab === 'pending') matchesTab = p.status === 'pending';
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const getIcon = (payout: Payout) => {
    if (payout.payout_type === 'withdrawal') return <ArrowUpRight className="w-5 h-5 text-green-500" />;
    if (payout.payout_type === 'cash_deposit') return <ArrowDownLeft className="w-5 h-5 text-blue-500" />;
    if (payout.recipient_type === 'restaurant') return <Store className="w-5 h-5 text-orange-500" />;
    return <Truck className="w-5 h-5 text-green-500" />;
  };

  const getTypeLabel = (payout: Payout) => {
    if (payout.payout_type === 'withdrawal') return 'Retrait livreur';
    if (payout.payout_type === 'cash_deposit') return 'Dépôt cash';
    if (payout.recipient_type === 'restaurant') return 'Paiement restaurant';
    return 'Paiement';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-xl font-bold">{stats.totalPending.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payé</p>
                <p className="text-xl font-bold">{stats.totalPaid.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dû aux livreurs</p>
                <p className="text-xl font-bold">{stats.pendingDriverBalance.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dû aux restos</p>
                <p className="text-xl font-bold">{stats.pendingRestaurantBalance.toLocaleString()} F</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('withdrawals')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="w-5 h-5 text-green-500" />
              <span className="font-medium">Retraits livreurs</span>
            </div>
            <Badge variant="secondary">{stats.driverWithdrawals}</Badge>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('cash_deposits')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Dépôts cash</span>
            </div>
            <Badge variant="secondary">{stats.driverCashDeposits}</Badge>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('restaurants')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Paiements restos</span>
            </div>
            <Badge variant="secondary">{stats.restaurantPayouts}</Badge>
          </div>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
                <TabsTrigger value="cash_deposits">Dépôts cash</TabsTrigger>
                <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
              </TabsList>
            </Tabs>

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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau paiement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts List */}
      <ScrollArea className="h-[500px]">
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
              const status = statusConfig[payout.status || 'pending'];
              
              return (
                <Card key={payout.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                          {getIcon(payout)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{payout.recipient_name}</h3>
                            <Badge className={status?.color || ''}>{status?.label || payout.status}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{getTypeLabel(payout)}</span>
                            <span>{format(new Date(payout.created_at), "d MMM yyyy HH:mm", { locale: fr })}</span>
                          </div>
                          {payout.rejection_reason && (
                            <p className="text-xs text-destructive mt-1">Raison: {payout.rejection_reason}</p>
                          )}
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
                                <DropdownMenuItem onClick={() => {
                                  setSelectedPayout(payout);
                                  setShowApproveModal(true);
                                }}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                  Approuver
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedPayout(payout);
                                  setShowRejectModal(true);
                                }}>
                                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                                  Rejeter
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {payout.status === 'approved' && (
                              <DropdownMenuItem onClick={() => handleMarkPaid(payout.id)}>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Marquer payé
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              Voir détails
                            </DropdownMenuItem>
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
      </ScrollArea>

      {/* Create Payout Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de bénéficiaire</Label>
              <Select 
                value={newPayout.recipientType} 
                onValueChange={(v) => setNewPayout({...newPayout, recipientType: v, recipientId: ''})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="driver">Livreur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newPayout.recipientType === 'restaurant' && (
              <div className="space-y-2">
                <Label>Restaurant</Label>
                <Select 
                  value={newPayout.recipientId} 
                  onValueChange={(v) => setNewPayout({...newPayout, recipientId: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map(r => (
                      <SelectItem key={r.id} value={r.owner_id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newPayout.recipientType === 'driver' && (
              <div className="space-y-2">
                <Label>Livreur</Label>
                <Select 
                  value={newPayout.recipientId} 
                  onValueChange={(v) => setNewPayout({...newPayout, recipientId: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name || 'Livreur'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input 
                type="number" 
                placeholder="0" 
                value={newPayout.amount}
                onChange={(e) => setNewPayout({...newPayout, amount: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Méthode de paiement</Label>
              <Select 
                value={newPayout.paymentMethod} 
                onValueChange={(v) => setNewPayout({...newPayout, paymentMethod: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank">Virement bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Référence (optionnel)</Label>
              <Input 
                placeholder="REF-001..." 
                value={newPayout.reference}
                onChange={(e) => setNewPayout({...newPayout, reference: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea 
                placeholder="Notes..." 
                value={newPayout.notes}
                onChange={(e) => setNewPayout({...newPayout, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button onClick={handleCreatePayout}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver le paiement</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir approuver ce paiement ?</p>
            {selectedPayout && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold">{selectedPayout.recipient_name}</p>
                <p className="text-2xl font-bold">{Number(selectedPayout.amount).toLocaleString()} FCFA</p>
                <p className="text-sm text-muted-foreground">{getTypeLabel(selectedPayout)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>Annuler</Button>
            <Button onClick={handleApprove} className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Indiquez la raison du rejet :</p>
            {selectedPayout && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">{selectedPayout.recipient_name}</p>
                <p className="text-xl font-bold">{Number(selectedPayout.amount).toLocaleString()} FCFA</p>
              </div>
            )}
            <Textarea 
              placeholder="Raison du rejet..." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Annuler</Button>
            <Button onClick={handleReject} variant="destructive" disabled={!rejectionReason}>
              <XCircle className="w-4 h-4 mr-2" />
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}