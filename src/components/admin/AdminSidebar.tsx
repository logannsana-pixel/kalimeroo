import { 
  LayoutDashboard, Store, Truck, Package, Users, CreditCard, 
  BarChart3, Settings, MessageSquare, Megaphone, Map, Shield, ChevronDown, Gift
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type AdminTab = 
  | 'overview' | 'restaurants' | 'drivers' | 'orders' 
  | 'users' | 'payments' | 'analytics' | 'support' 
  | 'marketing' | 'settings' | 'live-map' | 'admins' | 'affiliate';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const mainMenuItems = [
  { id: 'overview' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'restaurants' as AdminTab, label: 'Restaurants', icon: Store },
  { id: 'drivers' as AdminTab, label: 'Livreurs', icon: Truck },
  { id: 'orders' as AdminTab, label: 'Commandes', icon: Package },
  { id: 'users' as AdminTab, label: 'Utilisateurs', icon: Users },
];

const financeMenuItems = [
  { id: 'payments' as AdminTab, label: 'Paiements', icon: CreditCard },
  { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3 },
  { id: 'affiliate' as AdminTab, label: 'Affiliation', icon: Gift },
];

const operationsMenuItems = [
  { id: 'live-map' as AdminTab, label: 'Carte Live', icon: Map },
  { id: 'support' as AdminTab, label: 'Support', icon: MessageSquare },
  { id: 'marketing' as AdminTab, label: 'Marketing', icon: Megaphone },
];

const systemMenuItems = [
  { id: 'settings' as AdminTab, label: 'Paramètres', icon: Settings },
  { id: 'admins' as AdminTab, label: 'Équipe Admin', icon: Shield },
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const renderMenuItem = (item: { id: AdminTab; label: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton 
          onClick={() => onTabChange(item.id)} 
          isActive={activeTab === item.id}
          className="transition-all"
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-foreground">KALIMERO</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {/* Main Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance Section */}
        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 cursor-pointer flex items-center justify-between pr-2">
                Finance
                <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {financeMenuItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Operations Section */}
        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 cursor-pointer flex items-center justify-between pr-2">
                Opérations
                <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {operationsMenuItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* System Section */}
        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 cursor-pointer flex items-center justify-between pr-2">
                Système
                <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {systemMenuItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <SidebarTrigger className="w-full justify-center" />
      </SidebarFooter>
    </Sidebar>
  );
}