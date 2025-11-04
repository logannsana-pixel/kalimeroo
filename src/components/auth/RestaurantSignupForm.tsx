import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { congoDistricts, cities } from "@/data/congoLocations";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RestaurantData {
  // Gérant
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  // Restaurant
  restaurantName: string;
  cuisineType: string;
  city: string;
  district: string;
  address: string;
  description: string;
  logo?: File;
}

interface RestaurantSignupFormProps {
  onSubmit: (data: RestaurantData) => void;
  onBack: () => void;
}

const cuisineTypes = [
  "Congolaise",
  "Française",
  "Italienne",
  "Chinoise",
  "Fast-food",
  "Grillades",
  "Poisson",
  "Africaine",
  "Libanaise",
  "Autre",
];

export function RestaurantSignupForm({ onSubmit, onBack }: RestaurantSignupFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RestaurantData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    restaurantName: "",
    cuisineType: "",
    city: "",
    district: "",
    address: "",
    description: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RestaurantData, string>>>({});
  const [logoPreview, setLogoPreview] = useState<string>("");

  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof RestaurantData, string>> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = "Le nom est requis";
    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email invalide";
    if (!formData.phone.trim()) newErrors.phone = "Le téléphone est requis";
    if (formData.password.length < 6) newErrors.password = "Minimum 6 caractères";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof RestaurantData, string>> = {};
    
    if (!formData.restaurantName.trim()) newErrors.restaurantName = "Le nom du restaurant est requis";
    if (!formData.cuisineType) newErrors.cuisineType = "Le type de cuisine est requis";
    if (!formData.city) newErrors.city = "La ville est requise";
    if (!formData.district) newErrors.district = "Le quartier est requis";
    if (!formData.address.trim()) newErrors.address = "L'adresse est requise";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      onSubmit(formData);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredDistricts = formData.city 
    ? congoDistricts.filter(d => d.city === formData.city)
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h2 className="text-2xl md:text-3xl font-bold">Inscription Restaurant</h2>
        <Progress value={step * 50} className="h-2" />
        <p className="text-sm text-muted-foreground">Étape {step} sur 2</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Informations du gérant</h3>
              <p className="text-sm text-muted-foreground">
                Ces informations seront utilisées pour vous connecter et gérer votre restaurant.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet du gérant *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Jean Dupont"
              />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="restaurant@example.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+242 06 123 45 67"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 caractères"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Retapez votre mot de passe"
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button type="button" onClick={handleNext} className="w-full">
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Informations du restaurant</h3>
              <p className="text-sm text-muted-foreground">
                Ces informations seront visibles par les clients sur la plateforme.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nom du restaurant *</Label>
              <Input
                id="restaurantName"
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                placeholder="Le Bon Goût"
              />
              {errors.restaurantName && <p className="text-sm text-destructive">{errors.restaurantName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisineType">Type de cuisine *</Label>
              <Select 
                value={formData.cuisineType} 
                onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de cuisine" />
                </SelectTrigger>
                <SelectContent>
                  {cuisineTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cuisineType && <p className="text-sm text-destructive">{errors.cuisineType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Select 
                value={formData.city} 
                onValueChange={(value) => setFormData({ ...formData, city: value, district: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la ville" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">Quartier *</Label>
              <Select 
                value={formData.district} 
                onValueChange={(value) => setFormData({ ...formData, district: value })}
                disabled={!formData.city}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le quartier" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDistricts.map(district => (
                    <SelectItem key={district.name} value={district.name}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.district && <p className="text-sm text-destructive">{errors.district}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Avenue, rue, numéro..."
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre restaurant en quelques mots..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo du restaurant</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo preview" className="w-20 h-20 rounded-lg object-cover" />
                )}
                <Label htmlFor="logo" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Choisir une image</span>
                  </div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button type="submit" className="flex-1">
                Créer mon restaurant
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
