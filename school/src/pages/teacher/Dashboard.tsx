import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Users,
  AlertCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Clock,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  FileText,
  User
} from "lucide-react";
import Card from "../../components/common/Card";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface TeacherProfile {
  id: string;
  user_id: string;
  teacher_code: string;
  tsc_number?: string;
  qualification?: string;
  specialization?: string;
  employment_type?: string;
  date_of_employment?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    profile_picture_url?: string;
    is_active: boolean;
    last_login_at?: string;
    full_name: string;
  };
  school: {
    id: string;
    name: string;
    school_code: string;
    primary_color?: string;
    logo_url?: string;
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
  }>;
  quick_stats: {
    total_students: number;
    total_subjects: number;
    total_classes: number;
  };
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
  }>;
  quick_actions: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    route: string;
  }>;
}

interface PendingSubmission {
  id: string;
  class: string;
  class_id?: string;
  subject: string;
  subject_id?: string;
  assessment: string;
  deadline: string;
  status: "Urgent" | "Upcoming" | "Overdue";
  days_until_due?: number;
  completion_rate?: number;
}

interface RecentActivity {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  type: string;
  metadata?: {
    [key: string]: any;
  };
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch teacher profile first
        const teacherResponse = await api.get('/teachers/me/profile');
        const teacherData = teacherResponse.data.data;
        setTeacherProfile(teacherData);
        
        // Get teacher ID
        const teacherId = teacherData.id;
        
