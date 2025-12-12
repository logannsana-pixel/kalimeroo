import { useState, useEffect } from "react";
import { MapPin, Sparkles } from "lucide-react";
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
  const { district, city, isModalOpen, setLocation, closeModal, openModal } = useLocation();
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    // Show modal if no location is set
    if (!district || !city) {
      openModal();
    }
  }, []);

  const handleConfirm = () => {
    if (selectedDistrict && selectedCity) {
      setLocation(selectedDistrict, selectedCity);
      closeModal();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      openModal();
    } else {
      // Only close if location is set
      if (district && city) {
        closeModal();
      }
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-float">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-glow">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Où vous livrer ? 📍
          </DialogTitle>
          <DialogDescription className="text-base">
            Choisissez votre quartier pour voir les restaurants près de chez vous
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <DistrictSelector
            onSelect={(district, city) => {
              setSelectedDistrict(district);
              setSelectedCity(city);
            }}
            selectedDistrict={selectedDistrict}
          />
          
          <Button 
            className="w-full rounded-full h-14 text-base btn-playful" 
            onClick={handleConfirm}
            disabled={!selectedDistrict}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            C'est parti !
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
