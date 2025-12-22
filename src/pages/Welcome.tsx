import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/contexts/LocationContext";

const CITIES = [
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

const Welcome = () => {
  const navigate = useNavigate();
  const { city, setCity, setDistrict } = useLocation();
  const [searchCity, setSearchCity] = useState("");
  const [filteredCities, setFilteredCities] = useState(CITIES);

  // If city is already set, redirect to home
  useEffect(() => {
    if (city) {
      navigate("/", { replace: true });
    }
  }, [city, navigate]);

  useEffect(() => {
    if (searchCity.trim()) {
      const filtered = CITIES.filter(c => 
        c.toLowerCase().includes(searchCity.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(CITIES);
    }
  }, [searchCity]);

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setDistrict(""); // Reset district when city changes
    navigate("/", { replace: true });
  };

  const handleCustomCity = () => {
    if (searchCity.trim()) {
      handleCitySelect(searchCity.trim());
    }
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
        <div className="w-full max-w-md space-y-8">
          {/* Hero text */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Bienvenue sur Kalyam
            </h1>
            <p className="text-muted-foreground text-lg">
              Vos restaurants préférés, livrés chez vous
            </p>
          </div>

          {/* City selection */}
          <div className="bg-card rounded-2xl shadow-lg border p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Où êtes-vous ?</h2>
                <p className="text-sm text-muted-foreground">Sélectionnez votre ville</p>
              </div>
            </div>

            {/* Search input */}
            <div className="relative">
              <Input
                placeholder="Rechercher une ville..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pr-12"
              />
              {searchCity.trim() && !filteredCities.includes(searchCity) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={handleCustomCity}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* City list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredCities.length > 0 ? (
                filteredCities.map((cityName) => (
                  <button
                    key={cityName}
                    onClick={() => handleCitySelect(cityName)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-medium text-foreground">{cityName}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">Aucune ville trouvée</p>
                  {searchCity.trim() && (
                    <Button onClick={handleCustomCity} variant="outline">
                      Utiliser "{searchCity}"
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer text */}
          <p className="text-center text-sm text-muted-foreground">
            Livraison disponible dans plus de 10 villes au Cameroun
          </p>
        </div>
      </main>
    </div>
  );
};

export default Welcome;
