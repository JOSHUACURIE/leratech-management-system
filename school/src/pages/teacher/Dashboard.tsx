import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, ClipboardCheck, Users, AlertCircle,
  TrendingUp, Calendar, ArrowRight, Clock,
  ChevronRight, CheckCircle2, Loader2,
  AlertTriangle, FileText, User, School,
  Bell, RefreshCw, BarChart2, Zap,
  Activity, Target, Award, Layers,
  ChevronUp, ChevronDown, Minus,
  Sparkles, Rocket, Star, Flame,
  Crown, Gem, Heart, Coffee,
  Sunrise, Sunset, Moon, Cloud,
  Sun, Droplets, Leaf, Palette
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// ─── Types matching actual API shapes ─────────────────────────────────────────

interface DashboardStats {
  teacher: {
    id: string;
    teacher_code: string;
    name: string;
    email: string;
  };
  summary: {
    totalAssignments: number;
    totalStudents: number;
    totalSubjects: number;
    activeClasses: number;
    pendingGrading: number;
  };
  attendance: {
    last7Days: { present: number; absent: number; late: number; total: number; rate: number };
    today: { rate: number; present: number; absent: number; late: number; total: number };
  };
  assignments: {
    active: number;
    upcoming: number;
    overdue: number;
    submissions: { total: number; graded: number; pending: number; late: number; gradingProgress: number };
  };
  schemes: { total: number; approved: number; pending: number; draft: number; completionRate: number };
  lessonPlans: { total: number; completed: number; planned: number; upcoming: number };
  records: { total: number; thisWeek: number; lastWeek: number; averagePerWeek: number };
  notifications: { total: number; unread: number; priority: number };
  performance: { workloadScore: number; overallPerformance: number; attendanceRate: number; submissionRate: number };
}

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityResponse {
  success: boolean;
  data: ActivityItem[];
  summary: {
    total_activities: number;
    by_type: Record<string, number>;
    recent_activity: string;
  };
  pagination: { limit: number | null; offset: number; total: number; has_more: boolean };
  cachedAt: string;
}

interface PendingSubmission {
  id: string;
  type: string;
  class: string;
  class_id?: string;
  subject: string;
  subject_id?: string;
  title: string;
  due_date: string;
  days_until_due: number;
  status: "Urgent" | "Upcoming" | "Overdue" | "Pending Review" | "Draft";
  completion_rate?: number;
  total_students?: number;
  scores_entered?: number;
}

// ─── Fancy Color Palette ──────────────────────────────────────────────────────
const colors = {
  primary: {
    light: '#EEF2FF',
    DEFAULT: '#6366F1',
    dark: '#4F46E5',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
  },
  success: {
    light: '#ECFDF3',
    DEFAULT: '#10B981',
    dark: '#059669',
    gradient: 'from-emerald-400 to-teal-500',
  },
  warning: {
    light: '#FFFBEB',
    DEFAULT: '#F59E0B',
    dark: '#D97706',
    gradient: 'from-amber-400 to-orange-500',
  },
  danger: {
    light: '#FEF2F2',
    DEFAULT: '#EF4444',
    dark: '#DC2626',
    gradient: 'from-rose-400 to-red-500',
  },
  info: {
    light: '#EFF6FF',
    DEFAULT: '#3B82F6',
    dark: '#2563EB',
    gradient: 'from-blue-400 to-cyan-500',
  },
  purple: {
    light: '#F5F3FF',
    DEFAULT: '#8B5CF6',
    dark: '#7C3AED',
    gradient: 'from-violet-400 to-purple-500',
  },
  pink: {
    light: '#FDF2F8',
    DEFAULT: '#EC4899',
    dark: '#DB2777',
    gradient: 'from-pink-400 to-rose-500',
  },
};

// ─── Mini Components ──────────────────────────────────────────────────────────

