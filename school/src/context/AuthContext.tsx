// src/context/AuthContext.tsx
import React, { createContext, useContext, useState,type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type UserRole = "ADMIN" | "TEACHER" | "PARENT" | "BURSAR";

type User = {
  name: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Test credentials for all roles
const testUsers: { [key: string]: { password: string; user: User } } = {
  "admin@school.com": { password: "admin123", user: { name: "Alice Admin", role: "ADMIN" } },
  "teacher@school.com": { password: "teacher123", user: { name: "Tom Teacher", role: "TEACHER" } },
  "parent@school.com": { password: "parent123", user: { name: "Paula Parent", role: "PARENT" } },
  "bursar@school.com": { password: "bursar123", user: { name: "Ben Bursar", role: "BURSAR" } },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const login = (email: string, password: string): boolean => {
    const record = testUsers[email];
    if (record && record.password === password) {
      setUser(record.user);
      // Navigate to the dashboard based on role
      switch (record.user.role) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "TEACHER":
          navigate("/teacher/dashboard");
          break;
        case "PARENT":
          navigate("/parent/dashboard");
          break;
        case "BURSAR":
          navigate("/bursar/dashboard");
          break;
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
