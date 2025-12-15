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
    name: "Grocery",
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
    <section className="px-4">
      {/* Promo Banner - Premium Green Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/90 p-5 mb-6">
        <div className="relative z-10">
          <p className="text-primary-foreground/80 text-sm font-medium mb-1">Jusqu'à -35%</p>
          <h3 className="text-primary-foreground font-bold text-xl leading-tight mb-3">
            Sur votre première<br />commande
          </h3>
          <button 
            onClick={() => hasAddress ? navigate("/restaurants") : openModal()}
            className="bg-background text-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-background/90 transition-all duration-200 shadow-soft"
          >
            Commander
          </button>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full bg-primary-foreground/10" />
        <div className="absolute -right-8 bottom-0 w-24 h-24 rounded-full bg-primary-foreground/5" />
      </div>
    </section>
  );
};
