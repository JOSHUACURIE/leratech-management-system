import React, { useState, useEffect } from "react";
import { 
  BookOpen, ClipboardCheck, Users, AlertCircle, 
  TrendingUp, Calendar, ArrowRight, Clock, 
  ChevronRight, CheckCircle2, Loader2, 
  AlertTriangle, FileText, User, School, 
  Target, Zap, Award, Bell, MessageSquare,
  RefreshCw
} from "lucide-react";
import Card from "../../components/common/Card";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface TeacherProfile {
  id: string;
  user_id: string;
  teacher_code: string;
  tsc_number: string | null;
  qualification: string | null;
  specialization: string | null;
  employment_type: string | null;
  date_of_employment: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    profile_picture_url: string | null;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    national_id: string | null;
    date_of_birth: string | null;
    gender: string | null;
    is_email_verified: boolean;
    is_phone_verified: boolean;
    full_name: string;
  };
  school: {
    id: string;
    name: string;
    school_code: string;
    primary_color: string;
    logo_url: string | null;
  };
  statistics: {
    total_assignments: number;
    current_assignments: number;
    years_of_service: number;
    todays_lessons: number;
    pending_schemes: number;
    attendance_this_week: number;
  };
  current_assignments: Array<{
    id: string;
    class: {
      id: string;
      name: string;
      level?: string;
    };
    stream: {
      id: string;
      name: string;
    };
    subjects: Array<{
      id: string;
      name: string;
      code: string;
    }>;
    subjects_count: number;
    assigned_at: string;
  }>;
  quick_stats: {
    total_students: number;
    total_subjects: number;
    total_classes: number;
    avg_students_per_class: number;
  };
  cache_timestamp?: string;
  data_freshness?: 'fresh' | 'stale_cache' | 'cached';
}

interface DashboardSummary {
  teacher: {
    id: string;
    teacher_code: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      profile_picture_url?: string;
    };
  };
  current_period: {
    academic_year: {
      id: string;
      year_name: string;
      start_date: string;
      end_date: string;
      is_current: boolean;
    };
    term: {
      id: string;
      term_name: string;
      start_date: string;
      end_date: string;
      is_current: boolean;
    };
  };
  summary: {
    total_classes: number;
    total_students: number;
    total_subjects: number;
    pending_schemes: number;
    pending_records: number;
    upcoming_lessons: number;
    attendance_this_week: number;
  };
  current_assignments: Array<{
    id: string;
    class: {
      id: string;
      class_name: string;
      class_level: string;
    };
    stream: {
      id: string;
      name: string;
    };
    subjects: Array<{
      id: string;
      name: string;
      subject_code: string;
    }>;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    is_read: boolean;
  }>;
  quick_actions: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    route: string;
  }>;
  meta?: {
    cached: boolean;
    responseTime: string;
    cacheAge?: string;
    stale?: boolean;
  };
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
  assessment_type?: string;
  days_until_due: number;
  status: "Urgent" | "Upcoming" | "Overdue" | "Pending Review" | "Draft";
  completion_rate?: number;
  total_students?: number;
  scores_entered?: number;
}

interface RecentActivity {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: string;
  metadata?: { [key: string]: any };
}

interface QuickStats {
  assignments: number;
  pendingGrading: number;
  attendance7Days: number;
  notifications: number;
  schemes: number;
  upcomingLessons: number;
  lastUpdated: string;
  error?: string;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch all dashboard data
  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      setRefreshing(true);
      setError(null);

      // Fetch teacher profile (with optional force refresh)
      const profileParams = forceRefresh ? { force_refresh: 'true' } : {};
      const teacherResponse = await api.get('/teachers/me/profile', { params: profileParams });
      const teacherData = teacherResponse.data.data;
      setTeacherProfile(teacherData);

      // Fetch quick stats (optimized endpoint)
      try {
        const statsResponse = await api.get('/teachers/me/quick-stats');
        setQuickStats(statsResponse.data.data);
      } catch (statsError: any) {
        console.warn('Quick stats not available:', statsError.message);
        setQuickStats({
          assignments: teacherData.statistics?.total_assignments || 0,
          pendingGrading: 0,
          attendance7Days: teacherData.statistics?.attendance_this_week || 0,
          notifications: 0,
          schemes: teacherData.statistics?.pending_schemes || 0,
          upcomingLessons: teacherData.statistics?.todays_lessons || 0,
          lastUpdated: new Date().toISOString()
        });
      }

