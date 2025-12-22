import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, Loader2, ChevronRight, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";

const CAMEROON_CITIES = [
  "Douala",
  "Yaoundé", 
  "Bafoussam",
  "Bamenda",
  "Garoua",
  "Maroua",
  "Ngaoundéré",
  "Bertoua",
  "Ebolowa",
  "Kribi"
];

type Step = "loading" | "success" | "error" | "manual";

const Welcome = () => {
  const navigate = useNavigate();
  const { city, setCity, setCoordinates } = useLocation();
  const [step, setStep] = useState<Step>("loading");
  const [progress, setProgress] = useState(0);
  const [detectedCity, setDetectedCity] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [filteredCities, setFilteredCities] = useState(CAMEROON_CITIES);

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
      const filtered = CAMEROON_CITIES.filter(c => 
        c.toLowerCase().includes(manualCity.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(CAMEROON_CITIES);
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

      // Detect city from coordinates (simple approximation for Cameroon)
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
    // Approximate city centers in Cameroon
    const cities = [
      { name: "Douala", lat: 4.0511, lng: 9.7679 },
      { name: "Yaoundé", lat: 3.8480, lng: 11.5021 },
      { name: "Bafoussam", lat: 5.4764, lng: 10.4176 },
      { name: "Bamenda", lat: 5.9527, lng: 10.1582 },
      { name: "Garoua", lat: 9.3000, lng: 13.4000 },
      { name: "Maroua", lat: 10.5953, lng: 14.3158 },
      { name: "Ngaoundéré", lat: 7.3167, lng: 13.5833 },
      { name: "Bertoua", lat: 4.5833, lng: 13.6833 },
      { name: "Ebolowa", lat: 2.9000, lng: 11.1500 },
      { name: "Kribi", lat: 2.9500, lng: 9.9167 },
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

    // If too far from any city (> ~100km), default to Douala
    return minDist < 1 ? closest.name : "Douala";
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">Kalyam</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-6">
          {/* Hero text */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Bienvenue sur Kalyam
            </h1>
            <p className="text-muted-foreground">
              Vos restaurants préférés, livrés chez vous
            </p>
          </div>

          {/* Card */}
          <div className="bg-card rounded-2xl shadow-lg border p-6 space-y-5">
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
                  className="w-full"
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

                <div className="p-4 bg-accent rounded-xl text-center">
                  <p className="text-sm text-muted-foreground mb-1">Ville détectée</p>
                  <p className="text-xl font-bold text-foreground">{detectedCity}</p>
                </div>

                <Button className="w-full h-12 rounded-full" onClick={handleConfirmCity}>
                  Continuer avec {detectedCity}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
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
                  <Button variant="outline" className="h-11" onClick={handleRetryGPS}>
                    🔄 Réessayer
                  </Button>
                  <Button className="h-11" onClick={handleManualEntry}>
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
                />

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredCities.map((cityName) => (
                    <button
                      key={cityName}
                      onClick={() => handleSelectCity(cityName)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors text-left group"
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
                      className="w-full"
                      onClick={() => handleSelectCity(manualCity.trim())}
                    >
                      Utiliser "{manualCity}"
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleRetryGPS}
                >
                  🔄 Réessayer le GPS
                </Button>
              </>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Livraison disponible dans plus de 10 villes au Cameroun
          </p>
        </div>
      </main>
    </div>
  );
};

export default Welcome;
