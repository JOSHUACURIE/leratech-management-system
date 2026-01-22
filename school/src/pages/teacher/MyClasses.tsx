import React, { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  Lock,
  Hash,
  Loader2,
  AlertCircle,
  GraduationCap as GraduationCapIcon,
  Calendar,
  Clock,
  School
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { teacherAPI } from "../../services/api";

// Define types
interface ClassAssignment {
  id: string;
  stream: {
    id: string;
    name: string;
    class: {
      id: string;
      class_name: string;
      class_level: number;
    };
  };
  subjects: Array<{
    subject: {
      id: string;
      name: string;
      subject_code: string;
      category: string;
    };
  }>;
  academic_year: {
    year_name: string;
    is_current: boolean;
  };
  term: {
    term_name: string;
    is_current: boolean;
  };
  is_active: boolean;
  assigned_at: string;
}

interface MyClass {
  id: string;
  className: string;
  stream: string;
  students: number;
  subjects: string[];
  portalOpen: boolean;
  lastActivity: string;
  term: string;
  academicYear: string;
  isCurrentTerm: boolean;
}

const MyClasses: React.FC = () => {
  const navigate = useNavigate();
  const { school, user } = useAuth();
  
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    totalStudents: 0,
    totalSubjects: 0
  });

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current assignments
      const response = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      if (response.data.success) {
        const assignments = response.data.data.assignments;
        
        // Transform API data to frontend format
        const transformedClasses = await transformAssignmentsToClasses(assignments);
        
        setMyClasses(transformedClasses);
        
        // Calculate stats
        const totalStudents = transformedClasses.reduce((sum, cls) => sum + cls.students, 0);
        const totalSubjects = new Set(
          transformedClasses.flatMap(cls => cls.subjects)
        ).size;
        
        setStats({
          totalClasses: transformedClasses.length,
          activeClasses: transformedClasses.filter(cls => cls.isCurrentTerm).length,
          totalStudents,
          totalSubjects
        });
      } else {
        throw new Error(response.data.error || 'Failed to fetch classes');
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      setError(error.message || 'Failed to load your classes. Please try again.');
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback mock data');
        setMyClasses([
          {
            id: "cls-1",
            className: "Grade 4",
            stream: "East",
            students: 38,
            subjects: ["Mathematics", "English", "Science"],
            portalOpen: true,
            lastActivity: "2 hours ago",
            term: "Term 1",
            academicYear: "2025",
            isCurrentTerm: true
          },
          {
            id: "cls-2",
            className: "Grade 5",
            stream: "West",
            students: 41,
            subjects: ["Mathematics", "English"],
            portalOpen: false,
            lastActivity: "Yesterday",
            term: "Term 1",
            academicYear: "2025",
            isCurrentTerm: true
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const transformAssignmentsToClasses = async (assignmentsData: any[]): Promise<MyClass[]> => {
    const classes: MyClass[] = [];
    
    try {
      for (const yearData of assignmentsData) {
        for (const termData of yearData.terms) {
          for (const assignment of termData.assignments) {
            // Get student count for this class
            let studentCount = 0;
            try {
              const studentsResponse = await teacherAPI.getClassStudents(
                assignment.stream.class.id,
                assignment.stream.id
              );
              if (studentsResponse.data.success) {
                studentCount = studentsResponse.data.data.students.length;
              }
            } catch (error) {
              console.warn(`Could not fetch students for class ${assignment.stream.class.id}:`, error);
              // Estimate based on class level if API fails
              studentCount = assignment.stream.class.class_level === 4 ? 38 :
                            assignment.stream.class.class_level === 5 ? 41 :
                            assignment.stream.class.class_level === 6 ? 36 : 35;
            }

            // Determine if portal is open (based on current term and date)
            const isCurrentTerm = yearData.academic_year.is_current && termData.term.is_current;
            const portalOpen = isCurrentTerm; // Simple logic - can be enhanced

            // Get last activity (simulated for now)
            const lastActivity = getSimulatedLastActivity();

            classes.push({
              id: `${assignment.stream.class.id}-${assignment.stream.id}`,
              className: assignment.stream.class.class_name,
              stream: assignment.stream.name,
              students: studentCount,
              subjects: assignment.subjects.map((subject: any) => subject.name),
              portalOpen,
              lastActivity,
              term: termData.term.term_name,
              academicYear: yearData.academic_year.year_name,
              isCurrentTerm
            });
          }
        }
      }
    } catch (error) {
      console.error('Error transforming assignments:', error);
    }

    return classes;
  };

  const getSimulatedLastActivity = (): string => {
    const activities = [
      "Just now",
      "2 hours ago",
      "Yesterday",
      "3 days ago",
      "Last week"
    ];
    return activities[Math.floor(Math.random() * activities.length)];
  };

  const handleSubmitMarks = (classItem: MyClass) => {
    if (!classItem.portalOpen) {
      alert('Portal is locked. Marks submission is only available during active terms.');
      return;
    }
    navigate(`/teacher/scores?classId=${classItem.id}&className=${classItem.className}`);
  };

  const handleViewRegistry = (classItem: MyClass) => {
    navigate(`/teacher/classes/${classItem.id}`, {
      state: {
        className: classItem.className,
        stream: classItem.stream,
        studentCount: classItem.students
      }
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-700">Loading Your Classes</h2>
          <p className="text-slate-500 mt-2">Fetching your teaching assignments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Unable to Load Classes</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={fetchMyClasses}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Loader2 size={18} className="animate-spin" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (myClasses.length === 0) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <School className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Classes Assigned</h2>
          <p className="text-slate-600 mb-4">
            You don't have any teaching assignments for the current term.
          </p>
          <p className="text-sm text-slate-500">
            Contact your school administrator to get assigned to classes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Academic Workload</h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage marks and student profiles for your assigned classes at{" "}
            <span className="text-indigo-600 font-semibold">{school?.name}</span>
          </p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Hash size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Classes</p>
                <p className="text-lg font-bold text-slate-800">{stats.totalClasses}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Students</p>
                <p className="text-lg font-bold text-slate-800">{stats.totalStudents}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Subjects</p>
                <p className="text-lg font-bold text-slate-800">{stats.totalSubjects}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm text-slate-600">Logged in as</p>
            <p className="font-bold text-slate-800">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={fetchMyClasses}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Loader2 size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Term Info Banner */}
      {myClasses.some(cls => cls.isCurrentTerm) && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-800">Current Term Active</h3>
                <p className="text-sm text-indigo-600">
                  {myClasses.find(cls => cls.isCurrentTerm)?.term} • {
                    myClasses.find(cls => cls.isCurrentTerm)?.academicYear
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <Clock size={16} />
              <span>Portal open for marks submission</span>
            </div>
          </div>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {myClasses.map((cls) => (
          <Card key={cls.id} className="group border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            
            {/* Status Ribbon */}
            <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
              cls.portalOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${cls.portalOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {cls.portalOpen ? "Portal Open" : "Portal Closed"}
            </div>

            {/* Term Badge */}
            {cls.isCurrentTerm && (
              <div className="absolute top-4 left-4 px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md">
                CURRENT
              </div>
            )}

            <div className="space-y-5 p-5">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {cls.className.split(' ')[1] || cls.className.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">
                    {cls.className} {cls.stream}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                      <Users size={12} /> {cls.students} Students
                    </span>
                    <span className="text-xs text-slate-400">
                      {cls.term}, {cls.academicYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subjects Section */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {cls.subjects.slice(0, 3).map((subject, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-2"
                    >
                      <BookOpen size={12} />
                      {subject}
                    </span>
                  ))}
                  {cls.subjects.length > 3 && (
                    <span className="px-2 py-1 text-xs text-slate-500 bg-slate-50 rounded-lg">
                      +{cls.subjects.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Activity Info */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Last Activity:</span>
                  <span className="font-medium text-slate-700">{cls.lastActivity}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => handleViewRegistry(cls)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors"
                >
                  View Registry
                </button>

                <button
                  disabled={!cls.portalOpen}
                  onClick={() => handleSubmitMarks(cls)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    cls.portalOpen
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {cls.portalOpen ? <ClipboardCheck size={16} /> : <Lock size={16} />}
                  Submit Marks
                </button>
              </div>
            </div>

            {/* Decorative background */}
            <div className="absolute -bottom-8 -left-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <GraduationCapIcon size={150} />
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Note */}
      <div className="text-center pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          Showing {myClasses.length} of {stats.totalClasses} classes • {
            myClasses.filter(cls => cls.portalOpen).length
          } portals currently open
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Portal availability depends on current term and school schedule
        </p>
      </div>
    </div>
  );
};

export default MyClasses;