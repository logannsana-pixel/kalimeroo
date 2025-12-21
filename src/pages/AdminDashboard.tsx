import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OrderCardSkeleton } from "@/components/ui/skeleton-card";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { AdminSidebar, AdminTab } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminRestaurantsTab } from "@/components/admin/AdminRestaurantsTab";
import { AdminDriversTab } from "@/components/admin/AdminDriversTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminPaymentsTab } from "@/components/admin/AdminPaymentsTab";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminAdvancedAnalyticsTab } from "@/components/admin/AdminAdvancedAnalyticsTab";
import { AdminSupportTab } from "@/components/admin/AdminSupportTab";
import AdminSupportInboxTab from "@/components/admin/AdminSupportInboxTab";
import AdminFAQTab from "@/components/admin/AdminFAQTab";
import { AdminMarketingTab } from "@/components/admin/AdminMarketingTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminAdminsTab } from "@/components/admin/AdminAdminsTab";
import { AdminLiveMapTab } from "@/components/admin/AdminLiveMapTab";
import { AdminAffiliateTab } from "@/components/admin/AdminAffiliateTab";
import { AdminBlogArticlesTab } from "@/components/admin/blog/AdminBlogArticlesTab";
import { AdminBlogCategoriesTab } from "@/components/admin/blog/AdminBlogCategoriesTab";

const tabTitles: Record<AdminTab, string> = {
  overview: 'Dashboard',
  restaurants: 'Restaurants',
  drivers: 'Livreurs',
  orders: 'Commandes',
  users: 'Utilisateurs',
  payments: 'Paiements',
  analytics: 'Analytics',
  'advanced-analytics': 'Analytics Avancés',
  support: 'Support',
  'support-inbox': 'Inbox Support',
  faq: 'Gestion FAQ',
  marketing: 'Marketing',
  settings: 'Paramètres',
  admins: 'Équipe Admin',
  'live-map': 'Carte Live',
  affiliate: 'Affiliation',
  'blog-articles': 'Blog - Articles',
  'blog-categories': 'Blog - Catégories',
};

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState({
    totalUsers: 0, totalRestaurants: 0, totalOrders: 0, totalRevenue: 0,
    pendingOrders: 0, deliveredOrders: 0, todayOrders: 0, todayRevenue: 0, 
    totalDrivers: 0, activeDrivers: 0, pendingValidations: 0, openTickets: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        { count: usersCount },
        { data: restaurantsData, count: restaurantsCount },
        { data: ordersData },
        { count: driversCount },
        { count: ticketsCount }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("restaurants").select("*", { count: "exact" }),
        supabase.from("orders").select("id, status, total, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "delivery_driver"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open")
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalRevenue = ordersData?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const todayOrdersData = ordersData?.filter(o => new Date(o.created_at) >= today) || [];
      const pendingValidations = restaurantsData?.filter(r => !r.is_validated).length || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalRestaurants: restaurantsCount || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        pendingOrders: ordersData?.filter(o => ['pending', 'preparing', 'pickup_pending'].includes(o.status)).length || 0,
        deliveredOrders: ordersData?.filter(o => o.status === "delivered").length || 0,
        todayOrders: todayOrdersData.length,
        todayRevenue: todayOrdersData.reduce((sum, o) => sum + Number(o.total), 0),
        totalDrivers: driversCount || 0,
        activeDrivers: 0,
        pendingValidations,
        openTickets: ticketsCount || 0,
      });

      setRecentOrders(ordersData?.slice(0, 10) || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverviewTab stats={stats} recentOrders={recentOrders} loading={loading} />;
      case 'restaurants':
        return <AdminRestaurantsTab />;
      case 'drivers':
        return <AdminDriversTab />;
      case 'orders':
        return <AdminOrdersTab />;
      case 'users':
        return <AdminUsersTab />;
      case 'payments':
        return <AdminPaymentsTab />;
      case 'analytics':
        return <AdminAnalyticsTab />;
      case 'advanced-analytics':
        return <AdminAdvancedAnalyticsTab />;
      case 'support':
        return <AdminSupportTab />;
      case 'support-inbox':
        return <AdminSupportInboxTab />;
      case 'faq':
        return <AdminFAQTab />;
      case 'marketing':
        return <AdminMarketingTab />;
      case 'settings':
        return <AdminSettingsTab />;
      case 'admins':
        return <AdminAdminsTab />;
      case 'live-map':
        return <AdminLiveMapTab />;
      case 'affiliate':
        return <AdminAffiliateTab />;
      case 'blog-articles':
        return <AdminBlogArticlesTab />;
      case 'blog-categories':
        return <AdminBlogCategoriesTab />;
      default:
        return <AdminOverviewTab stats={stats} recentOrders={recentOrders} loading={loading} />;
    }
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <OrderCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset className="flex-1">
          <AdminHeader 
            title={tabTitles[activeTab]} 
            onRefresh={fetchAllData}
            loading={loading}
          />
          <main className="p-4 md:p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}