      // Try to fetch dashboard summary
      try {
        const dashboardResponse = await api.get('/teachers/dashboard/stats');
        if (dashboardResponse.data.success) {
          setDashboardData(dashboardResponse.data.data);
        }
      } catch (dashboardError: any) {
        console.warn('Dashboard stats not available:', dashboardError.message);
        // Create dashboard data from profile if endpoint doesn't exist
        createMockDashboardData(teacherData);
      }

      // Fetch pending submissions
      fetchPendingSubmissions();

      // Fetch recent activity
      fetchRecentActivity();

      // Fetch notifications if endpoint exists
      fetchNotifications();

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load dashboard data';
      
      // If we have stale data, show warning but don't clear data
      if (teacherProfile) {
        setError(`Showing cached data: ${errorMsg}`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createMockDashboardData = (teacherData: TeacherProfile) => {
    const mockDashboardData: DashboardSummary = {
      teacher: {
        id: teacherData.id,
        teacher_code: teacherData.teacher_code,
        user: {
          first_name: teacherData.user.first_name,
          last_name: teacherData.user.last_name,
          email: teacherData.user.email,
          profile_picture_url: teacherData.user.profile_picture_url || undefined
        }
      },
      current_period: {
        academic_year: {
          id: "current-year",
          year_name: new Date().getFullYear().toString(),
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(),
          is_current: true
        },
        term: {
          id: "current-term",
          term_name: "Term 1",
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().getFullYear(), 5, 30).toISOString(),
          is_current: true
        }
      },
      summary: {
        total_classes: teacherData.quick_stats?.total_classes || 0,
        total_students: teacherData.quick_stats?.total_students || 0,
        total_subjects: teacherData.quick_stats?.total_subjects || 0,
        pending_schemes: teacherData.statistics?.pending_schemes || 0,
        pending_records: 0,
        upcoming_lessons: teacherData.statistics?.todays_lessons || 0,
        attendance_this_week: teacherData.statistics?.attendance_this_week || 0
      },
      current_assignments: teacherData.current_assignments?.map((assignment: any) => ({
        id: assignment.id,
        class: {
          id: assignment.class.id,
          class_name: assignment.class.name,
          class_level: assignment.class.level || ""
        },
        stream: {
          id: assignment.stream.id,
          name: assignment.stream.name
        },
        subjects: assignment.subjects?.map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          subject_code: subject.code
        })) || []
      })) || [],
      notifications: [],
      quick_actions: getQuickActions()
    };
    setDashboardData(mockDashboardData);
  };

  const fetchPendingSubmissions = async () => {
    try {
      const submissionsResponse = await api.get('/teachers/me/pending-submissions');
      if (submissionsResponse.data.success) {
        const submissions = submissionsResponse.data.data || [];
        
        // Transform submissions to match expected format
        const formattedSubmissions: PendingSubmission[] = submissions.map((sub: any) => ({
          id: sub.id,
          type: sub.type || 'assessment',
          class: sub.class || 'N/A',
          class_id: sub.class_id,
          subject: sub.subject || 'General',
          subject_id: sub.subject_id,
          title: sub.title || sub.assessment || 'Submission',
          due_date: sub.due_date || sub.deadline || new Date().toISOString(),
          assessment_type: sub.assessment_type || sub.type,
          days_until_due: sub.days_until_due || getDaysUntilDeadline(sub.due_date || sub.deadline),
          status: getSubmissionStatus(sub.status, sub.days_until_due),
          completion_rate: sub.completion_rate,
          total_students: sub.total_students,
          scores_entered: sub.scores_entered
        }));
        
        setPendingSubmissions(formattedSubmissions);
      }
    } catch (submissionError: any) {
      console.warn('Pending submissions not available:', submissionError.message);
      setPendingSubmissions([]);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activityResponse = await api.get('/teachers/me/activity?limit=5');
      if (activityResponse.data.success) {
        setRecentActivities(activityResponse.data.data || []);
      }
    } catch (activityError: any) {
      console.warn('Activity not available:', activityError.message);
      setRecentActivities([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      // This would call a notifications endpoint if it exists
      // For now, we'll skip this
    } catch (error) {
      // Silent fail for notifications
    }
  };

  const getQuickActions = () => [
    {
      id: 'record_attendance',
      title: 'Record Attendance',
      description: 'Mark today\'s attendance',
      icon: 'check-circle',
      route: '/attendance/today'
    },
    {
      id: 'create_lesson',
      title: 'Create Lesson Plan',
      description: 'Plan upcoming lessons',
      icon: 'calendar-plus',
      route: '/lessons/new'
    },
    {
      id: 'upload_scheme',
      title: 'Upload Scheme',
      description: 'Submit scheme of work',
      icon: 'upload',
      route: '/schemes/new'
    },
    {
      id: 'record_work',
      title: 'Record Work',
      description: 'Log completed work',
      icon: 'clipboard-check',
      route: '/records/new'
    },
    {
      id: 'enter_scores',
      title: 'Enter Scores',
      description: 'Submit student marks',
      icon: 'clipboard-check',
      route: '/scores/enter'
    },
    {
      id: 'view_schemes',
      title: 'View Schemes',
      description: 'Check scheme status',
      icon: 'book-open',
      route: '/schemes'
    },
    {
      id: 'view_records',
      title: 'View Records',
      description: 'Review work records',
      icon: 'file-text',
      route: '/records'
    },
    {
      id: 'my_classes',
      title: 'My Classes',
      description: 'View all classes',
      icon: 'users',
      route: '/teacher/classes'
    }
  ];

  // Helper functions
  const getDaysUntilDeadline = (deadline: string): number => {
    if (!deadline) return 7;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getSubmissionStatus = (status: string, daysUntilDue?: number): PendingSubmission['status'] => {
    if (status && ['Urgent', 'Upcoming', 'Overdue', 'Pending Review', 'Draft'].includes(status)) {
      return status as PendingSubmission['status'];
    }
    
    const daysLeft = daysUntilDue ?? 7;
    if (daysLeft < 0) return "Overdue";
    if (daysLeft <= 2) return "Urgent";
    return "Upcoming";
  };

  const formatDeadline = (deadline: string) => {
    try {
      return new Date(deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleClearCache = async () => {
    try {
      await api.post('/teachers/cache/invalidate/me');
      alert('Cache cleared successfully!');
      fetchDashboardData(true);
    } catch (error) {
      alert('Failed to clear cache');
    }
  };

  const handleEnterScores = (submissionId: string, classId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (classId) params.append('class', classId);
    if (subjectId) params.append('subject', subjectId);
    window.location.href = `/teacher/enter-scores/${submissionId}?${params.toString()}`;
  };

  const handleQuickAction = (actionId: string) => {
    const routes: { [key: string]: string } = {
      'record_attendance': '/attendance/today',
      'create_lesson': '/lessons/new',
      'upload_scheme': '/schemes/new',
      'record_work': '/records/new',
      'enter_scores': '/scores/enter',
      'view_schemes': '/schemes',
      'view_records': '/records',
      'my_classes': '/teacher/classes'
    };

    if (routes[actionId]) {
      window.location.href = routes[actionId];
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center max-w-md">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Your Dashboard</h2>
          <p className="text-slate-600 mb-4">Fetching your latest teaching data...</p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse delay-150"></div>
            <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (but we might have stale data)
  if (error && !teacherProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  // Data from various sources
  const teacher = teacherProfile?.user || {
    first_name: "Teacher",
    last_name: "",
    full_name: "Teacher"
  };
  const teacherCode = teacherProfile?.teacher_code || "N/A";
  
  const academicYear = dashboardData?.current_period?.academic_year?.year_name || new Date().getFullYear().toString();
  const currentTerm = dashboardData?.current_period?.term?.term_name || "Term 1";
  const attendanceThisWeek = dashboardData?.summary?.attendance_this_week ?? teacherProfile?.statistics?.attendance_this_week ?? 0;

  // Summary cards
  const summaryCards = [
    {
      title: "Active Classes",
      value: (dashboardData?.summary?.total_classes ?? teacherProfile?.quick_stats?.total_classes ?? 0).toString(),
      icon: <School className="w-7 h-7" />,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      route: '/teacher/classes'
    },
    {
      title: "Total Students",
      value: (dashboardData?.summary?.total_students ?? teacherProfile?.quick_stats?.total_students ?? 0).toString(),
      icon: <Users className="w-7 h-7" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      route: '/teacher/students'
    },
    {
      title: "My Subjects",
      value: (dashboardData?.summary?.total_subjects ?? teacherProfile?.quick_stats?.total_subjects ?? 0).toString(),
      icon: <BookOpen className="w-7 h-7" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      route: '/teacher/subjects'
    },
    {
      title: "Pending Tasks",
      value: ((dashboardData?.summary?.pending_schemes ?? 0) + (dashboardData?.summary?.pending_records ?? 0) || teacherProfile?.statistics?.pending_schemes || 0).toString(),
      icon: <AlertCircle className="w-7 h-7" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      route: '/teacher/tasks'
    },
    {
      title: "Upcoming Lessons",
      value: (dashboardData?.summary?.upcoming_lessons ?? teacherProfile?.statistics?.todays_lessons ?? 0).toString(),
      icon: <Calendar className="w-7 h-7" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      route: '/lessons'
    },
    {
      title: "Weekly Attendance",
      value: (dashboardData?.summary?.attendance_this_week ?? teacherProfile?.statistics?.attendance_this_week ?? 0).toString(),
      icon: <CheckCircle2 className="w-7 h-7" />,
      color: "text-green-600",
      bg: "bg-green-50",
      route: '/attendance'
    },
  ];

  // Quick stats cards (using optimized data)
  const quickStatCards = quickStats ? [
    {
      title: "Assignments",
      value: quickStats.assignments.toString(),
      icon: <FileText className="w-5 h-5" />,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "Pending Grading",
      value: quickStats.pendingGrading.toString(),
      icon: <ClipboardCheck className="w-5 h-5" />,
      color: "text-red-600",
      bg: "bg-red-50"
    },
    {
      title: "This Week Attendance",
      value: quickStats.attendance7Days.toString(),
      icon: <User className="w-5 h-5" />,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Schemes",
      value: quickStats.schemes.toString(),
      icon: <BookOpen className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
  ] : [];

  const currentAssignments = dashboardData?.current_assignments || teacherProfile?.current_assignments?.map(assignment => ({
    id: assignment.id,
    class: {
      id: assignment.class.id,
      class_name: assignment.class.name,
      class_level: assignment.class.level || ""
    },
    stream: {
      id: assignment.stream.id,
      name: assignment.stream.name
    },
    subjects: assignment.subjects?.map(subject => ({
      id: subject.id,
      name: subject.name,
      subject_code: subject.code
    })) || []
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with refresh and cache controls */}
        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                    Welcome back, {teacher.first_name} 👋
                  </h1>
                  <p className="text-slate-600 font-medium">
                    {formatDate(currentDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={handleClearCache}
                    className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-medium transition-colors"
                    title="Clear cache"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-bold shadow-md">
                  {currentTerm}, {academicYear}
                </span>
                <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                  Teacher Code: {teacherCode}
                </span>
                {teacherProfile?.school && (
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold">
                    {teacherProfile.school.name}
                  </span>
                )}
                {teacherProfile?.data_freshness && (
                  <span className={`px-4 py-2 rounded-full font-semibold text-xs ${
                    teacherProfile.data_freshness === 'fresh' 
                      ? 'bg-green-100 text-green-700'
                      : teacherProfile.data_freshness === 'cached'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {teacherProfile.data_freshness === 'fresh' ? 'Live Data' : 
                     teacherProfile.data_freshness === 'cached' ? 'Cached' : 'Stale Cache'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Error warning (if we have stale data) */}
          {error && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-amber-800 font-medium">{error}</p>
                <p className="text-amber-700 text-sm mt-1">
                  Showing cached data. Click refresh to try again.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Row */}
        {quickStatCards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStatCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all border border-slate-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <div className={card.color}>{card.icon}</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-800 mb-1">{card.value}</div>
                <div className="text-sm font-medium text-slate-600">{card.title}</div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {summaryCards.map((card, index) => (
            <div
              key={index}
              onClick={() => card.route && (window.location.href = card.route)}
              className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all cursor-pointer border border-slate-100 group hover:border-indigo-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <div className={card.color}>{card.icon}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-1">{card.value}</div>
              <div className="text-sm font-medium text-slate-600">{card.title}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {getQuickActions().map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className="flex flex-col items-center justify-center p-4 bg-white text-slate-700 border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all active:scale-95 shadow-sm"
            >
              <div className="p-3 bg-indigo-50 rounded-xl mb-3">
                {action.icon === 'check-circle' && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                {action.icon === 'calendar-plus' && <Calendar className="w-6 h-6 text-indigo-600" />}
                {action.icon === 'upload' && <TrendingUp className="w-6 h-6 text-indigo-600" />}
                {action.icon === 'clipboard-check' && <ClipboardCheck className="w-6 h-6 text-indigo-600" />}
                {action.icon === 'book-open' && <BookOpen className="w-6 h-6 text-indigo-600" />}
                {action.icon === 'file-text' && <FileText className="w-6 h-6 text-indigo-600" />}
                {action.icon === 'users' && <Users className="w-6 h-6 text-indigo-600" />}
              </div>
              <div className="text-center">
                <div className="text-xs font-bold mb-1">{action.title}</div>
                <div className="text-xs text-slate-500">{action.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Pending Submissions */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Priority Submissions</h2>
              <p className="text-slate-600 text-sm mt-1">Tasks requiring your immediate attention</p>
            </div>
            <button
              onClick={() => window.location.href = '/teacher/schedule'}
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1"
            >
              Full Schedule <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">All caught up!</h3>
              <p className="text-slate-500">No pending submissions at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex-1 mb-3 md:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        sub.type === 'scheme_of_work' ? 'bg-purple-100 text-purple-700' :
                        sub.type === 'assessment' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {sub.type?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                        sub.status === 'Urgent' ? 'bg-amber-100 text-amber-700' :
                        sub.status === 'Pending Review' ? 'bg-blue-100 text-blue-700' :
                        sub.status === 'Draft' ? 'bg-slate-100 text-slate-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 mb-1">
                      {sub.subject} - {sub.class}
                    </div>
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">{sub.title}</span> • Due {formatDeadline(sub.due_date)} • {sub.days_until_due} days left
                      {sub.completion_rate !== undefined && (
                        <span className="ml-3">
                          <span className="inline-block w-24 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(sub.completion_rate, 100)}%` }}
                            ></div>
                          </span>
                          <span className="ml-2 text-xs">{sub.completion_rate}%</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {sub.type === 'assessment' && (
                      <button
                        onClick={() => handleEnterScores(sub.id, sub.class_id, sub.subject_id)}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
                      >
                        ENTER SCORES <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    {sub.type === 'scheme_of_work' && (
                      <button
                        onClick={() => window.location.href = `/schemes/${sub.id}`}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
                      >
                        REVIEW <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Assignments */}
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Current Classes</h2>
                <p className="text-slate-600 text-sm mt-1">Classes you're currently teaching</p>
              </div>
              {currentAssignments.length > 0 && (
                <button
                  onClick={() => window.location.href = '/teacher/assignments'}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {currentAssignments.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No classes assigned</h3>
                <p className="text-slate-500">You don't have any active class assignments.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentAssignments.slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    onClick={() => window.location.href = `/teacher/assignments/${assignment.id}`}
                    className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">
                          {assignment.class.class_name} - {assignment.stream.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {assignment.subjects.length} subject{assignment.subjects.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {assignment.subjects.slice(0, 3).map((subject) => (
                        <span
                          key={subject.id}
                          className="px-3 py-1 bg-white text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                        >
                          {subject.name}
                        </span>
                      ))}
                      {assignment.subjects.length > 3 && (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">
                          +{assignment.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Recent Activity</h2>
                <p className="text-slate-600 text-sm mt-1">Your latest actions and updates</p>
              </div>
              {recentActivities.length > 0 && (
                <button
                  onClick={() => window.location.href = '/teacher/activity'}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Logged in to dashboard</p>
                      <p className="text-sm text-slate-600">{formatDate(currentDate)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-slate-300 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Welcome to your teaching dashboard</p>
                      <p className="text-sm text-slate-600">Get started with your teaching tasks</p>
                    </div>
                  </div>
                </>
              ) : (
                recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={activity.id} className="relative">
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        activity.type === 'attendance' ? 'bg-green-500' :
                        activity.type === 'assessment' ? 'bg-blue-500' :
                        activity.type === 'scheme' ? 'bg-purple-500' :
                        activity.type === 'lesson' ? 'bg-indigo-500' :
                        'bg-slate-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{activity.action}</p>
                        <p className="text-sm text-slate-600">{activity.details}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {index < recentActivities.length - 1 && (
                      <div className="absolute w-0.5 h-6 bg-slate-200 left-1 top-6"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600">
                Last updated: {teacherProfile?.cache_timestamp ? 
                  new Date(teacherProfile.cache_timestamp).toLocaleString() : 
                  new Date().toLocaleString()}
              </p>
              {teacherProfile?.data_freshness === 'stale_cache' && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ Showing cached data. Some information may be outdated.
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Loader2 className="w-4 h-4" />
                Auto-refreshes every 5 minutes
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Cache enabled for faster loading
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;