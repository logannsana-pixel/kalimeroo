import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { congoDistricts, cities } from "@/data/congoLocations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CustomerData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  city: string;
  district: string;
  addressComplement: string;
}

interface CustomerSignupFormProps {
  onSubmit: (data: CustomerData) => void;
  onBack: () => void;
}

export function CustomerSignupForm({ onSubmit, onBack }: CustomerSignupFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CustomerData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    city: "",
    district: "",
    addressComplement: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});

  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof CustomerData, string>> = {};
    
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
    const newErrors: Partial<Record<keyof CustomerData, string>> = {};
    
    if (!formData.city) newErrors.city = "La ville est requise";
    if (!formData.district) newErrors.district = "Le quartier est requis";

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
        <h2 className="text-2xl md:text-3xl font-bold">Inscription Client</h2>
        <Progress value={step * 50} className="h-2" />
        <p className="text-sm text-muted-foreground">Étape {step} sur 2</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Jean Dupont"
              />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean@example.com"
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
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Select 
                value={formData.city} 
                onValueChange={(value) => setFormData({ ...formData, city: value, district: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre ville" />
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
                  <SelectValue placeholder="Sélectionnez votre quartier" />
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
              <Label htmlFor="addressComplement">Complément d'adresse</Label>
              <Input
                id="addressComplement"
                value={formData.addressComplement}
                onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })}
                placeholder="Rue, numéro, bâtiment..."
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button type="submit" className="flex-1">
                Créer mon compte
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
