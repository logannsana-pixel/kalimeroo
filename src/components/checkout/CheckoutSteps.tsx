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
  Package,
  Check,
  Navigation
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";

interface CheckoutData {
  phone: string;
  address: string;
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
  const { district, city, address, addressComplement, coordinates, hasGPS, openModal } = useLocation();
  const calculatedTotal = propTotal ?? (subtotal + deliveryFee - discount);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  
  // Build full address from location context
  const fullAddress = [address, addressComplement].filter(Boolean).join(" - ");
  const hasAddress = !!(address || (coordinates && (district || city)));
  
  const [formData, setFormData] = useState<CheckoutData>({
    phone: "",
    address: fullAddress,
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
    
    if (formData.deliveryMode === "delivery" && !hasAddress) {
      newErrors.address = "L'adresse de livraison est requise";
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
        address: fullAddress,
        phone: formData.orderForSomeoneElse ? formData.recipientPhone! : formData.phone,
      });
    } finally {
      setLoading(false);
    }
  };

  // Voice recording (audio note, not speech-to-text)
  const toggleRecording = async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        toast.success("Note vocale enregistrée !");
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const effectiveDeliveryFee = formData.deliveryMode === "pickup" ? 0 : deliveryFee;
  const effectiveTotal = subtotal + effectiveDeliveryFee - discount;

  return (
    <div className="space-y-4">
      {/* SECTION A: Adresse de livraison - Pre-filled from GPS/Manual */}
      {formData.deliveryMode === "delivery" && (
        <Card className="rounded-3xl border-none shadow-soft overflow-hidden">
          <div className="bg-primary/5 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {hasGPS ? (
                    <Navigation className="w-5 h-5 text-primary" />
                  ) : (
                    <MapPin className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold flex items-center gap-2">
                    Adresse de livraison
                    {hasAddress && <Check className="w-4 h-4 text-green-500" />}
                  </h3>
                  {hasAddress ? (
                    <p className="text-sm text-muted-foreground truncate">
                      {hasGPS && "📍 GPS • "}{city || district} {address && `• ${address.substring(0, 30)}...`}
                    </p>
                  ) : (
                    <p className="text-sm text-destructive">Aucune adresse définie</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={openModal} className="rounded-full shrink-0">
                <Edit2 className="w-4 h-4 mr-1" />
                {hasAddress ? "Modifier" : "Définir"}
              </Button>
            </div>
            
            {/* Show full address details if available */}
            {hasAddress && fullAddress && (
              <div className="mt-3 p-3 bg-muted/50 rounded-xl text-sm">
                <p className="text-foreground">{fullAddress}</p>
                {coordinates && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Coords: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            )}
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
                      placeholder="06 XXX XX XX"
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
                    placeholder="06 XXX XX XX"
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

      {/* SECTION C: Notes / Instructions avec audio */}
      <Card className="rounded-3xl border-none shadow-soft">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Instructions (optionnel)</h3>
          <p className="text-xs text-muted-foreground">
            Pour le livreur ou le restaurant • Texte ou note vocale
          </p>
          
          <div className="relative">
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Sonner 2 fois, sans sauce, allergie aux arachides..."
              rows={3}
              className="pr-14 rounded-xl resize-none"
            />
            <Button
              type="button"
              variant={isRecording ? "destructive" : "secondary"}
              size="icon"
              className="absolute right-2 bottom-2 rounded-full h-10 w-10"
              onClick={toggleRecording}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5 animate-pulse" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {isRecording && (
            <p className="text-sm text-destructive animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Enregistrement... Appuyez pour arrêter
            </p>
          )}
          {audioBlob && !isRecording && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Note vocale enregistrée
            </p>
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
            disabled={loading || (formData.deliveryMode === "delivery" && !hasAddress)}
            className="w-full h-14 rounded-2xl text-lg font-semibold btn-playful"
          >
            {loading ? (
              <span className="animate-pulse">Traitement...</span>
            ) : (
              `Payer ${effectiveTotal.toFixed(0)} FCFA`
            )}
          </Button>
          
          {formData.deliveryMode === "delivery" && !hasAddress && (
            <p className="text-center text-sm text-destructive">
              Définissez une adresse de livraison pour continuer
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
