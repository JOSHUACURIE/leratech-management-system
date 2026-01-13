import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, Eye, EyeOff, GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (!success) setError("Authentication failed. Please check your credentials.");
  };


  const quickFill = (type: string) => {
    const creds: Record<string, string> = {
      admin: "admin@school.com",
      teacher: "teacher@school.com",
      parent: "parent@school.com",
      bursar: "bursar@school.com",
    };
    setEmail(creds[type]);
    setPassword(`${type}123`);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side: Brand & Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 p-12 text-center max-w-lg">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <GraduationCap size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-6">
            LeraTech <span className="text-indigo-400">S</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">
            The next generation of educational management. Secure, lightning-fast, and data-driven.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                <ShieldCheck className="text-indigo-400 mb-2" size={20} />
                <p className="text-white text-xs font-black uppercase tracking-widest">Secure</p>
                <p className="text-slate-500 text-[10px] mt-1">End-to-end encrypted portal access.</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                <Lock className="text-violet-400 mb-2" size={20} />
                <p className="text-white text-xs font-black uppercase tracking-widest">Audit</p>
                <p className="text-slate-500 text-[10px] mt-1">Immutable logging for every action.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden text-center">
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter">LeraTech</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 font-medium mt-2">Enter your system credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="name@school.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Password</label>
                <button type="button" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Forgot?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold">
                <ShieldCheck size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group"
            >
              Sign In to Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Quick Access Portal (Test UI) */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Fast-Track Development Access</p>
            <div className="grid grid-cols-4 gap-2">
              {['admin', 'teacher', 'parent', 'bursar'].map((role) => (
                <button
                  key={role}
                  onClick={() => quickFill(role)}
                  className="py-2.5 rounded-xl border border-slate-100 text-[9px] font-black uppercase text-slate-500 hover:bg-white hover:shadow-md hover:border-indigo-200 hover:text-indigo-600 transition-all"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;