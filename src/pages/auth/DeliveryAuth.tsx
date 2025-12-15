import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bike, ArrowLeft, Phone, Loader2 } from "lucide-react";
import { DeliverySignupForm } from "@/components/auth/DeliverySignupForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const validateCongoPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return [/^0[456]\d{7}$/, /^\+242[0456]\d{7}$/, /^242[0456]\d{7}$/].some(p => p.test(cleanPhone));
};

const phoneToEmail = (phone: string): string => `${phone.replace(/[\s\-\(\)\+]/g, '')}@delivereat.cg`;

const DeliveryAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
        if (roleData?.role === "delivery_driver") navigate("/delivery-dashboard");
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!validateCongoPhone(loginData.phone)) { setLoginError("Numéro invalide"); return; }
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email: phoneToEmail(loginData.phone), password: loginData.password });
      if (error) { setLoginError("Identifiants incorrects"); return; }
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", data.user?.id).single();
      if (roleData?.role !== "delivery_driver") { toast.error("Compte non livreur"); await supabase.auth.signOut(); return; }
      toast.success("Prêt à livrer !"); navigate("/delivery-dashboard");
    } catch { setLoginError("Erreur"); } finally { setIsLoading(false); }
  };

  const handleSignup = async (deliveryData: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: phoneToEmail(deliveryData.phone),
        password: deliveryData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/delivery-dashboard`,
          data: { full_name: deliveryData.fullName, phone: deliveryData.phone, district: deliveryData.district, city: deliveryData.city, address: deliveryData.district, role: "delivery_driver", vehicle_type: deliveryData.vehicleType, license_number: deliveryData.licenseNumber },
        },
      });
      if (error) { toast.error(error.message.includes("already registered") ? "Numéro déjà utilisé" : error.message); return; }
      toast.success("Bienvenue dans l'équipe !"); navigate("/delivery-dashboard");
    } catch { toast.error("Erreur"); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="w-8 h-8 flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="text-sm font-medium">Espace Livreur</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
              <Bike className="w-7 h-7 text-blue-500" />
            </div>
            <h1 className="text-lg font-semibold">{mode === "login" ? "Connexion Livreur" : "Devenir Livreur"}</h1>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs flex items-center gap-1.5"><Phone className="w-3 h-3" />Téléphone</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇨🇬</span>
                  <Input id="phone" type="tel" value={loginData.phone} onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })} placeholder="06 123 45 67" className="h-11 rounded-xl pl-10 text-sm" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Mot de passe</Label>
                <Input id="password" type="password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} placeholder="••••••••" className="h-11 rounded-xl text-sm" required />
              </div>
              {loginError && <p className="text-xs text-destructive text-center bg-destructive/10 py-2 rounded-lg">{loginError}</p>}
              <button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Se connecter"}
              </button>
            </form>
          ) : (
            <DeliverySignupForm onSubmit={handleSignup} onBack={() => setMode("login")} />
          )}

          <p className="text-center text-xs text-muted-foreground">
            {mode === "login" ? "Nouveau livreur ? " : "Déjà inscrit ? "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-blue-500 font-medium">
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default DeliveryAuth;
