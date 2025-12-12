import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { toast } from "sonner";
import { 
  Banknote, 
  Building, 
  Clock, 
  Check, 
  AlertTriangle,
  History,
  Loader2,
  Wallet,
  XCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CashDeposit {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
}

interface DriverCashHandlingTabProps {
  orders: Array<{
    id: string;
    total: number;
    delivery_fee?: number;
    created_at: string;
    status: string;
  }>;
}

export function DriverCashHandlingTab({ orders }: DriverCashHandlingTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<CashDeposit[]>([]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter only cash orders that are delivered (assuming all COD orders need cash handling)
  const cashOrders = orders.filter(o => o.status === 'delivered');
  
  // Calculate cash on hand
  const totalCashCollected = cashOrders.reduce((sum, o) => sum + o.total, 0);
  
  const approvedDeposits = deposits.filter(d => d.status === 'approved' || d.status === 'completed');
  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const rejectedDeposits = deposits.filter(d => d.status === 'rejected');
  
  const totalDeposited = approvedDeposits.reduce((sum, d) => sum + d.amount, 0);
  const totalPending = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);
  const cashOnHand = totalCashCollected - totalDeposited - totalPending;

  useEffect(() => {
    fetchDeposits();
  }, [user]);

  const fetchDeposits = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('payouts')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('recipient_type', 'driver')
        .eq('payout_type', 'cash_deposit')
        .order('created_at', { ascending: false });

      if (data) {
        setDeposits(data as CashDeposit[]);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!user || !depositAmount) return;
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }

    if (amount > cashOnHand) {
      toast.error("Le montant dépasse votre cash en main");
      return;
    }

    setSubmitting(true);
    try {
      // Create deposit request
      const { data: payout, error: payoutError } = await supabase
        .from('payouts')
        .insert({
          recipient_id: user.id,
          recipient_type: 'driver',
          payout_type: 'cash_deposit',
          amount,
          status: 'pending',
          notes: `Dépôt cash au bureau`
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          transaction_type: 'driver_cash_deposit',
          entity_type: 'driver',
          entity_id: user.id,
          payout_id: payout.id,
          amount,
          balance_before: cashOnHand,
          balance_after: cashOnHand - amount,
          description: `Dépôt cash au bureau - ${amount} FCFA`
        });

      toast.success("Dépôt enregistré ! En attente de validation.");
      setShowDepositDialog(false);
      setDepositAmount('');
      fetchDeposits();
    } catch (error) {
      console.error('Error creating deposit:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Validé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejeté</Badge>;
      case 'received':
        return <Badge className="bg-blue-500"><Building className="h-3 w-3 mr-1" /> Reçu</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-xl font-bold">Gestion du cash</h2>

      {/* Cash Summary */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cash en main</p>
            <p className="text-3xl font-bold">{cashOnHand.toFixed(0)} FCFA</p>
          </div>
        </div>

        {cashOnHand > 0 && (
          <Button 
            onClick={() => setShowDepositDialog(true)}
            className="w-full h-14 text-lg font-semibold"
          >
            <Building className="h-5 w-5 mr-2" />
            Déposer au bureau
          </Button>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Collecté</p>
          <p className="text-lg font-bold text-green-600">{totalCashCollected.toFixed(0)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">En attente</p>
          <p className="text-lg font-bold text-orange-500">{totalPending.toFixed(0)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Déposé</p>
          <p className="text-lg font-bold text-blue-500">{totalDeposited.toFixed(0)}</p>
        </Card>
      </div>

      {/* Warning if high cash */}
      {cashOnHand > 50000 && (
        <Card className="p-4 border-orange-500 bg-orange-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-medium text-orange-700">Cash élevé</p>
              <p className="text-sm text-orange-600">
                Pensez à déposer votre cash au bureau dès que possible
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Deposits History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Historique des dépôts</h3>
        </div>

        {deposits.length === 0 ? (
          <Card className="p-6 text-center">
            <Banknote className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucun dépôt effectué</p>
          </Card>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {deposits.map((deposit) => (
                <Card key={deposit.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{deposit.amount.toFixed(0)} FCFA</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(deposit.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                      </p>
                      {deposit.rejection_reason && (
                        <p className="text-xs text-destructive mt-1">
                          Raison: {deposit.rejection_reason}
                        </p>
                      )}
                      {deposit.approved_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Validé le {format(new Date(deposit.approved_at), "d MMM HH:mm", { locale: fr })}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(deposit.status)}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 Déposez votre cash au bureau. Un agent validera la réception et votre solde sera mis à jour automatiquement.
        </p>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déposer du cash au bureau</DialogTitle>
            <DialogDescription>
              Indiquez le montant que vous allez déposer. Un agent validera votre dépôt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Cash disponible</p>
              <p className="text-2xl font-bold">{cashOnHand.toFixed(0)} FCFA</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant à déposer</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 25000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDepositAmount(cashOnHand.toString())}
            >
              Déposer tout ({cashOnHand.toFixed(0)} FCFA)
            </Button>

            <div className="p-3 bg-blue-500/10 rounded-lg">
              <p className="text-xs text-blue-700">
                <Building className="h-3 w-3 inline mr-1" />
                Rendez-vous au bureau avec ce montant exact. L'agent confirmera la réception.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleDeposit} disabled={submitting || !depositAmount}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmer le dépôt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}