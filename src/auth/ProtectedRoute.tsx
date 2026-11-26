import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute({ role }: { role?: "admin" }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="grid min-h-[50vh] place-items-center" role="status" aria-label="Loading">
        <Loader2 className="size-6 animate-spin text-muted" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role === "admin" && user.role !== "admin") return <Navigate to="/account" replace />;
  return <Outlet />;
}
