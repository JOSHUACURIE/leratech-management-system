import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

type UserRole = "admin" | "teacher" | "parent" | "bursar" | "student" | "secretary" | "support_staff";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  profile_picture_url?: string;
  phone?: string;
  is_email_verified?: boolean;
  avatar?: string;
  staff_id?: string | null;
  student_parent_code?: string | null;
}

interface School {
  id: string;
  name: string;
  slug: string;
  school_code: string;
  email?: string;
  primary_color?: string;
  logo_url?: string;
  portal_title?: string;
}

interface AuthContextType {
  user: User | null;
  school: School | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, schoolSlug: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  getUserFullName: () => string;
  getUserAvatar: () => string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [school, setSchool] = useState<School | null>(() => {
    const savedSchool = localStorage.getItem('school');
    return savedSchool ? JSON.parse(savedSchool) : null;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const accessToken = localStorage.getItem('accessToken');
    return !!accessToken;
  });
  
  const navigate = useNavigate();

  // Optimized redirect function - memoized with useCallback
  const redirectBasedOnRole = useCallback((role: UserRole, schoolSlug?: string) => {
    // Use provided schoolSlug or fallback to stored school
    const slug = schoolSlug || school?.slug || '';
    
    // Validate slug
    if (!slug || slug.trim() === '') {
      console.error("Invalid school slug for redirect:", slug);
      navigate('/login');
      return;
    }
    
    // Clean the slug
    const cleanSlug = slug.trim().toLowerCase();
    
    console.log("Redirecting to:", { role, cleanSlug });
    
    // Wait a small amount to ensure state is updated
    setTimeout(() => {
      switch (role) {
        case "admin":
          navigate(`/${cleanSlug}/admin/dashboard`);
          break;
        case "teacher":
          navigate(`/${cleanSlug}/teacher/dashboard`);
          break;
        case "parent":
          navigate(`/${cleanSlug}/parent/dashboard`);
          break;
        case "bursar":
          navigate(`/${cleanSlug}/bursar/dashboard`);
          break;
        case "student":
          navigate(`/${cleanSlug}/student/dashboard`);
          break;
        case "secretary":
          navigate(`/${cleanSlug}/secretary/dashboard`);
          break;
        case "support_staff":
          navigate(`/${cleanSlug}/staff/dashboard`);
          break;
        default:
          navigate(`/${cleanSlug}/dashboard`);
      }
    }, 50); // Small delay to ensure React state is updated
  }, [navigate, school]);

  // Handle redirects when auth state changes
  useEffect(() => {
    if (isAuthenticated && user && school) {
      // Only redirect if we're on login page
      if (window.location.pathname.includes('/login')) {
        console.log("Auto-redirecting after auth state update");
        redirectBasedOnRole(user.role, school.slug);
      }
    }
  }, [isAuthenticated, user, school, redirectBasedOnRole]);

  // Setup axios interceptor to attach token to all requests
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await api.post('/auth/refresh', {
                refreshToken
              });
              
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
              
