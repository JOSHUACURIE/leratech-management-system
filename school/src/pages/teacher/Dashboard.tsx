import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, ClipboardCheck, Users, AlertCircle,
  TrendingUp, Calendar, ArrowRight, Clock,
  ChevronRight, CheckCircle2, Loader2,
  AlertTriangle, FileText, User, School,
  Bell, RefreshCw, BarChart2, Zap,
  Activity, Target, Award, Layers,
  ChevronUp, ChevronDown, Minus
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

// ─── Mini Components ──────────────────────────────────────────────────────────

const StatCard = ({
  label, value, sub, icon, accent, trend
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string; trend?: 'up' | 'down' | 'flat';
}) => (
  <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 border ${accent}`}>
    <div className="flex items-start justify-between mb-2 sm:mb-3">
      <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/60 backdrop-blur-sm">{icon}</div>
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
    <div className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 mb-0.5">{value}</div>
    <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
    {sub && <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">{sub}</div>}
  </div>
);

const RingProgress = ({ value, size = 64, stroke = 6, color = '#6366f1' }: {
  value: number; size?: number; stroke?: number; color?: string;
}) => {
  const mobileSize = typeof window !== 'undefined' && window.innerWidth < 640 ? size * 0.8 : size;
  const r = (mobileSize - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={mobileSize} height={mobileSize} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={mobileSize / 2} cy={mobileSize / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={mobileSize / 2} cy={mobileSize / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
};

const ProgressBar = ({ value, color = 'bg-indigo-500', label }: { value: number; color?: string; label?: string }) => (
  <div>
    {label && <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 mb-1"><span>{label}</span><span>{value}%</span></div>}
    <div className="h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

const ActivityDot = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    attendance: 'bg-emerald-500',
    assessment: 'bg-blue-500',
    scheme: 'bg-violet-500',
    lesson: 'bg-indigo-500',
    record: 'bg-amber-500',
    score: 'bg-rose-500',
    message: 'bg-teal-500',
  };
  return <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 mt-1 sm:mt-1.5 ${colors[type] || 'bg-slate-400'}`} />;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium tracking-wide text-sm sm:text-base">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-red-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-lg">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-slate-900 font-bold text-lg sm:text-xl mb-2">Couldn't load dashboard</h2>
          <p className="text-slate-600 text-xs sm:text-sm mb-4 sm:mb-6">{error}</p>
          <button onClick={() => fetchAll(true)}
            className="px-5 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl font-semibold transition-colors w-full text-sm sm:text-base">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white text-slate-900">

      {/* ── Top Nav Bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-xs sm:text-sm hidden xs:block">Teacher Portal</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {s.notifications.unread > 0 && (
              <button className="relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 text-white text-[8px] sm:text-xs rounded-full flex items-center justify-center font-bold">
                  {s.notifications.unread}
                </span>
              </button>
            )}
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-xs sm:text-sm font-medium text-slate-600 disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{refreshing ? 'Refreshing' : 'Refresh'}</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">
                {s.teacher.name?.charAt(0) || 'T'}
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-600 hidden sm:block">
                {s.teacher.teacher_code}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-slate-50 border border-indigo-100 p-4 sm:p-8">
          {/* decorative blobs - hidden on mobile */}
          <div className="hidden sm:block absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none" />
          <div className="hidden sm:block absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-violet-200/30 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-indigo-600 font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">{greeting} ☀️</p>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2 sm:mb-3">{teacherName}</h1>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-semibold border border-indigo-200">
                  {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-semibold border border-indigo-200">
                  {s.teacher.teacher_code}
                </span>
              </div>
            </div>

            {/* Performance ring */}
            <div className="flex items-center gap-2 sm:gap-4 bg-white rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-4 border border-indigo-100 shadow-sm self-start sm:self-end">
              <div className="relative">
                <RingProgress value={s.performance.overallPerformance} size={48} stroke={4} color="#6366f1" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-black text-indigo-600">{s.performance.overallPerformance}%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Performance</p>
                <p className="text-slate-900 font-bold text-sm sm:text-base">
                  {s.performance.overallPerformance >= 80 ? 'Excellent' :
                   s.performance.overallPerformance >= 60 ? 'Good' :
                   s.performance.overallPerformance >= 40 ? 'Fair' : 'Needs work'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">Workload: {s.performance.workloadScore}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
            <p className="text-amber-700 text-xs sm:text-sm">— showing last cached data.</p>
          </div>
        )}

        {/* ── Core Stats Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <StatCard
            label="Classes" value={s.summary.activeClasses}
            icon={<School className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />}
            accent="bg-indigo-50 border-indigo-200"
          />
          <StatCard
            label="Students" value={s.summary.totalStudents}
            icon={<Users className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />}
            accent="bg-emerald-50 border-emerald-200"
          />
          <StatCard
            label="Subjects" value={s.summary.totalSubjects}
            icon={<BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />}
            accent="bg-blue-50 border-blue-200"
          />
          <StatCard
            label="Pending Grading" value={s.summary.pendingGrading}
            icon={<ClipboardCheck className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />}
            accent="bg-amber-50 border-amber-200"
            trend={s.summary.pendingGrading > 0 ? 'down' : 'flat'}
          />
          <StatCard
            label="Notifications" value={s.notifications.unread}
            sub={`${s.notifications.total} total`}
            icon={<Bell className="w-3 h-3 sm:w-4 sm:h-4 text-rose-600" />}
            accent="bg-rose-50 border-rose-200"
            trend={s.notifications.unread > 0 ? 'down' : 'flat'}
          />
        </div>

        {/* ── Middle Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Attendance Card */}
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Attendance</h3>
              <span className="text-[10px] sm:text-xs text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">Last 7 days</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative">
                <RingProgress
                  value={s.attendance.last7Days.rate}
                  size={60} stroke={5}
                  color={s.attendance.last7Days.rate >= 70 ? '#10b981' : s.attendance.last7Days.rate >= 40 ? '#f59e0b' : '#ef4444'}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-black text-slate-900">{s.attendance.last7Days.rate}%</span>
                </div>
              </div>
              <div className="space-y-1 sm:space-y-1.5 flex-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Present</span>
                  <span className="font-semibold text-emerald-600">{s.attendance.last7Days.present}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Absent</span>
                  <span className="font-semibold text-red-600">{s.attendance.last7Days.absent}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Late</span>
                  <span className="font-semibold text-amber-600">{s.attendance.last7Days.late}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm pt-1 sm:pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500">Total</span>
                  <span className="font-bold text-slate-900">{s.attendance.last7Days.total}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
              <p className="text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-2 font-medium uppercase tracking-wider">Today</p>
              <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                {[
                  { l: 'Present', v: s.attendance.today.present, c: 'text-emerald-600' },
                  { l: 'Absent', v: s.attendance.today.absent, c: 'text-red-600' },
                  { l: 'Late', v: s.attendance.today.late, c: 'text-amber-600' },
                ].map(item => (
                  <div key={item.l}>
                    <div className={`text-base sm:text-xl font-black ${item.c}`}>{item.v}</div>
                    <div className="text-[8px] sm:text-xs text-slate-500">{item.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/attendance/today'}
              className="mt-3 sm:mt-4 w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-xs sm:text-sm font-semibold text-slate-600 flex items-center justify-center gap-1 sm:gap-2"
            >
              Record Attendance <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Schemes & Lesson Plans */}
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Schemes & Plans</h3>

            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">Schemes of Work</p>
                <span className="text-[10px] sm:text-xs text-slate-500">{s.schemes.completionRate}% complete</span>
              </div>
              <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-2 sm:mb-3">
                {[
                  { l: 'Total', v: s.schemes.total, c: 'text-slate-900' },
                  { l: 'Approved', v: s.schemes.approved, c: 'text-emerald-600' },
                  { l: 'Pending', v: s.schemes.pending, c: 'text-amber-600' },
                  { l: 'Draft', v: s.schemes.draft, c: 'text-slate-500' },
                ].map(item => (
                  <div key={item.l} className="bg-slate-50 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 text-center">
                    <div className={`text-sm sm:text-lg font-black ${item.c}`}>{item.v}</div>
                    <div className="text-[8px] sm:text-xs text-slate-500 mt-0.5">{item.l}</div>
                  </div>
                ))}
              </div>
              <ProgressBar value={s.schemes.completionRate} color="bg-emerald-500" />
            </div>

            <div className="border-t border-slate-100 pt-3 sm:pt-4">
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Lesson Plans</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { l: 'Total', v: s.lessonPlans.total, icon: <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> },
                  { l: 'Completed', v: s.lessonPlans.completed, icon: <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> },
                  { l: 'Upcoming', v: s.lessonPlans.upcoming, icon: <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> },
                  { l: 'This Week', v: s.lessonPlans.planned, icon: <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> },
                ].map(item => (
                  <div key={item.l} className="flex items-center gap-1.5 sm:gap-2.5 bg-slate-50 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2.5">
                    <div className="text-indigo-600">{item.icon}</div>
                    <div>
                      <div className="text-sm sm:text-base font-black text-slate-900">{item.v}</div>
                      <div className="text-[8px] sm:text-xs text-slate-500">{item.l}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/schemes'}
              className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-xs sm:text-sm font-semibold text-slate-600 flex items-center justify-center gap-1 sm:gap-2"
            >
              Manage Schemes <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Records & Assignments */}
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Records & Assignments</h3>

            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Work Records (30 days)</p>
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                {[
                  { l: 'Total', v: s.records.total, c: 'text-slate-900' },
                  { l: 'This Week', v: s.records.thisWeek, c: 'text-indigo-600' },
                  { l: 'Last Week', v: s.records.lastWeek, c: 'text-slate-500' },
                  { l: 'Avg/Week', v: s.records.averagePerWeek, c: 'text-blue-600' },
                ].map(item => (
                  <div key={item.l} className="bg-slate-50 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2.5">
                    <div className={`text-base sm:text-xl font-black ${item.c}`}>{item.v}</div>
                    <div className="text-[8px] sm:text-xs text-slate-500">{item.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 sm:pt-4">
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Assignments</p>
              <div className="space-y-1.5 sm:space-y-2.5">
                {[
                  { l: 'Active', v: s.assignments.active, c: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { l: 'Upcoming', v: s.assignments.upcoming, c: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { l: 'Overdue', v: s.assignments.overdue, c: 'bg-red-50 text-red-700 border-red-200' },
                ].map(item => (
                  <div key={item.l} className={`flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border ${item.c}`}>
                    <span className="text-xs sm:text-sm font-medium">{item.l}</span>
                    <span className="font-black text-sm sm:text-base">{item.v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 sm:mt-3">
                <ProgressBar
                  value={s.assignments.submissions.gradingProgress}
                  color="bg-indigo-500"
                  label={`Grading progress`}
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 mt-1">
                  <span>{s.assignments.submissions.graded} graded</span>
                  <span>{s.assignments.submissions.pending} pending</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/records/new'}
              className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-xs sm:text-sm font-semibold text-slate-600 flex items-center justify-center gap-1 sm:gap-2"
            >
              Record Work <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Pending Submissions ──────────────────────────────────────── */}
        {pending.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Priority Submissions</h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{pending.length} task{pending.length !== 1 ? 's' : ''} need your attention</p>
              </div>
              <button
                onClick={() => window.location.href = '/teacher/schedule'}
                className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors"
              >
                All tasks <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {pending.slice(0, 5).map(sub => (
                <div key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl transition-colors group">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`mt-1 sm:mt-0.5 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full flex-shrink-0 ${
                      sub.status === 'Overdue' ? 'bg-red-500' :
                      sub.status === 'Urgent' ? 'bg-amber-500' :
                      sub.status === 'Pending Review' ? 'bg-blue-500' :
                      'bg-slate-500'
                    }`} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <span className={`text-[8px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full border ${
                          sub.status === 'Overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                          sub.status === 'Urgent' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          sub.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>{sub.status}</span>
                        <span className="text-[8px] sm:text-xs text-slate-500 uppercase font-semibold tracking-wide">
                          {sub.type?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{sub.subject} — {sub.class}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                        {sub.title} · Due {formatDeadline(sub.due_date)} · {sub.days_until_due}d left
                      </p>
                    </div>
                  </div>

                  {sub.type === 'assessment' ? (
                    <button
                      onClick={() => window.location.href = `/teacher/enter-scores/${sub.id}?class=${sub.class_id}&subject=${sub.subject_id}`}
                      className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-colors flex items-center gap-1 sm:gap-1.5 justify-center mt-2 sm:mt-0"
                    >
                      Enter Scores <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => window.location.href = `/schemes/${sub.id}`}
                      className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-colors flex items-center gap-1 sm:gap-1.5 justify-center mt-2 sm:mt-0"
                    >
                      Review <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recent Activity</h3>
                {activity && (
                  <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5">
                    {activity.summary.total_activities} total · last updated {formatTime(activity.cachedAt)}
                  </p>
                )}
              </div>
              <button
                onClick={() => window.location.href = '/teacher/activity'}
                className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm font-semibold flex items-center gap-1 transition-colors"
              >
                All <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>

            {(!activity || activity.data.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-center">
                <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mb-2 sm:mb-3" />
                <p className="text-slate-500 font-medium text-xs sm:text-sm">No recent activity</p>
                <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Your actions will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {activity.data.map((item, i) => (
                  <div key={item.id} className="flex gap-2 sm:gap-3">
                    <ActivityDot type={item.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">{item.action}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate mt-0.5">{item.details}</p>
                    </div>
                    <span className="text-[8px] sm:text-xs text-slate-400 flex-shrink-0 mt-0.5">{formatTime(item.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Activity type breakdown */}
            {activity && activity.summary.total_activities > 0 && (
              <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 grid grid-cols-3 gap-1 sm:gap-2">
                {Object.entries(activity.summary.by_type)
                  .filter(([, v]) => v > 0)
                  .slice(0, 6)
                  .map(([type, count]) => (
                    <div key={type} className="bg-slate-50 rounded-lg px-1.5 sm:px-2.5 py-1 sm:py-2 text-center">
                      <div className="text-xs sm:text-sm font-black text-slate-900">{count}</div>
                      <div className="text-[8px] sm:text-xs text-slate-500 capitalize">{type}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3 sm:mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { label: 'Record Attendance', icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />, route: '/attendance/today', color: 'hover:border-emerald-300 hover:bg-emerald-50' },
                { label: 'Lesson Plan', icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />, route: '/lessons/new', color: 'hover:border-blue-300 hover:bg-blue-50' },
                { label: 'Upload Scheme', icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />, route: '/schemes/new', color: 'hover:border-violet-300 hover:bg-violet-50' },
                { label: 'Record Work', icon: <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />, route: '/records/new', color: 'hover:border-amber-300 hover:bg-amber-50' },
                { label: 'Enter Scores', icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" />, route: '/scores/enter', color: 'hover:border-rose-300 hover:bg-rose-50' },
                { label: 'My Classes', icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, route: '/teacher/classes', color: 'hover:border-indigo-300 hover:bg-indigo-50' },
                { label: 'View Schemes', icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />, route: '/schemes', color: 'hover:border-sky-300 hover:bg-sky-50' },
                { label: 'View Records', icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />, route: '/records', color: 'hover:border-teal-300 hover:bg-teal-50' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => window.location.href = action.route}
                  className={`flex items-center gap-1.5 sm:gap-2.5 p-2 sm:p-3.5 rounded-lg sm:rounded-xl border border-slate-200 bg-white transition-all active:scale-95 hover:shadow-sm ${action.color}`}
                >
                  <div className="text-slate-600 flex-shrink-0">{action.icon}</div>
                  <span className="text-[10px] sm:text-sm font-semibold text-slate-700 leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 sm:gap-2 px-1 pb-2 sm:pb-4">
          <p className="text-[8px] sm:text-xs text-slate-400">
            Teacher ID: <span className="text-slate-500">{s.teacher.id.slice(0, 8)}…</span>
          </p>
          <p className="text-[8px] sm:text-xs text-slate-400">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;