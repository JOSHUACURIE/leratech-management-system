import React, { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Layers,
  BarChart3,
  Lock,
  ArrowUpRight,
  GraduationCap,
  Loader2,
  AlertCircle,
  School,
  Filter,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { teacherAPI } from "../../services/api";

// Define types
interface SubjectAssignment {
  id: string;
  name: string;
  subject_code: string;
  category: string;
}

interface AssignedSubject {
  id: string;
  subject: string;
  className: string;
  stream: string;
  students: number;
  curriculum: string;
  portalOpen: boolean;
  subjectCode: string;
  category: string;
  assignments: Array<{
    id: string;
    assigned_at: string;
  }>;
}

const SubjectsAssigned: React.FC = () => {
  const navigate = useNavigate();
  const { school, user } = useAuth();
  
  const [assignedSubjects, setAssignedSubjects] = useState<AssignedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCurriculum, setFilterCurriculum] = useState<string>("all"); // "all", "CBC", "8-4-4"
  const [stats, setStats] = useState({
    totalSubjects: 0,
    activeSubjects: 0,
    totalStudents: 0,
    cbcSubjects: 0,
    traditionalSubjects: 0
  });

  useEffect(() => {
    fetchAssignedSubjects();
  }, []);

  const fetchAssignedSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get teacher's assignments to extract subjects
      const response = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      if (response.data.success) {
        const assignments = response.data.data.assignments;
        
        // Transform API data to frontend format
        const transformedSubjects = await transformAssignmentsToSubjects(assignments);
        
        // Apply curriculum filter
        let filteredSubjects = transformedSubjects;
        if (filterCurriculum !== "all") {
          filteredSubjects = transformedSubjects.filter(
            subject => subject.curriculum === filterCurriculum
          );
        }
        
        setAssignedSubjects(filteredSubjects);
        
        // Calculate stats
        const totalStudents = transformedSubjects.reduce((sum, subject) => sum + subject.students, 0);
        const cbcSubjects = transformedSubjects.filter(subject => subject.curriculum === "CBC").length;
        const traditionalSubjects = transformedSubjects.filter(subject => subject.curriculum === "8-4-4").length;
        
        setStats({
          totalSubjects: transformedSubjects.length,
          activeSubjects: transformedSubjects.filter(subject => subject.portalOpen).length,
          totalStudents,
          cbcSubjects,
          traditionalSubjects
        });
      } else {
        throw new Error(response.data.error || 'Failed to fetch assigned subjects');
      }
    } catch (error: any) {
      console.error('Error fetching assigned subjects:', error);
      setError(error.message || 'Failed to load your assigned subjects. Please try again.');
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback mock data');
        setAssignedSubjects([
          {
            id: "sub-1",
            subject: "Mathematics",
            className: "Grade 4",
            stream: "East",
            students: 38,
            curriculum: "CBC",
            portalOpen: true,
            subjectCode: "MATH",
            category: "Core",
            assignments: [{ id: "1", assigned_at: new Date().toISOString() }]
          },
          {
            id: "sub-2",
            subject: "English",
            className: "Grade 5",
            stream: "West",
            students: 41,
            curriculum: "CBC",
            portalOpen: false,
            subjectCode: "ENG",
            category: "Core",
            assignments: [{ id: "2", assigned_at: new Date().toISOString() }]
          },
          {
            id: "sub-3",
            subject: "Science",
            className: "Grade 6",
            stream: "North",
            students: 36,
            curriculum: "8-4-4",
            portalOpen: true,
            subjectCode: "SCI",
            category: "Science",
            assignments: [{ id: "3", assigned_at: new Date().toISOString() }]
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const transformAssignmentsToSubjects = async (assignmentsData: any[]): Promise<AssignedSubject[]> => {
    const subjects: AssignedSubject[] = [];
    const seenSubjects = new Set(); // To avoid duplicates
    
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
              // Estimate based on class level
              studentCount = assignment.stream.class.class_level === 4 ? 38 :
                            assignment.stream.class.class_level === 5 ? 41 :
                            assignment.stream.class.class_level === 6 ? 36 : 35;
            }

            // Process each subject in this assignment
            for (const subjectData of assignment.subjects) {
              const subjectKey = `${subjectData.id}-${assignment.stream.id}`;
              
              if (!seenSubjects.has(subjectKey)) {
                seenSubjects.add(subjectKey);
                
                // Determine curriculum based on class level (simplified logic)
                const curriculum = assignment.stream.class.class_level <= 6 ? "CBC" : "8-4-4";
                
                // Determine if portal is open (based on current term)
                const portalOpen = yearData.academic_year.is_current && termData.term.is_current;

                subjects.push({
                  id: subjectData.id,
                  subject: subjectData.name,
                  className: assignment.stream.class.class_name,
                  stream: assignment.stream.name,
                  students: studentCount,
                  curriculum,
                  portalOpen,
                  subjectCode: subjectData.subject_code || subjectData.name.substring(0, 3).toUpperCase(),
                  category: subjectData.category || "General",
                  assignments: assignment.assignments || []
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error transforming assignments:', error);
    }

    return subjects;
  };

  const handleFilterChange = (curriculum: string) => {
    setFilterCurriculum(curriculum);
    // Re-filter the already loaded data
    fetchAssignedSubjects(); // Re-fetch to ensure fresh data
  };

  const handleViewPerformance = (subject: AssignedSubject) => {
    navigate(`/teacher/performance?subject=${encodeURIComponent(subject.subject)}&class=${encodeURIComponent(subject.className)}&subjectId=${subject.id}`);
  };

  const handleEnterMarks = (subject: AssignedSubject) => {
    if (!subject.portalOpen) {
      alert('Portal is locked. Marks entry is only available during active terms.');
      return;
    }
    
    const route = subject.curriculum === "CBC" 
      ? `/teacher/cbc?subject=${subject.id}&subjectName=${encodeURIComponent(subject.subject)}`
      : `/teacher/scores?subject=${subject.id}&subjectName=${encodeURIComponent(subject.subject)}`;
    
    navigate(route);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-700">Loading Your Subjects</h2>
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
          <h2 className="text-xl font-bold text-slate-700 mb-2">Unable to Load Subjects</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={fetchAssignedSubjects}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={18} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (assignedSubjects.length === 0) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Subjects Assigned</h2>
          <p className="text-slate-600 mb-4">
            You don't have any subject teaching assignments for the current term.
          </p>
          <p className="text-sm text-slate-500">
            Contact your school administrator to get assigned to subjects.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Academic Portfolio</h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage assessments and tracking for your assigned subjects at{" "}
            <span className="text-indigo-600 font-semibold">{school?.name}</span>
          </p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Subjects</p>
                <p className="text-lg font-bold text-slate-800">{stats.totalSubjects}</p>
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
                <School size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Active Portals</p>
                <p className="text-lg font-bold text-slate-800">{stats.activeSubjects}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Curriculum Filter */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-1 px-2">
              <Filter size={12} />
              <span className="font-semibold">Curriculum:</span>
            </div>
            <div className="flex gap-1">
              {["all", "CBC", "8-4-4"].map((curriculum) => (
                <button
                  key={curriculum}
                  onClick={() => handleFilterChange(curriculum)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filterCurriculum === curriculum
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {curriculum === "all" ? "All" : curriculum}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={fetchAssignedSubjects}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Portal Status Banner */}
      {stats.activeSubjects > 0 && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ClipboardCheck size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-800">Grading Portal Active</h3>
                <p className="text-sm text-emerald-600">
                  {stats.activeSubjects} out of {stats.totalSubjects} subjects available for grading
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <BookOpen size={16} />
              <span>Current term: Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {assignedSubjects.map((subject) => (
          <Card key={`${subject.id}-${subject.className}-${subject.stream}`} 
                className="group border-none shadow-xl shadow-slate-200/40 rounded-3xl bg-white hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
            
            {/* Background decoration */}
            <div className="absolute -bottom-4 -right-4 text-slate-50 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700">
              <BookOpen size={180} />
            </div>

            {/* Portal Status Badge */}
            <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
              subject.portalOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${subject.portalOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {subject.portalOpen ? "Portal Open" : "Portal Closed"}
            </div>

            <div className="relative z-10 space-y-5 p-5">
              {/* Subject Header */}
              <div className="flex justify-between items-start">
                <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl text-white shadow-lg group-hover:from-indigo-600 group-hover:to-violet-600 transition-all">
                  <BookOpen size={24} />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                  subject.curriculum === "CBC" 
                  ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                  : "bg-amber-50 text-amber-600 border-amber-100"
                }`}>
                  {subject.curriculum} System
                </span>
              </div>

              {/* Subject Info */}
              <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                  {subject.subject}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <GraduationCap size={16} className="text-slate-400" />
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    {subject.className} • {subject.stream}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                    Code: {subject.subjectCode}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                    {subject.category}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-6 py-3 border-t border-b border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Enrolled</span>
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-500" /> {subject.students} Students
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assignments</span>
                  <span className="text-sm font-bold text-slate-700">
                    {subject.assignments.length}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={() => handleViewPerformance(subject)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-100 hover:text-slate-800 transition-all group/btn"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 size={16} /> Performance Analytics
                  </span>
                  <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>

                <button
                  disabled={!subject.portalOpen}
                  onClick={() => handleEnterMarks(subject)}
                  className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wide transition-all ${
                    subject.portalOpen
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {subject.portalOpen ? (
                    subject.curriculum === "CBC" ? (
                      <><Layers size={16} /> Start CBC Assessment</>
                    ) : (
                      <><ClipboardCheck size={16} /> Enter Marks</>
                    )
                  ) : (
                    <><Lock size={16} /> Portal Locked</>
                  )}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="text-center pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          Showing {assignedSubjects.length} of {stats.totalSubjects} subjects • 
          {filterCurriculum !== "all" && ` Filtered by: ${filterCurriculum} •`}
          {" "}{stats.activeSubjects} portals currently open
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Portal availability depends on current term and school academic calendar
        </p>
      </div>
    </div>
  );
};

export default SubjectsAssigned;