              localStorage.setItem('accessToken', newAccessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              
              return api(originalRequest);
            }
          } catch (refreshError) {
            await logout();
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check authentication on initial load
  useEffect(() => {
    const checkInitialAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && !user) {
        await checkAuth();
      }
    };
    checkInitialAuth();
  }, []);
  
  const login = async (
    email: string,
    password: string,
    schoolSlug: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
        slug: schoolSlug.trim().toLowerCase(),
      });

      const responseData = response.data;
      console.log("Login response:", responseData);

      if (!responseData.success) {
        throw new Error(responseData.error || "Login failed");
      }

      if (!responseData.data) {
        throw new Error("No data received from server");
      }

      if (!responseData.data.accessToken) {
        throw new Error("No access token received from server");
      }

      // Store tokens FIRST
      localStorage.setItem('accessToken', responseData.data.accessToken);
      
      if (responseData.data.refreshToken) {
        localStorage.setItem('refreshToken', responseData.data.refreshToken);
      }

      // Extract user data
      const authenticatedUser: User = {
        id: responseData.data.user.id,
        email: responseData.data.user.email,
        first_name: responseData.data.user.first_name,
        last_name: responseData.data.user.last_name,
        role: responseData.data.user.role.toLowerCase() as UserRole,
        profile_picture_url: responseData.data.user.profile_picture_url,
        phone: responseData.data.user.phone,
        is_email_verified: responseData.data.user.is_email_verified,
        avatar: responseData.data.user.profile_picture_url,
        staff_id: responseData.data.user.staff_id,
        student_parent_code: responseData.data.user.student_parent_code,
      };

      // Extract school data
      const authenticatedSchool: School = {
        id: responseData.data.school.id,
        name: responseData.data.school.name,
        slug: responseData.data.school.slug,
        school_code: responseData.data.school.school_code,
        email: responseData.data.school.email,
        primary_color: responseData.data.school.primary_color,
        logo_url: responseData.data.school.logo_url,
        portal_title: responseData.data.school.portal_title,
      };

      // Persist to localStorage BEFORE setting state
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      localStorage.setItem('school', JSON.stringify(authenticatedSchool));

      // Now set state
      setUser(authenticatedUser);
      setSchool(authenticatedSchool);
      setIsAuthenticated(true);

      console.log("Login successful, user and school set");
      console.log("Redirecting with:", {
        role: authenticatedUser.role,
        slug: authenticatedSchool.slug
      });
      
      // Use a small timeout to ensure state is updated before redirect
      setTimeout(() => {
        redirectBasedOnRole(authenticatedUser.role, authenticatedSchool.slug);
      }, 0);
      
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Clear everything on error
      clearAuthData();
      
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('school');
    
    setUser(null);
    setSchool(null);
    setIsAuthenticated(false);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      clearAuthData();
      navigate("/login");
      setIsLoading(false);
    }
  };
  
  const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsAuthenticated(false);
      return false;
    }

    setIsLoading(true);

    try {
      const response = await api.get("/auth/me");
      const responseData = response.data;

      console.log("Check auth response:", responseData);

      if (!responseData.success) {
        throw new Error(responseData.error || "Authentication check failed");
      }

      const userData = responseData.data?.user;
      const schoolData = responseData.data?.school;

      if (!userData || !schoolData) {
        throw new Error("Invalid response structure");
      }

      // Update user
      const updatedUser: User = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role.toLowerCase() as UserRole,
        profile_picture_url: userData.profile_picture_url,
        phone: userData.phone,
        is_email_verified: userData.is_email_verified,
        avatar: userData.profile_picture_url,
        staff_id: userData.staff_id,
        student_parent_code: userData.student_parent_code,
      };

      // Update school
      const updatedSchool: School = {
        id: schoolData.id,
        name: schoolData.name,
        slug: schoolData.slug,
        school_code: schoolData.school_code,
        email: schoolData.email,
        primary_color: schoolData.primary_color,
        logo_url: schoolData.logo_url,
        portal_title: schoolData.portal_title,
      };

      // Update localStorage first
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('school', JSON.stringify(updatedSchool));

      // Then update state
      setUser(updatedUser);
      setSchool(updatedSchool);
      setIsAuthenticated(true);

      return true;
    } catch (error: any) {
      console.error("Auth check failed:", error);
      
      clearAuthData();
      
      if (!window.location.pathname.includes('/login')) {
        navigate('/login');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const getUserFullName = (): string => {
    if (!user) return "";
    return `${user.first_name} ${user.last_name}`.trim();
  };

  const getUserAvatar = (): string | undefined => {
    if (!user) return undefined;
    return user.avatar || user.profile_picture_url;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      school,
      isLoading, 
      isAuthenticated,
      login, 
      logout,
      checkAuth,
      updateUser,
      getUserFullName,
      getUserAvatar
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Higher Order Component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { isAuthenticated, user, isLoading, checkAuth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      const verifyAuth = async () => {
        if (!isAuthenticated && !isLoading) {
          const isAuth = await checkAuth();
          if (!isAuth) {
            navigate('/login');
            return;
          }
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
          navigate('/unauthorized');
        }
      };

      verifyAuth();
    }, [isAuthenticated, isLoading, user, checkAuth, navigate]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Authenticating...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };

  return AuthenticatedComponent;
};

// Hook for role-based access control
export const useRoleAccess = () => {
  const { user } = useAuth();

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isTeacher = (): boolean => {
    return user?.role === 'teacher';
  };

  const isParent = (): boolean => {
    return user?.role === 'parent';
  };

  const isBursar = (): boolean => {
    return user?.role === 'bursar';
  };

  const isStudent = (): boolean => {
    return user?.role === 'student';
  };

  const isSecretary = (): boolean => {
    return user?.role === 'secretary';
  };

  const isSupportStaff = (): boolean => {
    return user?.role === 'support_staff';
  };

  return {
    hasRole,
    isAdmin,
    isTeacher,
    isParent,
    isBursar,
    isStudent,
    isSecretary,
    isSupportStaff,
    currentRole: user?.role
  };
};