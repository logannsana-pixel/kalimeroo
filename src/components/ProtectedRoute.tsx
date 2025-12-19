import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        // Redirect based on user role
        switch (userRole) {
          case "restaurant_owner":
            navigate("/restaurant-dashboard");
            break;
          case "delivery_driver":
            navigate("/delivery-dashboard");
            break;
          case "admin":
            navigate("/admin-dashboard");
            break;
          default:
            navigate("/");
        }
      }
    }
  }, [user, userRole, loading, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
};
