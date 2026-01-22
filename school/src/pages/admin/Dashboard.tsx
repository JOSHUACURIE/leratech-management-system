import React, { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { 
  Users, UserCog, CreditCard, School, 
  Bell, Clock, TrendingUp, AlertCircle, FileText,
  Loader2, RefreshCw, CheckCircle, Calendar, BookOpen,
  BarChart3, DollarSign, TrendingDown, UserPlus,
  Receipt, CheckSquare, MessageSquare
} from "lucide-react";

interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_parents: number;
  active_classes: number;
  total_subjects: number;
  fee_collection: number;
  fee_collection_formatted: string;
  attendance_rate: number;
  attendance_today: number;
  recent_enrollments: number;
  recent_teachers: Array<{
    id: string;
    name: string;
    teacher_code: string;
    qualification: string;
  }>;
  current_term?: {
    id: string;
    term_name: string;
  };
  current_academic_year?: {
    id: string;
    year_name: string;
  };
}

interface RecentUpdate {
  id: string;
  type: 'student' | 'teacher' | 'payment' | 'invoice' | 'attendance' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  time_ago: string;
  user_name?: string;
  amount?: number;
  metadata?: {
    [key: string]: any;
  };
}

interface FinancialSummary {
  current_month: {
    amount: number;
    formatted: string;
    count: number;
  };
  last_month: {
    amount: number;
    formatted: string;
    count: number;
  };
  growth_percentage: number;
  pending_invoices: {
    amount: number;
    formatted: string;
    count: number;
  };
  upcoming_payments: {
    amount: number;
    formatted: string;
    count: number;
    due_in_days: number;
  };
  expenses: {
    amount: number;
    formatted: string;
    count: number;
  };
  net_revenue: {
    amount: number;
    formatted: string;
  };
  payment_methods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

interface AcademicSummary {
  classes: Array<{
    id: string;
    name: string;
    level: string;
    student_count: number;
    stream_count: number;
    capacity: number;
    utilization: number;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    category: string;
    teacher_count: number;
  }>;
  teacher_assignments: Array<{
    id: string;
    teacher_name: string;
    teacher_code: string;
    class: string;
    stream: string;
    assigned_at: string;
  }>;
  recent_assessments: Array<{
    id: string;
    title: string;
    type: string;
    subject: string;
    class: string;
    max_score: number;
    due_date: string;
  }>;
  attendance_today: Array<{
    class_id: string;
    count: number;
  }>;
  scheme_of_work_status: Array<{
    status: string;
    count: number;
  }>;
  summary: {
    total_classes: number;
    total_subjects: number;
    total_assignments: number;
    total_assessments: number;
    attendance_count: number;
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  gradient: string;
}

const AdminDashboard: React.FC = () => {
  const { user, school, getUserFullName, getUserAvatar } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [academicSummary, setAcademicSummary] = useState<AcademicSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'academic'>('overview');

  // Quick actions with updated icons
  const quickActions: QuickAction[] = [
    { 
      id: 'add-student', 
      label: 'Add Student', 
      icon: <UserPlus size={20} />, 
      path: '/students/create', 
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'add-teacher', 
      label: 'Add Teacher', 
      icon: <UserCog size={20} />, 
      path: '/users/create?role=teacher', 
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'record-payment', 
      label: 'Record Payment', 
      icon: <DollarSign size={20} />, 
      path: '/finance/record-payment', 
      color: 'text-green-600',
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      id: 'create-invoice', 
      label: 'Create Invoice', 
      icon: <Receipt size={20} />, 
      path: '/finance/invoices/create', 
      color: 'text-amber-600',
      gradient: 'from-amber-500 to-orange-500'
    },
    { 
      id: 'take-attendance', 
      label: 'Take Attendance', 
      icon: <CheckSquare size={20} />, 
      path: '/attendance/take', 
      color: 'text-indigo-600',
      gradient: 'from-indigo-500 to-purple-500'
    },
    { 
      id: 'send-announcement', 
      label: 'Send Announcement', 
      icon: <MessageSquare size={20} />, 
      path: '/communications/create', 
      color: 'text-rose-600',
      gradient: 'from-rose-500 to-red-500'
    }
  ];

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [statsRes, updatesRes, financeRes, academicRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-updates'),
        api.get('/dashboard/financial-summary'),
        api.get('/dashboard/academic-summary')
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }

      if (updatesRes.data?.success) {
        setRecentUpdates(updatesRes.data.data);
      }

      if (financeRes.data?.success) {
        setFinancialSummary(financeRes.data.data);
      }

      if (academicRes.data?.success) {
        setAcademicSummary(academicRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      
      // Set fallback data for development
      setStats({
        total_students: 150,
        total_teachers: 18,
        total_parents: 120,
        active_classes: 8,
        total_subjects: 15,
        fee_collection: 850000,
        fee_collection_formatted: 'KES 850k',
        attendance_rate: 94,
        attendance_today: 142,
        recent_enrollments: 8,
        recent_teachers: [
          { id: '1', name: 'John Smith', teacher_code: 'T001', qualification: 'B.Ed Mathematics' },
          { id: '2', name: 'Sarah Johnson', teacher_code: 'T002', qualification: 'M.Ed Science' },
          { id: '3', name: 'Michael Brown', teacher_code: 'T003', qualification: 'B.Ed English' }
        ],
        current_term: { id: '1', term_name: 'Term 1 2024' },
        current_academic_year: { id: '1', year_name: '2024' }
      });
      
      setRecentUpdates([
        {
          id: '1',
          type: 'student',
          title: 'New Student Enrollment',
          description: 'James Wilson enrolled in Grade 5A',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          time_ago: '2h ago',
          user_name: 'James Wilson',
          metadata: { admission_number: 'S2024001', class: 'Grade 5A' }
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Received',
          description: 'KES 25,000 fee payment received',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          time_ago: '3h ago',
          amount: 25000,
          metadata: { payment_reference: 'PAY-001', admission_number: 'S2023125' }
        },
        {
          id: '3',
          type: 'invoice',
          title: 'New Invoice Generated',
          description: 'Invoice #INV-2024-001 for Emma Davis',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          time_ago: '5h ago',
          amount: 35000,
          metadata: { invoice_number: 'INV-2024-001', status: 'pending' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await fetchDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSchoolName = (schoolName?: string) => {
    if (!schoolName) return "";
    return schoolName
      .replace(/^\w/, (c) => c.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'student': return <UserPlus size={18} />;
      case 'teacher': return <UserCog size={18} />;
      case 'payment': return <DollarSign size={18} />;
      case 'invoice': return <FileText size={18} />;
      case 'attendance': return <CheckSquare size={18} />;
      case 'announcement': return <MessageSquare size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'student': return 'bg-blue-100 text-blue-600';
      case 'teacher': return 'bg-purple-100 text-purple-600';
      case 'payment': return 'bg-green-100 text-green-600';
      case 'invoice': return 'bg-amber-100 text-amber-600';
      case 'attendance': return 'bg-indigo-100 text-indigo-600';
      case 'announcement': return 'bg-rose-100 text-rose-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'student': return 'from-blue-500 to-cyan-500';
      case 'teacher': return 'from-purple-500 to-pink-500';
      case 'payment': return 'from-green-500 to-emerald-500';
      case 'invoice': return 'from-amber-500 to-orange-500';
      case 'attendance': return 'from-indigo-500 to-purple-500';
      case 'announcement': return 'from-rose-500 to-red-500';
      default: return 'from-slate-500 to-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `KES ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `KES ${(amount / 1000).toFixed(0)}k`;
    }
    return `KES ${amount}`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600 bg-green-50';
    if (growth < 0) return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-50';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-bold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {school?.logo_url && (
              <img 
                src={school.logo_url} 
                alt={`${school.name} logo`}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                {school?.portal_title || school?.name || "LeraTech SMS"}
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                {school?.school_code && `School Code: ${school.school_code}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
              <Calendar size={16} />
              <span className="font-semibold">
                {stats?.current_term?.term_name} • {stats?.current_academic_year?.year_name}
              </span>
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-white shadow-sm rounded-full border border-slate-200 text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh
            </button>
            <div className="px-4 py-2 bg-white shadow-sm rounded-full border border-slate-200 text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              System Live
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
                {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  {user?.first_name || "Admin"}
                </span>
              </h2>
              <p className="text-slate-600 mt-2 text-lg font-medium">
                Welcome to the {formatSchoolName(school?.name)} {user?.role?.toUpperCase()} Dashboard
              </p>
              <p className="text-slate-500 mt-1">
                Here is what's happening in your school today.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm text-slate-600">
                  Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            
            {/* Quick User Info */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white">
                {getUserAvatar() ? (
                  <img 
                    src={getUserAvatar()} 
                    alt={getUserFullName()} 
                    className="h-full w-full rounded-lg object-cover" 
                  />
                ) : (
                  <span className="text-lg font-bold">
                    {(user?.first_name?.[0] || "A").toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-800">{getUserFullName()}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase">
                    {user?.role || "admin"}
                  </span>
                  • Admin Dashboard
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Tabs */}
      <div className="mb-8">
        <div className="flex space-x-2 bg-white rounded-2xl p-1 shadow-sm border border-slate-200 max-w-md">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart3 size={16} />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'finance'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <DollarSign size={16} />
              Finance
            </div>
          </button>
          <button
            onClick={() => setActiveTab('academic')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'academic'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen size={16} />
              Academic
            </div>
          </button>
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Modern Gradient Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Total Students */}
            <div className="relative overflow-hidden group rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Users size={32} className="opacity-80 group-hover:scale-110 transition-transform" />
                  <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    +{stats?.recent_enrollments || 0} new
                  </div>
                </div>
                <span className="text-sm font-medium uppercase tracking-wider opacity-90">Total Students</span>
                <div className="text-3xl font-bold mt-1 tracking-tight">{stats?.total_students || 0}</div>
                <div className="text-sm opacity-80 mt-2 flex items-center gap-1">
                  <Users size={12} />
                  {stats?.total_parents || 0} parents registered
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            </div>

            {/* Total Teachers */}
            <div className="relative overflow-hidden group rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br from-emerald-500 to-cyan-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <UserCog size={32} className="opacity-80 group-hover:scale-110 transition-transform" />
                  <TrendingUp size={20} className="opacity-70" />
                </div>
                <span className="text-sm font-medium uppercase tracking-wider opacity-90">Total Teachers</span>
                <div className="text-3xl font-bold mt-1 tracking-tight">{stats?.total_teachers || 0}</div>
                <div className="text-sm opacity-80 mt-2 flex items-center gap-1">
                  <BookOpen size={12} />
                  {stats?.total_subjects || 0} subjects taught
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            </div>

            {/* Fee Collection */}
            <div className="relative overflow-hidden group rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br from-orange-500 to-rose-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <CreditCard size={32} className="opacity-80 group-hover:scale-110 transition-transform" />
                  {financialSummary && (
                    <div className={`text-xs px-2 py-1 rounded-full ${getGrowthColor(financialSummary.growth_percentage)}`}>
                      {financialSummary.growth_percentage > 0 ? '+' : ''}{financialSummary.growth_percentage}%
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium uppercase tracking-wider opacity-90">Fee Collection</span>
                <div className="text-3xl font-bold mt-1 tracking-tight">
                  {stats?.fee_collection_formatted || formatCurrency(stats?.fee_collection || 0)}
                </div>
                <div className="text-sm opacity-80 mt-2">
                  This month • {financialSummary?.current_month.count || 0} payments
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            </div>

            {/* Active Classes & Attendance */}
            <div className="relative overflow-hidden group rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <School size={32} className="opacity-80 group-hover:scale-110 transition-transform" />
                  <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {stats?.attendance_today || 0} today
                  </div>
                </div>
                <span className="text-sm font-medium uppercase tracking-wider opacity-90">Active Classes</span>
                <div className="text-3xl font-bold mt-1 tracking-tight">{stats?.active_classes || 0}</div>
                <div className="text-sm opacity-80 mt-2">
                  {stats?.attendance_rate || 0}% overall attendance rate
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Bell size={20} />
                  </span>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => window.location.href = action.path}
                      className={`w-full text-left px-5 py-4 rounded-2xl font-semibold text-white transition-all group flex justify-between items-center bg-gradient-to-r ${action.gradient} hover:shadow-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white opacity-90">{action.icon}</span>
                        {action.label}
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Recent Updates & School Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Updates */}
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Clock size={20} />
                    </span>
                    Recent Updates
                  </h3>
                  <span className="text-sm text-slate-500 font-medium">
                    {recentUpdates.length} updates
                  </span>
                </div>
                
                {recentUpdates.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentUpdates.slice(0, 5).map((update) => (
                      <div key={update.id} className="py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors rounded-lg px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(update.type)}`}>
                          {getTypeIcon(update.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-slate-700 font-semibold leading-tight truncate">
                              {update.title}
                            </p>
                            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                              {update.time_ago}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm mt-1">
                            {update.description}
                          </p>
                          {update.user_name && (
                            <div className="text-xs text-slate-500 mt-1">
                              By: {update.user_name}
                            </div>
                          )}
                          {update.amount && (
                            <div className="text-xs font-semibold text-green-600 mt-1">
                              {formatCurrency(update.amount)}
                            </div>
                          )}
                          {update.metadata && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(update.metadata).map(([key, value]) => (
                                <span key={key} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <AlertCircle className="mx-auto mb-3 text-slate-300" size={32} />
                    <p className="text-slate-400 font-medium">No recent updates</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Finance Tab Content */}
      {activeTab === 'finance' && financialSummary && (
        <div className="space-y-8">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Current Month Revenue */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-gradient-to-br from-emerald-50 to-cyan-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign size={24} className="text-emerald-600" />
                  </div>
                  <div className={`text-sm font-semibold px-3 py-1 rounded-full ${getGrowthColor(financialSummary.growth_percentage)}`}>
                    {financialSummary.growth_percentage > 0 ? '+' : ''}{financialSummary.growth_percentage}%
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Current Month</h3>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {financialSummary.current_month.formatted}
                </div>
                <p className="text-sm text-slate-500">
                  {financialSummary.current_month.count} payments
                </p>
              </div>
            </Card>

            {/* Pending Invoices */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <FileText size={24} className="text-amber-600" />
                  </div>
                  <div className="text-sm font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                    {financialSummary.pending_invoices.count}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Pending Invoices</h3>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {financialSummary.pending_invoices.formatted}
                </div>
                <p className="text-sm text-slate-500">
                  {financialSummary.pending_invoices.count} invoices pending
                </p>
              </div>
            </Card>

            {/* Upcoming Payments */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar size={24} className="text-blue-600" />
                  </div>
                  <div className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {financialSummary.upcoming_payments.due_in_days} days
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Upcoming Payments</h3>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {financialSummary.upcoming_payments.formatted}
                </div>
                <p className="text-sm text-slate-500">
                  {financialSummary.upcoming_payments.count} payments due
                </p>
              </div>
            </Card>

            {/* Net Revenue */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp size={24} className="text-purple-600" />
                  </div>
                  <div className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    Net
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Net Revenue</h3>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {financialSummary.net_revenue.formatted}
                </div>
                <p className="text-sm text-slate-500">
                  Revenue - Expenses
                </p>
              </div>
            </Card>
          </div>

          {/* Payment Methods & Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Methods */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CreditCard size={20} />
                </span>
                Payment Methods Distribution
              </h3>
              <div className="space-y-4">
                {financialSummary.payment_methods.map((method) => (
                  <div key={method.method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 capitalize">{method.method}</span>
                      <span className="text-sm font-semibold text-slate-600">
                        {method.percentage}% • {formatCurrency(method.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {method.count} payments
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Expense Summary */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <TrendingDown size={20} />
                </span>
                Expense Summary
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">Total Expenses</span>
                    <span className="text-2xl font-bold text-rose-600">
                      {financialSummary.expenses.formatted}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {financialSummary.expenses.count} expense items this month
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">Revenue</p>
                      <p className="text-sm text-slate-500">{financialSummary.current_month.formatted}</p>
                    </div>
                    <div className="text-lg font-bold text-emerald-600">+</div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">Expenses</p>
                      <p className="text-sm text-slate-500">{financialSummary.expenses.formatted}</p>
                    </div>
                    <div className="text-lg font-bold text-rose-600">-</div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Net Revenue</p>
                        <p className="text-sm text-slate-500">Revenue - Expenses</p>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {financialSummary.net_revenue.formatted}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Academic Tab Content */}
      {activeTab === 'academic' && academicSummary && (
        <div className="space-y-8">
          {/* Academic Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Classes */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <School size={24} className="text-blue-600" />
                  </div>
                  <div className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {academicSummary.summary.total_classes}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Total Classes</h3>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {academicSummary.summary.total_classes}
                </div>
                <p className="text-sm text-slate-500">
                  {academicSummary.classes.reduce((sum, cls) => sum + cls.student_count, 0)} students
                </p>
              </div>
            </Card>

            {/* Total Subjects */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen size={24} className="text-purple-600" />
                  </div>
                  <div className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {academicSummary.summary.total_subjects}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Total Subjects</h3>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {academicSummary.summary.total_subjects}
                </div>
                <p className="text-sm text-slate-500">
                  Across all classes and streams
                </p>
              </div>
            </Card>

            {/* Teacher Assignments */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-gradient-to-br from-emerald-50 to-cyan-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <UserCog size={24} className="text-emerald-600" />
                  </div>
                  <div className="text-sm font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                    {academicSummary.summary.total_assignments}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Teacher Assignments</h3>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {academicSummary.summary.total_assignments}
                </div>
                <p className="text-sm text-slate-500">
                  Active teaching assignments
                </p>
              </div>
            </Card>

            {/* Recent Assessments */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <FileText size={24} className="text-amber-600" />
                  </div>
                  <div className="text-sm font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                    {academicSummary.summary.total_assessments}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Recent Assessments</h3>
                <div className="text-2xl font-bold text-slate-800 mb-1">
                  {academicSummary.summary.total_assessments}
                </div>
                <p className="text-sm text-slate-500">
                  Last 30 days
                </p>
              </div>
            </Card>
          </div>

          {/* Class Distribution & Teacher Assignments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Class Distribution */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <School size={20} />
                </span>
                Class Distribution
              </h3>
              <div className="space-y-4">
                {academicSummary.classes.slice(0, 5).map((cls) => (
                  <div key={cls.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-700">{cls.name}</span>
                        <span className="text-sm text-slate-500 ml-2">(Level {cls.level})</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-600">
                        {cls.student_count} students
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${cls.utilization}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{cls.utilization}% utilization</span>
                      <span>{cls.stream_count} streams</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Teacher Assignments */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <UserCog size={20} />
                </span>
                Recent Teacher Assignments
              </h3>
              <div className="space-y-4">
                {academicSummary.teacher_assignments.slice(0, 5).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-700">{assignment.teacher_name}</p>
                      <p className="text-sm text-slate-500">
                        {assignment.class} • {assignment.stream}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-purple-600">{assignment.teacher_code}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Assessments & Scheme of Work */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Assessments */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <FileText size={20} />
                </span>
                Recent Assessments
              </h3>
              <div className="space-y-4">
                {academicSummary.recent_assessments.slice(0, 5).map((assessment) => (
                  <div key={assessment.id} className="space-y-2 p-3 bg-amber-50/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 truncate">{assessment.title}</span>
                      <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-full capitalize">
                        {assessment.type}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {assessment.subject} • {assessment.class}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Max score: {assessment.max_score}</span>
                      <span>Due: {new Date(assessment.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Scheme of Work Status */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckSquare size={20} />
                </span>
                Scheme of Work Status
              </h3>
              <div className="space-y-4">
                {academicSummary.scheme_of_work_status.map((status) => (
                  <div key={status.status} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === 'completed' ? 'bg-emerald-500' :
                        status.status === 'in_progress' ? 'bg-amber-500' :
                        'bg-slate-500'
                      }`}></div>
                      <span className="font-medium text-slate-700 capitalize">{status.status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-lg font-bold text-slate-800">
                      {status.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* School Info Card (Always visible) */}
      {school && (
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl mt-8">
          <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <School size={20} />
            </span>
            School Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">School Name</p>
                <p className="text-lg font-semibold text-slate-800 truncate">{school.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">School Code</p>
                <p className="text-lg font-semibold text-slate-800">{school.school_code}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Email</p>
                <p className="text-lg font-semibold text-slate-800 truncate">
                  {school.email || 'Not specified'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Portal URL</p>
                <p className="text-lg font-semibold text-slate-800 truncate">
                  {school.slug}.leratech.ac.ke
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Portal Title</p>
                <p className="text-lg font-semibold text-slate-800 truncate">
                  {school.portal_title || "LeraTech School Portal"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Status</p>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Active
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;