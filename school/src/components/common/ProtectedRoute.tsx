import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type UserRole = "admin" | "teacher" | "parent" | "bursar" | string;

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If no user is authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize the user's role to lowercase for consistent comparison
  const userRole = user.role?.toLowerCase() as UserRole;
  
  // If specific roles are required, check if user has access
  if (allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) {
      console.warn(
        `Access denied: User with role "${userRole}" tried to access route requiring [${allowedRoles.join(", ")}]`
      );
      
      // Redirect to appropriate dashboard based on user's role
      const roleDashboardMap: Record<UserRole, string> = {
        admin: "/admin/dashboard",
        teacher: "/teacher/dashboard",
        parent: "/parent/dashboard",
        bursar: "/bursar/dashboard",
      };

      const redirectPath = roleDashboardMap[userRole] || "/";
      return <Navigate to={redirectPath} replace />;
    }
  }

  // If no specific roles required or user has access, render children
  return <>{children}</>;
};

// Optional: Add a helper component for common role-based routes
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>
);

export const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["teacher"]}>{children}</ProtectedRoute>
);

export const ParentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["parent"]}>{children}</ProtectedRoute>
);

export const BursarRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["bursar"]}>{children}</ProtectedRoute>
);

export default ProtectedRoute;