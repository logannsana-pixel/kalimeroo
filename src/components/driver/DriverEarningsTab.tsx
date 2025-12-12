import { useState } from "react";
import { TrendingUp, Package, Clock, Calendar, Wallet, ArrowUpRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { DriverOrder } from "@/pages/DeliveryDashboard";
import { startOfDay, startOfWeek, startOfMonth, isAfter } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DriverEarningsTabProps {
  orders: DriverOrder[];
}

export function DriverEarningsTab({ orders }: DriverEarningsTabProps) {
  const { user } = useAuth();
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const todayOrders = orders.filter(o => isAfter(new Date(o.created_at), todayStart));
  const weekOrders = orders.filter(o => isAfter(new Date(o.created_at), weekStart));
  const monthOrders = orders.filter(o => isAfter(new Date(o.created_at), monthStart));

  const calcEarnings = (orderList: DriverOrder[]) => {
    // Driver earns 15% of order total
    return orderList.reduce((sum, o) => sum + (o.total * 0.15), 0);
  };

  const todayEarnings = calcEarnings(todayOrders);
  const weekEarnings = calcEarnings(weekOrders);
  const monthEarnings = calcEarnings(monthOrders);
  const totalEarnings = calcEarnings(orders);

  // Available for withdrawal (simplified - in production this would track actual withdrawals)
  const availableBalance = monthEarnings;

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

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('payouts')
        .insert({
          recipient_id: user.id,
          recipient_type: 'driver',
          amount,
          status: 'pending',
          payment_method: 'Mobile Money',
          notes: `Retrait vers ${phoneNumber}`
        });

      if (error) throw error;

      toast.success("Demande de retrait envoyée !");
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setPhoneNumber('');
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast.error("Erreur lors de la demande");
    } finally {
      setSubmitting(false);
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
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-xl font-bold">Mes gains</h2>

      {/* Main earnings card with withdraw button */}
      <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">Solde disponible</p>
            <p className="text-4xl font-bold mt-1">
              {availableBalance.toFixed(0)} <span className="text-xl">FCFA</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Wallet className="h-7 w-7" />
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4 text-sm opacity-80">
          <span className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            {orders.length} livraisons totales
          </span>
        </div>

        <Button 
          onClick={() => setShowWithdrawDialog(true)}
          className="w-full h-12 bg-white text-green-600 hover:bg-white/90 font-semibold"
          disabled={availableBalance <= 0}
        >
          <ArrowUpRight className="h-5 w-5 mr-2" />
          Retirer mes gains
        </Button>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.earnings.toFixed(0)} FCFA</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{stat.deliveries}</p>
                  <p className="text-xs text-muted-foreground">livraisons</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 Les gains sont calculés à 15% du montant de chaque commande livrée.
          Les retraits sont traités sous 24-48h via Mobile Money.
        </p>
      </Card>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer mes gains</DialogTitle>
            <DialogDescription>
              Entrez le montant et votre numéro Mobile Money
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleWithdraw} 
              disabled={submitting || !withdrawAmount || !phoneNumber}
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
