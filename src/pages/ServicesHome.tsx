import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "@/contexts/LocationContext";
import { BottomNav } from "@/components/BottomNav";
import { MarketingPopup } from "@/components/marketing/MarketingPopup";
import { ChevronDown, Bell, User, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
import { Input } from "@/components/ui/input";

interface ServiceItem {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  route?: string;
}

const services: ServiceItem[] = [
  { id: "restaurants", name: "Restaurants", icon: "🍽️", available: true, route: "/home" },
  { id: "courses", name: "Courses", icon: "🛒", available: false },
  { id: "pharmacie", name: "Pharmacie", icon: "💊", available: false },
  { id: "eau", name: "Eau & Boissons", icon: "💧", available: false },
  { id: "boulangerie", name: "Boulangerie", icon: "🥖", available: false },
  { id: "express", name: "Express", icon: "📦", available: false },
];

const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbBFAsX1NCradFmpV70L";

const ServicesHome = () => {
  const navigate = useNavigate();
  const { district, city, openModal } = useLocation();
  const { user } = useAuth();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleServiceClick = (service: ServiceItem) => {
    if (!service.available) {
      setShowComingSoon(true);
      return;
    }
    if (service.route) navigate(service.route);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/restaurants?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <MarketingPopup />

      <main className="min-h-screen bg-surface-2 pb-24">
        {/* Header */}
        <header className="bg-card px-4 pt-4 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-display font-bold text-primary">Kalimero</h1>
            <button onClick={openModal} className="flex items-center gap-1 text-xs text-muted-foreground font-body mt-0.5">
              <span>📍</span>
              <span className="truncate max-w-[160px]">{district || city || "Définir ma position"}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate(user ? "/profile" : "/auth")}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            >
              <User className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Hero Search */}
        <section className="px-4 mt-4">
          <div className="bg-gradient-primary rounded-3xl p-5 shadow-card">
            <h2 className="text-lg font-display font-bold text-white mb-3">
              Que voulez-vous manger ?
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un plat ou restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-11 rounded-2xl bg-white border-none font-body text-sm"
              />
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="px-4 mt-6">
          <h3 className="text-base font-display font-bold text-foreground mb-3">Nos services</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className={`flex flex-col items-center gap-2 p-4 rounded-3xl bg-card shadow-card transition-all duration-200 ${
                  service.available
                    ? "hover:shadow-elevated active:scale-95"
                    : "opacity-70"
                }`}
              >
                <span className="text-4xl">{service.icon}</span>
                <span className="text-sm font-display font-semibold text-foreground">{service.name}</span>
                <span
                  className={`text-2xs px-2 py-0.5 rounded-full font-body font-medium ${
                    service.available
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {service.available ? "Disponible" : "Bientôt"}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Promo Banner */}
        <section className="px-4 mt-6">
          <button
            onClick={() => navigate("/affiliate")}
            className="w-full bg-card rounded-3xl p-4 shadow-card flex items-center gap-3 text-left hover:shadow-elevated transition-shadow"
          >
            <span className="text-3xl">🎉</span>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">
                Parrainez un ami, gagnez 500 FCFA !
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">En savoir plus →</p>
            </div>
          </button>
        </section>

        {/* Footer Links */}
        <footer className="px-4 mt-8 pb-4">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-body">
            <button onClick={() => navigate("/help")} className="hover:text-primary">Aide</button>
            <span>•</span>
            <button className="hover:text-primary">CGU</button>
            <span>•</span>
            <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              Contact
            </a>
          </div>
        </footer>
      </main>

      <BottomNav />

      {/* Coming Soon Bottom Sheet */}
      <AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-lg font-display">
              Ce service arrive bientôt 🚀
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-body text-sm">
              Soyez informé dès le lancement via notre canal WhatsApp !
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => {
                window.open(WHATSAPP_CHANNEL, "_blank");
                setShowComingSoon(false);
              }}
              className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full font-body"
            >
              📲 Être prévenu
            </Button>
            <AlertDialogCancel className="w-full rounded-full font-body">
              Plus tard
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ServicesHome;
