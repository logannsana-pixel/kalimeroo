import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bike } from "lucide-react";
import { DistrictSelector } from "@/components/DistrictSelector";

interface DeliverySignupFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export function DeliverySignupForm({ onSubmit, onBack }: DeliverySignupFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    city: "Brazzaville",
    district: "",
    vehicleType: "moto",
    licenseNumber: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">Devenir Livreur</h2>
          <p className="text-sm text-muted-foreground">Rejoignez notre équipe de livraison</p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Bike className="h-8 w-8 text-primary" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Votre nom complet"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="votre@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+242 06 XXX XX XX"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Quartier de résidence *</Label>
          <DistrictSelector
            selectedDistrict={formData.district}
            onSelect={(district, city) => setFormData({ ...formData, district, city })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleType">Type de véhicule *</Label>
          <select
            id="vehicleType"
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            <option value="moto">Moto</option>
            <option value="velo">Vélo</option>
            <option value="voiture">Voiture</option>
            <option value="pied">À pied</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Numéro de permis (optionnel)</Label>
          <Input
            id="licenseNumber"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            placeholder="Numéro de permis de conduire"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            required
          />
          {formData.password !== formData.confirmPassword && formData.confirmPassword && (
            <p className="text-sm text-destructive">Les mots de passe ne correspondent pas</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={formData.password !== formData.confirmPassword}
        >
          S'inscrire comme Livreur
        </Button>
      </form>
    </div>
  );
}
