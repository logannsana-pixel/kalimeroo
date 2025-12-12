import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export function NetworkStatus() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm font-medium animate-slide-down flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>Pas de connexion internet</span>
    </div>
  );
}
