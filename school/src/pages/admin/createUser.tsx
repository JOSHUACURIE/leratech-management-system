"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import {
  UserPlus, Mail, User, Phone, Briefcase,
  GraduationCap, ShieldCheck, Building2,
  Fingerprint, Send, Loader2, Info,
  type LucideIcon
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import api from "../../services/api";

type UserRole = "teacher" | "bursar" | "parent" | "student" | "secretary" | "support_staff";

// ────────────────────────────────────────────────
// Form data type
// ────────────────────────────────────────────────
interface CreateUserFormData {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  title?: string;
  department?: string;
  staff_id?: string;
  student_parent_code?: string;
  send_welcome_email: boolean;
}

// ────────────────────────────────────────────────
// Response types (aligned with your backend)
// ────────────────────────────────────────────────
interface ApiSuccessResponse {
  success: true;
  message: string;
  data: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone?: string;
    staff_id?: string;
    student_parent_code?: string;
    title?: string;
    department?: string;
    school: {
      id: string;
      name: string;
      code: string;
    };
    is_new_user: boolean;
    requires_password_reset: boolean;
    email_sent: boolean;
  };
}

interface RoleConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  fields?: string[];
}

const roleConfigs: Record<UserRole, RoleConfig> = {
  teacher: { label: "Teacher", icon: GraduationCap, color: "text-blue-600", bgColor: "bg-blue-50", fields: ["staff_id", "title", "department"] },
  bursar: { label: "Bursar", icon: Briefcase, color: "text-purple-600", bgColor: "bg-purple-50", fields: ["staff_id", "title", "department"] },
  parent: { label: "Parent", icon: Building2, color: "text-indigo-600", bgColor: "bg-indigo-50", fields: ["student_parent_code"] },
  student: { label: "Student", icon: GraduationCap, color: "text-green-600", bgColor: "bg-green-50", fields: ["staff_id"] },
  secretary: { label: "Secretary", icon: Briefcase, color: "text-amber-600", bgColor: "bg-amber-50", fields: ["staff_id", "title", "department"] },
  support_staff: { label: "Support Staff", icon: ShieldCheck, color: "text-gray-600", bgColor: "bg-gray-50", fields: ["staff_id", "title", "department"] },
};

