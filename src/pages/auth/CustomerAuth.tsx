import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, ArrowLeft, Phone, Loader2 } from "lucide-react";
import { CustomerSignupForm } from "@/components/auth/CustomerSignupForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const validateCongoPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return [/^0[456]\d{7}$/, /^\+242[0456]\d{7}$/, /^242[0456]\d{7}$/].some(p => p.test(cleanPhone));
};

const phoneToEmail = (phone: string): string => `${phone.replace(/[\s\-\(\)\+]/g, '')}@delivereat.cg`;

const CustomerAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
        if (roleData?.role === "customer") navigate("/");
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
      if (roleData?.role !== "customer") { toast.error("Compte non client"); await supabase.auth.signOut(); return; }
      toast.success("Bienvenue !"); navigate("/");
    } catch { setLoginError("Erreur"); } finally { setIsLoading(false); }
  };

  const handleSignup = async (customerData: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: phoneToEmail(customerData.phone),
        password: customerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: customerData.fullName, phone: customerData.phone, district: customerData.district, city: customerData.city, address: customerData.addressComplement ? `${customerData.district}, ${customerData.addressComplement}` : customerData.district, role: "customer" },
        },
      });
      if (error) { toast.error(error.message.includes("already registered") ? "Numéro déjà utilisé" : error.message); return; }
      toast.success("Compte créé !"); navigate("/");
    } catch { toast.error("Erreur"); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="w-8 h-8 flex items-center justify-center"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="text-sm font-medium">{mode === "login" ? "Connexion" : "Inscription"}</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Icon */}
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <User className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">{mode === "login" ? "Connexion Client" : "Créer un compte"}</h1>
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
              <button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Se connecter"}
              </button>
            </form>
          ) : (
            <CustomerSignupForm onSubmit={handleSignup} onBack={() => setMode("login")} />
          )}

          <p className="text-center text-xs text-muted-foreground">
            {mode === "login" ? "Pas de compte ? " : "Déjà un compte ? "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary font-medium">
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default CustomerAuth;
