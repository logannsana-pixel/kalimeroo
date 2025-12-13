import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "@/contexts/LocationContext";
import { Star } from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  promo?: string;
}

const serviceTypes: ServiceType[] = [
  {
    id: "restaurants",
    name: "Restaurants",
    icon: "🍔",
    available: true,
    promo: "Promo 50%",
  },
  {
    id: "supermarkets",
    name: "Supermarchés",
    icon: "🛒",
    available: false,
  },
  {
    id: "shops",
    name: "Boutiques",
    icon: "🛍️",
    available: false,
  },
];

export const ServiceTypes = () => {
  const navigate = useNavigate();
  const { district, city, openModal } = useLocation();
  const hasAddress = district && city;

  const handleClick = (service: ServiceType) => {
    if (!service.available) return;
    
    if (!hasAddress) {
      openModal();
      return;
    }
    
    if (service.id === "restaurants") {
      navigate("/restaurants");
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="grid grid-cols-3 gap-3">
        {serviceTypes.map((service, index) => (
          <button
            key={service.id}
            onClick={() => handleClick(service)}
            className={`relative text-center transition-all duration-200 animate-fade-in ${
              service.available 
                ? "hover:scale-105 active:scale-95" 
                : "opacity-60 cursor-default"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
            disabled={!service.available}
          >
            <Card className="relative p-4 border-none shadow-soft rounded-3xl bg-card overflow-visible">
              {/* Promo badge */}
              {service.promo && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <Badge className="bg-yellow-400 text-yellow-900 text-[10px] px-2 py-0.5 rounded-md font-bold">
                    {service.promo}
                  </Badge>
                </div>
              )}
              
              {/* Icon */}
              <div className="text-4xl mb-2 mt-2">{service.icon}</div>
            </Card>
            
            {/* Label */}
            <p className="text-sm font-medium mt-2 text-foreground">
              {service.name}
            </p>
            
            {/* Coming soon badge */}
            {!service.available && (
              <Badge 
                variant="secondary" 
                className="mt-1 text-[10px] bg-muted text-muted-foreground"
              >
                Bientôt
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
