import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";

const CONGO_CITIES = [
  "Brazzaville",
  "Pointe-Noire", 
  "Dolisie",
  "Nkayi",
  "Ouesso",
  "Impfondo",
  "Owando",
  "Sibiti",
  "Kinkala",
  "Madingou"
];

type Step = "loading" | "success" | "error" | "manual";

const Welcome = () => {
  const navigate = useNavigate();
  const { city, setCity, setCoordinates } = useLocation();
  const [step, setStep] = useState<Step>("loading");
  const [progress, setProgress] = useState(0);
  const [detectedCity, setDetectedCity] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [filteredCities, setFilteredCities] = useState(CONGO_CITIES);

  // If city is already set, redirect to home
  useEffect(() => {
    if (city) {
      navigate("/", { replace: true });
    }
  }, [city, navigate]);

  // Start GPS detection on mount
  useEffect(() => {
    requestGPS();
  }, []);

  // Progress animation
  useEffect(() => {
    if (step === "loading") {
      const interval = setInterval(() => {
        setProgress(prev => {
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

  // Filter cities for manual input
  useEffect(() => {
    if (manualCity.trim()) {
      const filtered = CONGO_CITIES.filter(c => 
        c.toLowerCase().includes(manualCity.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(CONGO_CITIES);
    }
  }, [manualCity]);

  const requestGPS = async () => {
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
      setProgress(100);

      // Detect city from coordinates
      const detected = detectCityFromCoords(latitude, longitude);
      setDetectedCity(detected);
      
      setTimeout(() => {
        setStep("success");
        toast.success("Position GPS détectée !");
      }, 500);

    } catch (error) {
      console.error("GPS error:", error);
      setStep("error");
    }
  };

  // Simple city detection based on coordinates
  const detectCityFromCoords = (lat: number, lng: number): string => {
    // Approximate city centers in Congo
    const cities = [
      { name: "Brazzaville", lat: -4.2634, lng: 15.2429 },
      { name: "Pointe-Noire", lat: -4.7781, lng: 11.8635 },
      { name: "Dolisie", lat: -4.2000, lng: 12.6667 },
      { name: "Nkayi", lat: -4.1667, lng: 13.2833 },
      { name: "Ouesso", lat: 1.6167, lng: 16.0500 },
      { name: "Impfondo", lat: 1.6167, lng: 18.0667 },
      { name: "Owando", lat: -0.4833, lng: 15.9000 },
      { name: "Sibiti", lat: -3.6833, lng: 13.3500 },
      { name: "Kinkala", lat: -4.3667, lng: 14.7667 },
      { name: "Madingou", lat: -4.1500, lng: 13.5500 },
    ];

    let closest = cities[0];
    let minDist = Infinity;

    for (const city of cities) {
      const dist = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2));
      if (dist < minDist) {
        minDist = dist;
        closest = city;
      }
    }

    // If too far from any city (> ~100km), default to Brazzaville
    return minDist < 1 ? closest.name : "Brazzaville";
  };

  const handleConfirmCity = () => {
    setCity(detectedCity);
    navigate("/", { replace: true });
  };

  const handleSelectCity = (selectedCity: string) => {
    setCity(selectedCity);
    navigate("/", { replace: true });
  };

  const handleManualEntry = () => {
    setStep("manual");
  };

  const handleRetryGPS = () => {
    setStep("loading");
    setProgress(0);
    requestGPS();
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col">
      {/* Header with Kalimero branding */}
      <header className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🍽️</span>
          </div>
          <span className="text-3xl font-bold text-white drop-shadow-md">Kalimero</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-6">
          {/* Hero text */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
              Bienvenue sur Kalimero
            </h1>
            <p className="text-white/90">
              Vos restaurants préférés, livrés chez vous
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5">
            {/* Loading state */}
            {step === "loading" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Localisation en cours...</h2>
                    <p className="text-sm text-muted-foreground">Détection de votre position</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Assurez-vous que le GPS est activé
                </p>

                <Button
                  variant="ghost"
                  className="w-full text-primary"
                  onClick={handleManualEntry}
                >
                  Saisir ma ville manuellement →
                </Button>
              </>
            )}

            {/* Success state */}
            {step === "success" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Position détectée ✓</h2>
                    <p className="text-sm text-muted-foreground">Coordonnées GPS enregistrées</p>
                  </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground mb-1">Ville détectée</p>
                  <p className="text-xl font-bold text-primary">{detectedCity}</p>
                </div>

                <Button className="w-full h-12 rounded-full bg-gradient-primary hover:opacity-90" onClick={handleConfirmCity}>
                  Continuer avec {detectedCity}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-primary"
                  onClick={handleManualEntry}
                >
                  Choisir une autre ville
                </Button>
              </>
            )}

            {/* Error state */}
            {step === "error" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">GPS indisponible</h2>
                    <p className="text-sm text-muted-foreground">Choisissez votre ville manuellement</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-11 rounded-full" onClick={handleRetryGPS}>
                    🔄 Réessayer
                  </Button>
                  <Button className="h-11 rounded-full bg-gradient-primary" onClick={handleManualEntry}>
                    Choisir →
                  </Button>
                </div>
              </>
            )}

            {/* Manual selection */}
            {step === "manual" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Sélectionnez votre ville</h2>
                    <p className="text-sm text-muted-foreground">Pour afficher les restaurants disponibles</p>
                  </div>
                </div>

                <Input
                  placeholder="Rechercher une ville..."
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  className="rounded-xl"
                />

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredCities.map((cityName) => (
                    <button
                      key={cityName}
                      onClick={() => handleSelectCity(cityName)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/10 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        <span className="font-medium text-foreground">{cityName}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </button>
                  ))}
                  {filteredCities.length === 0 && manualCity.trim() && (
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => handleSelectCity(manualCity.trim())}
                    >
                      Utiliser "{manualCity}"
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-primary"
                  onClick={handleRetryGPS}
                >
                  🔄 Réessayer le GPS
                </Button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-white/80">
            Livraison disponible dans les principales villes du Congo
          </p>
        </div>
      </main>
    </div>
  );
};

export default Welcome;
