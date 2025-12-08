import {
  Home,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  Settings,
  Clock,
  BarChart3,
  Tag,
  Store,
  ChevronLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface RestaurantSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  restaurantName: string;
}

const menuItems = [
  { id: 'overview', label: 'Accueil', icon: Home },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'bundles', label: 'Bundles', icon: Package },
  { id: 'options', label: 'Options', icon: Settings },
  { id: 'promos', label: 'Promos', icon: Tag },
  { id: 'hours', label: 'Horaires', icon: Clock },
  { id: 'stats', label: 'Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Profil', icon: Store },
];

export function RestaurantSidebar({ activeTab, onTabChange, restaurantName }: RestaurantSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold truncate">{restaurantName || 'Mon Restaurant'}</p>
              <p className="text-xs text-muted-foreground">Espace Restaurateur</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarTrigger className="w-full justify-center" />
      </SidebarFooter>
    </Sidebar>
  );
}