import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Globe, Building, User, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

interface SchoolSetupWizardProps {
  onBackToLogin: () => void;
}

const SchoolSetupWizard: React.FC<SchoolSetupWizardProps> = ({ onBackToLogin }) => {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);

  const [formData, setFormData] = useState({
    // School details
    school_code: "",
    name: "",
    email: "",
    slug: "",
    address: "",
    phone: "",
    website: "",
    curriculum_type: "8-4-4",
    custom_domain: "",
    primary_color: "#3B82F6",
    portal_title: "",
    welcome_message: "",
    
    // Admin details
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
    adminFirstName: "",
    adminLastName: "",
    adminPhone: "",
    adminNationalId: "",
    adminDOB: "",
    adminGender: "male"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create axios instance with base URL
  const api = axios.create({
    baseURL: "http://localhost:3000/api/v1",
    timeout: 10000,
  });

  // Fetch suggested school code on mount
  useEffect(() => {
    fetchSuggestedCode();
  }, []);

  // Debounced slug availability check
  useEffect(() => {
    if (formData.slug.length >= 3) {
      setCheckingSlug(true);
      const timer = setTimeout(() => {
        checkSlugAvailability(formData.slug);
      }, 500);
      
      return () => {
        clearTimeout(timer);
        setCheckingSlug(false);
      };
    } else {
      setSlugAvailable(null);
    }
  }, [formData.slug]);

  const fetchSuggestedCode = async () => {
    try {
      setGeneratingCode(true);
      const response = await api.get("/setup/suggest-school-code");
      if (response.data.code) {
        setSuggestedCode(response.data.code);
        setFormData(prev => ({ ...prev, school_code: response.data.code }));
      }
    } catch (error: any) {
      console.error("Failed to fetch school code:", error);
      // Fallback to manual generation
      const fallbackCode = `SCH${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
      setSuggestedCode(fallbackCode);
      setFormData(prev => ({ ...prev, school_code: fallbackCode }));
    } finally {
      setGeneratingCode(false);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    if (slug.length < 3) return;
    
    try {
      setCheckingSlug(true);
      const response = await api.get(`/setup/check-slug/${slug}`);
      setSlugAvailable(response.data.available);
    } catch (error: any) {
      console.error("Failed to check slug:", error);
      // Don't show error to user for slug check
    } finally {
      setCheckingSlug(false);
    }
  };

  const updateData = (newData: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
    // Clear errors for updated fields
    const fieldNames = Object.keys(newData);
    setErrors(prev => {
      const newErrors = { ...prev };
      fieldNames.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = "School name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    else if (formData.slug.length < 3) newErrors.slug = "Slug must be at least 3 characters";
    else if (!/^[a-z0-9-]+$/.test(formData.slug)) newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    else if (slugAvailable === false) newErrors.slug = "This slug is already taken";
    
    if (!formData.email.trim()) newErrors.email = "School email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    
    if (!formData.school_code.trim()) newErrors.school_code = "School code is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.adminEmail.trim()) newErrors.adminEmail = "Admin email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) newErrors.adminEmail = "Invalid email format";
    
    if (!formData.adminPassword) newErrors.adminPassword = "Password is required";
    else if (formData.adminPassword.length < 8) newErrors.adminPassword = "Password must be at least 8 characters";
    
    if (formData.adminPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (!formData.adminFirstName.trim()) newErrors.adminFirstName = "First name is required";
    if (!formData.adminLastName.trim()) newErrors.adminLastName = "Last name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({}); // Clear previous errors
    
    try {
      const setupData = {
        school_code: formData.school_code.toUpperCase(),
        name: formData.name,
        email: formData.email,
        slug: formData.slug,
        address: formData.address || null,
        phone: formData.phone || null,
        website: formData.website || null,
        curriculum_type: formData.curriculum_type,
        custom_domain: formData.custom_domain || null,
        primary_color: formData.primary_color,
        portal_title: formData.portal_title || `${formData.name} Portal`,
        welcome_message: formData.welcome_message || `Welcome to ${formData.name} School Management System`,
        admin: {
          email: formData.adminEmail,
          password: formData.adminPassword,
          first_name: formData.adminFirstName,
          last_name: formData.adminLastName,
          phone: formData.adminPhone || null,
          national_id: formData.adminNationalId || null,
          date_of_birth: formData.adminDOB || null,
          gender: formData.adminGender
        }
      };

      const response = await api.post("/setup", setupData);

      // Check if response has success flag
      if (response.data.success) {
        const { data } = response.data;
        
        // Store session token if returned
        if (data.sessionToken) {
          localStorage.setItem('sessionToken', data.sessionToken);
        }

        // Auto-login after successful setup using the session token
        // Option 1: Use the login function with credentials
        const loginSuccess = await login(
          formData.adminEmail,
          formData.adminPassword,
          formData.slug
        );

        if (!loginSuccess) {
          // If auto-login fails but setup succeeded, use the returned session
          // Option 2: Manually set auth state if login function fails
          setErrors({ 
            submit: "School created successfully! Redirecting to dashboard..." 
          });
          
          // Store user data in context/local storage
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('school', JSON.stringify(data.school));
          localStorage.setItem('sessionToken', data.sessionToken);
          
          // Redirect after delay
          setTimeout(() => {
            window.location.href = `/admin/dashboard?school=${formData.slug}`;
          }, 2000);
        }
      } else {
        throw new Error(response.data.error || "Setup failed");
      }

    } catch (error: any) {
      console.error("Setup error:", error);
      
      // Handle axios errors
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        
        if (status === 400 && data.fields) {
          // Field-specific errors from server validation
          const fieldErrors: Record<string, string> = {};
          data.fields.forEach((field: string) => {
            const fieldName = field.replace('admin.', '');
            fieldErrors[fieldName] = `${fieldName} is required`;
          });
          setErrors(fieldErrors);
        } else if (status === 409) {
          // Conflict errors (duplicate slug/email/code)
          setErrors({ submit: data.error || "This school already exists" });
        } else if (data.error) {
          setErrors({ submit: data.error });
        } else {
          setErrors({ submit: "Failed to create school. Please try again." });
        }
      } else if (error.request) {
        // Request was made but no response received
        setErrors({ submit: "Network error. Please check your connection." });
      } else {
        // Something happened in setting up the request
        setErrors({ submit: error.message || "Failed to create school. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <Building className="text-indigo-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">School Information</h2>
          <p className="text-slate-500 text-sm">Basic details about your institution</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">School Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className={`w-full p-3 rounded-xl border ${errors.name ? 'border-red-300' : 'border-slate-200'} bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
            placeholder="Mercy Academy"
            required
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">School Code *</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.school_code}
              onChange={(e) => updateData({ school_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
              className={`w-full p-3 rounded-xl border ${errors.school_code ? 'border-red-300' : 'border-slate-200'} bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
              placeholder="SCH202401A"
              required
              maxLength={20}
            />
            <button
              type="button"
              onClick={fetchSuggestedCode}
              disabled={generatingCode}
              className="px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2"
            >
              {generatingCode ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              Generate
            </button>
          </div>
          {errors.school_code && <p className="text-red-500 text-xs mt-1">{errors.school_code}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-600">School Slug *</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Globe size={18} />
          </div>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => updateData({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            className={`w-full pl-10 pr-24 p-3 rounded-xl border ${
              errors.slug ? 'border-red-300' : 
              slugAvailable === false ? 'border-red-300' : 
              slugAvailable === true ? 'border-green-300' : 
              'border-slate-200'
            } bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
            placeholder="mercy-academy"
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checkingSlug ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : slugAvailable === true ? (
              <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Available</span>
            ) : slugAvailable === false ? (
              <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded">Taken</span>
            ) : null}
          </div>
        </div>
        <div className="flex justify-between">
          {errors.slug && <p className="text-red-500 text-xs">{errors.slug}</p>}
          <p className="text-slate-400 text-xs ml-auto">
            Will be used as: {formData.slug || 'yourschool'}.ac.ke
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-600">School Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateData({ email: e.target.value })}
          className={`w-full p-3 rounded-xl border ${errors.email ? 'border-red-300' : 'border-slate-200'} bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
          placeholder="info@mercyacademy.ac.ke"
          required
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Curriculum Type</label>
          <select
            value={formData.curriculum_type}
            onChange={(e) => updateData({ curriculum_type: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="8-4-4">8-4-4 System (Kenya)</option>
            <option value="cbc">CBC (Competency Based Curriculum)</option>
            <option value="igcse">IGCSE</option>
            <option value="ib">International Baccalaureate</option>
            <option value="american">American Curriculum</option>
            <option value="british">British Curriculum</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.primary_color}
              onChange={(e) => updateData({ primary_color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.primary_color}
              onChange={(e) => updateData({ primary_color: e.target.value })}
              className="flex-1 p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="#3B82F6"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="+254 712 345 678"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => updateData({ website: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="https://mercyacademy.ac.ke"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-600">Address</label>
        <textarea
          value={formData.address}
          onChange={(e) => updateData({ address: e.target.value })}
          className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          placeholder="P.O. Box 12345, Nairobi, Kenya"
          rows={3}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Portal Title</label>
          <input
            type="text"
            value={formData.portal_title}
            onChange={(e) => updateData({ portal_title: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="Mercy Academy Portal"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Welcome Message</label>
          <textarea
            value={formData.welcome_message}
            onChange={(e) => updateData({ welcome_message: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="Welcome to our school management system"
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <User className="text-indigo-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Administrator Account</h2>
          <p className="text-slate-500 text-sm">Create the main admin account for this school</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">First Name *</label>
          <input
            type="text"
            value={formData.adminFirstName}
            onChange={(e) => updateData({ adminFirstName: e.target.value })}
            className={`w-full p-3 rounded-xl border ${errors.adminFirstName ? 'border-red-300' : 'border-slate-200'} bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
            placeholder="John"
            required
          />
          {errors.adminFirstName && <p className="text-red-500 text-xs mt-1">{errors.adminFirstName}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Last Name *</label>
          <input
            type="text"
            value={formData.adminLastName}
            onChange={(e) => updateData({ adminLastName: e.target.value })}
            className={`w-full p-3 rounded-xl border ${errors.adminLastName ? 'border-red-300' : 'border-slate-200'} bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
            placeholder="Doe"
            required
          />
          {errors.adminLastName && <p className="text-red-500 text-xs mt-1">{errors.adminLastName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-600">Admin Email *</label>
        <input
          type="email"
          value={formData.adminEmail}
          onChange={(e) => updateData({ adminEmail: e.target.value })}
          className={`w-full p-3 rounded-xl border ${errors.adminEmail ? 'border-red-300' : 'border-slate-200'} bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
          placeholder="admin@mercyacademy.ac.ke"
          required
        />
        {errors.adminEmail && <p className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Password *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              value={formData.adminPassword}
              onChange={(e) => updateData({ adminPassword: e.target.value })}
              className={`w-full pl-10 p-3 rounded-xl border ${errors.adminPassword ? 'border-red-300' : 'border-slate-200'} bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
              placeholder="••••••••"
              required
            />
          </div>
          {errors.adminPassword && <p className="text-red-500 text-xs mt-1">{errors.adminPassword}</p>}
          <p className="text-slate-400 text-xs">At least 8 characters</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Confirm Password *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateData({ confirmPassword: e.target.value })}
              className={`w-full pl-10 p-3 rounded-xl border ${errors.confirmPassword ? 'border-red-300' : 'border-slate-200'} bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all`}
              placeholder="••••••••"
              required
            />
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Phone Number</label>
          <input
            type="tel"
            value={formData.adminPhone}
            onChange={(e) => updateData({ adminPhone: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="+254 712 345 678"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">National ID</label>
          <input
            type="text"
            value={formData.adminNationalId}
            onChange={(e) => updateData({ adminNationalId: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="12345678"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Date of Birth</label>
          <input
            type="date"
            value={formData.adminDOB}
            onChange={(e) => updateData({ adminDOB: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">Gender</label>
          <select
            value={formData.adminGender}
            onChange={(e) => updateData({ adminGender: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Check size={40} className="text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Review & Create</h2>
        <p className="text-slate-500">Confirm your school details before creation</p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 space-y-4 text-left">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="font-bold text-slate-700 mb-2">School Information</h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500">Name:</span>
              <p className="font-medium">{formData.name}</p>
            </div>
            <div>
              <span className="text-slate-500">Slug:</span>
              <p className="font-medium">{formData.slug}</p>
            </div>
            <div>
              <span className="text-slate-500">Code:</span>
              <p className="font-medium">{formData.school_code}</p>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>
              <p className="font-medium">{formData.email}</p>
            </div>
            <div>
              <span className="text-slate-500">Curriculum:</span>
              <p className="font-medium">{formData.curriculum_type}</p>
            </div>
            <div>
              <span className="text-slate-500">Primary Color:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: formData.primary_color }}
                />
                <p className="font-medium">{formData.primary_color}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-700 mb-2">Admin Account</h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500">Name:</span>
              <p className="font-medium">{formData.adminFirstName} {formData.adminLastName}</p>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>
              <p className="font-medium">{formData.adminEmail}</p>
            </div>
            <div>
              <span className="text-slate-500">Role:</span>
              <p className="font-medium">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-700">
          After creation, you'll be automatically logged in and redirected to the admin dashboard.
        </p>
      </div>
    </div>
  );

  const steps = [renderStep1, renderStep2, renderStep3];

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Create New School</h1>
        <p className="text-slate-500 mt-2">Set up your school management system in minutes</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
              s < step ? 'bg-green-100 border-green-500 text-green-700' :
              s === step ? 'bg-indigo-600 border-indigo-600 text-white' :
              'bg-white border-slate-300 text-slate-400'
            }`}>
              {s < step ? <Check size={18} /> : s}
            </div>
            {s < 3 && (
              <div className={`h-0.5 w-16 ${s < step ? 'bg-green-500' : 'bg-slate-300'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="grid grid-cols-3 mb-6 text-center">
        <div className={`text-sm font-bold ${step === 1 ? 'text-indigo-600' : step > 1 ? 'text-green-600' : 'text-slate-400'}`}>
          School Details
        </div>
        <div className={`text-sm font-bold ${step === 2 ? 'text-indigo-600' : step > 2 ? 'text-green-600' : 'text-slate-400'}`}>
          Admin Account
        </div>
        <div className={`text-sm font-bold ${step === 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
          Confirmation
        </div>
      </div>

      {/* Current Step Content */}
      {steps[step - 1]()}

      {errors.submit && (
        <div className={`mt-6 p-4 rounded-xl border ${
          errors.submit.includes('successfully') 
            ? 'bg-green-50 border-green-100 text-green-700' 
            : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          <p className="text-sm font-medium">{errors.submit}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-10 flex justify-between items-center">
        <button
          type="button"
          onClick={step === 1 ? onBackToLogin : prevStep}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors"
          disabled={isSubmitting}
        >
          <ArrowLeft size={18} />
          {step === 1 ? "Back to Login" : "Previous"}
        </button>

        <button
          type="button"
          onClick={nextStep}
          disabled={isSubmitting || (step === 1 && slugAvailable === false) || checkingSlug}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
            isSubmitting || (step === 1 && slugAvailable === false)
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating...
            </>
          ) : step === 3 ? (
            <>
              Create School & Login
              <ArrowRight size={18} />
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SchoolSetupWizard;