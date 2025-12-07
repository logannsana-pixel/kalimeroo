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
import { Button } from "@/components/ui/button";
import { LogOut, ChefHat } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { RefreshButton } from "@/components/RefreshButton";

export default function RestaurantDashboard() {
  const { user, signOut } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("");

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header simplifié du portail */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{restaurantName || "Mon Restaurant"}</h1>
              <p className="text-xs text-muted-foreground">Espace Restaurateur</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <RefreshButton onClick={() => window.location.reload()} />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        
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
    </div>
  );
}
