import { useState } from "react";
import { passwordStrength } from "@/lib/auth-errors";
import { PasswordStrengthHint } from "./PasswordStrengthHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, User, MapPin, Mail } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PhoneInput, isValidCongoPhone } from "./PhoneInput";
import { AuthMethodToggle } from "./AuthMethodToggle";
import { NeighborhoodInput } from "@/components/NeighborhoodInput";

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
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");
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
    
    if (authMethod === "email") {
      if (!formData.email.trim()) newErrors.email = "L'email est requis";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email invalide";
      }
    } else {
      if (!formData.phone.trim()) newErrors.phone = "Le numéro est requis";
      else if (!isValidCongoPhone(formData.phone)) {
        newErrors.phone = "Numéro invalide (ex. 06 123 45 67 ou +33 6 12 34 56 78)";
      }
    }
    
    if (!passwordStrength(formData.password).ok) newErrors.password = passwordStrength(formData.password).label || "Mot de passe requis";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof CustomerData, string>> = {};
    if (!formData.district.trim()) newErrors.district = "Le quartier est requis";
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
              <Input 
                id="password" 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                placeholder="8 caractères, lettres et chiffres" 
                className="h-12 rounded-xl" 
              />
              <PasswordStrengthHint password={formData.password} />
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
            >
              Suivant <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <NeighborhoodInput
              value={formData.district}
              onChange={(value) => setFormData({ ...formData, district: value })}
              error={errors.district}
              label="Quartier"
              required
            />

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