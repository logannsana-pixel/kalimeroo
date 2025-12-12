import { useState } from "react";
import { MapPin, Navigation, Keyboard, Loader2, Mic, MicOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DistrictSelector } from "@/components/DistrictSelector";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";

type Step = 'choice' | 'gps' | 'manual';

export const LocationModal = () => {
  const { 
    district, 
    city, 
    isModalOpen, 
    setLocation, 
    setFullAddress,
    setCoordinates,
    closeModal, 
    openModal 
  } = useLocation();
  
  const [step, setStep] = useState<Step>('choice');
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [detectedCity, setDetectedCity] = useState("");
  const [detectedAddress, setDetectedAddress] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleRequestGPS = async () => {
    setLoadingGPS(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      setCoordinates({ latitude, longitude });
      
      // Detect city based on coordinates (simplified for Congo)
      // In a real app, you'd use a reverse geocoding API
      const city = latitude > -4.5 ? "Brazzaville" : "Pointe-Noire";
      setDetectedCity(city);
      setDetectedAddress(`Position GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      setStep('gps');
      
      toast.success("Position détectée !");
    } catch (error) {
      console.error("GPS error:", error);
      toast.error("Impossible d'obtenir la position. Veuillez entrer manuellement.");
      setStep('manual');
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleConfirmGPS = () => {
    if (selectedDistrict && selectedCity) {
      setLocation(selectedDistrict, selectedCity);
      setFullAddress(detectedAddress);
      closeModal();
      resetState();
    }
  };

  const handleConfirmManual = () => {
    if (selectedDistrict && selectedCity) {
      setLocation(selectedDistrict, selectedCity);
      setFullAddress(manualAddress, addressComplement);
      closeModal();
      resetState();
    }
  };

  const resetState = () => {
    setStep('choice');
    setDetectedCity("");
    setDetectedAddress("");
    setSelectedDistrict("");
    setSelectedCity("");
    setManualAddress("");
    setAddressComplement("");
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      openModal();
    } else {
      if (district && city) {
        closeModal();
        resetState();
      }
    }
  };

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("La reconnaissance vocale n'est pas supportée sur ce navigateur");
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
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setManualAddress(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Erreur de reconnaissance vocale");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-float p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-primary p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold text-primary-foreground">
            Où vous livrer ? 📍
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/80 mt-2">
            {step === 'choice' && "Choisissez comment définir votre adresse"}
            {step === 'gps' && "Confirmez votre position"}
            {step === 'manual' && "Entrez votre adresse de livraison"}
          </DialogDescription>
        </div>

        <div className="p-6">
          {/* Step: Choice */}
          {step === 'choice' && (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-auto py-4 rounded-2xl flex items-start gap-4 text-left hover:bg-primary/5 hover:border-primary"
                onClick={handleRequestGPS}
                disabled={loadingGPS}
              >
                {loadingGPS ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Navigation className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">Utiliser ma position</p>
                  <p className="text-sm text-muted-foreground">
                    Détection automatique de votre position GPS
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-4 rounded-2xl flex items-start gap-4 text-left hover:bg-primary/5 hover:border-primary"
                onClick={() => setStep('manual')}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Keyboard className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Entrer manuellement</p>
                  <p className="text-sm text-muted-foreground">
                    Saisissez votre quartier et adresse
                  </p>
                </div>
              </Button>
            </div>
          )}

          {/* Step: GPS Confirmation */}
          {step === 'gps' && (
            <div className="space-y-5">
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="font-medium">Position détectée</span>
                </div>
                <p className="text-sm text-muted-foreground">{detectedAddress}</p>
                <p className="text-sm font-medium mt-1">Ville: {detectedCity}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sélectionnez votre quartier
                </label>
                <DistrictSelector
                  onSelect={(district, city) => {
                    setSelectedDistrict(district);
                    setSelectedCity(city);
                  }}
                  selectedDistrict={selectedDistrict}
                  defaultCity={detectedCity}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => setStep('manual')}
                >
                  Modifier
                </Button>
                <Button
                  className="flex-1 rounded-full btn-playful"
                  onClick={handleConfirmGPS}
                  disabled={!selectedDistrict}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          )}

          {/* Step: Manual Entry */}
          {step === 'manual' && (
            <div className="space-y-5">
              <DistrictSelector
                onSelect={(district, city) => {
                  setSelectedDistrict(district);
                  setSelectedCity(city);
                }}
                selectedDistrict={selectedDistrict}
              />

              <div>
                <label className="text-sm font-medium mb-2 block">
                  📍 Adresse ou lieu (ex: arrêt Total, immeuble bleu…)
                </label>
                <div className="relative">
                  <Input
                    placeholder="Décrivez votre emplacement"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="pr-12 h-12 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
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
                  <p className="text-xs text-primary mt-1 animate-pulse">
                    🎤 Parlez maintenant...
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Précision optionnelle (facultatif)
                </label>
                <Textarea
                  placeholder="Ex: Bâtiment C, 2ème étage, porte rouge..."
                  value={addressComplement}
                  onChange={(e) => setAddressComplement(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => setStep('choice')}
                >
                  Retour
                </Button>
                <Button
                  className="flex-1 rounded-full btn-playful"
                  onClick={handleConfirmManual}
                  disabled={!selectedDistrict}
                >
                  C'est parti !
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
