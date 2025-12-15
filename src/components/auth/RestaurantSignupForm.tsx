import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { congoDistricts, cities } from "@/data/congoLocations";
import { ChevronLeft, ChevronRight, Upload, Store, User, MapPin, Image, Mail } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { PhoneInput, isValidCongoPhone } from "./PhoneInput";
import { AuthMethodToggle } from "./AuthMethodToggle";

interface RestaurantData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
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
  "Congolaise", "Française", "Italienne", "Chinoise", "Fast-food",
  "Grillades", "Poisson", "Africaine", "Libanaise", "Japonaise",
  "Burger", "Pizza", "Mexicaine", "Indienne", "Végétarien", "Autre",
];

export function RestaurantSignupForm({ onSubmit, onBack }: RestaurantSignupFormProps) {
  const [step, setStep] = useState(1);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");
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
    
    if (authMethod === "email") {
      if (!formData.email.trim()) newErrors.email = "L'email est requis";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email invalide";
      }
    } else {
      if (!formData.phone.trim()) newErrors.phone = "Le numéro est requis";
      else if (!isValidCongoPhone(formData.phone)) {
        newErrors.phone = "Numéro congolais invalide";
      }
    }
    
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
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) onSubmit(formData);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const filteredDistricts = formData.city ? congoDistricts.filter(d => d.city === formData.city) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            {step === 1 ? <><User className="w-4 h-4" /> Informations du gérant</> : <><Store className="w-4 h-4" /> Informations du restaurant</>}
          </span>
          <span>Étape {step}/2</span>
        </div>
        <Progress value={step * 50} className="h-2" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <Card className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-300">Vos informations</h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400/80">Ces informations seront utilisées pour vous connecter.</p>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet du gérant *</Label>
              <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Jean-Claude Makaya" className="h-12 rounded-xl" />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-3">
              <Label>Méthode de connexion *</Label>
              <AuthMethodToggle method={authMethod} onMethodChange={setAuthMethod} />
              
              {authMethod === "email" ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="votre@email.com"
                      className="h-12 rounded-xl pl-12"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
              ) : (
                <PhoneInput
                  phone={formData.phone}
                  onPhoneChange={(phone) => setFormData({ ...formData, phone })}
                  error={errors.phone}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Minimum 6 caractères" className="h-12 rounded-xl" />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Retapez votre mot de passe" className="h-12 rounded-xl" />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button type="button" onClick={handleNext} className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600">
              Suivant <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card className="p-4 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300">Votre restaurant</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400/80">Ces informations seront visibles par les clients.</p>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nom du restaurant *</Label>
              <Input id="restaurantName" value={formData.restaurantName} onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })} placeholder="Le Bon Goût" className="h-12 rounded-xl" />
              {errors.restaurantName && <p className="text-sm text-destructive">{errors.restaurantName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisineType">Type de cuisine *</Label>
              <Select value={formData.cuisineType} onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Sélectionnez le type de cuisine" /></SelectTrigger>
                <SelectContent>{cuisineTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
              {errors.cuisineType && <p className="text-sm text-destructive">{errors.cuisineType}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Ville *</Label>
                <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value, district: "" })}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Ville" /></SelectTrigger>
                  <SelectContent>{cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quartier *</Label>
                <Select value={formData.district} onValueChange={(value) => setFormData({ ...formData, district: value })} disabled={!formData.city}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Quartier" /></SelectTrigger>
                  <SelectContent>{filteredDistricts.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète *</Label>
              <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Avenue, rue, numéro, repère..." className="h-12 rounded-xl" />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Décrivez votre restaurant en quelques mots..." rows={2} className="rounded-xl resize-none" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Image className="w-4 h-4" /> Logo du restaurant (optionnel)</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-xl object-cover border-2 border-primary/20" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                    <Store className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
                <Label htmlFor="logo" className="cursor-pointer flex-1">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl hover:bg-accent hover:border-primary/50 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">{logoPreview ? "Changer l'image" : "Ajouter une image"}</span>
                  </div>
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600">
                Créer mon restaurant 🚀
              </Button>
            </div>
          </div>
        )}
      </form>

      <Button variant="ghost" onClick={onBack} className="w-full text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4 mr-2" /> Retour à la connexion
      </Button>
    </div>
  );
}
