import { useNavigate } from "react-router-dom";
import { useLocation } from "@/contexts/LocationContext";
import { BottomNav } from "@/components/BottomNav";
import { MarketingPopup } from "@/components/marketing/MarketingPopup";
import { ChevronDown, Home } from "lucide-react";

interface ServiceBubble {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  route?: string;
}

const services: ServiceBubble[] = [
  {
    id: "courses",
    name: "Courses",
    icon: "🛒",
    available: false,
  },
  {
    id: "boutiques",
    name: "Boutiques",
    icon: "🛍️",
    available: false,
  },
  {
    id: "restaurants",
    name: "Restaurants",
    icon: "🍔",
    available: true,
    route: "/home",
  },
  {
    id: "fetes",
    name: "Nouvel An",
    icon: "🎉",
    available: false,
  },
  {
    id: "pharmacies",
    name: "Parapharmacies & Beauté",
    icon: "💊",
    available: false,
  },
  {
    id: "supermarches",
    name: "Supermarchés",
    icon: "🏪",
    available: false,
  },
  {
    id: "coursier",
    name: "Service Coursier",
    icon: "🛵",
    available: false,
  },
];

const ServicesHome = () => {
  const navigate = useNavigate();
  const { district, city, openModal } = useLocation();

  const handleServiceClick = (service: ServiceBubble) => {
    if (!service.available) return;
    if (service.route) {
      navigate(service.route);
    }
  };

  return (
    <>
      <MarketingPopup />

      <main className="min-h-screen bg-gradient-primary pb-24">
        {/* Header with location */}
        <header className="pt-6 pb-4 px-4">
          <button
            onClick={openModal}
            className="mx-auto flex items-center gap-2 bg-foreground/90 text-background px-4 py-2.5 rounded-full shadow-lg"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium truncate max-w-[180px]">
              {district || city || "Définir ma localisation"}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </header>

        {/* Service Bubbles Grid - Glovo style organic layout */}
        <section className="px-6 py-8">
          <div className="relative max-w-sm mx-auto min-h-[450px]">
            {/* Top Center - Courses */}
            <ServiceBubbleItem
              service={services[0]}
              onClick={() => handleServiceClick(services[0])}
              className="absolute top-0 left-1/2 -translate-x-1/2"
              size="lg"
            />

            {/* Left Side - Boutiques */}
            <ServiceBubbleItem
              service={services[1]}
              onClick={() => handleServiceClick(services[1])}
              className="absolute top-[80px] left-0"
              size="md"
            />

            {/* Right Side - Nouvel An */}
            <ServiceBubbleItem
              service={services[3]}
              onClick={() => handleServiceClick(services[3])}
              className="absolute top-[80px] right-0"
              size="md"
            />

            {/* Center - Restaurants (main) */}
            <ServiceBubbleItem
              service={services[2]}
              onClick={() => handleServiceClick(services[2])}
              className="absolute top-[170px] left-1/2 -translate-x-1/2"
              size="xl"
              isMain
            />

            {/* Bottom Left - Pharmacies */}
            <ServiceBubbleItem
              service={services[4]}
              onClick={() => handleServiceClick(services[4])}
              className="absolute top-[280px] left-0"
              size="md"
            />

            {/* Bottom Right - Supermarchés */}
            <ServiceBubbleItem
              service={services[5]}
              onClick={() => handleServiceClick(services[5])}
              className="absolute top-[280px] right-0"
              size="md"
            />

            {/* Bottom Center - Service Coursier */}
            <ServiceBubbleItem
              service={services[6]}
              onClick={() => handleServiceClick(services[6])}
              className="absolute top-[380px] left-1/2 -translate-x-1/2"
              size="lg"
              isDashed
            />
          </div>
        </section>

        {/* Info Banner */}
        <section className="px-4 mt-4">
          <div className="bg-background/90 rounded-2xl p-4 shadow-lg">
            <p className="text-sm text-foreground text-center">
              🚀 Plus de services arrivent bientôt !
            </p>
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  );
};

interface ServiceBubbleItemProps {
  service: ServiceBubble;
  onClick: () => void;
  className?: string;
  size?: "md" | "lg" | "xl";
  isMain?: boolean;
  isDashed?: boolean;
}

const ServiceBubbleItem = ({
  service,
  onClick,
  className = "",
  size = "md",
  isMain = false,
  isDashed = false,
}: ServiceBubbleItemProps) => {
  const sizeClasses = {
    md: "w-24 h-24",
    lg: "w-28 h-28",
    xl: "w-32 h-32",
  };

  const iconSizes = {
    md: "text-3xl",
    lg: "text-4xl",
    xl: "text-5xl",
  };

  const disabled = !service.available;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${className}
        ${sizeClasses[size]}
        rounded-full
        flex flex-col items-center justify-center
        transition-all duration-300
        ${disabled ? "opacity-70" : "hover:scale-105 active:scale-95"}
        ${isMain ? "shadow-xl" : "shadow-lg"}
        ${isDashed 
          ? "border-2 border-dashed border-foreground/30 bg-background/80" 
          : "bg-white"
        }
      `}
    >
      {/* Coming Soon Badge */}
      {disabled && !isDashed && (
        <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-foreground text-background px-2 py-0.5 rounded-full">
          Bientôt
        </span>
      )}

      <span className={iconSizes[size]}>{service.icon}</span>
      <span className={`
        text-[10px] font-medium text-center leading-tight mt-1 px-1
        ${disabled ? "text-muted-foreground" : "text-foreground"}
      `}>
        {service.name}
      </span>
    </button>
  );
};

export default ServicesHome;
