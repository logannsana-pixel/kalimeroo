import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { congoDistricts, cities } from "@/data/congoLocations";
import { ChevronLeft, ChevronRight, User, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PhoneOTPInput } from "./PhoneOTPInput";

interface CustomerData {
  fullName: string;
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
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [formData, setFormData] = useState<CustomerData>({
    fullName: "",
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
    if (!phoneVerified) newErrors.phone = "Veuillez vérifier votre numéro";
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
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) onSubmit(formData);
  };

  const filteredDistricts = formData.city ? congoDistricts.filter(d => d.city === formData.city) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          {step === 1 ? <><User className="w-4 h-4" /> Vos informations</> : <><MapPin className="w-4 h-4" /> Votre adresse</>}
        </span>
        <span>Étape {step}/2</span>
      </div>
      <Progress value={step * 50} className="h-2" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
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

            <PhoneOTPInput
              phone={formData.phone}
              onPhoneChange={(phone) => setFormData({ ...formData, phone })}
              onVerified={() => setPhoneVerified(true)}
            />
            {errors.phone && !phoneVerified && <p className="text-sm text-destructive">{errors.phone}</p>}

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
              type="button" 
              onClick={handleNext} 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600"
              disabled={!phoneVerified}
            >
              Suivant <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ville *</Label>
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
              <Label>Complément d'adresse (optionnel)</Label>
              <Input 
                value={formData.addressComplement} 
                onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })} 
                placeholder="Rue, numéro, bâtiment..." 
                className="h-12 rounded-xl" 
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">
                <ChevronLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
                Créer mon compte 🎉
              </Button>
            </div>
          </div>
        )}
      </form>
      <Button variant="ghost" onClick={onBack} className="w-full text-muted-foreground">
        <ChevronLeft className="w-4 h-4 mr-2" /> Retour à la connexion
      </Button>
    </div>
  );
}
