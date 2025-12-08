import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RestaurantSidebar } from "@/components/restaurant/RestaurantSidebar";
import { RestaurantHeader } from "@/components/restaurant/RestaurantHeader";
import { RestaurantOverview } from "@/components/restaurant/RestaurantOverview";
import { OrdersTab } from "@/components/restaurant/OrdersTab";
import { MenuTab } from "@/components/restaurant/MenuTab";
import { RestaurantProfileTab } from "@/components/restaurant/RestaurantProfileTab";
import { AdvancedStatsTab } from "@/components/restaurant/AdvancedStatsTab";
import { BusinessHoursTab } from "@/components/restaurant/BusinessHoursTab";
import { MenuOptionsTab } from "@/components/restaurant/MenuOptionsTab";
import { BundlesTab } from "@/components/restaurant/BundlesTab";
import { PromoCodesTab } from "@/components/restaurant/PromoCodesTab";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function RestaurantDashboard() {
  const { user, signOut } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user) {
        const { data } = await supabase
          .from("restaurants")
          .select("id, name")
          .eq("owner_id", user.id)
          .single();
        
        if (data) {
          setRestaurantId(data.id);
          setRestaurantName(data.name);
        }
      }
    };
    fetchRestaurant();
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <RestaurantOverview restaurantId={restaurantId} />;
      case 'orders':
        return <OrdersTab />;
      case 'menu':
        return <MenuTab />;
      case 'bundles':
        return <BundlesTab />;
      case 'options':
        return restaurantId ? <MenuOptionsTab restaurantId={restaurantId} /> : null;
      case 'promos':
        return <PromoCodesTab />;
      case 'hours':
        return <BusinessHoursTab />;
      case 'stats':
        return <AdvancedStatsTab />;
      case 'profile':
        return <RestaurantProfileTab />;
      default:
        return <RestaurantOverview restaurantId={restaurantId} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <RestaurantSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          restaurantName={restaurantName}
        />
        <SidebarInset className="flex-1">
          <RestaurantHeader 
            restaurantName={restaurantName}
            onLogout={signOut}
          />
          <main className="p-4 md:p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}