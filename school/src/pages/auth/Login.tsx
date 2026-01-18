import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Key,
  School,
  Sparkles,
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  Globe,
  Target,
  Check,
  Home
} from "lucide-react";

interface LoginFormProps {
  onToggleMode?: () => void;
}

interface FormErrors {
  schoolSlug?: string;
  email?: string;
  password?: string;
  general?: string;
}

// Define touched fields separately - only for form fields, not error fields
type TouchedFields = {
  schoolSlug: boolean;
  email: boolean;
  password: boolean;
};

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { login, isLoading: authLoading, checkAuth } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({
    schoolSlug: false,
    email: false,
    password: false,
  });

  const isLoading = authLoading || isSubmitting || isForgotPasswordSubmitting;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Validate form on field change
  useEffect(() => {
    if (touched.schoolSlug) {
      validateField('schoolSlug', schoolSlug);
    }
  }, [schoolSlug, touched.schoolSlug]);

  useEffect(() => {
    if (touched.email) {
      validateField('email', email);
    }
  }, [email, touched.email]);

  useEffect(() => {
    if (touched.password) {
      validateField('password', password);
    }
  }, [password, touched.password]);

  const validateField = (field: 'schoolSlug' | 'email' | 'password', value: string) => {
    if (!touched[field]) return;

    const newErrors = { ...errors };

    switch (field) {
      case 'schoolSlug':
        if (!value.trim()) {
          newErrors.schoolSlug = 'School slug is required';
        } else if (!/^[a-z0-9-]+$/.test(value)) {
          newErrors.schoolSlug = 'Only lowercase letters, numbers, and hyphens allowed';
        } else if (value.length < 3) {
          newErrors.schoolSlug = 'School slug must be at least 3 characters';
        } else {
          delete newErrors.schoolSlug;
        }
        break;

      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleBlur = (field: keyof TouchedFields) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate the field immediately
    switch (field) {
      case 'schoolSlug':
        validateField(field, schoolSlug);
        break;
      case 'email':
        validateField(field, email);
        break;
      case 'password':
        validateField(field, password);
        break;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!schoolSlug.trim()) {
      newErrors.schoolSlug = 'School slug is required';
    } else if (!/^[a-z0-9-]+$/.test(schoolSlug)) {
      newErrors.schoolSlug = 'Only lowercase letters, numbers, and hyphens allowed';
    } else if (schoolSlug.length < 3) {
      newErrors.schoolSlug = 'School slug must be at least 3 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    setTouched({
      schoolSlug: true,
      email: true,
      password: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(
        email.trim(),
        password,
        schoolSlug.trim().toLowerCase()
      );

      if (!success) {
     
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setErrors({
            general: 'Login failed. No access token received.'
          });
        } else {
          // Token exists, try to check auth
          try {
            const isAuthenticated = await checkAuth();
            if (!isAuthenticated) {
              setErrors({
                general: 'Login failed. Please check your credentials.'
              });
            }
          } catch (authError) {
            setErrors({
              general: 'Session validation failed. Please try again.'
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error?.response) {
        // Axios response error
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            if (data.error?.includes('Email, password, and school slug')) {
              setErrors({
                general: 'Please fill in all required fields.'
              });
            } else if (data.error?.includes('Invalid email format')) {
              setErrors({
                email: 'Invalid email format'
              });
            } else {
              setErrors({
                general: data.error || 'Invalid request. Please check your input.'
              });
            }
            break;
            
          case 401:
            if (data.error === 'Invalid credentials') {
              setErrors({
                general: 'Invalid email or password.'
              });
            } else if (data.error === 'User not associated with this school') {
              setErrors({
                general: 'This email is not registered with this school.'
              });
            } else {
              setErrors({
                general: 'Authentication failed. Please check your credentials.'
              });
            }
            break;
            
          case 403:
            if (data.error?.includes('Please verify your email address')) {
              setErrors({
                general: 'Please verify your email address before logging in.'
              });
            } else {
              setErrors({
                general: 'Access denied. Please contact your administrator.'
              });
            }
            break;
            
          case 404:
            if (data.error === 'School not found or inactive') {
              setErrors({
                schoolSlug: 'School not found or inactive.'
              });
            } else {
              setErrors({
                general: data.error || 'Resource not found.'
              });
            }
            break;
            
          case 500:
            setErrors({
              general: 'Server error. Please try again later.'
            });
            break;
            
          default:
            setErrors({
              general: data?.error || `Login failed (${status}). Please try again.`
            });
        }
      } else if (error?.request) {
        // Network error (no response received)
        setErrors({
          general: 'Network error. Please check your internet connection.'
        });
      } else if (error?.message) {
        // Other errors
        setErrors({
          general: error.message || 'An unexpected error occurred.'
        });
      } else {
        setErrors({
          general: 'Login failed. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});

  if (!email.trim() || !schoolSlug.trim()) {
    setErrors({
      general: 'Please enter both email and school slug'
    });
    return;
  }

  setIsForgotPasswordSubmitting(true);

  try {
    const response = await authAPI.forgotPassword(
      email.trim(),
      schoolSlug.trim().toLowerCase()
    );

    // Handle different response structures
    if (response.data.success || response.data.message?.includes('sent') || response.status === 200) {
      setResetEmailSent(true);
      setErrors({});
    } else {
      setErrors({
        general: response.data.error || response.data.message || 'Failed to send reset email'
      });
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    
    // Handle the formatted error from our interceptor
    if (error.status) {
      // API error with status
      switch (error.status) {
        case 404:
          setErrors({
            general: 'Email or school not found.'
          });
          break;
        case 400:
          setErrors({
            general: error.message || 'Invalid request.'
          });
          break;
        case 429:
          setErrors({
            general: 'Too many attempts. Please try again later.'
          });
          break;
        default:
          setErrors({
            general: error.message || 'Failed to send reset email. Please try again.'
          });
      }
    } else if (error.isNetworkError) {
      // Network error
      setErrors({
        general: error.message || 'Network error. Please check your connection.'
      });
    } else {
      // Other errors
      setErrors({
        general: error.message || 'An unexpected error occurred.'
      });
    }
  } finally {
    setIsForgotPasswordSubmitting(false);
  }
};
  const quickFill = (type: string) => {
    const creds: Record<string, { email: string; password: string; slug: string }> = {
      admin: { email: "admin@school.com", password: "admin123", slug: "demo" },
      teacher: { email: "teacher@school.com", password: "teacher123", slug: "demo" },
      parent: { email: "parent@school.com", password: "parent123", slug: "demo" },
      bursar: { email: "bursar@school.com", password: "bursar123", slug: "demo" },
    };
    const selected = creds[type];
    setEmail(selected.email);
    setPassword(selected.password);
    setSchoolSlug(selected.slug);
    setTouched({
      schoolSlug: true,
      email: true,
      password: true,
    });
    setErrors({});
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setErrors({});
  };

  return (
    <div className="w-full">
      {/* Mobile Header - ONLY when inside AuthEntry on mobile */}
      <div className="lg:hidden mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">LeraTech SMS</h1>
            <p className="text-sm text-slate-600">School Management System</p>
          </div>
        </div>
      </div>

      {/* Form Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-sm">
            <Key className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 font-medium mt-1">
              Sign in with your school credentials
            </p>
          </div>
        </div>

        {/* School Slug Preview */}
        {schoolSlug && (
          <div className="p-3 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 rounded-xl border border-indigo-100 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <School size={12} className="text-white" />
              </div>
              <span className="text-slate-600">Accessing school:</span>
              <span className="font-bold text-indigo-700">
                {schoolSlug}.{'ac.ke'}
              </span>
            </div>
          </div>
        )}
      </div>

      {!showForgotPassword ? (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* School Slug */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1 flex items-center gap-2">
              <Globe size={12} />
              School Slug / Subdomain
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <School size={18} />
              </div>
              <input
                type="text"
                value={schoolSlug}
                onChange={(e) => setSchoolSlug(e.target.value.toLowerCase().trim())}
                onBlur={() => handleBlur('schoolSlug')}
                className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-xl text-sm font-medium ${
                  errors.schoolSlug 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10' 
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                } outline-none transition-all placeholder:text-slate-400`}
                placeholder="mercy (mercy.leratech.ac.ke)"
                required
                disabled={isLoading}
                aria-invalid={!!errors.schoolSlug}
              />
            </div>
            {errors.schoolSlug && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.schoolSlug}
              </p>
            )}
          </div>

         
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1 flex items-center gap-2">
              <Mail size={12} />
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                onBlur={() => handleBlur('email')}
                className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-xl text-sm font-medium ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10' 
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                } outline-none transition-all placeholder:text-slate-400`}
                placeholder="name@school.ac.ke"
                required
                autoComplete="email"
                disabled={isLoading}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Lock size={12} />
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors disabled:text-slate-400"
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-xl text-sm font-medium ${
                  errors.password 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10' 
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
                } outline-none transition-all placeholder:text-slate-400`}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={isLoading}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors disabled:text-slate-300"
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.password}
              </p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div 
              className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm"
              role="alert"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={16} className="text-red-600" />
              </div>
              <span className="font-medium">{errors.general}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r from-slate-900 to-indigo-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg hover:shadow-xl shadow-indigo-200 hover:shadow-indigo-300 flex items-center justify-center gap-2 group ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      ) : (
        // Forgot Password Form
        <form onSubmit={handleForgotPassword} className="space-y-5" noValidate>
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-4">
              <Key className="text-indigo-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Reset Password</h3>
            <p className="text-slate-500 text-sm">
              Enter your email and school slug to receive reset instructions
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">
              School Slug
            </label>
            <input
              type="text"
              value={schoolSlug}
              onChange={(e) => setSchoolSlug(e.target.value.toLowerCase().trim())}
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
              placeholder="e.g. mercy"
              required
              disabled={resetEmailSent || isForgotPasswordSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
              placeholder="name@school.ac.ke"
              required
              disabled={resetEmailSent || isForgotPasswordSubmitting}
            />
          </div>

          {/* Success Message */}
          {resetEmailSent ? (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Check your email!</p>
                  <p className="text-green-700 text-sm mt-1">
                    If an account exists with this email, you will receive password reset instructions shortly.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Error Message */}
          {errors.general && !resetEmailSent && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-red-700 text-sm mt-1">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForgotPassword}
              className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              disabled={isForgotPasswordSubmitting}
            >
              Back to Login
            </button>
            
            {!resetEmailSent && (
              <button
                type="submit"
                disabled={isForgotPasswordSubmitting}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                {isForgotPasswordSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            )}
          </div>
        </form>
      )}

      {/* Register Link */}
      {onToggleMode && !showForgotPassword && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Setting up a new school?{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline transition-colors disabled:text-slate-400"
            disabled={isLoading}
          >
            Register now
          </button>
        </p>
      )}

      {/* Development Quick Access */}
      {!showForgotPassword && isDevelopment && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles size={14} className="text-amber-500" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Development Quick Access
            </p>
            <Sparkles size={14} className="text-amber-500" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {["admin", "teacher", "parent", "bursar"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => quickFill(role)}
                className="py-2.5 rounded-lg border border-slate-100 bg-white text-xs font-semibold uppercase text-slate-500 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-violet-50 hover:border-indigo-200 hover:text-indigo-600 transition-all hover:shadow-sm"
                disabled={isLoading}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} LeraTech School Management System
        </p>
        <p className="text-center text-slate-300 text-[10px] mt-1">
          v1.0.0 • Secure multi-tenant platform • Built for Kenyan Education
        </p>
      </div>
    </div>
  );
};

export default LoginForm;