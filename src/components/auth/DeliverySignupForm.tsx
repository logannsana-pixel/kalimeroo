import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Bike, Car, Mail, MapPin } from "lucide-react";
import { PhoneInput, isValidCongoPhone } from "./PhoneInput";
import { AuthMethodToggle } from "./AuthMethodToggle";
import { NeighborhoodInput } from "@/components/NeighborhoodInput";

interface DeliverySignupFormProps {
  onSubmit: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    district: string;
    city: string;
    vehicleType: string;
    licenseNumber?: string;
  }) => void;
  onBack: () => void;
}

export function DeliverySignupForm({ onSubmit, onBack }: DeliverySignupFormProps) {
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    district: "",
    city: "",
    vehicleType: "",
    licenseNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
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
    
    if (!formData.district.trim()) newErrors.district = "Le quartier est requis";
    if (!formData.vehicleType) newErrors.vehicleType = "Le type de véhicule est requis";
    if (formData.password.length < 6) newErrors.password = "Minimum 6 caractères";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">Devenir livreur</h2>
        <p className="text-sm text-muted-foreground">Gagnez de l'argent en livrant des repas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Jean-Claude Makaya"
            className="h-12 rounded-xl"
          />
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

        <NeighborhoodInput
          value={formData.district}
          onChange={(value) => setFormData({ ...formData, district: value })}
          error={errors.district}
          label="Quartier"
          required
        />

        <div className="space-y-2">
          <Label>Type de véhicule *</Label>
          <Select
            value={formData.vehicleType}
            onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Sélectionnez votre véhicule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="moto">
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4" />
                  Moto
                </div>
              </SelectItem>
              <SelectItem value="velo">
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4" />
                  Vélo
                </div>
              </SelectItem>
              <SelectItem value="voiture">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Voiture
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.vehicleType && <p className="text-sm text-destructive">{errors.vehicleType}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimum 6 caractères"
            className="h-12 rounded-xl"
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
            className="h-12 rounded-xl"
          />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600"
        >
          Devenir livreur 🚀
        </Button>
      </form>

      <Button variant="ghost" onClick={onBack} className="w-full text-muted-foreground">
        <ChevronLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    </div>
  );
}