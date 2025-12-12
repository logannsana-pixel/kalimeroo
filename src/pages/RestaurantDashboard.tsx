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
import { ValidationLockScreen } from "@/components/validation/ValidationLockScreen";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RestaurantData {
  id: string;
  name: string;
  is_validated: boolean;
  validation_notes: string | null;
}

export default function RestaurantDashboard() {
  const { user, signOut } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("restaurants")
          .select("id, name, is_validated, validation_notes")
          .eq("owner_id", user.id)
          .maybeSingle();
        
        if (data) {
          setRestaurant(data);
        }
      }
      setLoading(false);
    };
    fetchRestaurant();

    // Real-time subscription for validation status changes
    if (user) {
      const channel = supabase
        .channel('restaurant-validation')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `owner_id=eq.${user.id}`
        }, (payload) => {
          setRestaurant(prev => prev ? {
            ...prev,
            is_validated: payload.new.is_validated,
            validation_notes: payload.new.validation_notes
          } : null);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleRequestRevalidation = async () => {
    if (!restaurant) return;
    
    // Clear rejection notes to mark as pending again
    await supabase
      .from("restaurants")
      .update({ validation_notes: null })
      .eq("id", restaurant.id);
    
    setRestaurant(prev => prev ? { ...prev, validation_notes: null } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show lock screen if not validated
  if (restaurant && !restaurant.is_validated) {
    return (
      <ValidationLockScreen
        type="restaurant"
        isValidated={restaurant.is_validated}
        validationNotes={restaurant.validation_notes}
        onLogout={signOut}
        onRequestRevalidation={handleRequestRevalidation}
        entityName={restaurant.name}
      />
    );
  }

  const renderContent = () => {
    if (!restaurant) return null;
    
    switch (activeTab) {
      case 'overview':
        return <RestaurantOverview restaurantId={restaurant.id} />;
      case 'orders':
        return <OrdersTab />;
      case 'menu':
        return <MenuTab />;
      case 'bundles':
        return <BundlesTab />;
      case 'options':
        return <MenuOptionsTab restaurantId={restaurant.id} />;
      case 'promos':
        return <PromoCodesTab />;
      case 'hours':
        return <BusinessHoursTab />;
      case 'stats':
        return <AdvancedStatsTab />;
      case 'profile':
        return <RestaurantProfileTab />;
      default:
        return <RestaurantOverview restaurantId={restaurant.id} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <RestaurantSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          restaurantName={restaurant?.name || ""}
        />
        <SidebarInset className="flex-1">
          <RestaurantHeader 
            restaurantName={restaurant?.name || ""}
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