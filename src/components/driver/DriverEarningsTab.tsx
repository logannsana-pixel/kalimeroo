import { useState, useEffect } from "react";
import { TrendingUp, Package, Clock, Calendar, Wallet, ArrowUpRight, Loader2, History, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { DriverOrder } from "@/pages/DeliveryDashboard";
import { startOfDay, startOfWeek, startOfMonth, isAfter, format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DriverEarningsTabProps {
  orders: DriverOrder[];
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  order_id: string | null;
  created_at: string;
}

const DRIVER_EARNING_RATE = 0.70; // 70% of delivery fee goes to driver

export function DriverEarningsTab({ orders }: DriverEarningsTabProps) {
  const { user } = useAuth();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const todayOrders = deliveredOrders.filter(o => isAfter(new Date(o.created_at), todayStart));
  const weekOrders = deliveredOrders.filter(o => isAfter(new Date(o.created_at), weekStart));
  const monthOrders = deliveredOrders.filter(o => isAfter(new Date(o.created_at), monthStart));

  // Calculate earnings: 70% of delivery_fee (not total order)
  const calcEarnings = (orderList: DriverOrder[]) => {
    return orderList.reduce((sum, o) => {
      const deliveryFee = o.delivery_fee || 0;
      // If delivery_fee is 0 (promo), still calculate based on a minimum fee
      const effectiveFee = deliveryFee > 0 ? deliveryFee : 1500; // Minimum 1500 FCFA if promo
      return sum + (effectiveFee * DRIVER_EARNING_RATE);
    }, 0);
  };

  const todayEarnings = calcEarnings(todayOrders);
  const weekEarnings = calcEarnings(weekOrders);
  const monthEarnings = calcEarnings(monthOrders);
  const totalEarnings = calcEarnings(deliveredOrders);

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
      fetchTransactions();
      calculateBalance();
    }
  }, [user, orders]);

  const fetchWithdrawals = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('payouts')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('recipient_type', 'driver')
        .eq('payout_type', 'withdrawal')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setWithdrawals(data as Withdrawal[]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('entity_id', user.id)
        .eq('entity_type', 'driver')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setTransactions(data as Transaction[]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculateBalance = async () => {
    if (!user) return;
    
    // Calculate total earnings from delivered orders
    const totalFromOrders = calcEarnings(deliveredOrders);
    
    // Get total approved withdrawals
    const { data: approvedWithdrawals } = await supabase
      .from('payouts')
      .select('amount')
      .eq('recipient_id', user.id)
      .eq('recipient_type', 'driver')
      .eq('payout_type', 'withdrawal')
      .in('status', ['approved', 'completed', 'paid']);

    const totalWithdrawn = approvedWithdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
    
    // Get pending withdrawals (not yet processed)
    const { data: pendingWithdrawals } = await supabase
      .from('payouts')
      .select('amount')
      .eq('recipient_id', user.id)
      .eq('recipient_type', 'driver')
      .eq('payout_type', 'withdrawal')
      .eq('status', 'pending');

    const totalPending = pendingWithdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
    
    setAvailableBalance(totalFromOrders - totalWithdrawn - totalPending);
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || !phoneNumber) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }

    if (amount > availableBalance) {
      toast.error("Solde insuffisant");
      return;
    }

    if (amount < 1000) {
      toast.error("Montant minimum: 1000 FCFA");
      return;
    }

    setSubmitting(true);
    try {
      // Create withdrawal request
      const { data: payout, error: payoutError } = await supabase
        .from('payouts')
        .insert({
          recipient_id: user.id,
          recipient_type: 'driver',
          payout_type: 'withdrawal',
          amount,
          status: 'pending',
          payment_method: 'mobile_money',
          notes: `Retrait vers ${phoneNumber}`
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          transaction_type: 'driver_withdrawal',
          entity_type: 'driver',
          entity_id: user.id,
          payout_id: payout.id,
          amount,
          balance_before: availableBalance,
          balance_after: availableBalance - amount,
          description: `Demande de retrait vers ${phoneNumber}`
        });

      toast.success("Demande de retrait envoyée ! En attente de validation admin.");
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setPhoneNumber('');
      fetchWithdrawals();
      calculateBalance();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast.error("Erreur lors de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Payé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejeté</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> En cours</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
    }
  };

  const stats = [
    {
      label: "Aujourd'hui",
      icon: Clock,
      earnings: todayEarnings,
      deliveries: todayOrders.length,
      color: "text-primary"
    },
    {
      label: "Cette semaine",
      icon: Calendar,
      earnings: weekEarnings,
      deliveries: weekOrders.length,
      color: "text-blue-500"
    },
    {
      label: "Ce mois",
      icon: TrendingUp,
      earnings: monthEarnings,
      deliveries: monthOrders.length,
      color: "text-purple-500"
    },
  ];

  return (
    <div className="p-4 space-y-4 pb-24">
      <h2 className="text-sm font-semibold">Mes gains</h2>

      {/* Main earnings card with withdraw button */}
      <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs opacity-80">Solde disponible</p>
            <p className="text-2xl font-bold mt-0.5">
              {availableBalance.toFixed(0)} <span className="text-sm">FCFA</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-3 text-xs opacity-80">
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {deliveredOrders.length} livraisons
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {totalEarnings.toFixed(0)} F total
          </span>
        </div>

        <Button 
          onClick={() => setShowWithdrawDialog(true)}
          className="w-full h-10 bg-white text-green-600 hover:bg-white/90 font-medium text-sm"
          disabled={availableBalance < 1000}
        >
          <ArrowUpRight className="h-4 w-4 mr-1.5" />
          Retirer mes gains
        </Button>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-bold">{stat.earnings.toFixed(0)} F</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{stat.deliveries}</p>
                  <p className="text-[10px] text-muted-foreground">livraisons</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💰 Gains = 70% des frais de livraison. Si la livraison est offerte (promo), vous recevez quand même 70% du tarif standard.
        </p>
      </Card>

      {/* Withdrawal History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Historique des retraits</h3>
        </div>

        {withdrawals.length === 0 ? (
          <Card className="p-6 text-center">
            <ArrowUpRight className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucun retrait effectué</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {withdrawals.slice(0, 5).map((withdrawal) => (
              <Card key={withdrawal.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{Number(withdrawal.amount).toFixed(0)} FCFA</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(withdrawal.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                    </p>
                    {withdrawal.rejection_reason && (
                      <p className="text-xs text-destructive mt-1">
                        Raison: {withdrawal.rejection_reason}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(withdrawal.status || 'pending')}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Dernières transactions</h3>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {transactions.map((tx) => (
                <Card key={tx.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {tx.transaction_type === 'delivery_earning' ? '+ Gain livraison' : '- Retrait'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "d MMM HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <span className={`font-semibold ${
                      tx.transaction_type === 'delivery_earning' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.transaction_type === 'delivery_earning' ? '+' : '-'}{Number(tx.amount).toFixed(0)} F
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer mes gains</DialogTitle>
            <DialogDescription>
              Entrez le montant et votre numéro Mobile Money. Minimum: 1000 FCFA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Solde disponible</p>
              <p className="text-2xl font-bold text-green-600">{availableBalance.toFixed(0)} FCFA</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Montant à retirer</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Ex: 10000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-lg h-12"
                min={1000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro Mobile Money</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="06 XXX XX XX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setWithdrawAmount(availableBalance.toString())}
            >
              Retirer tout ({availableBalance.toFixed(0)} FCFA)
            </Button>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                Votre demande sera validée par un admin sous 24-48h.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleWithdraw} 
              disabled={submitting || !withdrawAmount || !phoneNumber || parseFloat(withdrawAmount) < 1000}
              className="bg-green-500 hover:bg-green-600"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmer le retrait
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}