const StatCard = ({
  label, value, sub, icon, color = 'indigo', trend, gradient = false
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: string; trend?: 'up' | 'down' | 'flat';
  gradient?: boolean;
}) => {
  const colorMap: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', gradient: 'from-indigo-500 to-purple-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-cyan-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-500 to-pink-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-500 to-pink-500' },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 border ${c.border} ${c.bg} transition-all duration-300 hover:scale-105 hover:shadow-xl group`}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-700" />
      
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white shadow-sm ${c.text}`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
            trend === 'up' ? 'bg-emerald-100 text-emerald-700' :
            trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            {trend === 'up' ? <ChevronUp className="w-2 h-2 sm:w-3 sm:h-3" /> :
             trend === 'down' ? <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3" /> :
             <Minus className="w-2 h-2 sm:w-3 sm:h-3" />}
          </span>
        )}
      </div>
      <div className={`text-xl sm:text-3xl font-black tracking-tight ${c.text} mb-0.5`}>{value}</div>
      <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">{sub}</div>}
    </div>
  );
};

const RingProgress = ({ value, size = 64, stroke = 6, gradient = 'from-indigo-500 to-purple-500' }: {
  value: number; size?: number; stroke?: number; gradient?: string;
}) => {
  const mobileSize = typeof window !== 'undefined' && window.innerWidth < 640 ? size * 0.8 : size;
  const r = (mobileSize - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  
  return (
    <div className="relative">
      <svg width={mobileSize} height={mobileSize} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle cx={mobileSize / 2} cy={mobileSize / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={mobileSize / 2} cy={mobileSize / 2} r={r} fill="none"
          stroke="url(#ringGradient)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs sm:text-sm font-black bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {value}%
        </span>
      </div>
    </div>
  );
};

const ProgressBar = ({ value, gradient = 'from-indigo-500 to-purple-500', label }: { 
  value: number; gradient?: string; label?: string 
}) => (
  <div>
    {label && (
      <div className="flex justify-between text-[10px] sm:text-xs mb-1">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {value}%
        </span>
      </div>
    )}
    <div className="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

const ActivityDot = ({ type }: { type: string }) => {
  const colors: Record<string, { bg: string; gradient: string }> = {
    attendance: { bg: 'bg-emerald-500', gradient: 'from-emerald-400 to-teal-500' },
    assessment: { bg: 'bg-blue-500', gradient: 'from-blue-400 to-cyan-500' },
    scheme: { bg: 'bg-purple-500', gradient: 'from-purple-400 to-pink-500' },
    lesson: { bg: 'bg-indigo-500', gradient: 'from-indigo-400 to-purple-500' },
    record: { bg: 'bg-amber-500', gradient: 'from-amber-400 to-orange-500' },
    score: { bg: 'bg-rose-500', gradient: 'from-rose-400 to-pink-500' },
    message: { bg: 'bg-teal-500', gradient: 'from-teal-400 to-emerald-500' },
  };
  const color = colors[type] || { bg: 'bg-slate-400', gradient: 'from-slate-400 to-slate-500' };
  
  return (
    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 mt-1 sm:mt-1.5 bg-gradient-to-br ${color.gradient} animate-pulse`} />
  );
};

