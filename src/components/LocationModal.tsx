import { useState, useEffect } from "react";
import { MapPin, Navigation, Keyboard, Mic, MicOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type Step = 'choice' | 'gps-loading' | 'gps' | 'manual';

export const LocationModal = () => {
  const { 
    district, 
    city, 
    address,
    coordinates,
    isModalOpen, 
    setLocation, 
    setFullAddress,
    setCoordinates,
    closeModal, 
    openModal 
  } = useLocation();
  
  const [step, setStep] = useState<Step>('choice');
  const [gpsProgress, setGpsProgress] = useState(0);
  const [detectedCity, setDetectedCity] = useState("");
  const [detectedAddress, setDetectedAddress] = useState("");
  const [quartierInstructions, setQuartierInstructions] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Simulate GPS progress
  useEffect(() => {
    if (step === 'gps-loading') {
      setGpsProgress(0);
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
    setStep('gps-loading');
    
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
        setStep('gps');
        toast.success("Position détectée !");
      }, 500);
      
    } catch (error) {
      console.error("GPS error:", error);
      toast.error("Impossible d'obtenir la position. Veuillez réessayer.");
      setStep('choice');
    }
  };

  const handleConfirmGPS = () => {
    setLocation("GPS", detectedCity);
    setFullAddress(detectedAddress, quartierInstructions);
    closeModal();
    resetState();
    toast.success("Adresse enregistrée !");
  };

  const handleConfirmManual = () => {
    if (quartierInstructions.trim()) {
      setLocation("Manuel", "Congo");
      setFullAddress(quartierInstructions);
      closeModal();
      resetState();
      toast.success("Adresse enregistrée !");
    } else {
      toast.error("Décrivez votre quartier/emplacement");
    }
  };

  const resetState = () => {
    setStep('choice');
    setGpsProgress(0);
    setDetectedCity("");
    setDetectedAddress("");
    setQuartierInstructions("");
    setAudioBlob(null);
  };

  const handleClose = () => {
    if (district && city) {
      closeModal();
      resetState();
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

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-background rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
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
        <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-center shrink-0">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {step === 'choice' && "Où vous livrer ? 📍"}
            {step === 'gps-loading' && "Localisation en cours..."}
            {step === 'gps' && "Position trouvée ! ✅"}
            {step === 'manual' && "Décrivez votre emplacement"}
          </h2>
          <p className="text-white/80 mt-2 text-sm sm:text-base">
            {step === 'choice' && "Choisissez comment définir votre adresse"}
            {step === 'gps-loading' && "Veuillez patienter quelques secondes"}
            {step === 'gps' && "Ajoutez des instructions pour le livreur"}
            {step === 'manual' && "Quartier, repère, instructions..."}
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* Step: Choice */}
          {step === 'choice' && (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-auto py-5 rounded-2xl flex items-center gap-4 text-left hover:bg-primary/5 hover:border-primary transition-all border-2"
                onClick={handleRequestGPS}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                  <Navigation className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base">📍 Utiliser ma position GPS</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Détection automatique rapide
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-5 rounded-2xl flex items-center gap-4 text-left hover:bg-muted/50 transition-all border-2"
                onClick={() => setStep('manual')}
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                  <Keyboard className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base">✍️ Décrire manuellement</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Quartier, repère, instructions
                  </p>
                </div>
              </Button>
            </div>
          )}

          {/* Step: GPS Loading */}
          {step === 'gps-loading' && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Navigation className="w-10 h-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <p className="text-lg font-semibold mb-2">Recherche GPS...</p>
                <p className="text-3xl font-bold text-primary">{Math.round(gpsProgress)}%</p>
              </div>
              
              <Progress value={gpsProgress} className="h-3 rounded-full" />
              
              <p className="text-center text-sm text-muted-foreground">
                Assurez-vous que le GPS est activé sur votre appareil
              </p>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep('choice')}
              >
                Annuler
              </Button>
            </div>
          )}

          {/* Step: GPS Confirmation */}
          {step === 'gps' && (
            <div className="space-y-5">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-green-700 dark:text-green-400">Position GPS enregistrée</span>
                </div>
                <p className="text-sm text-muted-foreground ml-11">
                  📍 {detectedCity} • Coords: {detectedAddress}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">
                  📝 Quartier & instructions pour le livreur
                </label>
                <div className="relative">
                  <Textarea
                    placeholder="Ex: Bacongo, près de l'arrêt Total, maison bleue 2ème étage..."
                    value={quartierInstructions}
                    onChange={(e) => setQuartierInstructions(e.target.value)}
                    className="min-h-[100px] rounded-2xl resize-none pr-14 text-base"
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
                  <p className="text-sm text-destructive mt-2 animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    Enregistrement en cours... Appuyez pour arrêter
                  </p>
                )}
                {audioBlob && !isRecording && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Note vocale enregistrée
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-full"
                  onClick={() => setStep('choice')}
                >
                  Retour
                </Button>
                <Button
                  className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-lg font-semibold"
                  onClick={handleConfirmGPS}
                >
                  Confirmer ✓
                </Button>
              </div>
            </div>
          )}

          {/* Step: Manual Entry */}
          {step === 'manual' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-3 block">
                  📍 Décrivez votre emplacement complet
                </label>
                <div className="relative">
                  <Textarea
                    placeholder="Ex: Quartier Bacongo, avenue de la paix, près de l'école primaire, maison avec portail vert..."
                    value={quartierInstructions}
                    onChange={(e) => setQuartierInstructions(e.target.value)}
                    className="min-h-[120px] rounded-2xl resize-none pr-14 text-base"
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
                  <p className="text-sm text-destructive mt-2 animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    Enregistrement en cours...
                  </p>
                )}
                {audioBlob && !isRecording && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Note vocale enregistrée
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Soyez le plus précis possible pour faciliter la livraison
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-full"
                  onClick={() => setStep('choice')}
                >
                  Retour
                </Button>
                <Button
                  className="flex-1 h-12 rounded-full bg-primary hover:bg-primary/90 text-lg font-semibold"
                  onClick={handleConfirmManual}
                  disabled={!quartierInstructions.trim()}
                >
                  C'est parti ! 🚀
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Safe area for mobile */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </div>
    </div>
  );
};
