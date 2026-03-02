import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, ClipboardCheck, Users, AlertCircle,
  TrendingUp, Calendar, ArrowRight, Clock,
  ChevronRight, CheckCircle2, Loader2,
  AlertTriangle, FileText, User, School,
  Bell, RefreshCw, BarChart2, Zap,
  Activity, Target, Award, Layers,
  ChevronUp, ChevronDown, Minus,
  Flame, Sunrise, Sunset, Moon, Sun
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

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Primary: Slate-blue (cool neutral)
// Accent 1: Blue-600 (actions, highlights)
// Accent 2: Emerald-600 (success, attendance)
// Accent 3: Amber-600 (warnings, pending)
// Accent 4: Rose-600 (danger, overdue)
// Surface: White / Slate-50
// Muted: Slate-100/200

// ─── Mini Components ──────────────────────────────────────────────────────────

const StatCard = ({
  label, value, sub, icon, color = 'blue', trend
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color?: string; trend?: 'up' | 'down' | 'flat';
}) => {
  const colorMap: Record<string, { bg: string; iconBg: string; text: string; border: string }> = {
    blue:    { bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-100' },
    slate:   { bg: 'bg-slate-50',   iconBg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200' },
    amber:   { bg: 'bg-amber-50',   iconBg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-100' },
    rose:    { bg: 'bg-rose-50',    iconBg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`relative overflow-hidden rounded-xl p-4 border ${c.border} ${c.bg} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${c.iconBg} ${c.text}`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            trend === 'up'   ? 'bg-emerald-100 text-emerald-700' :
            trend === 'down' ? 'bg-rose-100 text-rose-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            {trend === 'up'   ? <ChevronUp className="w-3 h-3" /> :
             trend === 'down' ? <ChevronDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold ${c.text} mb-0.5`}>{value}</div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
};

const RingProgress = ({ value, size = 64, stroke = 6, color = '#2563EB' }: {
  value: number; size?: number; stroke?: number; color?: string;
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-700">{value}%</span>
      </div>
    </div>
  );
};

const ProgressBar = ({ value, color = 'bg-blue-500', label }: {
  value: number; color?: string; label?: string;
}) => (
  <div>
    {label && (
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{value}%</span>
      </div>
    )}
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

const ActivityDot = ({ type }: { type: string }) => {
  const dotColors: Record<string, string> = {
    attendance: 'bg-emerald-500',
    assessment: 'bg-blue-500',
    scheme:     'bg-violet-500',
    lesson:     'bg-sky-500',
    record:     'bg-amber-500',
    score:      'bg-rose-500',
    message:    'bg-teal-500',
  };
  return (
    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dotColors[type] || 'bg-slate-400'}`} />
  );
};

const GreetingIcon = ({ hour }: { hour: number }) => {
  if (hour < 12) return <Sunrise className="w-5 h-5 text-amber-500" />;
  if (hour < 17) return <Sun className="w-5 h-5 text-amber-500" />;
  if (hour < 20) return <Sunset className="w-5 h-5 text-orange-500" />;
  return <Moon className="w-5 h-5 text-slate-500" />;
};

// ─── Card Shell ───────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, sub, action }: { title: React.ReactNode; sub?: string; action?: React.ReactNode }) => (
  <div className="flex items-start justify-between mb-5">
    <div>
      <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {action}
  </div>
);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-slate-900 font-semibold text-lg mb-2">Couldn't load dashboard</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => fetchAll(true)}
            className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors text-sm"
          >
            Try again
          </button>
        </Card>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* ── Top Nav Bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <School className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-sm">Teacher Portal</span>
              <p className="text-xs text-slate-400">{s.teacher.teacher_code}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {s.notifications.unread > 0 && (
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {s.notifications.unread}
                </span>
              </button>
            )}

            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-xs font-medium text-slate-600 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing' : 'Refresh'}</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {s.teacher.name?.charAt(0) || 'T'}
              </div>
              <span className="text-xs font-medium text-slate-700 hidden sm:block">
                {s.teacher.teacher_code}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <GreetingIcon hour={greetingHour} />
                <p className="text-blue-100 text-sm font-medium">{greeting}</p>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{teacherName}</h1>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/50 text-blue-50 text-xs font-medium border border-blue-400/30">
                  {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/50 text-blue-50 text-xs font-medium border border-blue-400/30">
                  {s.teacher.teacher_code}
                </span>
              </div>
            </div>

            {/* Performance card */}
            <div className="bg-blue-500/40 rounded-xl px-5 py-4 border border-blue-400/30 flex items-center gap-4">
              <RingProgress value={s.performance.overallPerformance} size={56} stroke={5} color="white" />
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">Performance</p>
                <p className="text-white font-semibold text-sm">
                  {s.performance.overallPerformance >= 80 ? 'Excellent' :
                   s.performance.overallPerformance >= 60 ? 'Good' :
                   s.performance.overallPerformance >= 40 ? 'Fair' : 'Needs work'}
                </p>
                <p className="text-blue-200 text-xs">Workload: {s.performance.workloadScore}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-amber-700 text-xs font-medium">Showing cached data — {error}</p>
          </div>
        )}

        {/* ── Core Stats Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Classes"         value={s.summary.activeClasses}  icon={<School className="w-4 h-4" />}       color="blue" />
          <StatCard label="Students"        value={s.summary.totalStudents}  icon={<Users className="w-4 h-4" />}        color="emerald" />
          <StatCard label="Subjects"        value={s.summary.totalSubjects}  icon={<BookOpen className="w-4 h-4" />}     color="slate" />
          <StatCard label="Pending Grading" value={s.summary.pendingGrading} icon={<ClipboardCheck className="w-4 h-4" />} color="amber" trend={s.summary.pendingGrading > 0 ? 'down' : 'flat'} />
          <StatCard label="Notifications"  value={s.notifications.unread}   icon={<Bell className="w-4 h-4" />} sub={`${s.notifications.total} total`} color="rose" trend={s.notifications.unread > 0 ? 'down' : 'flat'} />
        </div>

        {/* ── Middle Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Attendance */}
          <Card className="p-5">
            <CardHeader
              title="Attendance"
              sub="Last 7 days"
              action={
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
                  {s.attendance.last7Days.rate}%
                </span>
              }
            />

            <div className="flex items-center gap-4 mb-5">
              <RingProgress value={s.attendance.last7Days.rate} size={64} stroke={6} color="#059669" />
              <div className="flex-1">
                <ProgressBar value={s.attendance.last7Days.present} color="bg-emerald-500" label="Present" />
                <div className="mt-3 flex justify-between text-xs text-slate-400">
                  <span>Absent: {s.attendance.last7Days.absent}</span>
                  <span>Late: {s.attendance.last7Days.late}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Today',     value: s.attendance.today.present },
                { label: 'This Week', value: s.attendance.last7Days.present },
                { label: 'Rate',      value: `${s.attendance.last7Days.rate}%` },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                  <div className="text-slate-900 font-semibold text-sm">{item.value}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            <button className="w-full py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-colors flex items-center justify-center gap-2">
              Record Attendance <ArrowRight className="w-4 h-4" />
            </button>
          </Card>

          {/* Schemes & Lesson Plans */}
          <Card className="p-5">
            <CardHeader title="Schemes & Plans" />

            <div className="mb-4">
              <ProgressBar value={s.schemes.completionRate} color="bg-violet-500" label="Schemes of Work" />
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {[
                  { label: 'Total',    value: s.schemes.total },
                  { label: 'Approved', value: s.schemes.approved },
                  { label: 'Pending',  value: s.schemes.pending },
                  { label: 'Draft',    value: s.schemes.draft },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-1.5 text-center border border-slate-100">
                    <div className="text-slate-900 font-semibold text-sm">{item.value}</div>
                    <div className="text-slate-400 text-[10px]">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Lesson Plans', value: s.lessonPlans.total },
                { label: 'Completed',    value: s.lessonPlans.completed },
                { label: 'Upcoming',     value: s.lessonPlans.upcoming },
                { label: 'This Week',    value: s.lessonPlans.planned },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 text-xs">{item.label}</span>
                  <span className="text-slate-900 font-semibold text-sm">{item.value}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 font-medium text-sm transition-colors flex items-center justify-center gap-2">
              Manage Schemes <ArrowRight className="w-4 h-4" />
            </button>
          </Card>

          {/* Records & Assignments */}
          <Card className="p-5">
            <CardHeader title="Records & Assignments" />

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Total',     value: s.records.total },
                { label: 'This Week', value: s.records.thisWeek },
                { label: 'Last Week', value: s.records.lastWeek },
                { label: 'Avg/Week',  value: s.records.averagePerWeek },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 text-xs">{item.label}</span>
                  <span className="text-slate-900 font-semibold text-sm">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4">
              {[
                { label: 'Active',   value: s.assignments.active,   dot: 'bg-emerald-500' },
                { label: 'Upcoming', value: s.assignments.upcoming, dot: 'bg-blue-500' },
                { label: 'Overdue',  value: s.assignments.overdue,  dot: 'bg-rose-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                    <span className="text-slate-600 text-sm">{item.label} Assignments</span>
                  </div>
                  <span className="font-semibold text-slate-900 text-sm">{item.value}</span>
                </div>
              ))}
            </div>

            <ProgressBar value={s.assignments.submissions.gradingProgress} color="bg-blue-500" label="Grading Progress" />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{s.assignments.submissions.graded} graded</span>
              <span>{s.assignments.submissions.pending} pending</span>
            </div>

            <button className="mt-4 w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-colors flex items-center justify-center gap-2">
              Record Work <ArrowRight className="w-4 h-4" />
            </button>
          </Card>
        </div>

        {/* ── Pending Submissions ──────────────────────────────────────── */}
        {pending.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Priority Submissions
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">{pending.length} task{pending.length !== 1 ? 's' : ''} need your attention</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 transition-colors">
                All tasks <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {pending.slice(0, 5).map(sub => (
                <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      sub.status === 'Overdue' ? 'bg-rose-500' :
                      sub.status === 'Urgent'  ? 'bg-amber-500' :
                      'bg-blue-400'
                    }`} />
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          sub.status === 'Overdue' ? 'bg-rose-100 text-rose-700' :
                          sub.status === 'Urgent'  ? 'bg-amber-100 text-amber-700' :
                          sub.status === 'Draft'   ? 'bg-slate-200 text-slate-600' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {sub.status}
                        </span>
                        <span className="text-slate-400 text-xs uppercase tracking-wide">
                          {sub.type?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900 text-sm">{sub.subject} — {sub.class}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {sub.title} · Due {formatDeadline(sub.due_date)} · {sub.days_until_due}d left
                      </p>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-center whitespace-nowrap">
                    {sub.type === 'assessment' ? 'Enter Scores' : 'Review'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Bottom Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Recent Activity */}
          <Card className="p-5">
            <CardHeader
              title="Recent Activity"
              sub={activity ? `${activity.summary.total_activities} total · updated ${formatTime(activity.cachedAt)}` : undefined}
              action={
                <button className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                  All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            />

            {(!activity || activity.data.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium text-sm">No recent activity</p>
                <p className="text-slate-400 text-xs mt-1">Your actions will appear here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.data.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <ActivityDot type={item.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-medium text-sm">{item.action}</p>
                      <p className="text-slate-400 text-xs truncate mt-0.5">{item.details}</p>
                    </div>
                    <span className="text-slate-400 text-xs flex-shrink-0">{formatTime(item.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}

            {activity && activity.summary.total_activities > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                {Object.entries(activity.summary.by_type)
                  .filter(([, v]) => v > 0)
                  .slice(0, 6)
                  .map(([type, count]) => (
                    <div key={type} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                      <div className="text-slate-900 font-semibold text-sm">{count}</div>
                      <div className="text-slate-400 text-xs capitalize">{type}</div>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-5">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Actions
                </span>
              }
            />

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Record Attendance', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100' },
                { label: 'Lesson Plan',       icon: <Calendar className="w-4 h-4" />,      color: 'text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100' },
                { label: 'Upload Scheme',     icon: <TrendingUp className="w-4 h-4" />,     color: 'text-violet-700 bg-violet-50 border-violet-100 hover:bg-violet-100' },
                { label: 'Record Work',       icon: <ClipboardCheck className="w-4 h-4" />, color: 'text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100' },
                { label: 'Enter Scores',      icon: <Target className="w-4 h-4" />,         color: 'text-rose-700 bg-rose-50 border-rose-100 hover:bg-rose-100' },
                { label: 'My Classes',        icon: <Users className="w-4 h-4" />,          color: 'text-sky-700 bg-sky-50 border-sky-100 hover:bg-sky-100' },
                { label: 'View Schemes',      icon: <BookOpen className="w-4 h-4" />,       color: 'text-teal-700 bg-teal-50 border-teal-100 hover:bg-teal-100' },
                { label: 'View Records',      icon: <FileText className="w-4 h-4" />,       color: 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100' },
              ].map(action => (
                <button
                  key={action.label}
                  className={`rounded-xl p-3 border transition-colors flex items-center gap-2.5 ${action.color}`}
                >
                  {action.icon}
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1 pb-4">
          <p className="text-xs text-slate-400">
            Teacher ID: <span className="font-mono text-slate-500">{s.teacher.id.slice(0, 8)}…</span>
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;