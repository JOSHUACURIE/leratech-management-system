import React, { type ReactNode } from "react";
import Sidebar from "../common/SideBar";
import TopNavbar from "../common/TopNavBar";

type DashboardLayoutProps = {
  role: "ADMIN" | "TEACHER" | "PARENT" | "BURSAR";
  user: { name: string; role: string; avatar?: string };
  children: ReactNode;
  notificationsCount?: number;
  onLogout: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  user,
  children,
  notificationsCount = 0,
  onLogout,
  onNotificationClick,
  onProfileClick
}) => {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* 1. Sidebar - Now supports its own internal mobile logic.
          On desktop, it remains a fixed 72px width.
      */}
      <Sidebar role={role} />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
        
        {/* Top Navigation Bar */}
        <TopNavbar 
          user={user} 
          notificationsCount={notificationsCount} 
          onLogout={onLogout}
          onNotificationClick={onNotificationClick}
          onProfileClick={onProfileClick}
        />

        {/* 3. Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {/* Subtle Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
          
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>

          {/* Spacer to prevent content from hitting the footer too abruptly */}
          <div className="h-20" />
        </main>

        {/* 4. Sleek Footer */}
        <footer className="bg-white/80 backdrop-blur-md border-t border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              System Status: Operational
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <p className="text-[11px] font-medium text-slate-400">
              © {new Date().getFullYear()} <span className="text-slate-900 font-bold">LeraTech OS</span>. All rights reserved.
            </p>
            <div className="hidden md:flex items-center gap-4 border-l border-slate-100 pl-6">
              <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Support</button>
              <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Privacy</button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;