import { useState, useEffect } from "react";
import { MapPin, Navigation, Check, X, Loader2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

type Step = 'gps_loading' | 'gps_success' | 'gps_error' | 'manual_entry';

interface AddressCaptureModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
}

export const AddressCaptureModal = ({ isOpen: propIsOpen, onClose: propOnClose, onConfirm }: AddressCaptureModalProps = {}) => {
  const { 
    district, 
    city, 
    address,
    addressComplement,
    isModalOpen: contextIsOpen, 
    setDistrict,
    setFullAddress,
    setCoordinates,
    closeModal: contextCloseModal, 
  } = useLocation();

  const isOpen = propIsOpen ?? contextIsOpen;
  const closeModal = propOnClose ?? contextCloseModal;
  
  const [step, setStep] = useState<Step>('gps_loading');
  const [gpsProgress, setGpsProgress] = useState(0);
  const [detectedAddress, setDetectedAddress] = useState("");
  
  // Form fields for manual entry
  const [manualAddress, setManualAddress] = useState(address || "");
  const [manualQuartier, setManualQuartier] = useState(district || "");
  const [manualComplement, setManualComplement] = useState(addressComplement || "");
  const [hasGpsCoords, setHasGpsCoords] = useState(false);
  const [coords, setCoords] = useState<{latitude: number; longitude: number} | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setManualAddress(address || "");
      setManualQuartier(district || "");
      setManualComplement(addressComplement || "");
      setStep('gps_loading');
      setGpsProgress(0);
      handleRequestGPS();
    }
  }, [isOpen]);

  // Simulate GPS progress
  useEffect(() => {
    if (step === 'gps_loading') {
      const interval = setInterval(() => {
        setGpsProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleRequestGPS = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });
      setHasGpsCoords(true);
      setGpsProgress(100);
      setDetectedAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      setManualAddress(`GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      
      setTimeout(() => {
        setStep('gps_success');
        toast.success("Position GPS détectée !");
      }, 500);
      
    } catch (error) {
      console.error("GPS error:", error);
      setStep('gps_error');
      setHasGpsCoords(false);
    }
  };

  const handleSkipToManual = () => {
    setStep('manual_entry');
  };

  const handleContinueToForm = () => {
    setStep('manual_entry');
  };

  const handleRetryGPS = () => {
    setStep('gps_loading');
    setGpsProgress(0);
    handleRequestGPS();
  };

  // Save neighborhood to database for future exploitation
  const saveNeighborhood = async (name: string) => {
    if (!name.trim()) return;
    
    try {
      // Check if neighborhood exists
      const { data: existing } = await supabase
        .from('neighborhoods')
        .select('id, usage_count')
        .eq('name', name.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        // Increment usage count
        await supabase
          .from('neighborhoods')
          .update({ usage_count: (existing.usage_count || 1) + 1, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Insert new neighborhood
        await supabase
          .from('neighborhoods')
          .insert({ name: name.trim().toLowerCase() });
      }
    } catch (error) {
      console.error("Error saving neighborhood:", error);
    }
  };

  const handleConfirm = async () => {
    if (!manualQuartier.trim()) {
      toast.error("Veuillez saisir votre quartier");
      return;
    }
    if (!manualAddress.trim()) {
      toast.error("Veuillez saisir une adresse");
      return;
    }

    // Save neighborhood to DB for future data exploitation
    await saveNeighborhood(manualQuartier);

    // Update location context - keep the city from Welcome page
    setDistrict(manualQuartier.trim());
    setFullAddress(manualAddress.trim(), manualComplement.trim());
    setFullAddress(manualAddress.trim(), manualComplement.trim());
    if (coords) {
      setCoordinates(coords);
    }

    closeModal();
    onConfirm?.();
    toast.success("Adresse enregistrée !");
  };

  const handleClose = () => {
    // Only allow closing if we have an address set
    if (district && address) {
      closeModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-background rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        {(district && address) && (
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-5 text-center">
          <div className="mx-auto w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 shadow-lg">
            {step === 'gps_loading' ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : step === 'gps_success' ? (
              <Check className="w-6 h-6 text-white" />
            ) : step === 'manual_entry' ? (
              <Edit2 className="w-6 h-6 text-white" />
            ) : (
              <MapPin className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-lg font-semibold text-white">
            {step === 'gps_loading' && "Localisation en cours..."}
            {step === 'gps_success' && "Position trouvée ✅"}
            {step === 'gps_error' && "GPS indisponible"}
            {step === 'manual_entry' && "Votre adresse de livraison"}
          </h2>
          <p className="text-white/80 mt-1 text-sm">
            {step === 'gps_loading' && "Patientez quelques secondes"}
            {step === 'gps_success' && "Coordonnées GPS enregistrées"}
            {step === 'gps_error' && "Saisissez votre adresse manuellement"}
            {step === 'manual_entry' && "Complétez les informations"}
          </p>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Step: GPS Loading */}
          {step === 'gps_loading' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{Math.round(gpsProgress)}%</p>
              </div>
              <Progress value={gpsProgress} className="h-2 rounded-full" />
              <p className="text-center text-sm text-muted-foreground">
                Assurez-vous que le GPS est activé
              </p>
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={handleSkipToManual}
              >
                Saisir l'adresse manuellement →
              </Button>
            </div>
          )}

          {/* Step: GPS Success */}
          {step === 'gps_success' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-400 block">Position GPS enregistrée</span>
                    <p className="text-xs text-muted-foreground mt-1">{detectedAddress}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                Complétez maintenant votre adresse et votre quartier
              </p>

              <Button
                className="w-full h-12 rounded-full font-medium"
                onClick={handleContinueToForm}
              >
                Continuer →
              </Button>
            </div>
          )}

          {/* Step: GPS Error */}
          {step === 'gps_error' && (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                <p className="text-sm text-center text-destructive">
                  Impossible d'obtenir votre position GPS. Vous pouvez réessayer ou saisir votre adresse manuellement.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-11 rounded-full"
                  onClick={handleRetryGPS}
                >
                  🔄 Réessayer
                </Button>
                <Button
                  className="h-11 rounded-full"
                  onClick={handleSkipToManual}
                >
                  Saisir →
                </Button>
              </div>
            </div>
          )}

          {/* Step: Manual Entry Form */}
          {step === 'manual_entry' && (
            <div className="space-y-4">
              {hasGpsCoords && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800 mb-4">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <Navigation className="w-4 h-4" />
                    <span>GPS activé</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Adresse complète *
                </Label>
                <Textarea
                  id="address"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Ex: 123 Avenue de la Paix, près de l'école Saint-Michel..."
                  className="min-h-[80px] rounded-xl resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quartier" className="text-sm font-medium">
                  Quartier *
                </Label>
                <Input
                  id="quartier"
                  value={manualQuartier}
                  onChange={(e) => setManualQuartier(e.target.value)}
                  placeholder="Ex: Bacongo, Poto-Poto, Moungali..."
                  className="h-12 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Le quartier est obligatoire pour la livraison
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement" className="text-sm font-medium">
                  Complément (optionnel)
                </Label>
                <Input
                  id="complement"
                  value={manualComplement}
                  onChange={(e) => setManualComplement(e.target.value)}
                  placeholder="Bâtiment, étage, code d'entrée..."
                  className="h-12 rounded-xl"
                />
              </div>

              <Button
                className="w-full h-12 rounded-full font-medium"
                onClick={handleConfirm}
                disabled={!manualQuartier.trim() || !manualAddress.trim()}
              >
                Confirmer l'adresse ✓
              </Button>

              {!hasGpsCoords && (
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={handleRetryGPS}
                >
                  🔄 Réessayer le GPS
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};