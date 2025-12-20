import { Search, ChevronDown, Clock, MapPin, Edit2 } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export const HomeHeader = () => {
  const { district, address, openModal } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayLocation = district || address?.substring(0, 20) || "Définir adresse";

  return (
    <header className="bg-background text-foreground">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Location + Estimated Time - Center */}
        <button
          onClick={openModal}
          className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium transition-all hover:opacity-80"
        >
          <MapPin className="h-3 w-3 text-primary" />
          <span className="text-foreground text-xs max-w-[120px] truncate">{displayLocation}</span>
          <span className="text-muted-foreground text-[10px]">•</span>
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground text-[10px]">25-40 min</span>
          <Edit2 className="h-3 w-3 text-muted-foreground" />
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
        <span className="flex-1 text-left text-xs">Rechercher un restaurant, un plat...</span>
      </button>
    </header>
  );
};