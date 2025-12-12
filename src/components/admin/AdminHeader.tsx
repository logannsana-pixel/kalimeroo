import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { RefreshCw, LogOut, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface AdminHeaderProps {
  title: string;
  onRefresh: () => void;
  loading?: boolean;
}

export function AdminHeader({ title, onRefresh, loading }: AdminHeaderProps) {
  const { signOut, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-foreground">{title}</h1>
            <Badge variant="outline" className="hidden sm:flex text-xs">
              Admin
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={signOut}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}