// ────────────────────────────────────────────────
// Custom validation functions
// ────────────────────────────────────────────────
const validateForm = (data: CreateUserFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Email validation
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  // First name validation
  if (!data.first_name.trim()) {
    errors.first_name = "First name is required";
  } else if (data.first_name.trim().length < 2) {
    errors.first_name = "First name must be at least 2 characters";
  } else if (data.first_name.trim().length > 100) {
    errors.first_name = "First name must be less than 100 characters";
  }

  // Last name validation
  if (!data.last_name.trim()) {
    errors.last_name = "Last name is required";
  } else if (data.last_name.trim().length < 2) {
    errors.last_name = "Last name must be at least 2 characters";
  } else if (data.last_name.trim().length > 100) {
    errors.last_name = "Last name must be less than 100 characters";
  }

  // Role validation
  if (!data.role) {
    errors.role = "Role is required";
  }

  // Phone validation (optional)
  if (data.phone && data.phone.trim()) {
    const phoneRegex = /^\+?[0-9\s\-()]{9,}$/;
    if (!phoneRegex.test(data.phone.trim())) {
      errors.phone = "Invalid phone number format";
    }
  }

  // Role-specific validations
  if (["teacher", "bursar", "secretary", "support_staff"].includes(data.role) && !data.staff_id?.trim()) {
    errors.staff_id = "Staff ID is required for this role";
  }

  if (data.role === "parent" && !data.student_parent_code?.trim()) {
    errors.student_parent_code = "Parent/Guardian code is required for parents";
  }

  if (data.role === "student" && !data.staff_id?.trim()) {
    errors.staff_id = "Admission/Student number is required for students";
  }

  // Title validation (optional)
  if (data.title && data.title.trim().length > 60) {
    errors.title = "Title must be less than 60 characters";
  }

  // Department validation (optional)
  if (data.department && data.department.trim().length > 100) {
    errors.department = "Department must be less than 100 characters";
  }

  return errors;
};

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────
export default function CreateUserForm() {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const { school, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors: hookFormErrors },
    reset,
    setError,
    clearErrors,
  } = useForm<CreateUserFormData>({
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      role: "teacher",
      phone: "",
      title: "",
      department: "",
      staff_id: "",
      student_parent_code: "",
      send_welcome_email: true,
    },
  });

  const selectedRole = watch("role");
  const currentRoleConfig = roleConfigs[selectedRole];

  const onSubmit: SubmitHandler<CreateUserFormData> = async (data) => {
    setIsSubmitting(true);
    setServerError(null);
    setValidationErrors({});
    clearErrors();

    // Validate form data
    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors(validationErrors);
      // Also set errors in react-hook-form for field-level display
      Object.entries(validationErrors).forEach(([field, message]) => {
        setError(field as keyof CreateUserFormData, {
          type: "manual",
          message,
        });
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Validate that we have school context
      if (!school || !schoolSlug) {
        throw new Error("School context is missing. Please refresh the page or log in again.");
      }

      // Check if user has admin privileges
      if (user?.role !== 'admin') {
        throw new Error("You do not have permission to create users.");
      }

      const payload = {
        ...data,
        phone: data.phone?.trim() || undefined,
        title: data.title?.trim() || undefined,
        department: data.department?.trim() || undefined,
        staff_id: data.staff_id?.trim() || undefined,
        student_parent_code: data.student_parent_code?.trim() || undefined,
      };

      console.log("Creating user with payload:", payload);
      console.log("School slug from URL:", schoolSlug);
      console.log("User role:", user?.role);
      console.log("School from auth:", school);

      const response = await api.post<ApiSuccessResponse>("/auth/users", payload);
      
      console.log("Create user response:", response.data);

      if (response.data.success) {
        const userData = response.data.data;

        toast.success(
          userData.is_new_user
            ? `✅ ${userData.first_name} created successfully! Welcome email ${
                userData.email_sent ? "sent" : "queued"
              }.`
            : `✅ ${userData.first_name} added to school successfully!`
        );

        reset();
      }
    } catch (err: any) {
      console.error("Create user failed:", err);
      
      // Enhanced error logging
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        console.error('No response received:', err.request);
      } else {
        console.error('Request error:', err.message);
      }

      let errorMessage = "Failed to create user. Please try again.";
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
        
        // Handle specific error cases
        if (err.response.data.error.includes("School not found")) {
          errorMessage = "Your school account is not active or not found. Please contact support.";
        } else if (err.response.data.error.includes("Only administrators")) {
          errorMessage = "Only administrators can create users.";
        } else if (err.response.data.error.includes("Missing school context")) {
          errorMessage = "School context is missing. Please refresh the page or log in again.";
        } else if (err.response.data.error.includes("User already exists")) {
          errorMessage = "A user with this email already exists in this school.";
        } else if (err.response.data.error.includes("Unique constraint")) {
          errorMessage = "A user with this email already exists.";
        } else if (err.response.data.error.includes("Staff ID is required")) {
          errorMessage = "Staff ID is required for this role.";
          setValidationErrors(prev => ({ ...prev, staff_id: "Staff ID is required" }));
        } else if (err.response.data.error.includes("Parent/Guardian code is required")) {
          errorMessage = "Parent/Guardian code is required for parents.";
          setValidationErrors(prev => ({ ...prev, student_parent_code: "Parent/Guardian code is required" }));
        } else if (err.response.data.error.includes("Admission/Student number is required")) {
          errorMessage = "Admission/Student number is required for students.";
          setValidationErrors(prev => ({ ...prev, staff_id: "Admission/Student number is required" }));
        }
      } else if (err.response?.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You do not have permission to perform this action.";
      } else if (err.response?.status === 404) {
        errorMessage = "School not found. Please check the school slug.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setServerError(errorMessage);
      toast.error(errorMessage);

      // Optional: field-level errors (if backend sends them later)
      if (err.response?.data?.fields) {
        Object.entries(err.response.data.fields).forEach(([field, msg]) => {
          setError(field as keyof CreateUserFormData, {
            type: "server",
            message: String(msg),
          });
        });
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  // Show warning if user is not admin
  if (user && user.role !== 'admin') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-200">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Access Denied</h2>
            <p className="text-slate-500 text-sm font-medium">You do not have permission to create users</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-red-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="text-red-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Admin Access Required</h3>
          <p className="text-slate-600 mb-6">
            Only administrators can create new user accounts. If you believe this is an error, 
            please contact your school administrator.
          </p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-sm text-slate-500">
              Your role: <span className="font-bold text-slate-800">{user.role}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Combine hook form errors with custom validation errors
  const allErrors = { ...hookFormErrors, ...validationErrors };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <UserPlus className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Create New Profile</h2>
          <p className="text-slate-500 text-sm font-medium">
            Add a new member to {school?.name || schoolSlug}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
              Admin Access
            </div>
            {schoolSlug && (
              <div className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                {schoolSlug}.ac.ke
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Server/global error */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-2 text-red-700">
            <Info size={16} />
            <span className="font-medium">{serverError}</span>
          </div>
          <p className="text-sm text-red-600 mt-2">
            If this error persists, please:
            <ol className="list-decimal ml-5 mt-1 space-y-1">
              <li>Refresh the page</li>
              <li>Check your internet connection</li>
              <li>Contact support if the issue continues</li>
            </ol>
          </p>
        </div>
      )}

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <p className="font-semibold text-slate-700 mb-1">Debug Info:</p>
          <p>School Slug: {schoolSlug || 'Not found'}</p>
          <p>User Role: {user?.role || 'Not logged in'}</p>
          <p>School Name: {school?.name || 'Not loaded'}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identity Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            <Fingerprint size={14} /> Identity Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="First Name" icon={<User size={18}/>} error={allErrors.first_name?.message} registration={register("first_name")} placeholder="e.g. David" />
            <InputField label="Last Name" icon={<User size={18}/>} error={allErrors.last_name?.message} registration={register("last_name")} placeholder="e.g. Ndungu" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Email Address" type="email" icon={<Mail size={18}/>} error={allErrors.email?.message} registration={register("email")} placeholder="d.ndungu@school.ac.ke" />
            <InputField label="Phone Number" type="tel" icon={<Phone size={18}/>} error={allErrors.phone?.message} registration={register("phone")} placeholder="+254..." />
          </div>
        </div>

        {/* Role & Attributes Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            <ShieldCheck size={14} /> Access & Assignment
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">System Role</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Briefcase size={18} />
              </div>
              <select
                {...register("role")}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-600 transition-all appearance-none"
              >
                {Object.entries(roleConfigs).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
              {allErrors.role?.message && (
                <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 ml-1 mt-1">
                  <Info size={10} /> {allErrors.role.message}
                </p>
              )}
            </div>
          </div>

          {/* Role preview card */}
          <div className={`p-4 ${currentRoleConfig.bgColor} rounded-2xl flex items-center gap-3`}>
            <currentRoleConfig.icon className={`${currentRoleConfig.color}`} size={20} />
            <div>
              <p className="text-sm font-bold text-slate-800">{currentRoleConfig.label} Profile</p>
              <p className="text-xs text-slate-500">
                {selectedRole === "teacher" && "Teaching staff with class & grade management"}
                {selectedRole === "bursar" && "Handles fees, payments & financial reports"}
                {selectedRole === "parent" && "Views student progress & receives alerts"}
                {selectedRole === "student" && "Access to timetable, assignments & results"}
                {selectedRole === "secretary" && "Office admin & record keeping"}
                {selectedRole === "support_staff" && "General support & maintenance"}
              </p>
            </div>
          </div>

          {/* Conditional role fields */}
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {["teacher", "bursar", "secretary", "support_staff"].includes(selectedRole) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl">
                <InputField label="Staff ID" dense registration={register("staff_id")} error={allErrors.staff_id?.message} placeholder="STF/..." />
                <InputField label="Position/Title" dense registration={register("title")} error={allErrors.title?.message} placeholder="e.g. H.O.D" />
                <InputField label="Department" dense registration={register("department")} error={allErrors.department?.message} placeholder="e.g. Mathematics" />
              </div>
            )}

            {selectedRole === "student" && (
              <div className="p-4 bg-blue-50/50 rounded-2xl">
                <InputField label="Admission / Student Number" dense registration={register("staff_id")} error={allErrors.staff_id?.message} placeholder="ADM/2025/..." />
              </div>
            )}

            {selectedRole === "parent" && (
              <div className="p-4 bg-indigo-50/50 rounded-2xl">
                <InputField label="Parent / Guardian Code" dense registration={register("student_parent_code")} error={allErrors.student_parent_code?.message} placeholder="PAR/2025/..." />
              </div>
            )}
          </div>
        </div>

        {/* Welcome email toggle */}
        <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors group">
          <input
            type="checkbox"
            {...register("send_welcome_email")}
            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all checked:bg-indigo-600 checked:border-indigo-600"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">Send Welcome Email</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
              User receives login credentials & portal link
            </span>
          </div>
          <Send size={16} className="ml-auto text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !user || user.role !== 'admin'}
          className="w-full bg-slate-900 text-white py-4 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Creating...
            </>
          ) : (
            <>
              Create Profile
              <Send size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// InputField component (updated)
function InputField({
  label,
  icon,
  error,
  registration,
  placeholder,
  type = "text",
  dense = false,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  registration: any;
  placeholder?: string;
  type?: string;
  dense?: boolean;
}) {
  return (
    <div className="w-full space-y-1.5">
      <label className={`text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 ${dense ? 'opacity-70' : ''}`}>
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          {...registration}
          placeholder={placeholder}
          className={`
            w-full ${icon ? 'pl-12' : 'px-5'} pr-4 ${dense ? 'py-3' : 'py-4'}
            bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold
            text-slate-800 outline-none transition-all
            placeholder:text-slate-300 placeholder:font-medium
            focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20
            ${error ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 ml-1">
          <Info size={10} /> {error}
        </p>
      )}
    </div>
  );
}