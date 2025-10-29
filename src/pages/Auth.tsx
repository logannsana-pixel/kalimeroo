import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Utensils, Upload } from "lucide-react";
import { z } from "zod";
import { allDistricts } from "@/data/congoDistricts";

const authSchema = z.object({
  email: z.string().email("Email invalide").max(255, "Email trop long"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100, "Mot de passe trop long"),
  fullName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Nom trop long").optional(),
  role: z.enum(["customer", "restaurant_owner", "delivery_driver", "admin"]).optional(),
  phone: z.string().optional(),
  district: z.string().optional(),
  restaurantName: z.string().optional(),
  restaurantAddress: z.string().optional(),
  cuisineType: z.string().optional(),
  restaurantDescription: z.string().optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    email: "", 
    password: "", 
    fullName: "",
    phone: "",
    district: "",
    role: "customer" as "customer" | "restaurant_owner" | "delivery_driver" | "admin",
    restaurantName: "",
    restaurantAddress: "",
    cuisineType: "",
    restaurantDescription: "",
  });
  const [restaurantImage, setRestaurantImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestaurantImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = authSchema.parse(loginData);
      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou mot de passe incorrect");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Connexion réussie !");
        // Get user role and redirect accordingly
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .single();
        
        const userRole = roleData?.role;
        switch (userRole) {
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
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = authSchema.parse(signupData);
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validated.fullName,
            phone: validated.phone,
            district: validated.district,
            address: validated.district,
            role: validated.role || "customer",
            restaurant_name: validated.restaurantName,
            restaurant_address: validated.restaurantAddress,
            cuisine_type: validated.cuisineType,
            restaurant_description: validated.restaurantDescription,
            restaurant_image_url: "", // Image sera ajoutée depuis le dashboard
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
        toast.success("Compte créé avec succès ! Vous pouvez maintenant ajouter votre logo depuis le dashboard.");
        const userRole = validated.role || "customer";
        switch (userRole) {
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
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Utensils className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">DeliverEat</CardTitle>
          <CardDescription>Mangez comme au restaurant, sans sortir</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Je suis</Label>
                  <Select
                    value={signupData.role}
                    onValueChange={(value: "customer" | "restaurant_owner" | "delivery_driver") => 
                      setSignupData({ ...signupData, role: value })
                    }
                  >
                    <SelectTrigger id="signup-role">
                      <SelectValue placeholder="Sélectionnez votre rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Client</SelectItem>
                      <SelectItem value="restaurant_owner">Restaurant</SelectItem>
                      <SelectItem value="delivery_driver">Livreur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Jean Dupont"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Téléphone</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="06 555 444"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    required
                  />
                </div>

                {signupData.role === "customer" && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-district">Quartier</Label>
                    <Select
                      value={signupData.district}
                      onValueChange={(value) => setSignupData({ ...signupData, district: value })}
                    >
                      <SelectTrigger id="signup-district">
                        <SelectValue placeholder="Sélectionnez votre quartier" />
                      </SelectTrigger>
                      <SelectContent>
                        {allDistricts.map((item) => (
                          <SelectItem key={`${item.city}-${item.district}`} value={`${item.city} - ${item.district}`}>
                            {item.city} - {item.district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {signupData.role === "restaurant_owner" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-name">Nom du restaurant</Label>
                      <Input
                        id="restaurant-name"
                        type="text"
                        placeholder="Le Goût Royal"
                        value={signupData.restaurantName}
                        onChange={(e) => setSignupData({ ...signupData, restaurantName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cuisine-type">Type de cuisine</Label>
                      <Select
                        value={signupData.cuisineType}
                        onValueChange={(value) => setSignupData({ ...signupData, cuisineType: value })}
                      >
                        <SelectTrigger id="cuisine-type">
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africaine">Africaine</SelectItem>
                          <SelectItem value="Pizza">Pizza</SelectItem>
                          <SelectItem value="Fast Food">Fast Food</SelectItem>
                          <SelectItem value="Chinoise">Chinoise</SelectItem>
                          <SelectItem value="Indienne">Indienne</SelectItem>
                          <SelectItem value="Italienne">Italienne</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="restaurant-address">Quartier / Adresse</Label>
                      <Select
                        value={signupData.restaurantAddress}
                        onValueChange={(value) => setSignupData({ ...signupData, restaurantAddress: value })}
                      >
                        <SelectTrigger id="restaurant-address">
                          <SelectValue placeholder="Sélectionnez le quartier" />
                        </SelectTrigger>
                        <SelectContent>
                          {allDistricts.map((item) => (
                            <SelectItem key={`${item.city}-${item.district}`} value={`${item.city} - ${item.district}`}>
                              {item.city} - {item.district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="restaurant-description">Description</Label>
                      <Textarea
                        id="restaurant-description"
                        placeholder="Cuisine locale moderne..."
                        value={signupData.restaurantDescription}
                        onChange={(e) => setSignupData({ ...signupData, restaurantDescription: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="restaurant-image">Logo / Image du restaurant</Label>
                      <p className="text-sm text-muted-foreground">
                        Vous pourrez ajouter votre logo depuis le dashboard après l'inscription
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Création..." : "Créer un compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
