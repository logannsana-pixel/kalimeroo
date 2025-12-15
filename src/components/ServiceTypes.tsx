import { useNavigate } from "react-router-dom";
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
      <div className="grid grid-cols-3 gap-3">
        {serviceTypes.map((service) => {
          const disabled = !service.available;

          return (
            <button
              key={service.id}
              onClick={() => handleClick(service)}
              disabled={disabled}
              className={`
                relative
                py-4
                rounded-xl
                flex
                flex-col
                items-center
                justify-center
                gap-1.5
                transition-all
                duration-200
                text-center
                ${
                  disabled
                    ? "bg-secondary/50 text-muted-foreground cursor-not-allowed"
                    : "bg-primary/15 text-foreground active:scale-95 hover:bg-primary/20"
                }
              `}
            >
              {/* Badge Bientôt */}
              {disabled && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-medium bg-secondary px-1 py-0.5 rounded-full text-muted-foreground">
                  Bientôt
                </span>
              )}

              {/* Icon */}
              <span className="text-xl leading-none">{service.icon}</span>

              {/* Label */}
              <span className="text-[11px] font-medium leading-tight">{service.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
