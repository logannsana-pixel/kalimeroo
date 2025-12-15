import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Bike } from "lucide-react";
import { DistrictSelector } from "@/components/DistrictSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneOTPInput } from "./PhoneOTPInput";

interface DeliverySignupFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export function DeliverySignupForm({ onSubmit, onBack }: DeliverySignupFormProps) {
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
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
    if (!phoneVerified) return;
    if (formData.password !== formData.confirmPassword) return;
    onSubmit(formData);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nom complet *</Label>
          <Input 
            value={formData.fullName} 
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
            placeholder="Jean-Claude Makaya" 
            className="h-12 rounded-xl" 
            required 
          />
        </div>

        <PhoneOTPInput
          phone={formData.phone}
          onPhoneChange={(phone) => setFormData({ ...formData, phone })}
          onVerified={() => setPhoneVerified(true)}
        />

        <div className="space-y-2">
          <Label>Quartier de résidence *</Label>
          <DistrictSelector 
            selectedDistrict={formData.district} 
            onSelect={(district, city) => setFormData({ ...formData, district, city })} 
          />
        </div>

        <div className="space-y-2">
          <Label>Type de véhicule *</Label>
          <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="moto">🏍️ Moto</SelectItem>
              <SelectItem value="velo">🚲 Vélo</SelectItem>
              <SelectItem value="voiture">🚗 Voiture</SelectItem>
              <SelectItem value="pied">🚶 À pied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Mot de passe *</Label>
          <Input 
            type="password" 
            value={formData.password} 
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
            placeholder="Minimum 6 caractères" 
            className="h-12 rounded-xl" 
            required 
            minLength={6} 
          />
        </div>

        <div className="space-y-2">
          <Label>Confirmer le mot de passe *</Label>
          <Input 
            type="password" 
            value={formData.confirmPassword} 
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
            placeholder="Retapez le mot de passe" 
            className="h-12 rounded-xl" 
            required 
          />
          {formData.password !== formData.confirmPassword && formData.confirmPassword && (
            <p className="text-sm text-destructive">Les mots de passe ne correspondent pas</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600" 
          disabled={!phoneVerified || formData.password !== formData.confirmPassword}
        >
          S'inscrire comme Livreur 🚀
        </Button>
      </form>
      <Button variant="ghost" onClick={onBack} className="w-full text-muted-foreground">
        <ChevronLeft className="w-4 h-4 mr-2" /> Retour à la connexion
      </Button>
    </div>
  );
}
