import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Wallet, LineChart, 
  BarChart3, Bell, CreditCard, ClipboardCheck, Layers, 
  NotebookPen, TrendingUp, FileCheck2, FileText, Percent, 
  RotateCcw, Settings, AlertTriangle, User, ListChecks, 
  ShieldCheck, CalendarCheck, Calendar, Wrench, MessageSquare, 
  ChevronRight, Receipt, GraduationCap, Menu, X, Terminal
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node) &&
          window.innerWidth < 1024) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  const menus: Record<string, MenuItem[]> = {
    ADMIN: [
      { label: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
      { label: "User Accounts", path: "/admin/users", icon: <ShieldCheck size={20} />, subItems: ["Admins", "Teachers", "Students", "Parents"] },
      { label: "Academic Setup", path: "/admin/academic-setup", icon: <GraduationCap size={20} /> },
      { label: "Fee Management", path: "/admin/fees", icon: <Wallet size={20} /> },
      { label: "Student Registry", path: "/admin/students", icon: <Users size={20} /> },
      { label: "Performance", path: "/admin/results", icon: <LineChart size={20} /> },
      { label: "System Reports", path: "/admin/reports", icon: <BarChart3 size={20} /> },
      { label: "School Settings", path: "/admin/settings", icon: <Settings size={20} /> },
      { label: "Audit Logs", path: "/admin/logs", icon: <Terminal size={20} /> },
      { label: "Core Utilities", path: "/admin/tools", icon: <Wrench size={20} /> },
    ],
    TEACHER: [
      { label: "Dashboard", path: "/teacher/dashboard", icon: <LayoutDashboard size={20} /> },
      { label: "My Classes", path: "/teacher/classes", icon: <Users size={20} /> },
      { label: "Subjects Assigned", path: "/teacher/subjects", icon: <BookOpen size={20} /> },
      { label: "Score Submission", path: "/teacher/scores", icon: <ClipboardCheck size={20} /> },
      { label: "CBC Assessment", path: "/teacher/cbc", icon: <Layers size={20} /> },
      { label: "Performance Analysis", path: "/teacher/performance", icon: <LineChart size={20} /> },
      { label: "Attendance", path: "/teacher/attendance", icon: <CalendarCheck size={20} /> },
      { label: "Lesson Plans", path: "/teacher/lesson-plans", icon: <NotebookPen size={20} /> },
      { label: "Assignments", path: "/teacher/assignments", icon: <FileText size={20} /> },
      { label: "Notices", path: "/teacher/notices", icon: <Bell size={20} /> },
    ],
    PARENT: [
      { label: "Dashboard", path: "/parent/dashboard", icon: <LayoutDashboard size={20} /> },
      { label: "Results", path: "/parent/results", icon: <LineChart size={20} /> },
      { label: "Fee Balance", path: "/parent/fees", icon: <Wallet size={20} /> },
      { label: "Payments History", path: "/parent/payments", icon: <Receipt size={20} /> },
      { label: "Attendance", path: "/parent/attendance", icon: <CalendarCheck size={20} /> },
      { label: "Homework & Assignments", path: "/parent/homework", icon: <BookOpen size={20} /> },
      { label: "Performance Analytics", path: "/parent/performance", icon: <BarChart3 size={20} /> },
      { label: "Teacher Communication", path: "/parent/messages", icon: <MessageSquare size={20} /> },
      { label: "Notifications", path: "/parent/notifications", icon: <Bell size={20} /> },
      { label: "School Calendar", path: "/parent/calendar", icon: <Calendar size={20} /> },
      { label: "Profile Settings", path: "/parent/profile", icon: <User size={20} /> },
    ],
    BURSAR: [
      { label: "Dashboard", path: "/bursar/dashboard", icon: <LayoutDashboard size={20} /> },
      { label: "Record Payments", path: "/bursar/payments", icon: <Wallet size={20} /> },
      { label: "Fee Structures", path: "/bursar/fee-structure", icon: <FileText size={20} /> },
      { label: "Student Balances", path: "/bursar/balances", icon: <Users size={20} /> },
      { label: "Invoices", path: "/bursar/invoices", icon: <Receipt size={20} /> },
      { label: "Payment History", path: "/bursar/history", icon: <ListChecks size={20} /> },
      { label: "Fee Arrears", path: "/bursar/arrears", icon: <AlertTriangle size={20} /> },
      { label: "Scholarships / Discounts", path: "/bursar/discounts", icon: <Percent size={20} /> },
      { label: "Refunds", path: "/bursar/refunds", icon: <RotateCcw size={20} /> },
      { label: "Financial Reports", path: "/bursar/reports", icon: <BarChart3 size={20} /> },
      { label: "MPESA / Bank Reconciliation", path: "/bursar/reconciliation", icon: <CreditCard size={20} /> },
    ]
  };

  const currentMenus = menus[role] || [];

  return (
    <>
      {/* Mobile Header Toggle Button */}
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 
          flex flex-col z-50 transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:shadow-sm
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                  LT
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">LeraTech</h1>
                <p className="text-xs text-gray-500 font-medium">Management System</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <div className="mt-4 px-1">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                {role.toLowerCase()} panel
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-4 px-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Main Navigation
            </h3>
          </div>
          
          <div className="space-y-1">
            {currentMenus.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isSubOpen = openSubmenu === item.label;
              const isActive = location.pathname === item.path || 
                               (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

              return (
                <div key={item.label} className="relative">
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full" />
                  )}

                  <div className="relative">
                    <NavLink
                      to={hasSubItems ? '#' : item.path}
                      onClick={(e) => {
                        if (hasSubItems) {
                          e.preventDefault();
                          toggleSubmenu(item.label);
                        }
                      }}
                      className={`
                        flex items-center justify-between w-full px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-50/80 to-purple-50/50 text-blue-700 font-semibold' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-1.5 rounded-lg transition-colors
                          ${isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                          }
                        `}>
                          {item.icon}
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      
                      {hasSubItems && (
                        <ChevronRight 
                          size={16} 
                          className={`
                            transition-transform duration-200 flex-shrink-0
                            ${isSubOpen ? 'rotate-90 text-blue-500' : 'text-gray-400'}
                          `} 
                        />
                      )}
                    </NavLink>

                    {/* Submenu */}
                    {hasSubItems && isSubOpen && (
                      <div className="mt-1 ml-12 space-y-1 animate-fadeIn">
                        {item.subItems?.map((subItem, idx) => (
                          <NavLink
                            key={idx}
                            to={`${item.path}/${subItem.toLowerCase().replace(/\s+/g, '-')}`}
                            className={({ isActive }) => `
                              block px-4 py-2.5 rounded-lg text-sm transition-all
                              ${isActive 
                                ? 'bg-blue-50 text-blue-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'
                              }
                            `}
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                setIsMobileOpen(false);
                              }
                            }}
                          >
                            {subItem}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="px-4 py-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">Need help?</p>
                <p className="text-xs text-gray-500">Contact support</p>
              </div>
              <button className="p-2 hover:bg-white rounded-lg transition-colors">
                <Bell size={16} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Add CSS for animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </>
  );
};

export default Sidebar;