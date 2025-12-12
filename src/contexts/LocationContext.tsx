import { createContext, useContext, useState, ReactNode } from "react";

interface LocationContextType {
  district: string;
  city: string;
  isModalOpen: boolean;
  setLocation: (district: string, city: string) => void;
  clearLocation: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [district, setDistrict] = useState(() => 
    localStorage.getItem("userDistrict") || ""
  );
  const [city, setCity] = useState(() => 
    localStorage.getItem("userCity") || ""
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const setLocation = (newDistrict: string, newCity: string) => {
    setDistrict(newDistrict);
    setCity(newCity);
    localStorage.setItem("userDistrict", newDistrict);
    localStorage.setItem("userCity", newCity);
  };

  const clearLocation = () => {
    setDistrict("");
    setCity("");
    localStorage.removeItem("userDistrict");
    localStorage.removeItem("userCity");
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <LocationContext.Provider value={{ 
      district, 
      city, 
      isModalOpen,
      setLocation, 
      clearLocation,
      openModal,
      closeModal
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
};
