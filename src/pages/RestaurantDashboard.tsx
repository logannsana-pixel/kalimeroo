import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersTab } from "@/components/restaurant/OrdersTab";
import { MenuTab } from "@/components/restaurant/MenuTab";
import { RestaurantProfileTab } from "@/components/restaurant/RestaurantProfileTab";
import { StatsTab } from "@/components/restaurant/StatsTab";
import { MenuOptionsTab } from "@/components/restaurant/MenuOptionsTab";
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
          <TabsList className="grid w-full max-w-2xl grid-cols-5 mb-4">
            <TabsTrigger value="orders" className="text-xs md:text-sm">Commandes</TabsTrigger>
            <TabsTrigger value="menu" className="text-xs md:text-sm">Menu</TabsTrigger>
            <TabsTrigger value="options" className="text-xs md:text-sm">Options</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs md:text-sm">Profil</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs md:text-sm">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="mt-6">
            <OrdersTab />
          </TabsContent>
          
          <TabsContent value="menu" className="mt-6">
            <MenuTab />
          </TabsContent>
          
          <TabsContent value="options" className="mt-6">
            {restaurantId && <MenuOptionsTab restaurantId={restaurantId} />}
          </TabsContent>
          
          <TabsContent value="profile" className="mt-6">
            <RestaurantProfileTab />
          </TabsContent>
          
          <TabsContent value="stats" className="mt-6">
            <StatsTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
