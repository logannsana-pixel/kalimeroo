import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Utensils } from "lucide-react";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { CustomerSignupForm } from "@/components/auth/CustomerSignupForm";
import { RestaurantSignupForm } from "@/components/auth/RestaurantSignupForm";
import { DeliverySignupForm } from "@/components/auth/DeliverySignupForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthStep = "login" | "role-select" | "customer-signup" | "restaurant-signup" | "delivery-signup";

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("login");
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
        
        redirectByRole(roleData?.role);
      }
    };
    checkSession();
  }, []);

  const redirectByRole = (role?: string) => {
    switch (role) {
      case "restaurant_owner":
        navigate("/restaurant-dashboard");
        break;
      case "delivery_driver":
        navigate("/delivery-dashboard");
        break;
      case "admin":
        navigate("/admin-dashboard");
        break;
      default:
        navigate("/");
    }
  };

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
        toast.success("Connexion réussie !");
        
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user?.id)
          .single();
        
        redirectByRole(roleData?.role);
      }
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSignup = async (customerData: any) => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error, data } = await supabase.auth.signUp({
        email: customerData.email,
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
          toast.error("Cet email est déjà utilisé");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Compte créé avec succès !");
        navigate("/");
      }
    } catch (err) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurantSignup = async (restaurantData: any) => {
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

      const { error, data } = await supabase.auth.signUp({
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
        toast.success("Restaurant créé avec succès !");
        navigate("/restaurant-dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeliverySignup = async (deliveryData: any) => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/delivery-dashboard`;

      const { error, data } = await supabase.auth.signUp({
        email: deliveryData.email,
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
          toast.error("Cet email est déjà utilisé");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Compte livreur créé avec succès !");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        {step !== "login" && (
          <div className="px-4 pt-4">
            <div className="flex justify-center mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        )}
        
        <CardContent className="p-4">
          {step === "login" && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="flex justify-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Utensils className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold">Connexion</h2>
                <p className="text-sm text-muted-foreground">Accédez à votre compte</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="votre@email.com"
                    className="h-10 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-10 text-sm"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-10 text-sm" disabled={isLoading}>
                  {isLoading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>

              <div className="text-center">
                <Button 
                  variant="link" 
                  onClick={() => setStep("role-select")}
                  className="text-xs"
                >
                  Pas encore de compte ? Inscrivez-vous
                </Button>
              </div>
            </div>
          )}

          {step === "role-select" && (
            <RoleSelector 
              onSelectRole={(role) => {
                if (role === "customer") {
                  setStep("customer-signup");
                } else if (role === "delivery_driver") {
                  setStep("delivery-signup");
                } else {
                  setStep("restaurant-signup");
                }
              }}
            />
          )}

          {step === "customer-signup" && (
            <CustomerSignupForm
              onSubmit={handleCustomerSignup}
              onBack={() => setStep("role-select")}
            />
          )}

          {step === "restaurant-signup" && (
            <RestaurantSignupForm
              onSubmit={handleRestaurantSignup}
              onBack={() => setStep("role-select")}
            />
          )}

          {step === "delivery-signup" && (
            <DeliverySignupForm
              onSubmit={handleDeliverySignup}
              onBack={() => setStep("role-select")}
            />
          )}

          {step !== "login" && (
            <div className="text-center mt-3">
              <Button 
                variant="link" 
                onClick={() => setStep("login")}
                className="text-xs"
              >
                Déjà un compte ? Connectez-vous
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
