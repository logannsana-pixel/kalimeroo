import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { useLocation } from "@/contexts/LocationContext";

interface CityGateProps {
  children: ReactNode;
}

// Routes that don't require city selection
const PUBLIC_ROUTES = [
  "/welcome",
  "/auth",
  "/auth/customer",
  "/auth/restaurant", 
  "/auth/delivery",
  "/auth/admin",
  "/help",
  "/admin-dashboard",
  "/restaurant-dashboard",
  "/delivery-dashboard"
];

export const CityGate = ({ children }: CityGateProps) => {
  const { city } = useLocation();
  const navigate = useNavigate();
  const location = useRouterLocation();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      location.pathname === route || location.pathname.startsWith(route + "/")
    );

    // If no city and not on a public route, redirect to welcome
    if (!city && !isPublicRoute) {
      navigate("/welcome", { replace: true });
    }
  }, [city, location.pathname, navigate]);

  return <>{children}</>;
};
