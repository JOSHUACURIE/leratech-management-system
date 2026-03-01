import React, { useState } from "react";
import LoginForm from "./Login";
import SchoolSetupWizard from "./SchoolSetupWizard";
import { GraduationCap, Shield, Globe, Target, Users, Menu, X } from "lucide-react";

type AuthMode = "login" | "register";

const AuthEntry: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showMobileBranding, setShowMobileBranding] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans">
      {/* Mobile Branding Header (visible only on mobile) */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              LeraTech <span className="text-indigo-400">SMS</span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => setShowMobileBranding(!showMobileBranding)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle info"
        >
          {showMobileBranding ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Branding Dropdown (collapsible on mobile) */}
      {showMobileBranding && (
        <div className="lg:hidden bg-slate-900 text-white p-4 border-t border-white/10 animate-slideDown">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <Shield className="text-indigo-400 mb-1" size={16} />
              <p className="text-white text-xs font-semibold">Secure Access</p>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <Globe className="text-violet-400 mb-1" size={16} />
              <p className="text-white text-xs font-semibold">Multi-tenant</p>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-3 text-center">
            Secure school management platform for modern education in Kenya.
          </p>
        </div>
      )}

      {/* LEFT SIDE: Permanent Branding Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-600/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-violet-600/20 rounded-full blur-[60px] md:blur-[100px] animate-pulse delay-1000" />
        
        <div className="relative z-10 p-8 md:p-12 text-center max-w-lg">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-2xl">
            <GraduationCap size={28} md:size={40} className="text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 md:mb-6">
            LeraTech <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">SMS</span>
          </h1>
          
          <p className="text-sm md:text-base text-slate-400 font-medium leading-relaxed mb-8 md:mb-12 px-4 md:px-0">
            Secure school management platform for modern education in Kenya.
          </p>

          <div className="grid grid-cols-2 gap-3 md:gap-4 text-left px-4 md:px-0">
            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl backdrop-blur-md">
              <Shield className="text-indigo-400 mb-1 md:mb-2" size={16} md:size={20} />
              <p className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">Secure Access</p>
            </div>
            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl backdrop-blur-md">
              <Globe className="text-violet-400 mb-1 md:mb-2" size={16} md:size={20} />
              <p className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">Multi-tenant</p>
            </div>
            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl backdrop-blur-md">
              <Target className="text-emerald-400 mb-1 md:mb-2" size={16} md:size={20} />
              <p className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">Goal Oriented</p>
            </div>
            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl backdrop-blur-md">
              <Users className="text-amber-400 mb-1 md:mb-2" size={16} md:size={20} />
              <p className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest">User Friendly</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Dynamic Content Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-slate-50 min-h-[calc(100vh-64px)] lg:min-h-screen">
        <div className="w-full max-w-sm sm:max-w-md">
          {mode === "login" ? (
            <LoginForm onToggleMode={() => setMode("register")} />
          ) : (
            <SchoolSetupWizard onBackToLogin={() => setMode("login")} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthEntry;