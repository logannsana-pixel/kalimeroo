import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersTab } from "@/components/restaurant/OrdersTab";
import { MenuTab } from "@/components/restaurant/MenuTab";
import { RestaurantProfileTab } from "@/components/restaurant/RestaurantProfileTab";
import { AdvancedStatsTab } from "@/components/restaurant/AdvancedStatsTab";
import { BusinessHoursTab } from "@/components/restaurant/BusinessHoursTab";
import { MenuOptionsTab } from "@/components/restaurant/MenuOptionsTab";
import { BundlesTab } from "@/components/restaurant/BundlesTab";
import { PromoCodesTab } from "@/components/restaurant/PromoCodesTab";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string>("");

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user) {
        const { data } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .single();
        
        if (data) {
          setRestaurantId(data.id);
        }
      }
    };
    fetchRestaurant();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <h1 className="text-xl md:text-3xl font-bold mb-6 md:mb-8">Tableau de bord Restaurant</h1>
        
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="flex w-full max-w-5xl overflow-x-auto mb-4 h-auto flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="orders" className="text-xs md:text-sm flex-shrink-0">Commandes</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs md:text-sm flex-shrink-0">Analytics</TabsTrigger>
            <TabsTrigger value="menu" className="text-xs md:text-sm flex-shrink-0">Menu</TabsTrigger>
            <TabsTrigger value="bundles" className="text-xs md:text-sm flex-shrink-0">Bundles</TabsTrigger>
            <TabsTrigger value="options" className="text-xs md:text-sm flex-shrink-0">Options</TabsTrigger>
            <TabsTrigger value="promos" className="text-xs md:text-sm flex-shrink-0">Promos</TabsTrigger>
            <TabsTrigger value="hours" className="text-xs md:text-sm flex-shrink-0">Horaires</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs md:text-sm flex-shrink-0">Profil</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="mt-6">
            <OrdersTab />
          </TabsContent>
          
          <TabsContent value="stats" className="mt-6">
            <AdvancedStatsTab />
          </TabsContent>
          
          <TabsContent value="menu" className="mt-6">
            <MenuTab />
          </TabsContent>
          
          <TabsContent value="bundles" className="mt-6">
            <BundlesTab />
          </TabsContent>
          
          <TabsContent value="options" className="mt-6">
            {restaurantId && <MenuOptionsTab restaurantId={restaurantId} />}
          </TabsContent>
          
          <TabsContent value="promos" className="mt-6">
            <PromoCodesTab />
          </TabsContent>
          
          <TabsContent value="hours" className="mt-6">
            <BusinessHoursTab />
          </TabsContent>
          
          <TabsContent value="profile" className="mt-6">
            <RestaurantProfileTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
