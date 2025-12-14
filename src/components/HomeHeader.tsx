import { Search, Gift, MapPin, ChevronDown, SlidersHorizontal } from "lucide-react";
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
    <header className="bg-background text-foreground px-4 pt-4">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-4">
        {/* Location */}
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-muted px-3 py-2 rounded-full text-sm font-medium hover:bg-muted/80"
        >
          <span className="w-2 h-2 rounded-full bg-primary" />
          {city || "Choisir une ville"}
          <ChevronDown className="h-4 w-4 opacity-60" />
        </button>

        {/* Right Icons */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-muted hover:bg-muted/80"
            onClick={() => navigate("/restaurants")}
          >
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <NotificationBell />
          ) : (
            <Button size="icon" variant="ghost" className="rounded-full bg-muted hover:bg-muted/80">
              <Gift className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {/* <button
        onClick={() => navigate("/restaurants")}
        className="w-full flex items-center gap-3 bg-muted px-4 py-3 rounded-2xl text-muted-foreground"
      >
        <Search className="h-5 w-5" />
        <span className="flex-1 text-left">Rechercher un restaurant ou un plat</span>
        <SlidersHorizontal className="h-5 w-5 opacity-60" />
      </button> */}
    </header>
  );
};
