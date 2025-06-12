import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactElement } from "react";

interface PrivateRouteProps {
  children: ReactElement;
}

const PrivateRoute = ({ children }: PrivateRouteProps): ReactElement | null => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log("user", user);
  console.log("loading", loading);

  if (loading) {
    return <div>Загрузка...</div>; // Ждём пока Firebase ответит
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
