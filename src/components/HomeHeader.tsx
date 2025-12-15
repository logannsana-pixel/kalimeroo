import { Search, Gift, Menu, ChevronDown, SlidersHorizontal } from "lucide-react";
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
    <header className="bg-background text-foreground">
      {/* Top Row - Premium Dark Style */}
      <div className="flex items-center justify-between mb-5">
        {/* Menu Button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-11 w-11 rounded-full bg-secondary hover:bg-secondary/80 transition-all duration-200"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>

        {/* Location - Center */}
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-80"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-foreground">{city || "Choisir une ville"}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Right Icons */}
        <div className="flex items-center gap-2">
          {user ? (
            <NotificationBell />
          ) : (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-11 w-11 rounded-full bg-secondary hover:bg-secondary/80 transition-all duration-200"
            >
              <SlidersHorizontal className="h-5 w-5 text-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar - Premium Style */}
      <button
        onClick={() => navigate("/restaurants")}
        className="w-full flex items-center gap-3 bg-secondary hover:bg-secondary/80 px-5 py-3.5 rounded-full text-muted-foreground transition-all duration-200"
      >
        <Search className="h-5 w-5" />
        <span className="flex-1 text-left text-sm">Rechercher</span>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
      </button>
    </header>
  );
};
