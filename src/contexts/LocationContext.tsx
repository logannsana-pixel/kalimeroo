import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LocationContextType {
  district: string;
  city: string;
  setLocation: (district: string, city: string) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [district, setDistrict] = useState(() => 
    localStorage.getItem("userDistrict") || ""
  );
  const [city, setCity] = useState(() => 
    localStorage.getItem("userCity") || ""
  );

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

  return (
    <LocationContext.Provider value={{ district, city, setLocation, clearLocation }}>
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
