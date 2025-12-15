import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export const HomeHeader = () => {
  const { city, openModal } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="bg-background text-foreground">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Location - Center */}
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium transition-all hover:opacity-80"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-foreground text-xs">{city || "Choisir une ville"}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        {/* Right Icons */}
        <div className="flex items-center gap-1">
          {user && <NotificationBell />}
        </div>
      </div>

      {/* Search Bar */}
      <button
        onClick={() => navigate("/restaurants")}
        className="w-full flex items-center gap-2 bg-secondary hover:bg-secondary/80 px-3 py-2.5 rounded-full text-muted-foreground transition-all"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left text-xs">Rechercher</span>
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </div>
      </button>
    </header>
  );
};
