import { useState, useEffect } from "react";
import { MapPin, Navigation, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type Step = 'loading' | 'success' | 'error';

export const LocationModal = () => {
  const { 
    district, 
    city, 
    isModalOpen, 
    setLocation, 
    setFullAddress,
    setCoordinates,
    closeModal, 
  } = useLocation();
  
  const [step, setStep] = useState<Step>('loading');
  const [gpsProgress, setGpsProgress] = useState(0);
  const [detectedCity, setDetectedCity] = useState("");
  const [detectedAddress, setDetectedAddress] = useState("");

  // Start GPS detection automatically when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setStep('loading');
      setGpsProgress(0);
      handleRequestGPS();
    }
  }, [isModalOpen]);

  // Simulate GPS progress
  useEffect(() => {
    if (step === 'loading') {
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
      setCoordinates({ latitude, longitude });
      setGpsProgress(100);
      
      // Detect city based on coordinates (simplified for Congo)
      const city = latitude > -4.5 ? "Brazzaville" : "Pointe-Noire";
      setDetectedCity(city);
      setDetectedAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      
      // Small delay for UX
      setTimeout(() => {
        setStep('success');
        toast.success("Position détectée !");
      }, 500);
      
    } catch (error) {
      console.error("GPS error:", error);
      setStep('error');
    }
  };

  const handleConfirmGPS = () => {
    setLocation("GPS", detectedCity);
    setFullAddress(detectedAddress, "");
    closeModal();
    toast.success("Adresse enregistrée !");
  };

  const handleRetry = () => {
    setStep('loading');
    setGpsProgress(0);
    handleRequestGPS();
  };

  const handleClose = () => {
    if (district && city) {
      closeModal();
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal - Centered */}
      <div className="relative w-full max-w-sm bg-background rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        {(district && city) && (
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 shadow-lg">
            {step === 'loading' ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : step === 'success' ? (
              <Check className="w-8 h-8 text-white" />
            ) : (
              <MapPin className="w-8 h-8 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white">
            {step === 'loading' && "Localisation en cours..."}
            {step === 'success' && "Position trouvée ! ✅"}
            {step === 'error' && "Impossible de localiser"}
          </h2>
          <p className="text-white/80 mt-2 text-sm">
            {step === 'loading' && "Veuillez patienter quelques secondes"}
            {step === 'success' && `📍 ${detectedCity}`}
            {step === 'error' && "Vérifiez que le GPS est activé"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step: GPS Loading */}
          {step === 'loading' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{Math.round(gpsProgress)}%</p>
              </div>
              
              <Progress value={gpsProgress} className="h-3 rounded-full" />
              
              <p className="text-center text-sm text-muted-foreground">
                Assurez-vous que le GPS est activé sur votre appareil
              </p>
            </div>
          )}

          {/* Step: GPS Success */}
          {step === 'success' && (
            <div className="space-y-5">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-green-700 dark:text-green-400 block">Position GPS enregistrée</span>
                    <p className="text-sm text-muted-foreground">
                      📍 {detectedCity}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-lg font-semibold"
                onClick={handleConfirmGPS}
              >
                Confirmer ✓
              </Button>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="space-y-5">
              <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20">
                <p className="text-sm text-center text-destructive">
                  Impossible d'obtenir votre position. Vérifiez que le GPS est activé et réessayez.
                </p>
              </div>

              <Button
                className="w-full h-12 rounded-full"
                onClick={handleRetry}
              >
                Réessayer 🔄
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
