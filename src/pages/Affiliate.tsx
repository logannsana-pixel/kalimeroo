import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Gift, Copy, Share2, Users, Wallet, Clock, CheckCircle, 
  AlertTriangle, TrendingUp, ChevronLeft, MessageCircle, 
  Ban, DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Affiliate {
  id: string;
  referral_code: string;
  referral_link: string | null;
  total_referrals: number;
  eligible_referrals: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  status: string;
  is_eligible: boolean;
  created_at: string;
}

interface Referral {
  id: string;
  referred_user_id: string;
  status: string;
  orders_count: number;
  reward_amount: number;
  created_at: string;
  is_suspicious: boolean;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  rejection_reason: string | null;
}

interface AffiliateSettings {
  reward_amount: number;
  min_orders_required: number;
  min_withdrawal_amount: number;
  legal_message: string;
  program_enabled: boolean;
}

const statusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  eligible: { label: "Éligible", variant: "default" },
  not_eligible: { label: "Non éligible", variant: "outline" },
  rewarded: { label: "Récompensé", variant: "default" },
};

const withdrawalStatusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  pending_review: { label: "En vérification", variant: "secondary" },
  approved: { label: "Approuvé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
  paid: { label: "Payé", variant: "default" },
};

export default function Affiliate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from("affiliate_settings")
        .select("setting_key, setting_value");

      if (settingsData) {
        const settingsMap: Record<string, string> = {};
        settingsData.forEach(s => {
          settingsMap[s.setting_key] = JSON.parse(JSON.stringify(s.setting_value));
        });
        setSettings({
          reward_amount: Number(settingsMap.reward_amount) || 1000,
          min_orders_required: Number(settingsMap.min_orders_required) || 3,
          min_withdrawal_amount: Number(settingsMap.min_withdrawal_amount) || 5000,
          legal_message: String(settingsMap.legal_message || "").replace(/"/g, ""),
          program_enabled: settingsMap.program_enabled === "true",
        });
      }

      // Fetch or create affiliate profile
      let { data: affiliateData } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!affiliateData) {
        // Generate referral code
        const code = "KAL" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: newAffiliate, error } = await supabase
          .from("affiliates")
          .insert({
            user_id: user.id,
            referral_code: code,
            referral_link: `${window.location.origin}/auth?ref=${code}`,
          })
          .select()
          .single();

        if (error) throw error;
        affiliateData = newAffiliate;
      }

      setAffiliate(affiliateData);

      // Fetch referrals
      if (affiliateData) {
        const { data: referralsData } = await supabase
          .from("referrals")
          .select("*")
          .eq("referrer_id", affiliateData.id)
          .order("created_at", { ascending: false });

        setReferrals(referralsData || []);

        // Fetch withdrawals
        const { data: withdrawalsData } = await supabase
          .from("affiliate_withdrawals")
          .select("*")
          .eq("affiliate_id", affiliateData.id)
          .order("created_at", { ascending: false });

        setWithdrawals(withdrawalsData || []);
      }
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (affiliate?.referral_code) {
      navigator.clipboard.writeText(affiliate.referral_code);
      toast.success("Code copié !");
    }
  };

  const copyReferralLink = () => {
    if (affiliate?.referral_link) {
      navigator.clipboard.writeText(affiliate.referral_link);
      toast.success("Lien copié !");
    }
  };

  const shareViaWhatsApp = () => {
    if (affiliate?.referral_link) {
      const message = `🎁 Rejoins KALIMERO avec mon code ${affiliate.referral_code} et gagne des récompenses ! ${affiliate.referral_link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const handleWithdrawal = async () => {
    if (!affiliate || !settings) return;
    
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount < settings.min_withdrawal_amount) {
      toast.error(`Montant minimum: ${settings.min_withdrawal_amount} FCFA`);
      return;
    }

    if (amount > affiliate.available_balance) {
      toast.error("Solde insuffisant");
      return;
    }

    if (!mobileMoneyNumber || mobileMoneyNumber.length < 9) {
      toast.error("Numéro Mobile Money invalide");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("affiliate_withdrawals")
        .insert({
          affiliate_id: affiliate.id,
          amount,
          payment_method: "mobile_money",
          mobile_money_number: mobileMoneyNumber,
          status: "pending",
        });

      if (error) throw error;

      // Update affiliate balance
      await supabase
        .from("affiliates")
        .update({
          available_balance: affiliate.available_balance - amount,
          pending_balance: affiliate.pending_balance + amount,
        })
        .eq("id", affiliate.id);

      toast.success("Demande de retrait envoyée !");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setMobileMoneyNumber("");
      fetchData();
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error("Erreur lors de la demande de retrait");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-20 bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!settings?.program_enabled) {
    return (
      <div className="min-h-screen flex flex-col pb-20 bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Mon Parrainage</h1>
          </div>
          <Card className="border-none shadow-soft rounded-3xl text-center py-12">
            <CardContent>
              <Ban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">Programme en pause</h3>
              <p className="text-muted-foreground">Le programme d'affiliation est temporairement désactivé.</p>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

  const eligibleCount = referrals.filter(r => r.status === "rewarded").length;
  const pendingCount = referrals.filter(r => r.status === "pending" || r.status === "eligible").length;
  const notEligibleCount = referrals.filter(r => r.status === "not_eligible" || r.is_suspicious).length;

  return (
    <div className="min-h-screen flex flex-col pb-20 bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Mon Parrainage
          </h1>
        </div>

        {/* Referral Card */}
        <Card className="border-none shadow-soft rounded-3xl overflow-hidden bg-gradient-primary text-primary-foreground mb-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm opacity-90">Ton code parrain</span>
              {affiliate?.status === "banned" && (
                <Badge variant="destructive">Suspendu</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold tracking-wider">{affiliate?.referral_code}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30"
                onClick={copyReferralCode}
              >
                <Copy className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-full bg-white/20 hover:bg-white/30 text-primary-foreground"
                onClick={copyReferralLink}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier lien
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-white/20 hover:bg-white/30 text-primary-foreground"
                onClick={shareViaWhatsApp}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="border-none shadow-soft rounded-2xl">
            <CardContent className="p-4 text-center">
              <Wallet className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-lg font-bold">{affiliate?.available_balance?.toFixed(0) || 0}</p>
              <p className="text-xs text-muted-foreground">Disponible</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-soft rounded-2xl">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-warning mb-2" />
              <p className="text-lg font-bold">{affiliate?.pending_balance?.toFixed(0) || 0}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-soft rounded-2xl">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-success mb-2" />
              <p className="text-lg font-bold">{affiliate?.total_earnings?.toFixed(0) || 0}</p>
              <p className="text-xs text-muted-foreground">Total gagné</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Button */}
        {affiliate && affiliate.available_balance >= (settings?.min_withdrawal_amount || 5000) && (
          <Button
            className="w-full rounded-2xl h-12 mb-4 btn-playful"
            onClick={() => setShowWithdrawModal(true)}
            disabled={affiliate.status === "banned"}
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Demander un retrait
          </Button>
        )}

        {/* Stats */}
        <Card className="border-none shadow-soft rounded-3xl mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Mes Filleuls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-success">{eligibleCount}</p>
                <p className="text-xs text-muted-foreground">Éligibles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{notEligibleCount}</p>
                <p className="text-xs text-muted-foreground">Non éligibles</p>
              </div>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-success" />
                <span><strong>{settings?.reward_amount} FCFA</strong> par filleul éligible</span>
              </p>
              <p className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span>Éligible après <strong>{settings?.min_orders_required}</strong> commandes</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        {referrals.length > 0 && (
          <Card className="border-none shadow-soft rounded-3xl mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Historique des filleuls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {referrals.slice(0, 10).map((referral) => (
                <div key={referral.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">Filleul #{referral.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(referral.created_at), "dd MMM yyyy", { locale: fr })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {referral.orders_count}/{settings?.min_orders_required || 3} commandes
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusBadges[referral.status]?.variant || "secondary"}>
                      {statusBadges[referral.status]?.label || referral.status}
                    </Badge>
                    {referral.status === "rewarded" && (
                      <p className="text-xs text-success font-medium mt-1">
                        +{referral.reward_amount} FCFA
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Withdrawals List */}
        {withdrawals.length > 0 && (
          <Card className="border-none shadow-soft rounded-3xl mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Historique des retraits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {withdrawals.slice(0, 5).map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{withdrawal.amount.toFixed(0)} FCFA</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(withdrawal.created_at), "dd MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={withdrawalStatusBadges[withdrawal.status]?.variant || "secondary"}>
                      {withdrawalStatusBadges[withdrawal.status]?.label || withdrawal.status}
                    </Badge>
                    {withdrawal.rejection_reason && (
                      <p className="text-xs text-destructive mt-1">{withdrawal.rejection_reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Legal Notice */}
        {settings?.legal_message && (
          <Card className="border-none bg-muted/50 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{settings.legal_message}</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="mx-4 max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Demande de retrait</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Montant (FCFA)</Label>
              <Input
                id="amount"
                type="number"
                placeholder={`Min. ${settings?.min_withdrawal_amount || 5000}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="mt-1 rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Solde disponible: {affiliate?.available_balance?.toFixed(0)} FCFA
              </p>
            </div>
            <div>
              <Label htmlFor="phone">Numéro Mobile Money</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="06 XXX XX XX"
                value={mobileMoneyNumber}
                onChange={(e) => setMobileMoneyNumber(e.target.value)}
                className="mt-1 rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Délai de traitement: 24-48h ouvrées
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleWithdrawal} disabled={submitting} className="rounded-xl">
              {submitting ? "Envoi..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}