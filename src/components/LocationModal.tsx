import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DistrictSelector } from "@/components/DistrictSelector";
import { useLocation } from "@/contexts/LocationContext";

export const LocationModal = () => {
  const { district, city, setLocation } = useLocation();
  const [open, setOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    // Show modal if no location is set
    if (!district || !city) {
      setOpen(true);
    }
  }, [district, city]);

  const handleConfirm = () => {
    if (selectedDistrict && selectedCity) {
      setLocation(selectedDistrict, selectedCity);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-6 h-6 text-primary" />
            Où voulez-vous vous faire livrer ?
          </DialogTitle>
          <DialogDescription>
            Sélectionnez votre quartier pour découvrir les restaurants disponibles dans votre zone
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <DistrictSelector
            onSelect={(district, city) => {
              setSelectedDistrict(district);
              setSelectedCity(city);
            }}
            selectedDistrict={selectedDistrict}
          />
          
          <Button 
            className="w-full" 
            onClick={handleConfirm}
            disabled={!selectedDistrict}
          >
            Confirmer ma localisation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
