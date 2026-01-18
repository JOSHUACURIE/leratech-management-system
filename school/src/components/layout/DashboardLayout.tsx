import React, { type ReactNode, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../common/SideBar";
import TopNavbar from "../common/TopNavBar";
import { useParams, useNavigate } from "react-router-dom";
import { 
  AlertCircle, 
  School, 
  Shield, 
  Users,
  Home,
  LogOut,
  RefreshCw,
  ArrowLeft
} from "lucide-react";

type DashboardLayoutProps = {
  role?: "admin" | "teacher" | "parent" | "bursar" | "student" | "secretary" | "support_staff";
  children: ReactNode;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  children,
}) => {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const { 
    user, 
    school, 
    logout, 
    isLoading, 
    getUserFullName, 
    getUserAvatar,
    checkAuth 
  } = useAuth();
  const navigate = useNavigate();
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Verify school access on mount
  useEffect(() => {
    const verifyAccess = async () => {
      if (!schoolSlug || !user) return;
      
      // If school slug doesn't match user's school, show error
      if (school && school.slug !== schoolSlug) {
        setAccessError(`You are trying to access ${schoolSlug} but your account is registered with ${school.slug}`);
        return;
      }

      // Additional verification for sensitive pages
      if (role && user.role !== role) {
        console.warn(`User role (${user.role}) doesn't match layout role (${role})`);
        // You might want to redirect based on actual role
        // navigate(`/${schoolSlug}/${user.role}/dashboard`);
      }
    };

    verifyAccess();
  }, [schoolSlug, user, school, role, navigate]);

  // Show loading state while auth is being verified
  if (isLoading || isVerifyingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <School className="text-white" size={28} />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-indigo-200 to-violet-300 rounded-3xl blur-lg opacity-30 animate-pulse"></div>
          </div>
          
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {isVerifyingAccess ? "Verifying Access" : "Loading Dashboard"}
          </h3>
          <p className="text-slate-500 text-sm">
            {schoolSlug ? `Preparing ${schoolSlug} portal...` : "Setting up your dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user || !school) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50/30 p-6">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
              <AlertCircle className="text-white" size={28} />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-rose-200 to-pink-300 rounded-3xl blur-lg opacity-30"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Session Expired</h2>
          
          <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm mb-6">
            <p className="text-slate-600 mb-4">
              Your session has expired or you are not authenticated.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(schoolSlug ? `/${schoolSlug}/login` : '/login')}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition-all"
              >
                Go to Login
              </button>
              
              <button
                onClick={async () => {
                  setIsVerifyingAccess(true);
                  const success = await checkAuth();
                  setIsVerifyingAccess(false);
                  if (success) {
                    window.location.reload();
                  }
                }}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access error if school slug doesn't match
  if (accessError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50/30 p-6">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Shield className="text-white" size={28} />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-amber-200 to-orange-300 rounded-3xl blur-lg opacity-30"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Access Restricted</h2>
          
          <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <School className="text-slate-600" size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800">{school.name}</p>
                <p className="text-sm text-slate-500">{school.school_code}</p>
              </div>
            </div>
            
            <div className="p-3 bg-amber-50 rounded-xl mb-4">
              <p className="text-amber-700 text-sm font-medium">{accessError}</p>
            </div>
            
            <p className="text-slate-600 text-sm">
              You can only access the school portal that matches your account.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(`/${school.slug}`)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition-all flex items-center justify-center gap-2"
            >
              <Home size={16} />
              Go to {school.slug}
            </button>
            
            <button
              onClick={logout}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine actual role to use (use user's role if role prop not provided)
  const actualRole = role || user.role;

  const handleLogout = () => {
    logout();
  };

  const handleNotificationClick = () => {
    console.log("Notification clicked");
  };

  const handleProfileClick = () => {
    console.log("Profile clicked");
  };

  const handleBackToSchool = () => {
    navigate(`/${schoolSlug}`);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar role={actualRole} schoolSlug={schoolSlug} />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
        {/* Top Navigation Bar - Only pass necessary props */}
        <TopNavbar 
          school={school}
          user={user}
          notificationsCount={3} // You can fetch this from context if available
          onNotificationClick={handleNotificationClick}
          onProfileClick={handleProfileClick}
          onLogout={handleLogout}
        />

        {/* School Context Header */}
        {schoolSlug && (
          <div className="bg-white/50 border-b border-slate-100 px-6 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                  <School size={12} className="text-indigo-600" />
                </div>
                <span className="text-slate-600">School Portal:</span>
                <span className="font-bold text-slate-800">{school.name}</span>
                <span className="text-slate-400">({schoolSlug}.ac.ke)</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">
                    Logged in as <span className="text-indigo-600 font-bold">{getUserFullName()}</span>
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {/* Subtle Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/30 to-transparent -z-10" />
          
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
            
            {children}
          </div>

          {/* Spacer to prevent content from hitting the footer too abruptly */}
          <div className="h-20" />
        </main>

        {/* Footer with school info */}
        <footer className="bg-white/80 backdrop-blur-md border-t border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                System Status: Operational
              </p>
            </div>
            
            {school && (
              <div className="hidden md:flex items-center gap-2 border-l border-slate-100 pl-4">
                <School size={12} className="text-slate-400" />
                <p className="text-xs text-slate-500">
                  {school.name} • {school.school_code}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <p className="text-[11px] font-medium text-slate-400">
              © {new Date().getFullYear()} <span className="text-slate-900 font-bold">LeraTech SMS</span>. All rights reserved.
            </p>
            <div className="hidden md:flex items-center gap-4 border-l border-slate-100 pl-6">
              <button 
                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                onClick={() => window.open('/support', '_blank')}
              >
                Support
              </button>
              <button 
                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                onClick={() => window.open('/privacy', '_blank')}
              >
                Privacy
              </button>
              {user.role === 'admin' && (
                <button 
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                  onClick={() => navigate(`/${schoolSlug}/admin/settings`)}
                >
                  School Settings
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;