        // Try to fetch dashboard data if endpoint exists
        try {
          const dashboardResponse = await api.get(`/teachers/${teacherId}/dashboard`);
          setDashboardData(dashboardResponse.data.data);
        } catch (dashboardError: any) {
          console.warn('Dashboard endpoint not available, using profile data:', dashboardError.message);
          // Create dashboard data from profile if endpoint doesn't exist
          const mockDashboardData: DashboardSummary = {
            teacher: {
              id: teacherData.id,
              teacher_code: teacherData.teacher_code,
              user: {
                first_name: teacherData.user.first_name,
                last_name: teacherData.user.last_name,
                email: teacherData.user.email,
                profile_picture_url: teacherData.user.profile_picture_url
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
              pending_records: 0, // You might want to fetch this separately
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
            quick_actions: [
              { id: 'record_attendance', title: 'Record Attendance', description: 'Mark today\'s attendance', icon: 'check-circle', route: '/attendance/today' },
              { id: 'create_lesson', title: 'Create Lesson Plan', description: 'Plan upcoming lessons', icon: 'calendar-plus', route: '/lessons/new' },
              { id: 'upload_scheme', title: 'Upload Scheme', description: 'Submit scheme of work', icon: 'upload', route: '/schemes/new' },
              { id: 'record_work', title: 'Record Work', description: 'Log completed work', icon: 'clipboard-check', route: '/records/new' }
            ]
          };
          setDashboardData(mockDashboardData);
        }
        
        // Try to fetch pending submissions
        try {
          const submissionsResponse = await api.get(`/teachers/${teacherId}/assignments/pending-submissions`);
          setPendingSubmissions(submissionsResponse.data.data || []);
        } catch (submissionError: any) {
          console.warn('Pending submissions endpoint not available:', submissionError.message);
          setPendingSubmissions([]);
        }
        
        // Try to fetch recent activity
        try {
          const activityResponse = await api.get(`/teachers/${teacherId}/activity?limit=5`);
          setRecentActivities(activityResponse.data.data || []);
        } catch (activityError: any) {
          console.warn('Activity endpoint not available:', activityError.message);
          setRecentActivities([]);
        }
        
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (deadline: string): number => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Determine status based on deadline
  const getSubmissionStatus = (deadline: string): "Urgent" | "Upcoming" | "Overdue" => {
    const daysLeft = getDaysUntilDeadline(deadline);
    if (daysLeft < 0) return "Overdue";
    if (daysLeft <= 2) return "Urgent";
    return "Upcoming";
  };

  // Format deadline date
  const formatDeadline = (deadline: string) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle submission button click
  const handleEnterScores = (submissionId: string, classId?: string, subjectId?: string) => {
    // Navigate to scores entry page
    const params = new URLSearchParams();
    if (classId) params.append('class', classId);
    if (subjectId) params.append('subject', subjectId);
    window.location.href = `/teacher/enter-scores/${submissionId}?${params.toString()}`;
  };

  // Handle quick action click
  const handleQuickAction = (actionId: string) => {
    const routes: { [key: string]: string } = {
      'record_attendance': '/attendance/today',
      'create_lesson': '/lessons/new',
      'upload_scheme': '/schemes/new',
      'record_work': '/records/new'
    };
    
    if (routes[actionId]) {
      window.location.href = routes[actionId];
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <h3 className="text-lg font-bold text-red-800">Error Loading Dashboard</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  const teacher = teacherProfile?.user || { 
    first_name: "Teacher", 
    last_name: "",
    full_name: "Teacher"
  };
  
  const teacherCode = teacherProfile?.teacher_code || "N/A";
  
  // Use data from dashboard if available, otherwise from teacher profile
  const academicYear = dashboardData?.current_period?.academic_year?.year_name || 
    new Date().getFullYear().toString();
  const currentTerm = dashboardData?.current_period?.term?.term_name || "Term 1";
  
  const attendanceThisWeek = dashboardData?.summary?.attendance_this_week || 
    teacherProfile?.statistics?.attendance_this_week || 0;

  const summaryCards = [
    { 
      title: "My Classes", 
      value: dashboardData?.summary?.total_classes?.toString() || 
        teacherProfile?.quick_stats?.total_classes?.toString() || "0", 
      icon: <Users size={22} />, 
      color: "text-indigo-600", 
      bg: "bg-indigo-50" 
    },
    { 
      title: "Active Subjects", 
      value: dashboardData?.summary?.total_subjects?.toString() || 
        teacherProfile?.quick_stats?.total_subjects?.toString() || "0", 
      icon: <BookOpen size={22} />, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50" 
    },
    { 
      title: "Pending Tasks", 
      value: ((dashboardData?.summary?.pending_schemes || 0) + 
        (dashboardData?.summary?.pending_records || 0) ||
        teacherProfile?.statistics?.pending_schemes || 0).toString(), 
      icon: <ClipboardCheck size={22} />, 
      color: "text-amber-600", 
      bg: "bg-amber-50" 
    },
    { 
      title: "Total Students", 
      value: dashboardData?.summary?.total_students?.toString() || 
        teacherProfile?.quick_stats?.total_students?.toString() || "0", 
      icon: <TrendingUp size={22} />, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
  ];

  const quickActions = dashboardData?.quick_actions || [
    { id: 'record_attendance', title: 'Record Attendance', description: 'Mark today\'s attendance', icon: 'check-circle', route: '/attendance/today' },
    { id: 'create_lesson', title: 'Create Lesson Plan', description: 'Plan upcoming lessons', icon: 'calendar-plus', route: '/lessons/new' },
    { id: 'upload_scheme', title: 'Upload Scheme', description: 'Submit scheme of work', icon: 'upload', route: '/schemes/new' },
    { id: 'record_work', title: 'Record Work', description: 'Log completed work', icon: 'clipboard-check', route: '/records/new' }
  ];

  const currentAssignments = dashboardData?.current_assignments || 
    teacherProfile?.current_assignments?.map(assignment => ({
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
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Hello, <span className="text-indigo-600">{teacher.first_name}</span> 👋
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Today is <span className="text-slate-800 font-bold">{formatDate(currentDate)}</span>
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Teacher Code: <span className="font-bold">{teacherCode}</span>
            {teacherProfile?.school && (
              <span className="ml-3">
                School: <span className="font-bold">{teacherProfile.school.name}</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Calendar size={18} className="text-indigo-500" />
            <span className="text-sm font-bold text-slate-700">
              {currentTerm}, {academicYear}
            </span>
          </div>
          {attendanceThisWeek > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
              <CheckCircle2 size={18} />
              <span className="text-sm font-bold">
                {attendanceThisWeek} attendance records this week
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <div 
            key={index} 
            className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-transparent hover:border-indigo-100 transition-all group cursor-pointer"
            onClick={() => {
              // Navigate to relevant details page based on card
              const routes = [
                '/teacher/classes',
                '/teacher/subjects',
                '/teacher/tasks',
                '/teacher/students'
              ];
              if (routes[index]) {
                window.location.href = routes[index];
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-400">
                View Details
              </span>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{card.value}</p>
            <p className="text-sm font-bold text-slate-400 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.slice(0, 4).map((action) => (
          <button
            key={action.id}
            onClick={() => handleQuickAction(action.id)}
            className="flex items-center justify-between p-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:border-indigo-400 hover:shadow-md transition-all active:scale-95 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                {action.icon === 'check-circle' && <ClipboardCheck size={18} />}
                {action.icon === 'calendar-plus' && <Calendar size={18} />}
                {action.icon === 'upload' && <ArrowRight size={18} />}
                {action.icon === 'clipboard-check' && <FileText size={18} />}
              </div>
              <div className="text-left">
                <span className="text-sm block">{action.title}</span>
                <span className="text-xs text-slate-400 font-normal">{action.description}</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pending Submissions Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-800">Priority Submissions</h3>
            <button 
              className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800"
              onClick={() => window.location.href = '/teacher/schedule'}
            >
              Full Schedule
            </button>
          </div>
          
          {pendingSubmissions.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="font-bold text-slate-600">No pending submissions</h4>
              <p className="text-sm text-slate-400 mt-1">All assessments are up to date!</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingSubmissions.map((sub) => {
                const daysLeft = sub.days_until_due ?? getDaysUntilDeadline(sub.deadline);
                const status = sub.status || getSubmissionStatus(sub.deadline);
                const formattedDeadline = formatDeadline(sub.deadline);
                
                return (
                  <div 
                    key={sub.id} 
                    className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                          status === 'Urgent' ? 'bg-rose-50 text-rose-500' :
                          status === 'Overdue' ? 'bg-red-50 text-red-500' :
                          'bg-amber-50 text-amber-500'
                        }`}>
                          <Clock size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{sub.subject} - {sub.class}</h4>
                          <p className="text-xs text-slate-400 font-medium">
                            {sub.assessment} • Due {formattedDeadline} • {daysLeft} days left
                            {sub.completion_rate !== undefined && (
                              <span className="ml-2">
                                • {sub.completion_rate}% complete
                              </span>
                            )}
                          </p>
                          <div className={`inline-block px-2 py-1 rounded-lg text-xs font-bold mt-2 ${
                            status === 'Urgent' ? 'bg-rose-100 text-rose-700' :
                            status === 'Overdue' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleEnterScores(sub.id, sub.class_id, sub.subject_id)}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-xs font-black transition-all"
                      >
                        ENTER SCORES
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Current Assignments */}
          {currentAssignments.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-black text-slate-800 mb-4">Current Class Assignments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentAssignments.slice(0, 4).map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/teacher/assignments/${assignment.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-800">
                        {assignment.class.class_name} - {assignment.stream.name}
                      </h4>
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold">
                        {assignment.subjects.length} subjects
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assignment.subjects.slice(0, 3).map((subject) => (
                        <span key={subject.id} className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded">
                          {subject.name}
                        </span>
                      ))}
                      {assignment.subjects.length > 3 && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                          +{assignment.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {currentAssignments.length > 4 && (
                <button 
                  className="text-xs font-bold text-indigo-600 mt-4 hover:text-indigo-800"
                  onClick={() => window.location.href = '/teacher/assignments'}
                >
                  View all assignments →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notices & Activity */}
        <div className="lg:col-span-4 space-y-8">
          {/* School Information Card */}
          {teacherProfile?.school && (
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <User size={20} /> School Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-bold">{teacherProfile.school.name}</p>
                    <p className="text-xs opacity-80">Code: {teacherProfile.school.school_code}</p>
                  </div>
                  {teacherProfile.statistics?.years_of_service && teacherProfile.statistics.years_of_service > 0 && (
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md border border-white/10">
                      <p className="text-xs font-bold">
                        {teacherProfile.statistics.years_of_service} year{teacherProfile.statistics.years_of_service !== 1 ? 's' : ''} of service
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 text-white/5 rotate-12">
                <User size={140} />
              </div>
            </Card>
          )}

          {/* Activity Log */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
            <h3 className="text-lg font-black text-slate-800 mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {recentActivities.length === 0 ? (
                <>
                  {/* Show placeholder activities if no real data */}
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center z-10 relative">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-100" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Logged in to dashboard</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {formatDate(currentDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center z-10 relative">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Viewing teacher profile</p>
                      <p className="text-[10px] text-slate-400 font-medium">Today</p>
                    </div>
                  </div>
                </>
              ) : (
                recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={activity.id || index} className="flex gap-4">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 relative ${
                        activity.type === 'assessment' ? 'bg-emerald-50 text-emerald-500' :
                        activity.type === 'attendance' ? 'bg-blue-50 text-blue-500' :
                        activity.type === 'lesson' ? 'bg-purple-50 text-purple-500' :
                        activity.type === 'scheme' ? 'bg-amber-50 text-amber-500' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        <CheckCircle2 size={16} />
                      </div>
                      {index < recentActivities.length - 1 && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-100" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{activity.action}</p>
                      <p className="text-xs text-slate-500">{activity.details}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentActivities.length > 0 && (
              <button 
                className="text-xs font-bold text-indigo-600 mt-4 hover:text-indigo-800"
                onClick={() => window.location.href = '/teacher/activity'}
              >
                View all activity →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;