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
    <section className="px-4">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {serviceTypes.map((service) => {
          const disabled = !service.available;

          return (
            <button
              key={service.id}
              onClick={() => handleClick(service)}
              disabled={disabled}
              className={`
              relative
              aspect-square
              rounded-2xl
              flex
              flex-col
              items-center
              justify-center
              gap-2
              transition-all
              text-center

              ${
                disabled
                  ? "bg-muted text-muted-foreground opacity-70 cursor-not-allowed"
                  : "bg-primary/10 text-foreground active:scale-95 hover:bg-primary/15"
              }
            `}
            >
              {/* Badge Bientôt */}
              {disabled && (
                <span className="absolute top-2 right-2 text-[10px] font-medium bg-background px-2 py-0.5 rounded-full">
                  Bientôt
                </span>
              )}

              {/* Icon */}
              <span className="text-3xl leading-none">{service.icon}</span>

              {/* Label */}
              <span className="text-sm font-semibold leading-tight">{service.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
