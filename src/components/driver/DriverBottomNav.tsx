import { Home, FileText, DollarSign, User, Settings, Banknote } from "lucide-react";

export type DriverTabType = 'home' | 'orders' | 'earnings' | 'cash' | 'profile' | 'settings';

interface DriverBottomNavProps {
  activeTab: DriverTabType;
  onTabChange: (tab: DriverTabType) => void;
}

const navItems = [
  { id: 'home' as const, icon: Home, label: 'Accueil' },
  { id: 'orders' as const, icon: FileText, label: 'Historique' },
  { id: 'earnings' as const, icon: DollarSign, label: 'Gains' },
  { id: 'cash' as const, icon: Banknote, label: 'Cash' },
  { id: 'profile' as const, icon: User, label: 'Profil' },
];

export function DriverBottomNav({ activeTab, onTabChange }: DriverBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 touch-target transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
