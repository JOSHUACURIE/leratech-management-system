// src/components/common/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: Array<"ADMIN" | "TEACHER" | "PARENT" | "BURSAR">;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role is not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Optionally redirect to their own dashboard
    switch (user.role) {
      case "ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      case "TEACHER":
        return <Navigate to="/teacher/dashboard" replace />;
      case "PARENT":
        return <Navigate to="/parent/dashboard" replace />;
      case "BURSAR":
        return <Navigate to="/bursar/dashboard" replace />;
    }
  }

  // Authorized
  return <>{children}</>;
};

export default ProtectedRoute;
