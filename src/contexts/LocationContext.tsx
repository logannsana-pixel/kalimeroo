import { createContext, useContext, useState, ReactNode } from "react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  district: string;
  city: string;
  address: string;
  addressComplement: string;
  coordinates: Coordinates | null;
  isModalOpen: boolean;
  hasGPS: boolean;
  setLocation: (district: string, city: string) => void;
  setFullAddress: (address: string, complement?: string) => void;
  setCoordinates: (coords: Coordinates | null) => void;
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
  const [address, setAddress] = useState(() => 
    localStorage.getItem("userAddress") || ""
  );
  const [addressComplement, setAddressComplement] = useState(() => 
    localStorage.getItem("userAddressComplement") || ""
  );
  const [coordinates, setCoordinatesState] = useState<Coordinates | null>(() => {
    const stored = localStorage.getItem("userCoordinates");
    return stored ? JSON.parse(stored) : null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasGPS = coordinates !== null;

  const setLocation = (newDistrict: string, newCity: string) => {
    setDistrict(newDistrict);
    setCity(newCity);
    localStorage.setItem("userDistrict", newDistrict);
    localStorage.setItem("userCity", newCity);
  };

  const setFullAddress = (newAddress: string, complement?: string) => {
    setAddress(newAddress);
    localStorage.setItem("userAddress", newAddress);
    if (complement !== undefined) {
      setAddressComplement(complement);
      localStorage.setItem("userAddressComplement", complement);
    }
  };

  const setCoordinates = (coords: Coordinates | null) => {
    setCoordinatesState(coords);
    if (coords) {
      localStorage.setItem("userCoordinates", JSON.stringify(coords));
    } else {
      localStorage.removeItem("userCoordinates");
    }
  };

  const clearLocation = () => {
    setDistrict("");
    setCity("");
    setAddress("");
    setAddressComplement("");
    setCoordinatesState(null);
    localStorage.removeItem("userDistrict");
    localStorage.removeItem("userCity");
    localStorage.removeItem("userAddress");
    localStorage.removeItem("userAddressComplement");
    localStorage.removeItem("userCoordinates");
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <LocationContext.Provider value={{ 
      district, 
      city, 
      address,
      addressComplement,
      coordinates,
      hasGPS,
      isModalOpen,
      setLocation, 
      setFullAddress,
      setCoordinates,
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
