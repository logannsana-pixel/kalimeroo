import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { DistrictSelector } from "@/components/DistrictSelector";

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GuestCheckoutModal = ({ isOpen, onClose, onSuccess }: GuestCheckoutModalProps) => {
  const [step, setStep] = useState<'choice' | 'login' | 'signup'>('choice');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    district: '',
    city: 'Brazzaville',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      toast.success("Connexion réussie!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            district: formData.district,
            city: formData.city,
            role: 'customer',
          },
        },
      });

      if (error) throw error;
      toast.success("Compte créé! Vous pouvez maintenant commander.");
      onSuccess();
    } catch (error: any) {
      if (error.message?.includes("already registered")) {
        toast.error("Cet email est déjà utilisé. Connectez-vous plutôt.");
        setStep('login');
      } else {
        toast.error(error.message || "Erreur lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep('choice');
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      district: '',
      city: 'Brazzaville',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {step === 'choice' && "Continuer ma commande"}
            {step === 'login' && "Se connecter"}
            {step === 'signup' && "Créer un compte rapide"}
          </DialogTitle>
          <DialogDescription>
            {step === 'choice' && "Connectez-vous ou créez un compte pour finaliser votre commande"}
            {step === 'login' && "Entrez vos identifiants"}
            {step === 'signup' && "Quelques informations pour créer votre compte"}
          </DialogDescription>
        </DialogHeader>

        {step === 'choice' && (
          <div className="space-y-4 py-4">
            <Button 
              onClick={() => setStep('login')} 
              className="w-full h-14 text-lg gap-3"
              variant="default"
            >
              <User className="h-5 w-5" />
              J'ai déjà un compte
              <ArrowRight className="h-5 w-5 ml-auto" />
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>
            
            <Button 
              onClick={() => setStep('signup')} 
              className="w-full h-14 text-lg gap-3"
              variant="outline"
            >
              <Mail className="h-5 w-5" />
              Créer un compte
              <ArrowRight className="h-5 w-5 ml-auto" />
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
              La création de compte prend moins de 30 secondes
            </p>
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="votre@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep('choice')} className="flex-1">
                Retour
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Se connecter
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Pas de compte?{" "}
              <button type="button" onClick={() => setStep('signup')} className="text-primary hover:underline">
                Créer un compte
              </button>
            </p>
          </form>
        )}

        {step === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="signup-name">Nom complet *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    placeholder="Jean Dupont"
                    className="pl-10"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="signup-email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="signup-phone">Téléphone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+242 06 XXX XX XX"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label>Quartier de livraison *</Label>
                <DistrictSelector
                  selectedDistrict={formData.district}
                  onSelect={(district, city) => setFormData({ ...formData, district, city })}
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="signup-password">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Min. 6 caractères"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep('choice')} className="flex-1">
                Retour
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Créer et commander
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Déjà un compte?{" "}
              <button type="button" onClick={() => setStep('login')} className="text-primary hover:underline">
                Se connecter
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
