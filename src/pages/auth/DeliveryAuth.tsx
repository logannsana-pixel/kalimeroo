import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Bike, ArrowLeft, Wallet, Clock, MapPin, Sparkles, Phone } from "lucide-react";
import { DeliverySignupForm } from "@/components/auth/DeliverySignupForm";
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

const DeliveryAuth = () => {
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
        
        if (roleData?.role === "delivery_driver") {
          navigate("/delivery-dashboard");
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
        
        if (roleData?.role !== "delivery_driver") {
          toast.error("Ce compte n'est pas un compte livreur");
          await supabase.auth.signOut();
          return;
        }
        
        toast.success("Prêt à livrer ! 🚀");
        navigate("/delivery-dashboard");
      }
    } catch (err) {
      setLoginError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (deliveryData: any) => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/delivery-dashboard`;
      const email = phoneToEmail(deliveryData.phone);

      const { error } = await supabase.auth.signUp({
        email,
        password: deliveryData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: deliveryData.fullName,
            phone: deliveryData.phone,
            district: deliveryData.district,
            city: deliveryData.city,
            address: deliveryData.district,
            role: "delivery_driver",
            vehicle_type: deliveryData.vehicleType,
            license_number: deliveryData.licenseNumber,
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
        toast.success("Bienvenue dans l'équipe ! 🎉");
        navigate("/delivery-dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-50 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        {/* <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </Link> */}
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left - Benefits */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Espace Livreur
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                Gagnez de l'argent
                <span className="text-blue-500 block">à votre rythme</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Devenez livreur KALIMERO et travaillez quand vous voulez
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Revenus attractifs</h3>
                  <p className="text-sm text-muted-foreground">Gagnez jusqu'à 150 000 FCFA par semaine selon votre activité</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Horaires flexibles</h3>
                  <p className="text-sm text-muted-foreground">Travaillez quand vous voulez, activez/désactivez votre statut en 1 clic</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Livrez dans votre zone</h3>
                  <p className="text-sm text-muted-foreground">Recevez des commandes proches de vous, optimisez vos trajets</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                🎁 <strong>Bonus de bienvenue</strong> de 10 000 FCFA après vos 10 premières livraisons !
              </p>
            </div>
          </div>

          {/* Right - Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <Bike className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    {mode === "login" ? "Connexion Livreur" : "Devenir Livreur"}
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {mode === "login" 
                      ? "Accédez à vos livraisons" 
                      : "Rejoignez notre équipe"}
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
                      className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Connexion..." : "Commencer à livrer"}
                    </Button>
                  </form>
                ) : (
                  <DeliverySignupForm
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
                      Nouveau livreur ? Inscrivez-vous
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

export default DeliveryAuth;
