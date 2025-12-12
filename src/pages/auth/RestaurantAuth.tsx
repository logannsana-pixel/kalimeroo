import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, ArrowLeft, TrendingUp, Users, BarChart3, Sparkles } from "lucide-react";
import { RestaurantSignupForm } from "@/components/auth/RestaurantSignupForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RestaurantAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        if (roleData?.role === "restaurant_owner") {
          navigate("/restaurant-dashboard");
        }
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou mot de passe incorrect");
        } else {
          toast.error(error.message);
        }
      } else {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user?.id)
          .single();
        
        if (roleData?.role !== "restaurant_owner") {
          toast.error("Ce compte n'est pas un compte restaurant");
          await supabase.auth.signOut();
          return;
        }
        
        toast.success("Bienvenue dans votre espace restaurant ! 🍽️");
        navigate("/restaurant-dashboard");
      }
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (restaurantData: any) => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/restaurant-dashboard`;

      let logoUrl = "";
      if (restaurantData.logo) {
        const fileExt = restaurantData.logo.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('restaurant-images')
          .upload(fileName, restaurantData.logo);

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('restaurant-images')
            .getPublicUrl(uploadData.path);
          logoUrl = publicUrl;
        }
      }

      const { error } = await supabase.auth.signUp({
        email: restaurantData.email,
        password: restaurantData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: restaurantData.fullName,
            phone: restaurantData.phone,
            role: "restaurant_owner",
            restaurant_name: restaurantData.restaurantName,
            restaurant_address: `${restaurantData.district}, ${restaurantData.address}`,
            cuisine_type: restaurantData.cuisineType,
            restaurant_description: restaurantData.description,
            restaurant_image_url: logoUrl,
            restaurant_city: restaurantData.city,
            restaurant_district: restaurantData.district,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Cet email est déjà utilisé");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Restaurant créé avec succès ! 🎉");
        navigate("/restaurant-dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-background dark:via-background dark:to-background">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Espace Restaurateur
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                Développez votre
                <span className="text-emerald-500 block">activité avec nous</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Rejoignez les meilleurs restaurants de Brazzaville et Pointe-Noire
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Augmentez vos ventes</h3>
                  <p className="text-sm text-muted-foreground">Atteignez de nouveaux clients et augmentez votre chiffre d'affaires</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Gestion simplifiée</h3>
                  <p className="text-sm text-muted-foreground">Gérez vos commandes, menus et horaires depuis un seul tableau de bord</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-2xl border border-border/50">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Analytics détaillés</h3>
                  <p className="text-sm text-muted-foreground">Suivez vos performances et optimisez votre activité</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                💡 <strong>0% de commission</strong> le premier mois pour les nouveaux partenaires !
              </p>
            </div>
          </div>

          {/* Right - Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">
                    {mode === "login" ? "Espace Restaurant" : "Devenir Partenaire"}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {mode === "login" 
                      ? "Accédez à votre tableau de bord" 
                      : "Inscrivez votre restaurant"}
                  </p>
                </div>

                {mode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email professionnel</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        placeholder="restaurant@email.com"
                        className="h-12 rounded-xl"
                        required
                      />
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
                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Connexion..." : "Accéder au dashboard"}
                    </Button>
                  </form>
                ) : (
                  <RestaurantSignupForm
                    onSubmit={handleSignup}
                    onBack={() => setMode("login")}
                  />
                )}

                <div className="mt-6 text-center">
                  <Button 
                    variant="link" 
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="text-sm"
                  >
                    {mode === "login" 
                      ? "Nouveau partenaire ? Inscrivez-vous" 
                      : "Déjà partenaire ? Connectez-vous"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantAuth;
