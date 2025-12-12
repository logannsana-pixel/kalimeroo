import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Download, TrendingUp, Clock, CheckCircle, Loader2 } from "lucide-react";

interface Payout {
  id: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  processed_at: string | null;
  payment_method: string | null;
  reference: string | null;
}

export const RestaurantPaymentsTab = () => {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingPayout: 0,
    lastPayout: 0
  });

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) return;

      // Get payouts
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('*')
        .eq('recipient_id', restaurant.id)
        .eq('recipient_type', 'restaurant')
        .order('created_at', { ascending: false });

      if (payoutsData) {
        setPayouts(payoutsData);
        
        // Calculate stats
        const completed = payoutsData.filter(p => p.status === 'completed');
        const pending = payoutsData.filter(p => p.status === 'pending');
        
        setStats({
          totalEarned: completed.reduce((sum, p) => sum + p.amount, 0),
          pendingPayout: pending.reduce((sum, p) => sum + p.amount, 0),
          lastPayout: completed[0]?.amount || 0
        });
      }

      // If no payouts, calculate from orders
      if (!payoutsData || payoutsData.length === 0) {
        const { data: orders } = await supabase
          .from('orders')
          .select('total, status')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'delivered');

        if (orders) {
          const total = orders.reduce((sum, o) => sum + (o.total * 0.85), 0); // 85% goes to restaurant
          setStats({
            totalEarned: total,
            pendingPayout: total,
            lastPayout: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Payé</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Paiements</h2>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total gagné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.totalEarned.toFixed(0)} FCFA</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.pendingPayout.toFixed(0)} FCFA</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dernier paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.lastPayout.toFixed(0)} FCFA</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>
            Retrouvez tous vos paiements reçus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun paiement pour le moment</p>
              <p className="text-sm">Les paiements seront effectués après vos premières livraisons</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Référence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      {payout.period_start && payout.period_end ? (
                        <>
                          {new Date(payout.period_start).toLocaleDateString('fr-FR')} - {new Date(payout.period_end).toLocaleDateString('fr-FR')}
                        </>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {payout.amount.toFixed(0)} FCFA
                    </TableCell>
                    <TableCell>{payout.payment_method || 'Mobile Money'}</TableCell>
                    <TableCell>{getStatusBadge(payout.status || 'pending')}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {payout.reference || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
