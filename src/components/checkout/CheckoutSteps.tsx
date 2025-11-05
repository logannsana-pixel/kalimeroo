import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Check, CreditCard, Banknote } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { congoDistricts, cities } from "@/data/congoLocations";

interface CheckoutData {
  phone: string;
  city: string;
  district: string;
  addressComplement: string;
  notes: string;
  paymentMethod: "mobile_money" | "cod";
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
}

interface CheckoutStepsProps {
  cartItems: any[];
  subtotal: number;
  deliveryFee: number;
  onSubmit: (data: CheckoutData) => Promise<void>;
}

export function CheckoutSteps({ cartItems, subtotal, deliveryFee, onSubmit }: CheckoutStepsProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CheckoutData>({
    phone: "",
    city: "",
    district: "",
    addressComplement: "",
    notes: "",
    paymentMethod: "cod",
    mobileMoneyProvider: "",
    mobileMoneyNumber: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutData, string>>>({});

  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof CheckoutData, string>> = {};
    
    if (!formData.city) newErrors.city = "La ville est requise";
    if (!formData.district) newErrors.district = "Le quartier est requis";
    if (!formData.phone.trim()) newErrors.phone = "Le téléphone est requis";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    if (formData.paymentMethod === "mobile_money") {
      const newErrors: Partial<Record<keyof CheckoutData, string>> = {};
      
      if (!formData.mobileMoneyProvider) newErrors.mobileMoneyProvider = "Sélectionnez un opérateur";
      if (!formData.mobileMoneyNumber?.trim()) newErrors.mobileMoneyNumber = "Le numéro est requis";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const filteredDistricts = formData.city 
    ? congoDistricts.filter(d => d.city === formData.city)
    : [];

  const total = subtotal + deliveryFee;
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Checkout Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            Étape {step} sur {totalSteps}
          </p>
        </div>

        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Adresse de livraison</h3>
                <p className="text-sm text-muted-foreground">
                  Où souhaitez-vous recevoir votre commande ?
                </p>
              </div>

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
                <Textarea
                  id="addressComplement"
                  value={formData.addressComplement}
                  onChange={(e) => setFormData({ ...formData, addressComplement: e.target.value })}
                  placeholder="Rue, numéro, point de repère..."
                  rows={3}
                />
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
                <Label htmlFor="notes">Instructions spéciales (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instructions pour le livreur..."
                  rows={2}
                />
              </div>

              <Button type="button" onClick={handleNext} className="w-full">
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Mode de paiement</h3>
                <p className="text-sm text-muted-foreground">
                  Choisissez comment vous souhaitez payer
                </p>
              </div>

              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value: "mobile_money" | "cod") => setFormData({ ...formData, paymentMethod: value })}
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="cod" id="cod" className="mt-1" />
                  <Label htmlFor="cod" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="w-5 h-5" />
                      <span className="font-semibold">Paiement à la livraison</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Payez en espèces lors de la réception de votre commande
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="mobile_money" id="mobile_money" className="mt-1" />
                  <Label htmlFor="mobile_money" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-semibold">Mobile Money</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Orange Money, Airtel Money, etc.
                    </p>
                  </Label>
                </div>
              </RadioGroup>

              {formData.paymentMethod === "mobile_money" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Opérateur *</Label>
                    <Select 
                      value={formData.mobileMoneyProvider} 
                      onValueChange={(value) => setFormData({ ...formData, mobileMoneyProvider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre opérateur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orange">Orange Money</SelectItem>
                        <SelectItem value="airtel">Airtel Money</SelectItem>
                        <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.mobileMoneyProvider && <p className="text-sm text-destructive">{errors.mobileMoneyProvider}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Numéro Mobile Money *</Label>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      value={formData.mobileMoneyNumber}
                      onChange={(e) => setFormData({ ...formData, mobileMoneyNumber: e.target.value })}
                      placeholder="+242 06 123 45 67"
                    />
                    {errors.mobileMoneyNumber && <p className="text-sm text-destructive">{errors.mobileMoneyNumber}</p>}
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      💡 Vous recevrez une notification de paiement à valider sur votre téléphone
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button type="button" onClick={handleNext} className="flex-1">
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Récapitulatif</h3>
                <p className="text-sm text-muted-foreground">
                  Vérifiez votre commande avant de confirmer
                </p>
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold">Livraison</h4>
                <div className="text-sm space-y-1">
                  <p>{formData.city} - {formData.district}</p>
                  {formData.addressComplement && <p>{formData.addressComplement}</p>}
                  <p className="font-medium">{formData.phone}</p>
                  {formData.notes && (
                    <p className="text-muted-foreground italic">Note: {formData.notes}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold">Paiement</h4>
                <div className="flex items-center gap-2">
                  {formData.paymentMethod === "cod" ? (
                    <>
                      <Banknote className="w-5 h-5" />
                      <span>Paiement à la livraison</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Mobile Money ({formData.mobileMoneyProvider})</span>
                    </>
                  )}
                </div>
                {formData.paymentMethod === "mobile_money" && (
                  <p className="text-sm text-muted-foreground">{formData.mobileMoneyNumber}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    "Traitement..."
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirmer la commande
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold text-lg">Votre commande</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b">
                  <span className="flex-1">
                    {item.menu_items?.name || "Article"} x{item.quantity}
                  </span>
                  <span className="font-medium">
                    {(Number(item.menu_items?.price || 0) * item.quantity).toFixed(0)} FCFA
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Sous-total</span>
                <span>{subtotal.toFixed(0)} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Frais de livraison</span>
                <span>{deliveryFee.toFixed(0)} FCFA</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{total.toFixed(0)} FCFA</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
