import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { LocationProvider } from "@/contexts/LocationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AlertEngine } from "@/components/alerts/AlertEngine";
import { FloatingCart } from "@/components/FloatingCart";
import { NetworkStatus } from "@/components/NetworkStatus";
import { Skeleton } from "@/components/ui/skeleton";

// ici 
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const HostRedirect = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  useEffect(() => {
    // On attend que le DOM soit prêt
    setReady(true);

    // Si sous-domaine admin-panel et pas déjà sur /auth/admin, on redirige
    if (
      hostname.startsWith("admin-panel.") &&
      !location.pathname.startsWith("/auth/admin")
    ) {
      navigate("/auth/admin", { replace: true });
    }
  }, [hostname, location.pathname, navigate]);

  if (!ready) return null; // loader minimal

  return <>{children}</>;
};




// Lazy loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Restaurants = lazy(() => import("./pages/Restaurants"));
const RestaurantDetail = lazy(() => import("./pages/RestaurantDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const RestaurantDashboard = lazy(() => import("./pages/RestaurantDashboard"));
const DeliveryDashboard = lazy(() => import("./pages/DeliveryDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const EnableAlerts = lazy(() => import("./pages/EnableAlerts"));
const AlertPlayground = lazy(() => import("./pages/AlertPlayground"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth pages
const CustomerAuth = lazy(() => import("./pages/auth/CustomerAuth"));
const RestaurantAuth = lazy(() => import("./pages/auth/RestaurantAuth"));
const DeliveryAuth = lazy(() => import("./pages/auth/DeliveryAuth"));
const AdminAuth = lazy(() => import("./pages/auth/AdminAuth"));

// Page loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md p-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
      <div className="space-y-2">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <NetworkStatus />
              <AlertEngine />
              <FloatingCart />
              <Suspense fallback={<PageLoader />}>
                <HostRedirect>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    
                    {/* Auth routes - role specific */}
                    <Route path="/auth" element={<CustomerAuth />} />
                    <Route path="/auth/customer" element={<CustomerAuth />} />
                    <Route path="/auth/restaurant" element={<RestaurantAuth />} />
                    <Route path="/auth/delivery" element={<DeliveryAuth />} />
                    <Route path="/auth/admin" element={<AdminAuth />} />
                    
                    <Route path="/restaurants" element={<Restaurants />} />
                    <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                    <Route path="/enable-alerts" element={<EnableAlerts />} />
                    <Route path="/dev/alerts" element={<AlertPlayground />} />
                    <Route 
                      path="/cart" 
                      element={
                        <ProtectedRoute allowedRoles={["customer"]}>
                          <Cart />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/checkout" 
                      element={
                        <ProtectedRoute allowedRoles={["customer"]}>
                          <Checkout />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/orders" 
                      element={
                        <ProtectedRoute allowedRoles={["customer"]}>
                          <Orders />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/customer-dashboard" 
                      element={
                        <ProtectedRoute allowedRoles={["customer"]}>
                          <CustomerDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/restaurant-dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["restaurant_owner"]}>
                          <RestaurantDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/delivery-dashboard" 
                      element={
                        <ProtectedRoute allowedRoles={["delivery_driver"]}>
                          <DeliveryDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin-dashboard" 
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </HostRedirect>
              </Suspense>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
