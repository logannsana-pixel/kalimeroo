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
  ArrowRight,
  History,
  Loader2,
  Wallet
} from "lucide-react";

interface CashDeposit {
  id: string;
  amount: number;
  status: 'pending' | 'received' | 'validated';
  created_at: string;
  validated_at?: string;
  notes?: string;
}

interface DriverCashHandlingTabProps {
  orders: Array<{
    id: string;
    total: number;
    created_at: string;
  }>;
}

export function DriverCashHandlingTab({ orders }: DriverCashHandlingTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<CashDeposit[]>([]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Calculate cash on hand (orders paid in cash minus validated deposits)
  const totalCashCollected = orders.reduce((sum, o) => sum + o.total, 0);
  const totalDeposited = deposits
    .filter(d => d.status === 'validated')
    .reduce((sum, d) => sum + d.amount, 0);
  const pendingDeposits = deposits
    .filter(d => d.status === 'pending' || d.status === 'received')
    .reduce((sum, d) => sum + d.amount, 0);
  const cashOnHand = totalCashCollected - totalDeposited - pendingDeposits;

  useEffect(() => {
    fetchDeposits();
  }, [user]);

  const fetchDeposits = async () => {
    if (!user) return;
    try {
      // For now, store deposits in profile validation_documents or create a simple local state
      // In production, this would be a separate table
      const { data } = await supabase
        .from('payouts')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('recipient_type', 'driver_cash_deposit')
        .order('created_at', { ascending: false });

      if (data) {
        setDeposits(data.map(d => ({
          id: d.id,
          amount: d.amount,
          status: d.status as CashDeposit['status'],
          created_at: d.created_at || '',
          validated_at: d.processed_at || undefined,
          notes: d.notes || undefined
        })));
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
      const { error } = await supabase
        .from('payouts')
        .insert({
          recipient_id: user.id,
          recipient_type: 'driver_cash_deposit',
          amount,
          status: 'pending',
          notes: `Dépôt cash par ${user.email}`
        });

      if (error) throw error;

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

  const getStatusBadge = (status: CashDeposit['status']) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Validé</Badge>;
      case 'received':
        return <Badge className="bg-blue-500"><Building className="h-3 w-3 mr-1" /> Reçu au bureau</Badge>;
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
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Collecté total</p>
          <p className="text-xl font-bold text-green-600">{totalCashCollected.toFixed(0)} FCFA</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Dépôts en cours</p>
          <p className="text-xl font-bold text-orange-500">{pendingDeposits.toFixed(0)} FCFA</p>
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
                Pensez à déposer votre cash au bureau
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
          <div className="space-y-2">
            {deposits.map((deposit) => (
              <Card key={deposit.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{deposit.amount.toFixed(0)} FCFA</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(deposit.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {getStatusBadge(deposit.status)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleDeposit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmer le dépôt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
