import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { User, ArrowLeft, Sparkles, ShoppingBag, Heart, Clock, Phone } from "lucide-react";
import { CustomerSignupForm } from "@/components/auth/CustomerSignupForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Validate Congolese phone number format
const validateCongoPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const patterns = [
    /^0[456]\d{7}$/,
    /^\+242[0456]\d{7}$/,
    /^242[0456]\d{7}$/,
  ];
  return patterns.some(pattern => pattern.test(cleanPhone));
};

// Format phone to email format for Supabase (workaround)
const phoneToEmail = (phone: string): string => {
  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  return `${clean}@delivereat.cg`;
};

const CustomerAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        if (roleData?.role === "customer") {
          navigate("/");
        }
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (!validateCongoPhone(loginData.phone)) {
      setLoginError("Numéro de téléphone congolais invalide");
      return;
    }
    
    setIsLoading(true);

    try {
      const email = phoneToEmail(loginData.phone);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setLoginError("Numéro ou mot de passe incorrect");
        } else {
          setLoginError("Erreur de connexion");
        }
      } else {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user?.id)
          .single();
        
        if (roleData?.role !== "customer") {
          toast.error("Ce compte n'est pas un compte client");
          await supabase.auth.signOut();
          return;
        }
        
        toast.success("Bienvenue ! 🎉");
        navigate("/");
      }
    } catch (err) {
      setLoginError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (customerData: any) => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const email = phoneToEmail(customerData.phone);

      const { error } = await supabase.auth.signUp({
        email,
        password: customerData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: customerData.fullName,
            phone: customerData.phone,
            district: customerData.district,
            city: customerData.city,
            address: customerData.addressComplement 
              ? `${customerData.district}, ${customerData.addressComplement}`
              : customerData.district,
            role: "customer",
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Ce numéro de téléphone est déjà utilisé");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Compte créé ! Bienvenue 🎉");
        navigate("/");
      }
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-yellow-50 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left - Benefits */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Rejoignez KALIMERO
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                Vos plats préférés,
                <span className="text-gradient-primary block">livrés chez vous</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Découvrez les meilleurs restaurants de Brazzaville et Pointe-Noire
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Commandez facilement</h3>
                  <p className="text-sm text-muted-foreground">Parcourez des centaines de restaurants et commandez en quelques clics</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Vos favoris sauvegardés</h3>
                  <p className="text-sm text-muted-foreground">Retrouvez vos restaurants et plats préférés instantanément</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Suivi en temps réel</h3>
                  <p className="text-sm text-muted-foreground">Suivez votre commande de la préparation à la livraison</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    {mode === "login" ? "Connexion Client" : "Créer un compte"}
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {mode === "login" 
                      ? "Accédez à vos commandes" 
                      : "Commencez à commander dès maintenant"}
                  </p>
                </div>

                {mode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Numéro de téléphone
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-lg">
                          🇨🇬
                        </span>
                        <Input
                          id="phone"
                          type="tel"
                          value={loginData.phone}
                          onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                          placeholder="06 123 45 67"
                          className="h-12 rounded-xl pl-12"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="••••••••"
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    
                    {loginError && (
                      <p className="text-sm text-destructive text-center bg-destructive/10 py-2 rounded-lg">
                        {loginError}
                      </p>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Connexion..." : "Se connecter"}
                    </Button>
                  </form>
                ) : (
                  <CustomerSignupForm
                    onSubmit={handleSignup}
                    onBack={() => setMode("login")}
                  />
                )}

                {mode === "login" && (
                  <div className="mt-6 text-center">
                    <Button 
                      variant="link" 
                      onClick={() => setMode("signup")}
                      className="text-sm"
                    >
                      Pas encore de compte ? Inscrivez-vous
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
