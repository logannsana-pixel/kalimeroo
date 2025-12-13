import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "@/contexts/LocationContext";

interface ServiceType {
  id: string;
  name: string;
  icon: string;
  available: boolean;
}

const serviceTypes: ServiceType[] = [
  {
    id: "restaurants",
    name: "Restaurants",
    icon: "🍔",
    available: true,
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
    <section className="px-4 py-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {serviceTypes.map((service, index) => (
          <button
            key={service.id}
            onClick={() => handleClick(service)}
            className={`relative flex-shrink-0 transition-all duration-200 animate-fade-in ${
              service.available 
                ? "hover:scale-105 active:scale-95" 
                : "opacity-50 cursor-not-allowed"
            }`}
            style={{ animationDelay: `${index * 80}ms` }}
            disabled={!service.available}
          >
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-full ${
              service.available 
                ? "bg-primary text-primary-foreground shadow-soft" 
                : "bg-muted text-muted-foreground"
            }`}>
              <span className="text-xl">{service.icon}</span>
              <span className="text-sm font-semibold whitespace-nowrap">{service.name}</span>
              {!service.available && (
                <Badge 
                  variant="secondary" 
                  className="text-[9px] px-1.5 py-0 bg-background/50 text-muted-foreground"
                >
                  Bientôt
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
