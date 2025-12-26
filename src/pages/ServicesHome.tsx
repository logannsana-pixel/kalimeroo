import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "@/contexts/LocationContext";
import { BottomNav } from "@/components/BottomNav";
import { MarketingPopup } from "@/components/marketing/MarketingPopup";
import { ChevronDown, Home } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ServiceBubble {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  route?: string;
}

const services: ServiceBubble[] = [
  { id: "courses", name: "Courses", icon: "🛒", available: false },
  { id: "boutiques", name: "Boutiques", icon: "🛍️", available: false },
  { id: "restaurants", name: "Restaurants", icon: "🍔", available: true, route: "/home" },
  { id: "fetes", name: "Nouvel An", icon: "🎉", available: false },
  { id: "pharmacies", name: "Parapharmacies & Beauté", icon: "💊", available: false },
  { id: "supermarches", name: "Supermarchés", icon: "🏪", available: false },
  { id: "coursier", name: "Service Coursier", icon: "🛵", available: false },
];

const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbBFAsX1NCradFmpV70L";

const ServicesHome = () => {
  const navigate = useNavigate();
  const { district, city, openModal } = useLocation();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleServiceClick = (service: ServiceBubble) => {
    if (!service.available) {
      setShowComingSoon(true);
      return;
    }
    if (service.route) {
      navigate(service.route);
    }
  };

  const handleWhatsAppClick = () => {
    window.open(WHATSAPP_CHANNEL, "_blank");
    setShowComingSoon(false);
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

        {/* Service Bubbles Grid - Compact organic layout */}
        <section className="px-6 py-8">
          <div className="relative max-w-xs mx-auto min-h-[380px]">
            {/* Top Center - Courses */}
            <ServiceBubbleItem
              service={services[0]}
              onClick={() => handleServiceClick(services[0])}
              className="absolute top-0 left-1/2 -translate-x-1/2"
              size="md"
            />

            {/* Left Side - Boutiques */}
            <ServiceBubbleItem
              service={services[1]}
              onClick={() => handleServiceClick(services[1])}
              className="absolute top-[65px] left-2"
              size="md"
            />

            {/* Right Side - Nouvel An */}
            <ServiceBubbleItem
              service={services[3]}
              onClick={() => handleServiceClick(services[3])}
              className="absolute top-[65px] right-2"
              size="md"
            />

            {/* Center - Restaurants (main) */}
            <ServiceBubbleItem
              service={services[2]}
              onClick={() => handleServiceClick(services[2])}
              className="absolute top-[130px] left-1/2 -translate-x-1/2"
              size="xl"
              isMain
            />

            {/* Bottom Left - Pharmacies */}
            <ServiceBubbleItem
              service={services[4]}
              onClick={() => handleServiceClick(services[4])}
              className="absolute top-[230px] left-2"
              size="md"
            />

            {/* Bottom Right - Supermarchés */}
            <ServiceBubbleItem
              service={services[5]}
              onClick={() => handleServiceClick(services[5])}
              className="absolute top-[230px] right-2"
              size="md"
            />

            {/* Bottom Center - Service Coursier */}
            <ServiceBubbleItem
              service={services[6]}
              onClick={() => handleServiceClick(services[6])}
              className="absolute top-[310px] left-1/2 -translate-x-1/2"
              size="md"
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

      {/* Coming Soon Popup */}
      <AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-xl">
              Ce service arrive bientôt 🚀
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Laisse ton WhatsApp pour être informé dès le lancement !
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleWhatsAppClick}
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full"
            >
              📲 Être prévenu
            </Button>
            <AlertDialogCancel className="w-full rounded-full">
              Plus tard
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    md: "w-20 h-20",
    lg: "w-24 h-24",
    xl: "w-28 h-28",
  };

  const iconSizes = {
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const disabled = !service.available;

  return (
    <button
      onClick={onClick}
      className={`
        ${className}
        ${sizeClasses[size]}
        rounded-full
        flex flex-col items-center justify-center gap-0.5
        transition-all duration-300
        ${disabled ? "opacity-50 grayscale" : "hover:scale-105 active:scale-95"}
        ${isMain ? "shadow-xl ring-2 ring-primary/30" : "shadow-lg"}
        ${isDashed 
          ? "border-2 border-dashed border-foreground/30 bg-background/80" 
          : "bg-white"
        }
      `}
    >
      <span className={iconSizes[size]}>{service.icon}</span>
      <span className={`
        text-[9px] font-medium text-center leading-tight px-1
        ${disabled ? "text-muted-foreground" : "text-foreground"}
      `}>
        {service.name}
      </span>
    </button>
  );
};

export default ServicesHome;
