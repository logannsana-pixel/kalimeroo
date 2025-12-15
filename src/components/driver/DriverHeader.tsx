import { Bell, LogOut, RefreshCw, Volume2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DriverHeaderProps {
  driverName: string;
  isOnline: boolean;
  onToggleOnline: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onSettings?: () => void;
}

export function DriverHeader({ 
  driverName, 
  isOnline, 
  onToggleOnline, 
  onLogout, 
  onRefresh, 
  refreshing,
  onSettings
}: DriverHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background border-b safe-area-top">
      <div className="px-4 h-14 flex items-center justify-between">
        {/* Left - Status Toggle */}
        <div className="flex items-center gap-2">
          <div 
            className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-primary animate-pulse-soft' : 'bg-muted-foreground'}`} 
          />
          <div>
            <p className="font-medium text-xs">{driverName}</p>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] ${isOnline ? 'text-primary' : 'text-muted-foreground'}`}>
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
              <Switch 
                checked={isOnline} 
                onCheckedChange={onToggleOnline}
                className="data-[state=checked]:bg-primary h-4 w-7 scale-90"
              />
            </div>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/enable-alerts')}
                className="touch-target"
              >
                <Volume2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Alertes & Sons</TooltipContent>
          </Tooltip>
          <NotificationBell />
          {onSettings && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onSettings}
              className="touch-target"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh}
            disabled={refreshing}
            className="touch-target"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onLogout}
            className="touch-target"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}