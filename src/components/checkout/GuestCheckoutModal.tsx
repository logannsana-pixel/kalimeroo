import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Phone, Lock, ArrowLeft } from "lucide-react";
import { DistrictSelector } from "@/components/DistrictSelector";

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const validateCongoPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return [/^0[456]\d{7}$/, /^\+242[0456]\d{7}$/, /^242[0456]\d{7}$/].some(p => p.test(cleanPhone));
};

const phoneToEmail = (phone: string): string => `${phone.replace(/[\s\-\(\)\+]/g, '')}@delivereat.cg`;

export const GuestCheckoutModal = ({ isOpen, onClose, onSuccess }: GuestCheckoutModalProps) => {
  const [step, setStep] = useState<'choice' | 'login' | 'signup'>('choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    phone: '', password: '', full_name: '', district: '', city: 'Brazzaville',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateCongoPhone(formData.phone)) { setError("Numéro invalide"); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: phoneToEmail(formData.phone), password: formData.password });
      if (authError) { setError("Identifiants incorrects"); return; }
      toast.success("Connexion réussie!"); onSuccess();
    } catch { setError("Erreur"); } finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateCongoPhone(formData.phone)) { setError("Numéro invalide"); return; }
    if (!formData.district) { setError("Sélectionnez un quartier"); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: phoneToEmail(formData.phone),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: formData.full_name, phone: formData.phone, district: formData.district, city: formData.city, role: 'customer' },
        },
      });
      if (authError) {
        if (authError.message?.includes("already registered")) { setError("Numéro déjà utilisé"); setStep('login'); return; }
        setError(authError.message); return;
      }
      toast.success("Compte créé!"); onSuccess();
    } catch { setError("Erreur"); } finally { setLoading(false); }
  };

  const resetAndClose = () => { setStep('choice'); setFormData({ phone: '', password: '', full_name: '', district: '', city: 'Brazzaville' }); setError(""); onClose(); };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-xs rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/30 flex items-center gap-3">
          {step !== 'choice' && (
            <button onClick={() => setStep('choice')} className="w-7 h-7 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-sm font-medium">
            {step === 'choice' && "Continuer"}
            {step === 'login' && "Connexion"}
            {step === 'signup' && "Inscription"}
          </span>
        </div>

        <div className="p-4">
          {step === 'choice' && (
            <div className="space-y-3">
              <button onClick={() => setStep('login')} className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2">
                <User className="w-4 h-4" />J'ai un compte
              </button>
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">ou</span></div></div>
              <button onClick={() => setStep('signup')} className="w-full h-11 rounded-xl border border-border text-sm font-medium flex items-center justify-center gap-2">
                Créer un compte
              </button>
              <p className="text-xs text-center text-muted-foreground">Inscription en 30 secondes</p>
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" />Téléphone</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇨🇬</span>
                  <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="06 123 45 67" className="h-10 rounded-xl pl-10 text-sm" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mot de passe</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••" className="h-10 rounded-xl text-sm" required />
              </div>
              {error && <p className="text-xs text-destructive text-center bg-destructive/10 py-1.5 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Se connecter"}
              </button>
              <p className="text-xs text-center text-muted-foreground">Pas de compte ? <button type="button" onClick={() => setStep('signup')} className="text-primary">S'inscrire</button></p>
            </form>
          )}

          {step === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom complet</Label>
                <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Jean Dupont" className="h-10 rounded-xl text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" />Téléphone</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇨🇬</span>
                  <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="06 123 45 67" className="h-10 rounded-xl pl-10 text-sm" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quartier</Label>
                <DistrictSelector selectedDistrict={formData.district} onSelect={(district, city) => setFormData({ ...formData, district, city })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" />Mot de passe</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min. 6 caractères" className="h-10 rounded-xl text-sm" required minLength={6} />
              </div>
              {error && <p className="text-xs text-destructive text-center bg-destructive/10 py-1.5 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer et commander"}
              </button>
              <p className="text-xs text-center text-muted-foreground">Déjà un compte ? <button type="button" onClick={() => setStep('login')} className="text-primary">Connexion</button></p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
