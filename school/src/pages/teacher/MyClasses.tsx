import React, { useState, useEffect, useCallback } from "react";
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

// Define types matching the actual API response
interface Subject {
  id: string;
  name: string;
  subject_code: string;
  category: string;
}

interface Stream {
  id: string;
  name: string;
  class: {
    id: string;
    class_name: string;
    class_level: number;
  };
}

interface Assignment {
  id: string;
  stream: Stream;
  subjects: Subject[];
  is_active: boolean;
  assigned_at: string;
}

interface TermData {
  term: {
    id: string;
    term_name: string;
    is_current: boolean;
    start_date: string;
    end_date: string;
  };
  assignments: Assignment[];
}

interface AcademicYearData {
  academic_year: {
    id: string;
    year_name: string;
    is_current: boolean;
    start_date: string;
    end_date: string;
  };
  terms: TermData[];
}

interface ApiResponse {
  success: boolean;
  data: {
    teacher: {
      id: string;
      teacher_code: string;
    };
    assignments: AcademicYearData[];
    summary: {
      total_assignments: number;
      active_assignments: number;
      current_term_assignments: number;
    };
    cacheAge: string;
  };
}

interface MyClass {
  id: string;
  className: string;
  stream: string;
  streamId: string;
  classId: string;
  students: number;
  subjects: string[];
  subjectIds: string[];
  portalOpen: boolean;
  lastActivity: string;
  term: string;
  termId: string;
  academicYear: string;
  academicYearId: string;
  isCurrentTerm: boolean;
  isActive: boolean;
  assignedAt: string;
}

// Cache for student counts to avoid repeated API calls
const studentCountCache: Map<string, number> = new Map();

