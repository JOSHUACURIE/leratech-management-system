import React, { useState } from "react";
import LoginForm from "./Login";
import SchoolSetupWizard from "./SchoolSetupWizard";
import { GraduationCap, Shield, Globe, Target, Users } from "lucide-react";

type AuthMode = "login" | "register";

const AuthEntry: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* LEFT SIDE: Permanent Branding Sidebar */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        
        <div className="relative z-10 p-12 text-center max-w-lg">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <GraduationCap size={40} className="text-white" />
          </div>
          
          <h1 className="text-5xl font-black text-white tracking-tighter mb-6">
            LeraTech <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">SMS</span>
          </h1>
          
          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-12">
            Secure school management platform for modern education in Kenya.
          </p>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <Shield className="text-indigo-400 mb-2" size={20} />
              <p className="text-white text-[10px] font-black uppercase tracking-widest">Secure Access</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <Globe className="text-violet-400 mb-2" size={20} />
              <p className="text-white text-[10px] font-black uppercase tracking-widest">Multi-tenant</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Dynamic Content Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
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