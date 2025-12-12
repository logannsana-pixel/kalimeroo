import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  CreditCard, 
  Banknote, 
  Bike, 
  MapPin, 
  Mic, 
  MicOff,
  User,
  Phone,
  Edit2,
  Package
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";

interface CheckoutData {
  phone: string;
  city: string;
  district: string;
  addressComplement: string;
  notes: string;
  paymentMethod: "mobile_money" | "cod";
  mobileMoneyProvider?: string;
  mobileMoneyNumber?: string;
  deliveryMode: "delivery" | "pickup";
  orderForSomeoneElse: boolean;
  recipientName?: string;
  recipientPhone?: string;
}

interface CheckoutStepsProps {
  cartItems: any[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total?: number;
  onSubmit: (data: CheckoutData) => Promise<void>;
}

export function CheckoutSteps({ cartItems, subtotal, deliveryFee, discount = 0, total: propTotal, onSubmit }: CheckoutStepsProps) {
  const { district, city, address, addressComplement: savedComplement, openModal } = useLocation();
  const calculatedTotal = propTotal ?? (subtotal + deliveryFee - discount);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [formData, setFormData] = useState<CheckoutData>({
    phone: "",
    city: city || "",
    district: district || "",
    addressComplement: savedComplement || address || "",
    notes: "",
    paymentMethod: "cod",
    mobileMoneyProvider: "",
    mobileMoneyNumber: "",
    deliveryMode: "delivery",
    orderForSomeoneElse: false,
    recipientName: "",
    recipientPhone: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof CheckoutData, string>> = {};
    
    if (formData.deliveryMode === "delivery") {
      if (!formData.city && !city) newErrors.city = "La ville est requise";
      if (!formData.district && !district) newErrors.district = "Le quartier est requis";
    }
    
    if (formData.orderForSomeoneElse) {
      if (!formData.recipientName?.trim()) newErrors.recipientName = "Le nom du destinataire est requis";
      if (!formData.recipientPhone?.trim()) newErrors.recipientPhone = "Le téléphone du destinataire est requis";
    } else {
      if (!formData.phone.trim()) newErrors.phone = "Le téléphone est requis";
    }
    
    if (formData.paymentMethod === "mobile_money") {
      if (!formData.mobileMoneyProvider) newErrors.mobileMoneyProvider = "Sélectionnez un opérateur";
      if (!formData.mobileMoneyNumber?.trim()) newErrors.mobileMoneyNumber = "Le numéro est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        city: formData.city || city,
        district: formData.district || district,
        phone: formData.orderForSomeoneElse ? formData.recipientPhone! : formData.phone,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("La reconnaissance vocale n'est pas supportée");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({ ...prev, notes: transcript }));
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const effectiveDeliveryFee = formData.deliveryMode === "pickup" ? 0 : deliveryFee;
  const effectiveTotal = subtotal + effectiveDeliveryFee - discount;

  return (
    <div className="space-y-4">
      {/* SECTION A: Adresse de livraison */}
      {formData.deliveryMode === "delivery" && (
        <Card className="rounded-3xl border-none shadow-soft overflow-hidden">
          <div className="bg-primary/5 p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Adresse de livraison</h3>
                {(district || city) && (
                  <p className="text-sm text-muted-foreground">{district}, {city}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={openModal} className="rounded-full">
              <Edit2 className="w-4 h-4 mr-1" />
              Modifier
            </Button>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Order for someone else toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <Label htmlFor="orderForOther" className="text-sm cursor-pointer">
                Commander pour quelqu'un d'autre
              </Label>
              <Switch
                id="orderForOther"
                checked={formData.orderForSomeoneElse}
                onCheckedChange={(checked) => setFormData({ ...formData, orderForSomeoneElse: checked })}
              />
            </div>

            {formData.orderForSomeoneElse ? (
              <div className="space-y-3 p-4 border-2 border-dashed border-primary/30 rounded-xl">
                <p className="text-sm font-medium text-primary">Informations du destinataire</p>
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Nom du destinataire *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="recipientName"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      placeholder="Nom complet"
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                  {errors.recipientName && <p className="text-sm text-destructive">{errors.recipientName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">Téléphone du destinataire *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="recipientPhone"
                      type="tel"
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                      placeholder="+242 06 123 45 67"
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                  {errors.recipientPhone && <p className="text-sm text-destructive">{errors.recipientPhone}</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone">Votre téléphone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+242 06 123 45 67"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION B: Mode de livraison */}
      <Card className="rounded-3xl border-none shadow-soft">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Bike className="w-5 h-5 text-primary" />
            Mode de réception
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, deliveryMode: "delivery" })}
              className={`p-4 rounded-2xl border-2 transition-all ${
                formData.deliveryMode === "delivery" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Bike className={`w-6 h-6 mx-auto mb-2 ${
                formData.deliveryMode === "delivery" ? "text-primary" : "text-muted-foreground"
              }`} />
              <p className="font-medium text-sm">Livraison</p>
              <p className="text-xs text-muted-foreground">{deliveryFee.toFixed(0)} FCFA</p>
            </button>
            
            <button
              type="button"
              onClick={() => setFormData({ ...formData, deliveryMode: "pickup" })}
              className={`p-4 rounded-2xl border-2 transition-all ${
                formData.deliveryMode === "pickup" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Package className={`w-6 h-6 mx-auto mb-2 ${
                formData.deliveryMode === "pickup" ? "text-primary" : "text-muted-foreground"
              }`} />
              <p className="font-medium text-sm">À emporter</p>
              <p className="text-xs text-muted-foreground">Gratuit</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION C: Notes / Instructions */}
      <Card className="rounded-3xl border-none shadow-soft">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Instructions (optionnel)</h3>
          <p className="text-xs text-muted-foreground">
            Pour le livreur ou le restaurant
          </p>
          
          <div className="relative">
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Sonner 2 fois, sans sauce, allergie aux arachides..."
              rows={3}
              className="pr-12 rounded-xl resize-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 rounded-full"
              onClick={toggleRecording}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5 text-destructive animate-pulse" />
              ) : (
                <Mic className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </div>
          {isRecording && (
            <p className="text-xs text-primary animate-pulse">🎤 Parlez maintenant...</p>
          )}
        </CardContent>
      </Card>

      {/* SECTION D: Paiement */}
      <Card className="rounded-3xl border-none shadow-soft">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold">Mode de paiement</h3>
          
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={(value: "mobile_money" | "cod") => setFormData({ ...formData, paymentMethod: value })}
            className="space-y-3"
          >
            <label 
              htmlFor="cod" 
              className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                formData.paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <RadioGroupItem value="cod" id="cod" />
              <Banknote className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Paiement à la livraison</p>
                <p className="text-xs text-muted-foreground">Payez en espèces</p>
              </div>
            </label>

            <label 
              htmlFor="mobile_money" 
              className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                formData.paymentMethod === "mobile_money" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <RadioGroupItem value="mobile_money" id="mobile_money" />
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">Mobile Money</p>
                <p className="text-xs text-muted-foreground">Orange, Airtel, MTN</p>
              </div>
            </label>
          </RadioGroup>

          {formData.paymentMethod === "mobile_money" && (
            <div className="space-y-3 pt-3 border-t">
              <Select 
                value={formData.mobileMoneyProvider} 
                onValueChange={(value) => setFormData({ ...formData, mobileMoneyProvider: value })}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Choisir l'opérateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orange">🟠 Orange Money</SelectItem>
                  <SelectItem value="airtel">🔴 Airtel Money</SelectItem>
                  <SelectItem value="mtn">🟡 MTN MoMo</SelectItem>
                </SelectContent>
              </Select>
              {errors.mobileMoneyProvider && <p className="text-sm text-destructive">{errors.mobileMoneyProvider}</p>}

              <Input
                type="tel"
                value={formData.mobileMoneyNumber}
                onChange={(e) => setFormData({ ...formData, mobileMoneyNumber: e.target.value })}
                placeholder="Numéro Mobile Money"
                className="h-12 rounded-xl"
              />
              {errors.mobileMoneyNumber && <p className="text-sm text-destructive">{errors.mobileMoneyNumber}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION E: Récapitulatif & Payer */}
      <Card className="rounded-3xl border-none shadow-soft bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{subtotal.toFixed(0)} FCFA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formData.deliveryMode === "pickup" ? "À emporter" : "Livraison"}
            </span>
            <span>{effectiveDeliveryFee.toFixed(0)} FCFA</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Réduction</span>
              <span>-{discount.toFixed(0)} FCFA</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl pt-3 border-t">
            <span>Total</span>
            <span className="text-primary">{effectiveTotal.toFixed(0)} FCFA</span>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full h-14 rounded-2xl text-lg font-semibold btn-playful"
          >
            {loading ? (
              <span className="animate-pulse">Traitement...</span>
            ) : (
              `Payer ${effectiveTotal.toFixed(0)} FCFA`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
