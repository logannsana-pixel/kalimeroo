import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";

const CONGO_CITIES = [
  "Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Ouesso",
  "Impfondo", "Owando", "Sibiti", "Kinkala", "Madingou",
];

const Welcome = () => {
  const navigate = useNavigate();
  const { city, setCity, setCoordinates } = useLocation();
  const [selectedCity, setSelectedCity] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [showCities, setShowCities] = useState(false);

  // Skip if already welcomed with a city
  useEffect(() => {
    if (localStorage.getItem("kalimero_welcomed") === "true" && city) {
      navigate("/", { replace: true });
    }
  }, [city, navigate]);

  // Show city selection after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowCities(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const detectGPS = async () => {
    setDetecting(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setCoordinates({ latitude, longitude });

      const cities = [
        { name: "Brazzaville", lat: -4.2634, lng: 15.2429 },
        { name: "Pointe-Noire", lat: -4.7781, lng: 11.8635 },
        { name: "Dolisie", lat: -4.2, lng: 12.6667 },
        { name: "Nkayi", lat: -4.1667, lng: 13.2833 },
        { name: "Ouesso", lat: 1.6167, lng: 16.05 },
      ];

      let closest = cities[0];
      let minDist = Infinity;
      for (const c of cities) {
        const dist = Math.sqrt((latitude - c.lat) ** 2 + (longitude - c.lng) ** 2);
        if (dist < minDist) { minDist = dist; closest = c; }
      }

      const detected = minDist < 1 ? closest.name : "Brazzaville";
      setSelectedCity(detected);
      toast.success(`Position détectée : ${detected}`);
    } catch {
      toast.error("GPS indisponible");
    } finally {
      setDetecting(false);
    }
  };

  const handleContinue = () => {
    if (!selectedCity) return;
    setCity(selectedCity);
    localStorage.setItem("kalimero_welcomed", "true");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary via-primary-dark to-secondary overflow-hidden">
      {/* Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="text-7xl mb-4 animate-pulse-soft">🍔</div>
        <h1 className="text-4xl font-display font-bold text-white">Kalimero</h1>
        <p className="text-base text-white/80 font-body mt-2">La livraison au Congo</p>
      </div>

      {/* City selection */}
      {showCities && (
        <div className="px-6 pb-10 animate-slide-up space-y-5">
          <h2 className="text-lg font-display font-bold text-white text-center">Où êtes-vous ?</h2>

          <Button
            onClick={detectGPS}
            disabled={detecting}
            variant="ghost"
            className="w-full h-12 rounded-full bg-white/20 text-white hover:bg-white/30 font-body"
          >
            {detecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Détecter ma position
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/60 text-xs font-body">ou</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CONGO_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                className={`h-10 rounded-full text-sm font-body font-medium transition-all duration-200 ${
                  selectedCity === c
                    ? "bg-white text-primary shadow-card"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selectedCity}
            className="w-full h-14 rounded-full bg-white text-primary font-display font-bold text-base hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuer
          </Button>
        </div>
      )}
    </div>
  );
};

export default Welcome;
