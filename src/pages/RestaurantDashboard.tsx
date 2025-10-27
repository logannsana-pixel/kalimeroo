import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersTab } from "@/components/restaurant/OrdersTab";
import { MenuTab } from "@/components/restaurant/MenuTab";
import { RestaurantProfileTab } from "@/components/restaurant/RestaurantProfileTab";
import { StatsTab } from "@/components/restaurant/StatsTab";

export default function RestaurantDashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord Restaurant</h1>
        
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="mt-6">
            <OrdersTab />
          </TabsContent>
          
          <TabsContent value="menu" className="mt-6">
            <MenuTab />
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
    </div>
  );
}
