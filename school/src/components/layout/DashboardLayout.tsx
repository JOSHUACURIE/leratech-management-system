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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar 
          user={user} 
          notificationsCount={notificationsCount} 
          onLogout={onLogout}
          onNotificationClick={onNotificationClick}
          onProfileClick={onProfileClick}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        {/* Optional Footer */}
        <footer className="bg-white border-t border-gray-200 p-4 text-center text-sm text-gray-500">
          <p>School Management System © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;