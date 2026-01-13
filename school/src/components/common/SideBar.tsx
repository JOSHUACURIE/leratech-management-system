import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Wallet, LineChart, 
  BarChart3, Bell, CreditCard,FileText,Percent, RotateCcw,Settings, AlertTriangle, User ,ListChecks ,ShieldCheck,CalendarCheck,Calendar, Wrench, MessageSquare ,ChevronRight, LogOut,Receipt, GraduationCap, Terminal as TerminalIcon 
} from 'lucide-react';


type SidebarProps = {
  role: "ADMIN" | "TEACHER" | "PARENT" | "BURSAR";
};

type MenuItem = {
  label: string;
  path: string;
  icon: JSX.Element;
  subItems?: string[];
};


const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const menus: MenuItem[] = {
    ADMIN: [
      { label: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
      { label: "User Accounts", path: "/admin/users", icon: <ShieldCheck size={20} />, subItems: ["Admins", "Teachers", "Students", "Parents"] },
      { label: "Academic Setup", path: "/admin/academic-setup", icon: <GraduationCap size={20} /> },
      { label: "Fee Management", path: "/admin/fees", icon: <Wallet size={20} /> },
      { label: "Student Registry", path: "/admin/students", icon: <Users size={20} /> },
      { label: "Performance", path: "/admin/results", icon: <LineChart size={20} /> },
      { label: "System Reports", path: "/admin/reports", icon: <BarChart3 size={20} /> },
      { label: "School Settings", path: "/admin/settings", icon: <Settings size={20} /> },
      { label: "Audit Logs", path: "/admin/logs", icon: <TerminalIcon size={20} /> },
      { label: "Core Utilities", path: "/admin/tools", icon: <Wrench size={20} /> },
    ],
    TEACHER: [
        { label: "Dashboard", path: "/teacher/dashboard", icon: <LayoutDashboard size={20} /> },
        { label: "Score Submission", path: "/teacher/scores", icon: <BookOpen size={20} /> },
        { label: "CBC Submission", path: "/teacher/cbc", icon: <BookOpen size={20} /> },
    ],
PARENT: [
  {
    label: "Dashboard",
    path: "/parent/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Results",
    path: "/parent/results",
    icon: <LineChart size={20} />,
  },
  {
    label: "Fee Balance",
    path: "/parent/fees",
    icon: <Wallet size={20} />,
  },
  {
    label: "Payments History",
    path: "/parent/payments",
    icon: <Receipt size={20} />,
  },
  {
    label: "Attendance",
    path: "/parent/attendance",
    icon: <CalendarCheck size={20} />,
  },
  {
    label: "Homework & Assignments",
    path: "/parent/homework",
    icon: <BookOpen size={20} />,
  },
  {
    label: "Performance Analytics",
    path: "/parent/performance",
    icon: <BarChart3 size={20} />,
  },
  {
    label: "Teacher Communication",
    path: "/parent/messages",
    icon: <MessageSquare size={20} />,
  },
  {
    label: "Notifications",
    path: "/parent/notifications",
    icon: <Bell size={20} />,
  },
  {
    label: "School Calendar",
    path: "/parent/calendar",
    icon: <Calendar size={20} />,
  },
  {
    label: "Profile Settings",
    path: "/parent/profile",
    icon: <User size={20} />,
  },
],

  BURSAR: [
  {
    label: "Dashboard",
    path: "/bursar/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Record Payments",
    path: "/bursar/payments",
    icon: <Wallet size={20} />,
  },
  {
    label: "Fee Structures",
    path: "/bursar/fee-structure",
    icon: <FileText size={20} />,
  },
  {
    label: "Student Balances",
    path: "/bursar/balances",
    icon: <Users size={20} />,
  },
  {
    label: "Invoices",
    path: "/bursar/invoices",
    icon: <Receipt size={20} />,
  },
  {
    label: "Payment History",
    path: "/bursar/history",
    icon: <ListChecks size={20} />,
  },
  {
    label: "Fee Arrears",
    path: "/bursar/arrears",
    icon: <AlertTriangle size={20} />,
  },
  {
    label: "Scholarships / Discounts",
    path: "/bursar/discounts",
    icon: <Percent size={20} />,
  },
  {
    label: "Refunds",
    path: "/bursar/refunds",
    icon: <RotateCcw size={20} />,
  },
  {
    label: "Financial Reports",
    path: "/bursar/reports",
    icon: <BarChart3 size={20} />,
  },
  {
    label: "MPESA / Bank Reconciliation",
    path: "/bursar/reconciliation",
    icon: <CreditCard size={20} />,
  },
]

  }[role] || [];

  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  return (
    <aside className="w-72 h-screen sticky top-0 bg-white border-r border-slate-100 flex flex-col z-50">
      {/* Branding */}
      <div className="p-8 pb-10 flex items-center gap-3">
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-2xl">
                L
            </div>
        </div>
        <div>
            <span className="text-xl font-black tracking-tighter text-slate-800 block leading-none">LeraTech</span>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Management</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        <div className="px-4 mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Menu</p>
        </div>

        {menus.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isSubOpen = openSubmenu === item.label;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <div key={item.path} className="relative">
              {isActive && (
                <div className="absolute left-[-16px] top-3 w-1.5 h-7 bg-indigo-600 rounded-r-full shadow-[4px_0_12px_rgba(79,70,229,0.4)]" />
              )}

              <NavLink
                to={hasSubItems ? "#" : item.path}
                onClick={(e) => {
                    if (hasSubItems) {
                        e.preventDefault();
                        toggleSubmenu(item.label);
                    }
                }}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? "bg-indigo-50/80 text-indigo-700 backdrop-blur-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`${isActive ? "text-indigo-600 scale-110" : "text-slate-400 group-hover:text-indigo-500"} transition-all duration-300`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm tracking-tight ${isActive ? "font-extrabold" : "font-semibold"}`}>
                    {item.label}
                  </span>
                </div>
                
                {hasSubItems && (
                  <ChevronRight 
                    size={14} 
                    className={`transition-transform duration-300 ${isSubOpen ? "rotate-90 text-indigo-500" : "text-slate-300"}`} 
                  />
                )}
              </NavLink>

              {/* Collapsible Sub-menu */}
              {hasSubItems && isSubOpen && (
                <div className="mt-1 ml-6 pl-4 border-l-2 border-slate-50 space-y-1">
                  {item.subItems?.map((sub, index) => (
                    <NavLink
                      key={index}
                      to={`${item.path}/${sub.toLowerCase()}`}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${
                          isActive 
                            ? "text-indigo-600 bg-white shadow-sm" 
                            : "text-slate-400 hover:text-slate-700 hover:translate-x-1"
                        }`
                      }
                    >
                      {sub}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

    </aside>
  );
};

export default Sidebar;