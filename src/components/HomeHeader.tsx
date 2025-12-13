import { Search, Gift, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/LocationContext";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

export const HomeHeader = () => {
  const { city, openModal } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-2xl">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            KALIMERO
          </span>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-white hover:bg-white/10"
            onClick={() => navigate("/restaurants")}
          >
            <Search className="h-5 w-5" />
          </Button>
          {user ? (
            <NotificationBell />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-white hover:bg-white/10"
            >
              <Gift className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Location selector */}
      <button
        onClick={openModal}
        className="flex items-center justify-center gap-2 w-full py-3 hover:bg-white/10 transition-colors"
      >
        <MapPin className="h-4 w-4" />
        <span className="font-medium">{city || "Choisir une ville"}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
    </header>
  );
};
