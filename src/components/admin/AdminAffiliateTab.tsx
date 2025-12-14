import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Users, DollarSign, AlertTriangle, CheckCircle, XCircle, 
  Eye, Ban, RefreshCw, Settings, Shield, TrendingUp, Clock
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  total_referrals: number;
  eligible_referrals: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  status: string;
  ban_reason: string | null;
  created_at: string;
}

interface Withdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  status: string;
  mobile_money_number: string | null;
  rejection_reason: string | null;
  fraud_check_passed: boolean | null;
  created_at: string;
  affiliate?: Affiliate;
}

interface FraudLog {
  id: string;
  affiliate_id: string | null;
  event_type: string;
  severity: string;
  ip_address: string | null;
  details: unknown;
  resolved: boolean;
  admin_notes: string | null;
  created_at: string;
}

interface AffiliateSettings {
  reward_amount: string;
  min_orders_required: string;
  min_withdrawal_amount: string;
  withdrawal_delay_hours: string;
  program_enabled: string;
  legal_message: string;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  suspended: "secondary",
  banned: "destructive",
};

const withdrawalStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  pending_review: "secondary",
  approved: "default",
  rejected: "destructive",
  paid: "default",
};

const severityColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  critical: "destructive",
};

export function AdminAffiliateTab() {
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    eligibleAffiliates: 0,
    totalEarnings: 0,
    totalPaid: 0,
    pendingWithdrawals: 0,
    fraudsDetected: 0,
  });

  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch affiliates
      const { data: affiliatesData } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      setAffiliates(affiliatesData || []);

      // Fetch withdrawals
      const { data: withdrawalsData } = await supabase
        .from("affiliate_withdrawals")
        .select("*")
        .order("created_at", { ascending: false });

      setWithdrawals(withdrawalsData || []);

      // Fetch fraud logs
      const { data: fraudData } = await supabase
        .from("affiliate_fraud_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setFraudLogs(fraudData || []);

      // Fetch settings
      const { data: settingsData } = await supabase
        .from("affiliate_settings")
        .select("setting_key, setting_value");

      if (settingsData) {
        const settingsMap: Record<string, string> = {};
        settingsData.forEach(s => {
          settingsMap[s.setting_key] = JSON.parse(JSON.stringify(s.setting_value));
        });
        setSettings(settingsMap as unknown as AffiliateSettings);
      }

      // Calculate stats
      const totalAffiliates = affiliatesData?.length || 0;
      const eligibleAffiliates = affiliatesData?.filter(a => a.eligible_referrals > 0).length || 0;
      const totalEarnings = affiliatesData?.reduce((sum, a) => sum + Number(a.total_earnings), 0) || 0;
      const totalPaid = withdrawalsData?.filter(w => w.status === "paid").reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const pendingWithdrawals = withdrawalsData?.filter(w => w.status === "pending" || w.status === "pending_review").length || 0;
      const fraudsDetected = fraudData?.filter(f => !f.resolved).length || 0;

      setStats({
        totalAffiliates,
        eligibleAffiliates,
        totalEarnings,
        totalPaid,
        pendingWithdrawals,
        fraudsDetected,
      });
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleBanAffiliate = async (affiliate: Affiliate) => {
    if (!actionNote.trim()) {
      toast.error("Veuillez ajouter une raison");
      return;
    }

    setSubmitting(true);
    try {
      await supabase
        .from("affiliates")
        .update({
          status: "banned",
          ban_reason: actionNote,
        })
        .eq("id", affiliate.id);

      toast.success("Affilié banni");
      setSelectedAffiliate(null);
      setActionNote("");
      fetchData();
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreAffiliate = async (affiliate: Affiliate) => {
    setSubmitting(true);
    try {
      await supabase
        .from("affiliates")
        .update({
          status: "active",
          ban_reason: null,
        })
        .eq("id", affiliate.id);

      toast.success("Affilié réactivé");
      setSelectedAffiliate(null);
      fetchData();
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawalAction = async (action: "approve" | "reject" | "pay") => {
    if (!selectedWithdrawal) return;

    if (action === "reject" && !actionNote.trim()) {
      toast.error("Veuillez ajouter une raison de rejet");
      return;
    }

    setSubmitting(true);
    try {
      const updates: Record<string, unknown> = {};
      
      if (action === "approve") {
        updates.status = "approved";
        updates.fraud_check_passed = true;
      } else if (action === "reject") {
        updates.status = "rejected";
        updates.rejection_reason = actionNote;
        updates.fraud_check_passed = false;
        
        // Restore balance
        const affiliate = affiliates.find(a => a.id === selectedWithdrawal.affiliate_id);
        if (affiliate) {
          await supabase
            .from("affiliates")
            .update({
              available_balance: Number(affiliate.available_balance) + Number(selectedWithdrawal.amount),
              pending_balance: Number(affiliate.pending_balance) - Number(selectedWithdrawal.amount),
            })
            .eq("id", affiliate.id);
        }
      } else if (action === "pay") {
        updates.status = "paid";
        updates.processed_at = new Date().toISOString();
        
        // Reduce pending balance
        const affiliate = affiliates.find(a => a.id === selectedWithdrawal.affiliate_id);
        if (affiliate) {
          await supabase
            .from("affiliates")
            .update({
              pending_balance: Math.max(0, Number(affiliate.pending_balance) - Number(selectedWithdrawal.amount)),
            })
            .eq("id", affiliate.id);
        }
      }

      await supabase
        .from("affiliate_withdrawals")
        .update(updates)
        .eq("id", selectedWithdrawal.id);

      toast.success(action === "approve" ? "Retrait approuvé" : action === "reject" ? "Retrait rejeté" : "Retrait payé");
      setSelectedWithdrawal(null);
      setActionNote("");
      fetchData();
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSubmitting(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from("affiliate_settings")
          .update({ setting_value: value })
          .eq("setting_key", key);
      }

      toast.success("Paramètres sauvegardés");
      setShowSettingsModal(false);
    } catch (error) {
      toast.error("Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-none shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.totalAffiliates}</p>
            <p className="text-xs text-muted-foreground">Affiliés</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold">{stats.eligibleAffiliates}</p>
            <p className="text-xs text-muted-foreground">Éligibles</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.totalEarnings.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Gains générés</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto text-success mb-2" />
            <p className="text-2xl font-bold">{stats.totalPaid.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Payés</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto text-warning mb-2" />
            <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
            <p className="text-xs text-muted-foreground">Retraits en attente</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto text-destructive mb-2" />
            <p className="text-2xl font-bold">{stats.fraudsDetected}</p>
            <p className="text-xs text-muted-foreground">Fraudes détectées</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Gestion Affiliation</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button size="sm" onClick={() => setShowSettingsModal(true)} className="rounded-xl">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="withdrawals" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-xl">
          <TabsTrigger value="withdrawals" className="rounded-lg">Retraits</TabsTrigger>
          <TabsTrigger value="affiliates" className="rounded-lg">Affiliés</TabsTrigger>
          <TabsTrigger value="fraud" className="rounded-lg">Fraudes</TabsTrigger>
        </TabsList>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="space-y-4">
          {withdrawals.filter(w => w.status === "pending" || w.status === "pending_review").length > 0 && (
            <Card className="border-none shadow-soft rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Retraits en attente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {withdrawals
                  .filter(w => w.status === "pending" || w.status === "pending_review")
                  .map((withdrawal) => {
                    const affiliate = affiliates.find(a => a.id === withdrawal.affiliate_id);
                    return (
                      <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div>
                          <p className="font-medium">{withdrawal.amount.toFixed(0)} FCFA</p>
                          <p className="text-xs text-muted-foreground">
                            {affiliate?.referral_code} • {withdrawal.mobile_money_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(withdrawal.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={withdrawalStatusColors[withdrawal.status]}>
                            {withdrawal.status}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => setSelectedWithdrawal(withdrawal)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-soft rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Historique des retraits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {withdrawals.slice(0, 20).map((withdrawal) => {
                const affiliate = affiliates.find(a => a.id === withdrawal.affiliate_id);
                return (
                  <div key={withdrawal.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{withdrawal.amount.toFixed(0)} FCFA</p>
                      <p className="text-xs text-muted-foreground">
                        {affiliate?.referral_code} • {format(new Date(withdrawal.created_at), "dd MMM", { locale: fr })}
                      </p>
                    </div>
                    <Badge variant={withdrawalStatusColors[withdrawal.status]}>
                      {withdrawal.status}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="space-y-4">
          <Card className="border-none shadow-soft rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Liste des affiliés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {affiliates.map((affiliate) => (
                <div key={affiliate.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <div>
                    <p className="font-medium">{affiliate.referral_code}</p>
                    <p className="text-xs text-muted-foreground">
                      {affiliate.total_referrals} filleuls • {affiliate.eligible_referrals} éligibles
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gains: {affiliate.total_earnings.toFixed(0)} FCFA
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[affiliate.status]}>
                      {affiliate.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setSelectedAffiliate(affiliate)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fraud Tab */}
        <TabsContent value="fraud" className="space-y-4">
          <Card className="border-none shadow-soft rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-destructive" />
                Logs Anti-Fraude
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fraudLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune fraude détectée</p>
              ) : (
                fraudLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{log.event_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        IP: {log.ip_address || "N/A"} • {format(new Date(log.created_at), "dd MMM HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={severityColors[log.severity]}>
                        {log.severity}
                      </Badge>
                      {log.resolved ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Affiliate Detail Modal */}
      <Dialog open={!!selectedAffiliate} onOpenChange={(open) => !open && setSelectedAffiliate(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Affilié: {selectedAffiliate?.referral_code}</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total filleuls</p>
                  <p className="font-bold">{selectedAffiliate.total_referrals}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Éligibles</p>
                  <p className="font-bold">{selectedAffiliate.eligible_referrals}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gains totaux</p>
                  <p className="font-bold">{selectedAffiliate.total_earnings.toFixed(0)} FCFA</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Solde disponible</p>
                  <p className="font-bold">{selectedAffiliate.available_balance.toFixed(0)} FCFA</p>
                </div>
              </div>

              {selectedAffiliate.status === "banned" ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Raison du ban: {selectedAffiliate.ban_reason}</p>
                  <Button onClick={() => handleRestoreAffiliate(selectedAffiliate)} disabled={submitting} className="w-full">
                    Réactiver
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Raison du bannissement</Label>
                  <Textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Raison..."
                  />
                  <Button
                    variant="destructive"
                    onClick={() => handleBanAffiliate(selectedAffiliate)}
                    disabled={submitting}
                    className="w-full"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Bannir cet affilié
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdrawal Action Modal */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={(open) => !open && setSelectedWithdrawal(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Retrait: {selectedWithdrawal?.amount.toFixed(0)} FCFA</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p><strong>Mobile Money:</strong> {selectedWithdrawal.mobile_money_number}</p>
                <p><strong>Date:</strong> {format(new Date(selectedWithdrawal.created_at), "PPP HH:mm", { locale: fr })}</p>
                <p><strong>Statut:</strong> <Badge variant={withdrawalStatusColors[selectedWithdrawal.status]}>{selectedWithdrawal.status}</Badge></p>
              </div>

              {(selectedWithdrawal.status === "pending" || selectedWithdrawal.status === "pending_review") && (
                <>
                  <div className="space-y-2">
                    <Label>Note/Raison (optionnel pour approbation)</Label>
                    <Textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Note..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleWithdrawalAction("reject")}
                      disabled={submitting}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                    <Button
                      onClick={() => handleWithdrawalAction("approve")}
                      disabled={submitting}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                  </div>
                </>
              )}

              {selectedWithdrawal.status === "approved" && (
                <Button
                  onClick={() => handleWithdrawalAction("pay")}
                  disabled={submitting}
                  className="w-full"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Marquer comme payé
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Paramètres Affiliation</DialogTitle>
          </DialogHeader>
          {settings && (
            <div className="space-y-4">
              <div>
                <Label>Récompense par filleul (FCFA)</Label>
                <Input
                  type="number"
                  value={settings.reward_amount}
                  onChange={(e) => setSettings({ ...settings, reward_amount: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Commandes minimum pour éligibilité</Label>
                <Input
                  type="number"
                  value={settings.min_orders_required}
                  onChange={(e) => setSettings({ ...settings, min_orders_required: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Retrait minimum (FCFA)</Label>
                <Input
                  type="number"
                  value={settings.min_withdrawal_amount}
                  onChange={(e) => setSettings({ ...settings, min_withdrawal_amount: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Délai de traitement (heures)</Label>
                <Input
                  type="number"
                  value={settings.withdrawal_delay_hours}
                  onChange={(e) => setSettings({ ...settings, withdrawal_delay_hours: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Programme actif</Label>
                <Switch
                  checked={settings.program_enabled === "true"}
                  onCheckedChange={(checked) => setSettings({ ...settings, program_enabled: checked ? "true" : "false" })}
                />
              </div>
              <div>
                <Label>Message légal</Label>
                <Textarea
                  value={settings.legal_message}
                  onChange={(e) => setSettings({ ...settings, legal_message: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveSettings} disabled={submitting}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}