const GreetingIcon = ({ hour }: { hour: number }) => {
  if (hour < 12) return <Sunrise className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />;
  if (hour < 17) return <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />;
  if (hour < 20) return <Sunset className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />;
  return <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />;
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [pending, setPending] = useState<PendingSubmission[]>([]);
  const [now, setNow] = useState(new Date());

  const fetchAll = useCallback(async (force = false) => {
    setRefreshing(true);
    if (!stats) setLoading(true);
    setError(null);

    try {
      const refreshParam = force ? '?refresh=true' : '';

      const [statsRes, activityRes, pendingRes] = await Promise.allSettled([
        api.get(`/teachers/dashboard/stats${refreshParam}`),
        api.get('/teachers/me/activity?limit=8'),
        api.get('/teachers/me/pending-submissions'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        setStats(statsRes.value.data.data);
      }
      if (activityRes.status === 'fulfilled' && activityRes.value.data.success) {
        setActivity(activityRes.value.data);
      }
      if (pendingRes.status === 'fulfilled' && pendingRes.value.data.success) {
        setPending(pendingRes.value.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stats]);

  useEffect(() => {
    fetchAll();
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const teacherName = stats?.teacher?.name?.split(' ')[0] || 'Teacher';

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const diff = now.getTime() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  const formatDeadline = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-pink-500 border-l-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 animate-pulse" />
          </div>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-sm sm:text-base animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white/80 backdrop-blur-xl border border-rose-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" />
          </div>
          <h2 className="text-slate-900 font-bold text-lg sm:text-xl mb-2">Couldn't load dashboard</h2>
          <p className="text-slate-600 text-xs sm:text-sm mb-4 sm:mb-6">{error}</p>
          <button 
            onClick={() => fetchAll(true)}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-indigo-200 w-full text-sm sm:text-base"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900">

      {/* ── Top Nav Bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-indigo-100 px-3 sm:px-6 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <School className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-sm sm:text-base">
                Teacher Portal
              </span>
              <p className="text-[8px] sm:text-xs text-slate-500">{s.teacher.teacher_code}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {s.notifications.unread > 0 && (
              <button className="relative p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 transition-all group">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-rose-500 to-pink-500 text-white text-[8px] sm:text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                  {s.notifications.unread}
                </span>
              </button>
            )}
            
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all text-xs sm:text-sm font-medium text-indigo-600 disabled:opacity-40 group"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="hidden xs:inline">{refreshing ? 'Refreshing' : 'Refresh'}</span>
            </button>
            
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-lg">
                {s.teacher.name?.charAt(0) || 'T'}
              </div>
              <span className="text-xs sm:text-sm font-medium text-indigo-600 hidden sm:block">
                {s.teacher.teacher_code}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <GreetingIcon hour={greetingHour} />
                <p className="text-white/90 font-medium text-xs sm:text-sm">{greeting} ✨</p>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
                {teacherName}
                <span className="inline-block ml-2 animate-bounce">👋</span>
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold border border-white/30">
                  {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold border border-white/30">
                  {s.teacher.teacher_code}
                </span>
              </div>
            </div>

            {/* Performance card */}
            <div className="bg-white/20 backdrop-blur-xl rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 border border-white/30 shadow-xl">
              <div className="flex items-center gap-3 sm:gap-4">
                <RingProgress value={s.performance.overallPerformance} size={56} gradient="from-white to-purple-200" />
                <div>
                  <p className="text-white/80 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1">Performance</p>
                  <p className="text-white font-bold text-sm sm:text-base">
                    {s.performance.overallPerformance >= 80 ? '🌟 Excellent' :
                     s.performance.overallPerformance >= 60 ? '⭐ Good' :
                     s.performance.overallPerformance >= 40 ? '✨ Fair' : '💫 Needs work'}
                  </p>
                  <p className="text-white/70 text-[10px] sm:text-xs">Workload: {s.performance.workloadScore}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/80 backdrop-blur-sm border border-amber-200">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-700 text-xs sm:text-sm font-medium">Showing cached data — {error}</p>
          </div>
        )}

        {/* ── Core Stats Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <StatCard
            label="Classes" value={s.summary.activeClasses}
            icon={<School className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="indigo" gradient
          />
          <StatCard
            label="Students" value={s.summary.totalStudents}
            icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="emerald" gradient
          />
          <StatCard
            label="Subjects" value={s.summary.totalSubjects}
            icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="blue" gradient
          />
          <StatCard
            label="Pending Grading" value={s.summary.pendingGrading}
            icon={<ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="amber" trend={s.summary.pendingGrading > 0 ? 'down' : 'flat'} gradient
          />
          <StatCard
            label="Notifications" value={s.notifications.unread}
            sub={`${s.notifications.total} total`}
            icon={<Bell className="w-4 h-4 sm:w-5 sm:h-5" />}
            color="rose" trend={s.notifications.unread > 0 ? 'down' : 'flat'} gradient
          />
        </div>

        {/* ── Middle Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Attendance Card - Fancy */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-lg">Attendance</h3>
                <span className="text-white/80 text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Last 7 days
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                  <RingProgress value={s.attendance.last7Days.rate} size={70} gradient="from-white to-emerald-200" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Present</span>
                    <span className="text-white font-bold text-lg">{s.attendance.last7Days.present}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${(s.attendance.last7Days.present / s.attendance.last7Days.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/70">
                    <span>Absent: {s.attendance.last7Days.absent}</span>
                    <span>Late: {s.attendance.last7Days.late}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Today', value: s.attendance.today.present, icon: '☀️' },
                  { label: 'This Week', value: s.attendance.last7Days.present, icon: '📊' },
                  { label: 'Rate', value: `${s.attendance.last7Days.rate}%`, icon: '🎯' },
                ].map(item => (
                  <div key={item.label} className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center">
                    <div className="text-white text-lg font-bold">{item.value}</div>
                    <div className="text-white/70 text-xs">{item.label}</div>
                  </div>
                ))}
              </div>

              <button className="mt-4 w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 group">
                Record Attendance <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Schemes & Lesson Plans - Fancy */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 p-5 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative">
              <h3 className="font-bold text-white text-lg mb-4">Schemes & Plans</h3>

              <div className="mb-4">
                <div className="flex justify-between text-white mb-2">
                  <span>Schemes of Work</span>
                  <span className="font-bold">{s.schemes.completionRate}%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${s.schemes.completionRate}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: 'Total', value: s.schemes.total },
                    { label: 'Approved', value: s.schemes.approved },
                    { label: 'Pending', value: s.schemes.pending },
                    { label: 'Draft', value: s.schemes.draft },
                  ].map(item => (
                    <div key={item.label} className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5 text-center">
                      <div className="text-white font-bold text-sm">{item.value}</div>
                      <div className="text-white/70 text-[10px]">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Lesson Plans', value: s.lessonPlans.total, icon: '📚' },
                  { label: 'Completed', value: s.lessonPlans.completed, icon: '✅' },
                  { label: 'Upcoming', value: s.lessonPlans.upcoming, icon: '📅' },
                  { label: 'This Week', value: s.lessonPlans.planned, icon: '⚡' },
                ].map(item => (
                  <div key={item.label} className="bg-white/20 backdrop-blur-sm rounded-xl p-2 flex items-center gap-2">
                    <span className="text-white text-lg">{item.icon}</span>
                    <div>
                      <div className="text-white font-bold text-sm">{item.value}</div>
                      <div className="text-white/70 text-[10px]">{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 group">
                Manage Schemes <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Records & Assignments - Fancy */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 p-5 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative">
              <h3 className="font-bold text-white text-lg mb-4">Records & Assignments</h3>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Total', value: s.records.total, icon: '📊' },
                  { label: 'This Week', value: s.records.thisWeek, icon: '📈' },
                  { label: 'Last Week', value: s.records.lastWeek, icon: '📉' },
                  { label: 'Avg/Week', value: s.records.averagePerWeek, icon: '📊' },
                ].map(item => (
                  <div key={item.label} className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                    <div className="text-white text-lg font-bold">{item.value}</div>
                    <div className="text-white/70 text-xs flex items-center gap-1">
                      {item.icon} {item.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                {[
                  { label: 'Active Assignments', value: s.assignments.active, color: 'bg-emerald-400' },
                  { label: 'Upcoming', value: s.assignments.upcoming, color: 'bg-blue-400' },
                  { label: 'Overdue', value: s.assignments.overdue, color: 'bg-rose-400' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">{item.label}</span>
                    <span className={`px-2 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white font-bold text-sm`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-white mb-1">
                  <span className="text-sm">Grading Progress</span>
                  <span className="font-bold">{s.assignments.submissions.gradingProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${s.assignments.submissions.gradingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-white/70 text-xs mt-1">
                  <span>{s.assignments.submissions.graded} graded</span>
                  <span>{s.assignments.submissions.pending} pending</span>
                </div>
              </div>

              <button className="w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 group">
                Record Work <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Pending Submissions ──────────────────────────────────────── */}
        {pending.length > 0 && (
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 sm:p-6 shadow-xl">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-200" />
                    Priority Submissions
                  </h3>
                  <p className="text-white/80 text-sm">{pending.length} task{pending.length !== 1 ? 's' : ''} need your attention</p>
                </div>
                <button className="text-white/90 hover:text-white text-sm font-semibold flex items-center gap-1 transition-colors bg-white/20 px-3 py-1.5 rounded-full">
                  All tasks <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {pending.slice(0, 5).map(sub => (
                  <div key={sub.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all group/item">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full ${
                          sub.status === 'Overdue' ? 'bg-rose-400 animate-pulse' :
                          sub.status === 'Urgent' ? 'bg-amber-400 animate-pulse' :
                          sub.status === 'Pending Review' ? 'bg-blue-400' :
                          'bg-slate-400'
                        }`} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              sub.status === 'Overdue' ? 'bg-rose-500/30 text-white' :
                              sub.status === 'Urgent' ? 'bg-amber-500/30 text-white' :
                              sub.status === 'Draft' ? 'bg-slate-500/30 text-white' :
                              'bg-blue-500/30 text-white'
                            }`}>
                              {sub.status}
                            </span>
                            <span className="text-white/70 text-xs uppercase">
                              {sub.type?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="font-semibold text-white text-base">{sub.subject} — {sub.class}</p>
                          <p className="text-white/70 text-sm mt-1">
                            {sub.title} · Due {formatDeadline(sub.due_date)} · {sub.days_until_due}d left
                          </p>
                        </div>
                      </div>

                      <button className="px-4 py-2 bg-white hover:bg-white/90 text-amber-600 text-sm font-bold rounded-xl transition-all transform hover:scale-105 flex items-center gap-2 self-end sm:self-center">
                        {sub.type === 'assessment' ? 'Enter Scores' : 'Review'} 
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Recent Activity - Fancy */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 sm:p-6 shadow-xl">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Recent Activity</h3>
                  {activity && (
                    <p className="text-white/80 text-xs">
                      {activity.summary.total_activities} total · last updated {formatTime(activity.cachedAt)}
                    </p>
                  )}
                </div>
                <button className="text-white/90 hover:text-white text-sm font-semibold flex items-center gap-1 transition-colors bg-white/20 px-3 py-1.5 rounded-full">
                  All <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {(!activity || activity.data.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="w-12 h-12 text-white/30 mb-3" />
                  <p className="text-white font-medium">No recent activity</p>
                  <p className="text-white/60 text-sm mt-1">Your actions will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.data.map(item => (
                    <div key={item.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 transition-all">
                      <div className="flex gap-3">
                        <ActivityDot type={item.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm">{item.action}</p>
                          <p className="text-white/70 text-xs truncate mt-0.5">{item.details}</p>
                        </div>
                        <span className="text-white/60 text-xs flex-shrink-0">{formatTime(item.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activity && activity.summary.total_activities > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-2">
                  {Object.entries(activity.summary.by_type)
                    .filter(([, v]) => v > 0)
                    .slice(0, 6)
                    .map(([type, count]) => (
                      <div key={type} className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                        <div className="text-white font-bold text-lg">{count}</div>
                        <div className="text-white/70 text-xs capitalize">{type}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions - Fancy */}
          <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 p-5 sm:p-6 shadow-xl">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
            
            <div className="relative">
              <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-200" />
                Quick Actions
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Record Attendance', icon: <CheckCircle2 className="w-5 h-5" />, color: 'from-emerald-400 to-teal-400' },
                  { label: 'Lesson Plan', icon: <Calendar className="w-5 h-5" />, color: 'from-blue-400 to-cyan-400' },
                  { label: 'Upload Scheme', icon: <TrendingUp className="w-5 h-5" />, color: 'from-purple-400 to-pink-400' },
                  { label: 'Record Work', icon: <ClipboardCheck className="w-5 h-5" />, color: 'from-amber-400 to-orange-400' },
                  { label: 'Enter Scores', icon: <Target className="w-5 h-5" />, color: 'from-rose-400 to-red-400' },
                  { label: 'My Classes', icon: <Users className="w-5 h-5" />, color: 'from-indigo-400 to-purple-400' },
                  { label: 'View Schemes', icon: <BookOpen className="w-5 h-5" />, color: 'from-sky-400 to-blue-400' },
                  { label: 'View Records', icon: <FileText className="w-5 h-5" />, color: 'from-teal-400 to-emerald-400' },
                ].map(action => (
                  <button
                    key={action.label}
                    className={`bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 transition-all hover:scale-105 transform group/btn`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="text-white">{action.icon}</div>
                      <span className="text-white text-xs font-semibold">{action.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 px-2 pb-4">
          <p className="text-[10px] sm:text-xs text-slate-400">
            Teacher ID: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-mono">
              {s.teacher.id.slice(0, 8)}…
            </span>
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;