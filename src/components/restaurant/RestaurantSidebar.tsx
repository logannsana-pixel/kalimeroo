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
  MessageCircle,
  FileText,
  Wallet,
  Star,
  Megaphone,
  Timer,
  Users,
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
  { id: 'overview', label: 'Accueil', icon: Home, group: 'main' },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag, group: 'main' },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed, group: 'menu' },
  { id: 'bundles', label: 'Modificateurs', icon: Package, group: 'menu' },
  { id: 'options', label: 'Options', icon: Settings, group: 'menu' },
  { id: 'preptime', label: 'Temps prépa', icon: Timer, group: 'store' },
  { id: 'hours', label: 'Horaires', icon: Clock, group: 'store' },
  { id: 'profile', label: 'Infos restaurant', icon: Store, group: 'store' },
  { id: 'documents', label: 'Documents', icon: FileText, group: 'store' },
  { id: 'chat', label: 'Messages', icon: MessageCircle, group: 'engage' },
  { id: 'feedback', label: 'Avis clients', icon: Star, group: 'engage' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, group: 'engage' },
  { id: 'promos', label: 'Codes promo', icon: Tag, group: 'engage' },
  { id: 'stats', label: 'Analytics', icon: BarChart3, group: 'finance' },
  { id: 'payments', label: 'Paiements', icon: Wallet, group: 'finance' },
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
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(i => i.group === 'main').map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => onTabChange(item.id)} isActive={isActive} tooltip={item.label}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(i => i.group === 'menu').map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => onTabChange(item.id)} isActive={isActive} tooltip={item.label}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Store */}
        <SidebarGroup>
          <SidebarGroupLabel>Restaurant</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(i => i.group === 'store').map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => onTabChange(item.id)} isActive={isActive} tooltip={item.label}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Engage */}
        <SidebarGroup>
          <SidebarGroupLabel>Engagement</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(i => i.group === 'engage').map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => onTabChange(item.id)} isActive={isActive} tooltip={item.label}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance */}
        <SidebarGroup>
          <SidebarGroupLabel>Finance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.filter(i => i.group === 'finance').map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton onClick={() => onTabChange(item.id)} isActive={isActive} tooltip={item.label}>
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