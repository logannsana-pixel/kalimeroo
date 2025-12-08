import { LogOut, Bell, RefreshCw, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface RestaurantHeaderProps {
  restaurantName: string;
  onLogout: () => void;
}

export function RestaurantHeader({ restaurantName, onLogout }: RestaurantHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <h1 className="font-semibold text-lg hidden md:block">{restaurantName || 'Dashboard'}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}