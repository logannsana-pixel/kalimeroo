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
    <section className="px-4 py-2">
      <div className="grid grid-cols-3 gap-4">
        {serviceTypes.map((service) => (
          <button
            key={service.id}
            onClick={() => handleClick(service)}
            disabled={!service.available}
            className={`
            relative
            h-28
            rounded-2xl
            flex
            flex-col
            items-center
            justify-center
            gap-2
            transition
            ${service.available ? "bg-[#F7EFE6] active:scale-95" : "bg-[#F7EFE6] opacity-60 cursor-not-allowed"}
          `}
          >
            {/* Badge Bientôt */}
            {!service.available && (
              <span className="absolute top-2 right-2 text-[10px] font-semibold bg-white px-2 py-0.5 rounded-full">
                Bientôt
              </span>
            )}

            {/* Emoji */}
            <span className="text-3xl">{service.icon}</span>

            {/* Label */}
            <span className="text-sm font-semibold text-center">{service.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
