import React, { useState, useEffect, useRef,type JSX } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, Wallet, LineChart, 
  BarChart3, Bell, CreditCard, ClipboardCheck, Layers, 
  NotebookPen, TrendingUp, FileCheck2, FileText, Percent, 
  RotateCcw, Settings, AlertTriangle, User, ListChecks, 
  ShieldCheck, CalendarCheck, Calendar, Wrench, MessageSquare, 
  ChevronRight, Receipt, GraduationCap, Menu, X, Terminal,
  Home, LogOut, School
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type SidebarProps = {
  role: "admin" | "teacher" | "parent" | "bursar" | "student" | "secretary" | "support_staff";
  schoolSlug?: string;
};

type MenuItem = {
  label: string;
  path: string;
  icon: JSX.Element;
  subItems?: { label: string; path: string }[];
};

const Sidebar: React.FC<SidebarProps> = ({ role, schoolSlug }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const location = useLocation();
  const { school, logout } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Get school slug from params if not provided
  const params = useParams<{ schoolSlug: string }>();
  const actualSchoolSlug = schoolSlug || params.schoolSlug || '';

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

  // Helper function to build paths with school slug
  const buildPath = (basePath: string) => {
    if (!actualSchoolSlug) return basePath;
    // Remove leading slash if present
    const cleanBase = basePath.startsWith('/') ? basePath.slice(1) : basePath;
    return `/${actualSchoolSlug}/${cleanBase}`;
  };

  const menus: Record<string, MenuItem[]> = {
    admin: [
      { label: "Dashboard", path: buildPath("admin/dashboard"), icon: <LayoutDashboard size={20} /> },
      { 
        label: "User Accounts", 
        path: buildPath("admin/users"), 
        icon: <ShieldCheck size={20} />, 
        subItems: [
          { label: "All Users", path: buildPath("admin/users") },
          { label: "Teachers", path: buildPath("admin/users/teachers") },
          { label: "Students", path: buildPath("admin/students") },
          { label: "Parents", path: buildPath("admin/parents") }
        ] 
      },
      { label: "Academic Setup", path: buildPath("admin/academic-setup"), icon: <GraduationCap size={20} /> },
      { label: "Fee Management", path: buildPath("admin/fees"), icon: <Wallet size={20} /> },
      { label: "Student Registry", path: buildPath("admin/students"), icon: <Users size={20} /> },
      { label: "Performance", path: buildPath("admin/results"), icon: <LineChart size={20} /> },
      { label: "System Reports", path: buildPath("admin/reports"), icon: <BarChart3 size={20} /> },
      { label: "School Settings", path: buildPath("admin/settings"), icon: <Settings size={20} /> },
      { label: "Audit Logs", path: buildPath("admin/logs"), icon: <Terminal size={20} /> },
      { label: "Core Utilities", path: buildPath("admin/tools"), icon: <Wrench size={20} /> },
    ],
    teacher: [
      { label: "Dashboard", path: buildPath("teacher/dashboard"), icon: <LayoutDashboard size={20} /> },
      { label: "Student&Subjects", path: buildPath("teacher/subject-assignment"), icon: <BookOpen size={20} /> },
      { label: "My Classes", path: buildPath("teacher/classes"), icon: <Users size={20} /> },
      { label: "Subjects Assigned", path: buildPath("teacher/subjects"), icon: <BookOpen size={20} /> },
      { label: "Score Submission", path: buildPath("teacher/scores"), icon: <ClipboardCheck size={20} /> },
      { label: "CBC Assessment", path: buildPath("teacher/cbc"), icon: <Layers size={20} /> },
      { label: "Performance Analysis", path: buildPath("teacher/performance"), icon: <LineChart size={20} /> },
      { label: "Attendance", path: buildPath("teacher/attendance"), icon: <CalendarCheck size={20} /> },
      { label: "Lesson Plans", path: buildPath("teacher/lesson-plans"), icon: <NotebookPen size={20} /> },
      { label: "My Schemes", path: buildPath("teacher/schemes"), icon: <BookOpen size={20} /> },
      { label: "Record of Work", path: buildPath("teacher/records"), icon: <NotebookPen size={20} /> },
      { label: "Assignments", path: buildPath("teacher/assignments"), icon: <FileText size={20} /> },
      { label: "Notices", path: buildPath("teacher/notices"), icon: <Bell size={20} /> },
    ],
    parent: [
      { label: "Dashboard", path: buildPath("parent/dashboard"), icon: <LayoutDashboard size={20} /> },
      { label: "Results", path: buildPath("parent/results"), icon: <LineChart size={20} /> },
      { label: "Fee Balance", path: buildPath("parent/fees"), icon: <Wallet size={20} /> },
      { label: "Payments History", path: buildPath("parent/payments"), icon: <Receipt size={20} /> },
      { label: "Attendance", path: buildPath("parent/attendance"), icon: <CalendarCheck size={20} /> },
      { label: "Homework & Assignments", path: buildPath("parent/homework"), icon: <BookOpen size={20} /> },
      { label: "Performance Analytics", path: buildPath("parent/performance"), icon: <BarChart3 size={20} /> },
      { label: "Teacher Communication", path: buildPath("parent/messages"), icon: <MessageSquare size={20} /> },
      { label: "Notifications", path: buildPath("parent/notifications"), icon: <Bell size={20} /> },
      { label: "School Calendar", path: buildPath("parent/calendar"), icon: <Calendar size={20} /> },
      { label: "Profile Settings", path: buildPath("parent/profile"), icon: <User size={20} /> },
    ],
    bursar: [
      { label: "Dashboard", path: buildPath("bursar/dashboard"), icon: <LayoutDashboard size={20} /> },
      { label: "Record Payments", path: buildPath("bursar/payments"), icon: <Wallet size={20} /> },
      { label: "Fee Structures", path: buildPath("bursar/fee-structure"), icon: <FileText size={20} /> },
      { label: "Student Balances", path: buildPath("bursar/balances"), icon: <Users size={20} /> },
      { label: "Invoices", path: buildPath("bursar/invoices"), icon: <Receipt size={20} /> },
      { label: "Payment History", path: buildPath("bursar/history"), icon: <ListChecks size={20} /> },
      { label: "Fee Arrears", path: buildPath("bursar/arrears"), icon: <AlertTriangle size={20} /> },
      { label: "Scholarships / Discounts", path: buildPath("bursar/discounts"), icon: <Percent size={20} /> },
      { label: "Refunds", path: buildPath("bursar/refunds"), icon: <RotateCcw size={20} /> },
      { label: "Financial Reports", path: buildPath("bursar/reports"), icon: <BarChart3 size={20} /> },
      { label: "MPESA / Bank Reconciliation", path: buildPath("bursar/reconciliation"), icon: <CreditCard size={20} /> },
    ],
    student: [
      { label: "Dashboard", path: buildPath("student/dashboard"), icon: <LayoutDashboard size={20} /> },
      { label: "My Classes", path: buildPath("student/classes"), icon: <Users size={20} /> },
      { label: "My Subjects", path: buildPath("student/subjects"), icon: <BookOpen size={20} /> },
      { label: "My Results", path: buildPath("student/results"), icon: <LineChart size={20} /> },
      { label: "Attendance", path: buildPath("student/attendance"), icon: <CalendarCheck size={20} /> },
      { label: "Homework", path: buildPath("student/homework"), icon: <FileText size={20} /> },
      { label: "Assignments", path: buildPath("student/assignments"), icon: <ClipboardCheck size={20} /> },
      { label: "Exams", path: buildPath("student/exams"), icon: <NotebookPen size={20} /> },
      { label: "Fee Statement", path: buildPath("student/fees"), icon: <Wallet size={20} /> },
      { label: "Timetable", path: buildPath("student/timetable"), icon: <Calendar size={20} /> },
      { label: "Messages", path: buildPath("student/messages"), icon: <MessageSquare size={20} /> },
      { label: "Notifications", path: buildPath("student/notifications"), icon: <Bell size={20} /> },
    ],
    secretary: [
      { label: "Dashboard", path: buildPath("secretary/dashboard"), icon: <LayoutDashboard size={20} /> },
      { label: "Student Records", path: buildPath("secretary/students"), icon: <Users size={20} /> },
      { label: "Parent Records", path: buildPath("secretary/parents"), icon: <User size={20} /> },
      { label: "Attendance Records", path: buildPath("secretary/attendance"), icon: <CalendarCheck size={20} /> },
      { label: "Document Management", path: buildPath("secretary/documents"), icon: <FileText size={20} /> },
      { label: "Communication", path: buildPath("secretary/communication"), icon: <MessageSquare size={20} /> },
      { label: "Calendar", path: buildPath("secretary/calendar"), icon: <Calendar size={20} /> },
    ],
    support_staff: [
      { label: "Dashboard", path: buildPath("support/dashboard"), icon: <LayoutDashboard size={20} /> },
      { label: "Maintenance Log", path: buildPath("support/maintenance"), icon: <Wrench size={20} /> },
      { label: "Inventory", path: buildPath("support/inventory"), icon: <ListChecks size={20} /> },
      { label: "Requests", path: buildPath("support/requests"), icon: <Bell size={20} /> },
      { label: "Reports", path: buildPath("support/reports"), icon: <BarChart3 size={20} /> },
    ]
  };

  const currentMenus = menus[role] || [];

  const handleLogout = () => {
    logout();
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

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
        {/* Brand Header with School Info */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {school?.logo_url ? (
                    <img 
                      src={school.logo_url} 
                      alt={school.name} 
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    school?.name?.charAt(0) || 'LT'
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight truncate max-w-[140px]">
                  {school?.name || 'LeraTech'}
                </h1>
                <p className="text-xs text-gray-500 font-medium truncate max-w-[140px]">
                  {actualSchoolSlug}.ac.ke
                </p>
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
          
          <div className="mt-4 px-1 flex items-center justify-between">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                {role.toLowerCase()} portal
              </span>
            </div>
            
            {/* Quick school portal link */}
            <NavLink 
              to={actualSchoolSlug ? `/${actualSchoolSlug}` : '/'}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="School Portal Home"
            >
              <Home size={16} className="text-gray-500" />
            </NavLink>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
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
                               (item.path !== buildPath(`${role}/dashboard`) && 
                                location.pathname.startsWith(item.path.replace(/\/$/, '')));

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
                      className={({ isActive: navIsActive }) => `
                        flex items-center justify-between w-full px-4 py-3 rounded-xl
                        transition-all duration-200 group
                        ${(navIsActive || isActive) 
                          ? 'bg-gradient-to-r from-blue-50/80 to-purple-50/50 text-blue-700 font-semibold' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                      end={!hasSubItems}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-1.5 rounded-lg transition-colors
                          ${(isActive) 
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
                            to={subItem.path}
                            end
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
                            {subItem.label}
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

        {/* Footer with School Info and Actions */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* School Info Card */}
          {school && (
            <div className="px-4 py-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                  <School size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{school.name}</p>
                  <p className="text-xs text-gray-500 truncate">{school.school_code}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 font-medium hover:from-rose-100 hover:to-pink-100 transition-all text-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
            
            <NavLink 
              to={actualSchoolSlug ? `/${actualSchoolSlug}/support` : '/support'}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-all text-sm"
              onClick={() => window.innerWidth < 1024 && setIsMobileOpen(false)}
            >
              <Bell size={16} />
              Help
            </NavLink>
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
        
        /* Active nav link styles */
        .nav-link-active {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05));
          color: rgb(37, 99, 235);
          font-weight: 600;
        }
      `}</style>
    </>
  );
};

export default Sidebar;