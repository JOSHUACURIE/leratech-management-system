// components/layout/SchoolLayout.tsx
import { Outlet, useParams, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, School } from "lucide-react";
import api from "../../services/api";

interface SchoolInfo {
  id: string;
  name: string;
  slug: string;
  school_code: string;
  logo_url?: string;
  primary_color?: string;
  portal_title?: string;
  is_active: boolean;
}

export default function SchoolLayout() {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const { school, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // Add this
  const [isCheckingSchool, setIsCheckingSchool] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have a school slug but no school in auth context, fetch school info
    if (schoolSlug && (!school || school.slug !== schoolSlug)) {
      verifySchoolAccess();
    }
  }, [schoolSlug, school, isAuthenticated]);

  const verifySchoolAccess = async () => {
    if (!schoolSlug) return;

    setIsCheckingSchool(true);
    setError(null);

    try {
      // Fetch school info from API
      const response = await api.get(`/schools/${schoolSlug}/info`);
      
      if (response.data.success) {
        setSchoolInfo(response.data.data);
        
        // If user is authenticated but school doesn't match, show warning
        if (isAuthenticated && school && school.slug !== schoolSlug) {
          console.warn(`User is authenticated with school ${school.slug} but accessing ${schoolSlug}`);
        }
      } else {
        setError(response.data.error || "School not found");
      }
    } catch (err: any) {
      console.error("Failed to fetch school info:", err);
      
      if (err.response?.status === 404) {
        setError("School not found");
      } else if (err.response?.status === 403) {
        setError("School access denied");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Unable to verify school access");
      }
    } finally {
      setIsCheckingSchool(false);
    }
  };

  // If not authenticated, redirect to login with school slug
  if (!isAuthenticated && !authLoading) {
    const redirectPath = schoolSlug ? `/${schoolSlug}/login` : '/login';
    const from = location.pathname + location.search;
    return <Navigate to={redirectPath} state={{ from }} replace />;
  }

  // Show loading state
  if (authLoading || isCheckingSchool) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <School className="text-white" size={28} />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-indigo-200 to-violet-300 rounded-3xl blur-lg opacity-30 animate-pulse"></div>
          </div>
          
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {isCheckingSchool ? "Verifying School Access" : "Loading Session"}
          </h3>
          <p className="text-slate-500 text-sm">
            {isCheckingSchool 
              ? `Checking access to ${schoolSlug}` 
              : "Authenticating your session..."
            }
          </p>
        </div>
      </div>
    );
  }

  // If we got an error fetching school info
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50/30 p-6">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
              <AlertCircle className="text-white" size={28} />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-rose-200 to-pink-300 rounded-3xl blur-lg opacity-30"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">School Access Error</h2>
          
          <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <School className="text-rose-600" size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800">{schoolSlug}</p>
                <p className="text-sm text-slate-500">School not accessible</p>
              </div>
            </div>
            
            <div className="p-3 bg-rose-50 rounded-xl text-left">
              <p className="text-rose-700 text-sm font-medium">{error}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={verifySchoolAccess}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white transition-all"
            >
              Retry
            </button>
            <a
              href="/login"
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-center"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated but school slug doesn't match their school
  if (isAuthenticated && school && schoolSlug && school.slug !== schoolSlug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50/30 p-6">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <AlertCircle className="text-white" size={28} />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-amber-200 to-orange-300 rounded-3xl blur-lg opacity-30"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Wrong School Access</h2>
          
          <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Current URL</p>
                <p className="font-bold text-slate-800">{schoolSlug}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">Your School</p>
                <p className="font-bold text-slate-800">{school.slug}</p>
              </div>
            </div>
            
            <p className="text-slate-600 text-sm">
              You are logged into <span className="font-bold">{school.name}</span> but trying to access a different school portal.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* FIXED: Use onClick handler instead of wrapping with Navigate */}
            <button
              onClick={() => navigate(`/${school.slug}`, { replace: true })}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition-all"
            >
              Go to {school.slug}
            </button>
            
            <button
              onClick={() => {
                // Option to logout and switch schools
                window.location.href = `/${schoolSlug}/login`;
              }}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
            >
              Switch Schools
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If school exists but is not active
  if (schoolInfo && !schoolInfo.is_active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50/30 p-6">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
              <AlertCircle className="text-white" size={28} />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-rose-200 to-pink-300 rounded-3xl blur-lg opacity-30"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">School Inactive</h2>
          
          <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <School className="text-slate-600" size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800">{schoolInfo.name}</p>
                <p className="text-sm text-slate-500">{schoolInfo.school_code}</p>
              </div>
            </div>
            
            <div className="p-3 bg-rose-50 rounded-xl">
              <p className="text-rose-700 text-sm font-medium">
                This school portal is currently inactive. Please contact the school administration.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="inline-block py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If everything is valid, render the outlet
  return <Outlet />;
}

// Optional: Create a hook to get school context
export function useSchool() {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const { school } = useAuth();
  
  return {
    slug: schoolSlug,
    school,
    isCurrentSchool: school?.slug === schoolSlug,
  };
}