const MyClasses: React.FC = () => {
  const navigate = useNavigate();
  const { school, user } = useAuth();
  
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    totalStudents: 0,
    totalSubjects: 0
  });

  useEffect(() => {
    fetchMyClasses();
  }, []);

  // Fetch student counts with batching and debouncing
  const fetchStudentCountsForClasses = useCallback(async (classes: MyClass[]) => {
    if (classes.length === 0) return;

    setFetchingStudents(true);
    const counts: Map<string, number> = new Map();
    let totalStudents = 0;

    try {
      // First, check cache for existing counts
      const uncachedClasses = classes.filter(cls => {
        const cacheKey = `${cls.classId}-${cls.streamId}`;
        if (studentCountCache.has(cacheKey)) {
          const cachedCount = studentCountCache.get(cacheKey)!;
          counts.set(cacheKey, cachedCount);
          totalStudents += cachedCount;
          return false;
        }
        return true;
      });

      if (uncachedClasses.length === 0) {
        // All counts were cached
        updateStudentCounts(counts, totalStudents);
        return;
      }

      // For uncached classes, fetch counts with a small delay between requests
      // to avoid overwhelming the server
      for (let i = 0; i < uncachedClasses.length; i++) {
        const cls = uncachedClasses[i];
        
        // Add a small delay between requests (300ms) to prevent connection pool exhaustion
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        try {
          const response = await teacherAPI.getClassStudents(
            cls.classId,
            cls.streamId
          );
          
          if (response.data?.success && response.data.data?.students) {
            const count = response.data.data.students.length;
            const cacheKey = `${cls.classId}-${cls.streamId}`;
            
            // Store in cache
            studentCountCache.set(cacheKey, count);
            counts.set(cacheKey, count);
            totalStudents += count;
          } else {
            // Fallback to estimated counts
            const estimatedCount = getEstimatedStudentCount(cls.className);
            const cacheKey = `${cls.classId}-${cls.streamId}`;
            studentCountCache.set(cacheKey, estimatedCount);
            counts.set(cacheKey, estimatedCount);
            totalStudents += estimatedCount;
          }
        } catch (error) {
          console.warn(`Failed to fetch students for ${cls.className} ${cls.stream}:`, error);
          // Fallback to estimated counts
          const estimatedCount = getEstimatedStudentCount(cls.className);
          const cacheKey = `${cls.classId}-${cls.streamId}`;
          studentCountCache.set(cacheKey, estimatedCount);
          counts.set(cacheKey, estimatedCount);
          totalStudents += estimatedCount;
        }
      }

      updateStudentCounts(counts, totalStudents);

    } catch (error) {
      console.error('Error fetching student counts:', error);
    } finally {
      setFetchingStudents(false);
    }
  }, []);

  const updateStudentCounts = (counts: Map<string, number>, totalStudents: number) => {
    // Update stats with real student counts
    setStats(prev => ({
      ...prev,
      totalStudents
    }));

    // Update myClasses with real student counts
    setMyClasses(prev => prev.map(cls => {
      const cacheKey = `${cls.classId}-${cls.streamId}`;
      const studentCount = counts.get(cacheKey);
      return {
        ...cls,
        students: studentCount || cls.students
      };
    }));
  };

  const getEstimatedStudentCount = (className: string): number => {
    // Estimate based on class name/number
    if (className.includes('FORM 1')) return 42;
    if (className.includes('FORM 2')) return 38;
    if (className.includes('FORM 3')) return 45;
    if (className.includes('FORM 4')) return 36;
    return 40; // Default estimate
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

  const transformAssignmentsToClasses = (assignmentsData: AcademicYearData[]): MyClass[] => {
    const classes: MyClass[] = [];
    
    try {
      for (const yearData of assignmentsData) {
        for (const termData of yearData.terms) {
          for (const assignment of termData.assignments) {
            // Determine if portal is open (based on current term)
            const isCurrentTerm = yearData.academic_year.is_current && termData.term.is_current;
            
            // Get last activity (simulated for now - you might want to fetch this from an API)
            const lastActivity = getSimulatedLastActivity();

            // Check cache for student count
            const cacheKey = `${assignment.stream.class.id}-${assignment.stream.id}`;
            const cachedCount = studentCountCache.get(cacheKey) || 0;

            classes.push({
              id: assignment.id,
              classId: assignment.stream.class.id,
              className: assignment.stream.class.class_name,
              stream: assignment.stream.name,
              streamId: assignment.stream.id,
              students: cachedCount || 0, // Will be updated after fetching
              subjects: assignment.subjects.map((subject: Subject) => subject.name),
              subjectIds: assignment.subjects.map((subject: Subject) => subject.id),
              portalOpen: isCurrentTerm,
              lastActivity,
              term: termData.term.term_name,
              termId: termData.term.id,
              academicYear: yearData.academic_year.year_name,
              academicYearId: yearData.academic_year.id,
              isCurrentTerm,
              isActive: assignment.is_active,
              assignedAt: assignment.assigned_at
            });
          }
        }
      }
    } catch (error) {
      console.error('Error transforming assignments:', error);
    }

    return classes;
  };

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current assignments with the exact parameters from your working API call
      const response = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      if (response.data.success) {
        const apiData: ApiResponse = response.data;
        const assignments = apiData.data.assignments;
        
        // Transform API data to frontend format
        const transformedClasses = transformAssignmentsToClasses(assignments);
        
        setMyClasses(transformedClasses);
        
        // Calculate initial stats (without student counts)
        const totalSubjects = new Set(
          transformedClasses.flatMap(cls => cls.subjects)
        ).size;
        
        setStats({
          totalClasses: transformedClasses.length,
          activeClasses: transformedClasses.filter(cls => cls.isActive).length,
          totalStudents: transformedClasses.reduce((sum, cls) => sum + cls.students, 0),
          totalSubjects
        });

        // Fetch real student counts with batching
        await fetchStudentCountsForClasses(transformedClasses);
        
      } else {
        throw new Error(response.data.error || 'Failed to fetch classes');
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      setError(error.message || 'Failed to load your classes. Please try again.');
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback mock data');
        const mockClasses = getMockClasses();
        setMyClasses(mockClasses);
        
        setStats({
          totalClasses: mockClasses.length,
          activeClasses: mockClasses.filter(cls => cls.isActive).length,
          totalStudents: mockClasses.reduce((sum, cls) => sum + cls.students, 0),
          totalSubjects: new Set(mockClasses.flatMap(cls => cls.subjects)).size
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getMockClasses = (): MyClass[] => {
    return [
      {
        id: "e7385754-74f5-47e7-98e7-08a07a25eed0",
        className: "FORM 1",
        stream: "BLUE",
        streamId: "313179b8-5493-46da-9bf2-36a46a391a88",
        classId: "c41ce4ba-598d-41de-85ea-54eda8e8f9a6",
        students: 42,
        subjects: ["CHEMISTRY", "BIOLOGY"],
        subjectIds: ["1073f89f-ac4f-4ec7-a807-dfbb853ac543", "fec8926e-e66f-4ff3-b2a0-a78d67676ec3"],
        portalOpen: false,
        lastActivity: "2 hours ago",
        term: "TERM 1",
        termId: "ad3d3e02-967b-4138-9478-2eca73ec3582",
        academicYear: "2026",
        academicYearId: "fee90dfb-f76b-4186-a17a-8552556de2ad",
        isCurrentTerm: false,
        isActive: true,
        assignedAt: "2026-02-07T23:05:18.429Z"
      },
      {
        id: "7f65df27-d5c6-4d94-8c4f-650bb78472d4",
        className: "FORM 2",
        stream: "KINGS",
        streamId: "4e6c7b80-98ea-4a83-abb8-b85606b7b21b",
        classId: "88be0e98-f356-4ba6-8325-3c37039f54b5",
        students: 38,
        subjects: ["GEOGRAPHY", "BIOLOGY"],
        subjectIds: ["a9f49b5b-c147-4feb-9fee-779f9a310103", "fec8926e-e66f-4ff3-b2a0-a78d67676ec3"],
        portalOpen: false,
        lastActivity: "Yesterday",
        term: "TERM 1",
        termId: "ad3d3e02-967b-4138-9478-2eca73ec3582",
        academicYear: "2026",
        academicYearId: "fee90dfb-f76b-4186-a17a-8552556de2ad",
        isCurrentTerm: false,
        isActive: true,
        assignedAt: "2026-02-14T13:32:40.761Z"
      }
    ];
  };

  const handleSubmitMarks = (classItem: MyClass) => {
    if (!classItem.portalOpen) {
      alert('Portal is locked. Marks submission is only available during active terms.');
      return;
    }
    navigate(`/teacher/scores`, { 
      state: { 
        classId: classItem.classId,
        streamId: classItem.streamId,
        className: classItem.className,
        stream: classItem.stream,
        subjects: classItem.subjects,
        subjectIds: classItem.subjectIds
      }
    });
  };

  const handleViewRegistry = (classItem: MyClass) => {
    navigate(`/teacher/classes/${classItem.classId}`, {
      state: {
        classId: classItem.classId,
        streamId: classItem.streamId,
        className: classItem.className,
        stream: classItem.stream,
        studentCount: classItem.students,
        subjects: classItem.subjects
      }
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-white min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-700">Loading Your Classes</h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">Fetching your teaching assignments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-white min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-700 mb-2">Unable to Load Classes</h2>
          <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">{error}</p>
          <button
            onClick={fetchMyClasses}
            className="px-5 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto text-sm sm:text-base"
          >
            <Loader2 size={16} className={loading ? "animate-spin" : ""} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (myClasses.length === 0) {
    return (
      <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-white min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <School className="text-indigo-600" size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-700 mb-2">No Classes Assigned</h2>
          <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4">
            You don't have any teaching assignments for the current term.
          </p>
          <p className="text-xs sm:text-sm text-slate-500">
            Contact your school administrator to get assigned to classes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gradient-to-br from-slate-50 to-white min-h-screen space-y-4 sm:space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Academic Workload</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            Manage marks and student profiles for your assigned classes at{" "}
            <span className="text-indigo-600 font-semibold">{school?.name || 'Your School'}</span>
          </p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Hash size={14} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Total Classes</p>
                <p className="text-sm sm:text-lg font-bold text-slate-800">{stats.totalClasses}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Users size={14} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Total Students</p>
                <p className="text-sm sm:text-lg font-bold text-slate-800">
                  {fetchingStudents ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs text-slate-400">Updating...</span>
                    </span>
                  ) : (
                    stats.totalStudents
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <BookOpen size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Subjects</p>
                <p className="text-sm sm:text-lg font-bold text-slate-800">{stats.totalSubjects}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs sm:text-sm text-slate-600">Logged in as</p>
            <p className="text-sm sm:text-base font-bold text-slate-800">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={fetchMyClasses}
            disabled={loading || fetchingStudents}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 sm:gap-2 shadow-sm text-xs sm:text-sm disabled:opacity-50"
          >
            <Loader2 size={14} className={(loading || fetchingStudents) ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Term Info Banner */}
      {myClasses.some(cls => cls.isCurrentTerm) && (
        <div className="p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl sm:rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Calendar size={16} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-indigo-800">Current Term Active</h3>
                <p className="text-xs sm:text-sm text-indigo-600">
                  {myClasses.find(cls => cls.isCurrentTerm)?.term} • {
                    myClasses.find(cls => cls.isCurrentTerm)?.academicYear
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-indigo-700 ml-10 sm:ml-0">
              <Clock size={14} />
              <span>Portal open for marks submission</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator for student counts - only show if it's taking a while */}
      {fetchingStudents && myClasses.length > 2 && (
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-indigo-600 bg-indigo-50 py-2 px-3 rounded-lg">
          <Loader2 size={14} className="animate-spin" />
          <span>Loading student counts ({(studentCountCache.size / myClasses.length * 100).toFixed(0)}% complete)...</span>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {myClasses.map((cls) => (
          <Card key={cls.id} className="group border-none shadow-lg sm:shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl bg-white hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            
            {/* Status Ribbon */}
            <div className={`absolute top-3 sm:top-4 right-3 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider ${
              cls.portalOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${cls.portalOpen ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {cls.portalOpen ? "Portal Open" : "Portal Closed"}
            </div>

            {/* Term Badge */}
            {cls.isCurrentTerm && (
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-indigo-50 text-indigo-600 text-[8px] sm:text-[10px] font-bold rounded-md">
                CURRENT
              </div>
            )}

            <div className="space-y-3 sm:space-y-5 p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-base sm:text-xl shadow-md sm:shadow-lg">
                  {cls.className.split(' ')[1] || cls.className.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight leading-tight truncate">
                    {cls.className} {cls.stream}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                    <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-slate-500 bg-slate-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                      <Users size={10} /> 
                      {cls.students > 0 ? cls.students : (
                        <span className="flex items-center gap-0.5">
                          <Loader2 size={8} className="animate-spin" />
                          Loading...
                        </span>
                      )}
                    </span>
                    <span className="text-[8px] sm:text-xs text-slate-400">
                      {cls.term}, {cls.academicYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subjects Section */}
              <div className="space-y-1.5 sm:space-y-3">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Subjects</p>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {cls.subjects.slice(0, 3).map((subject, index) => (
                    <span
                      key={index}
                      className="px-1.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-xs font-medium rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1 sm:gap-2"
                    >
                      <BookOpen size={8} />
                      {subject.length > 10 ? `${subject.substring(0, 8)}...` : subject}
                    </span>
                  ))}
                  {cls.subjects.length > 3 && (
                    <span className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-[8px] sm:text-xs text-slate-500 bg-slate-50 rounded-lg">
                      +{cls.subjects.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Activity Info */}
              <div className="pt-1.5 sm:pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-slate-500">Last Activity:</span>
                  <span className="font-medium text-slate-700">{cls.lastActivity}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-4">
                <button
                  onClick={() => handleViewRegistry(cls)}
                  className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 bg-slate-50 text-slate-600 rounded-lg sm:rounded-xl font-semibold text-[10px] sm:text-sm hover:bg-slate-100 transition-colors"
                >
                  View Registry
                </button>

                <button
                  disabled={!cls.portalOpen}
                  onClick={() => handleSubmitMarks(cls)}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-[10px] sm:text-sm transition-all ${
                    cls.portalOpen
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm sm:shadow-lg shadow-indigo-100"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {cls.portalOpen ? <ClipboardCheck size={12} /> : <Lock size={12} />}
                  Submit Marks
                </button>
              </div>
            </div>

            {/* Decorative background */}
            <div className="absolute -bottom-6 sm:-bottom-8 -left-6 sm:-left-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <GraduationCapIcon size={100} />
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Note */}
      <div className="text-center pt-4 sm:pt-8 border-t border-slate-200">
        <p className="text-xs sm:text-sm text-slate-500">
          Showing {myClasses.length} of {stats.totalClasses} classes • {
            myClasses.filter(cls => cls.portalOpen).length
          } portals currently open
        </p>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">
          Portal availability depends on current term and school schedule
        </p>
      </div>
    </div>
  );
};

export default MyClasses;