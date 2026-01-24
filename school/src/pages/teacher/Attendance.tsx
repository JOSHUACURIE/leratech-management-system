import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/common/Card";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Calendar as CalendarIcon, 
  Users, 
  Search, 
  Save,
  CheckCircle2,
  Filter,
  AlertCircle,
  ArrowLeft,
  Loader2,
  BookOpen,
  Hash,
  X,
  RefreshCw,
  FileText,
  Calendar,
  Check,
  XCircle,
  Clock4,
  Stethoscope,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Shield,
  BarChart3,
  FileSpreadsheet,
  GraduationCap,
  Download,
  Eye,
  EyeOff,
  History,
  TrendingUp,
  Clock3,
  CalendarClock,
  UserMinus,
  ClipboardList,
  AlertTriangle,
  UserCheck as UserCheckIcon,
  CalendarDays
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { teacherAPI, attendanceAPI } from "../../services/api";

// Define types
interface Student {
  id: string;
  studentId: string;
  admissionNumber: string;
  fullName: string;
  status?: "present" | "absent" | "late" | "excused" | "sick";
  reason?: string;
  lastAttendance?: string;
  attendanceCount?: number;
}

interface ClassOption {
  id: string;
  name: string;
  class_name: string;
  class_level: number;
}

interface StreamOption {
  id: string;
  name: string;
  class_id: string;
}

interface SubjectOption {
  id: string;
  name: string;
  subject_code: string;
  code?: string;
  category?: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  reason: string | null;
  attendance_date: string;
  created_at: string;
  student: {
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  subject?: {
    name: string;
    subject_code: string;
  };
  teacher?: {
    teacher_code: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  sick: number;
  total: number;
  marked: number;
  attendanceRate: number;
  lastUpdated?: string;
}

const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const { user, school } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingSubjects, setFetchingSubjects] = useState<boolean>(false);
  const [fetchingStudents, setFetchingStudents] = useState<boolean>(false);
  const [fetchingAttendance, setFetchingAttendance] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Selection states
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Data states
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [streams, setStreams] = useState<StreamOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // UI states
  const [showSelectionSummary, setShowSelectionSummary] = useState<boolean>(true);
  const [showHelpSection, setShowHelpSection] = useState<boolean>(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"marking" | "view">("marking");

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch streams when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStreamsForClass(selectedClass);
    } else {
      setStreams([]);
      setSelectedStream("");
      setSubjects([]);
      setSelectedSubject("");
    }
  }, [selectedClass]);

  // Fetch subjects when stream changes
  useEffect(() => {
    if (selectedClass && selectedStream) {
      fetchSubjectsForStream(selectedStream);
    } else {
      setSubjects([]);
      setSelectedSubject("");
    }
  }, [selectedClass, selectedStream]);

  // Fetch attendance when criteria change (in view mode)
  useEffect(() => {
    if (viewMode === "view" && selectedClass && selectedStream && selectedDate) {
      fetchAttendanceRecords();
    }
  }, [selectedClass, selectedStream, selectedDate, viewMode]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      if (response.data.success) {
        const assignments = response.data.data.assignments;
        const classSet = new Map<string, ClassOption>();
        
        assignments.forEach((yearData: any) => {
          yearData.terms.forEach((termData: any) => {
            termData.assignments.forEach((assignment: any) => {
              if (assignment.stream?.class && !classSet.has(assignment.stream.class.id)) {
                classSet.set(assignment.stream.class.id, {
                  id: assignment.stream.class.id,
                  name: assignment.stream.class.class_name,
                  class_name: assignment.stream.class.class_name,
                  class_level: assignment.stream.class.class_level || 0
                });
              }
            });
          });
        });

        setClasses(Array.from(classSet.values()));
        
      } else {
        throw new Error(response.data.error || 'Failed to load assignments');
      }
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError(error.message || 'Failed to load your teaching assignments');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback mock data');
        setClasses([
          { id: "1", name: "Grade 4", class_name: "Grade 4", class_level: 4 },
          { id: "2", name: "Grade 5", class_name: "Grade 5", class_level: 5 },
          { id: "3", name: "Class 6", class_name: "Class 6", class_level: 6 },
        ]);
      } else {
        setClasses([]);
      }
      setStreams([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamsForClass = async (classId: string) => {
    try {
      setError(null);
      setStreams([]);
      setSelectedStream("");
      
      const response = await teacherAPI.getClassStreams(classId);
      
      if (response.data.success) {
        const apiStreams: StreamOption[] = response.data.data.streams.map((stream: any) => ({
          id: stream.id,
          name: stream.name,
          class_id: stream.class_id
        }));
        
        setStreams(apiStreams);
        
        if (apiStreams.length === 1) {
          setSelectedStream(apiStreams[0].id);
        }
      } else {
        throw new Error(response.data.error || 'Failed to load streams');
      }
    } catch (error: any) {
      console.error('Error fetching streams:', error);
      
      if (process.env.NODE_ENV === 'development') {
        setStreams([
          { id: "1", name: "East", class_id: classId },
          { id: "2", name: "West", class_id: classId },
          { id: "3", name: "North", class_id: classId },
        ]);
      } else {
        setError("Failed to load streams for this class");
      }
    }
  };

  const fetchSubjectsForStream = async (streamId: string) => {
    try {
      setFetchingSubjects(true);
      setError(null);
      
      const response = await teacherAPI.getTeacherSubjects(streamId);
      
      if (response.data.success) {
        const responseData = response.data.data;
        let subjectsArray: any[] = [];
        
        if (responseData.subjects && Array.isArray(responseData.subjects)) {
          subjectsArray = responseData.subjects;
        } else if (Array.isArray(responseData)) {
          subjectsArray = responseData;
        } else {
          throw new Error("Invalid subjects data structure");
        }
        
        const apiSubjects: SubjectOption[] = subjectsArray.map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          subject_code: subject.subject_code || subject.code || subject.name.substring(0, 3).toUpperCase(),
          code: subject.subject_code || subject.code || subject.name.substring(0, 3).toUpperCase(),
          category: subject.category || "General"
        }));
        
        setSubjects(apiSubjects);
        
        if (apiSubjects.length === 1) {
          setSelectedSubject(apiSubjects[0].id);
        }
      } else {
        throw new Error(response.data.error || 'Failed to load subjects');
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      
      if (process.env.NODE_ENV === 'development') {
        setSubjects([
          { id: "1", name: "Mathematics", subject_code: "MATH", category: "Core" },
          { id: "2", name: "English", subject_code: "ENG", category: "Core" },
          { id: "3", name: "Science", subject_code: "SCI", category: "Science" },
        ]);
      } else {
        setError("Failed to load subjects for this stream");
        setSubjects([]);
      }
    } finally {
      setFetchingSubjects(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    if (!selectedClass || !selectedStream || !selectedDate) {
      setError("Please select Class, Stream, and Date to view attendance");
      return;
    }

    try {
      setFetchingAttendance(true);
      setError(null);
      setAttendanceHistory([]);

      const params: any = {
        classId: selectedClass,
        streamId: selectedStream,
        date: selectedDate
      };

      if (selectedSubject && selectedSubject !== 'all') {
        params.subjectId = selectedSubject;
      }

      const response = await attendanceAPI.getAttendanceByDate(params);
      
      if (response.data.success) {
        const attendanceData = response.data.data;
        setAttendanceHistory(attendanceData.attendance || []);
        
        // Transform to students for marking view
        if (viewMode === "marking" && attendanceData.attendance && attendanceData.unmarked_students) {
          const allStudents = [
            ...(attendanceData.attendance.map((record: any) => ({
              id: record.student_id,
              studentId: record.student_id,
              admissionNumber: record.student?.admission_number || `ADM-${record.student_id.slice(-4)}`,
              fullName: `${record.student?.first_name || ''} ${record.student?.last_name || ''}`.trim(),
              status: record.status,
              reason: record.reason || ""
            }))),
            ...(attendanceData.unmarked_students.map((record: any) => ({
              id: record.student.id,
              studentId: record.student.id,
              admissionNumber: record.student.admission_number || `ADM-${record.student.id.slice(-4)}`,
              fullName: `${record.student.first_name || ''} ${record.student.last_name || ''}`.trim(),
              status: undefined,
              reason: ""
            })))
          ];
          
          setStudents(allStudents);
        }

        setSuccessMessage(`Attendance records loaded for ${new Date(selectedDate).toLocaleDateString()}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.data.error || "Failed to load attendance records");
      }
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      
      if (error.response?.status === 404) {
        setAttendanceHistory([]);
        setSuccessMessage("No attendance records found for selected criteria");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (error.response?.status === 400) {
        setError("Invalid selection. Please check your inputs");
      } else {
        setError(error.message || "Failed to load attendance records");
      }
      
      setAttendanceHistory([]);
    } finally {
      setFetchingAttendance(false);
    }
  };

  const fetchStudentsForMarking = async () => {
    try {
      setFetchingStudents(true);
      setError(null);

      if (!selectedClass || !selectedStream || !selectedSubject) {
        setError("Please select Class, Stream, and Subject");
        return;
      }

      const response = await teacherAPI.getClassStudents(selectedClass, selectedStream);
      
      if (response.data.success) {
        const classStudents = response.data.data.students;
        const apiStudents: Student[] = classStudents.map((student: any) => ({
          id: student.id,
          studentId: student.id,
          admissionNumber: student.admission_number || `ADM-${student.id.slice(-4)}`,
          fullName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          status: undefined,
          reason: ""
        }));

        // Fetch existing attendance
        try {
          await fetchAttendanceRecords();
        } catch {
          setStudents(apiStudents);
        }
        
        if (apiStudents.length > 0) {
          setSuccessMessage(`Loaded ${apiStudents.length} students for attendance`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError("No students found in this class");
        }
      } else {
        throw new Error(response.data.error || "Failed to load students");
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      
      if (error.response?.status === 404) {
        setError("No students found for the selected criteria");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to mark attendance for this class");
      } else if (error.response?.status === 400) {
        setError("Invalid selection. Please check your inputs");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to load students. Please try again.");
      }
      
      if (process.env.NODE_ENV === 'development') {
        setStudents([
          { id: "1", studentId: "1", admissionNumber: "ADM-1001", fullName: "Jane Smith", status: undefined, reason: "" },
          { id: "2", studentId: "2", admissionNumber: "ADM-1002", fullName: "Mary Jaoko", status: undefined, reason: "" },
          { id: "3", studentId: "3", admissionNumber: "ADM-1003", fullName: "Mary Johnson", status: undefined, reason: "" },
          { id: "4", studentId: "4", admissionNumber: "ADM-1004", fullName: "Peter Brown", status: undefined, reason: "" },
        ]);
      } else {
        setStudents([]);
      }
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleStatusChange = (studentId: string, status: Student["status"], reason?: string) => {
    setStudents((prev) => 
      prev.map((s) => 
        s.studentId === studentId ? { 
          ...s, 
          status, 
          reason: reason || "" 
        } : s
      )
    );
  };

  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      if (!selectedClass || !selectedStream || !selectedSubject || !selectedDate) {
        setError("Please select Class, Stream, Subject, and Date");
        return;
      }

      const attendanceRecords = students
        .filter(student => student.status)
        .map(student => ({
          studentId: student.studentId,
          status: student.status!,
          reason: student.reason
        }));

      if (attendanceRecords.length === 0) {
        setError("No attendance marked. Please mark attendance for at least one student.");
        return;
      }

      const invalidRecords = attendanceRecords.filter(record => 
        (record.status === "absent" || record.status === "late" || record.status === "sick") && 
        !record.reason
      );

      if (invalidRecords.length > 0) {
        setError(`Reason is required for ${invalidRecords.length} ${invalidRecords.length === 1 ? 'student' : 'students'} marked as absent, late, or sick.`);
        return;
      }

      const attendanceData = {
        classId: selectedClass,
        streamId: selectedStream,
        subjectId: selectedSubject,
        attendanceDate: selectedDate,
        attendanceData: attendanceRecords
      };

      const response = await attendanceAPI.markAttendance(attendanceData);

      if (response.data.success) {
        setSuccessMessage(`✓ Attendance marked successfully for ${response.data.data.marked_count} students`);
        
        // Refresh attendance data
        await fetchAttendanceRecords();
        
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        throw new Error(response.data.error || "Failed to mark attendance");
      }
    } catch (error: any) {
      console.error('Error submitting attendance:', error);
      
      if (error.response?.status === 403) {
        setError("You don't have permission to mark attendance for this class");
      } else if (error.response?.status === 400) {
        if (error.response.data.error?.includes("already marked")) {
          setError("Attendance already marked for some students on this date. Please refresh to see existing records.");
        } else {
          setError(error.response.data.error || "Invalid data. Please check all fields.");
        }
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to mark attendance. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAll = (status: Student["status"]) => {
    setStudents((prev) => 
      prev.map((s) => ({ 
        ...s, 
        status,
        reason: status === "present" ? "" : s.reason
      }))
    );
  };

  const handleRefresh = () => {
    setStudents([]);
    setAttendanceHistory([]);
    setSelectedClass("");
    setSelectedStream("");
    setSelectedSubject("");
    setSelectedDate(new Date().toISOString().split('T')[0]);
    fetchInitialData();
  };

  const toggleViewMode = () => {
    const newMode = viewMode === "marking" ? "view" : "marking";
    setViewMode(newMode);
    if (newMode === "view") {
      fetchAttendanceRecords();
    } else {
      setAttendanceHistory([]);
    }
  };

  // Calculate statistics
  const stats: AttendanceSummary = {
    present: students.filter(s => s.status === "present").length,
    absent: students.filter(s => s.status === "absent").length,
    late: students.filter(s => s.status === "late").length,
    excused: students.filter(s => s.status === "excused").length,
    sick: students.filter(s => s.status === "sick").length,
    total: students.length,
    marked: students.filter(s => s.status).length,
    attendanceRate: students.length > 0 ? (students.filter(s => s.status === "present").length / students.length) * 100 : 0
  };

  const historyStats: AttendanceSummary = {
    present: attendanceHistory.filter(a => a.status === "present").length,
    absent: attendanceHistory.filter(a => a.status === "absent").length,
    late: attendanceHistory.filter(a => a.status === "late").length,
    excused: attendanceHistory.filter(a => a.status === "excused").length,
    sick: attendanceHistory.filter(a => a.status === "sick").length,
    total: attendanceHistory.length,
    marked: attendanceHistory.length,
    attendanceRate: attendanceHistory.length > 0 ? (attendanceHistory.filter(a => a.status === "present").length / attendanceHistory.length) * 100 : 0
  };

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = attendanceHistory.filter(record =>
    record.student?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.student?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.student?.admission_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get display names
  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "";
  const selectedStreamName = streams.find(s => s.id === selectedStream)?.name || "";
  const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || "";

  const displayDate = selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : "";

  if (loading && students.length === 0 && attendanceHistory.length === 0) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-700">Loading Attendance Portal</h2>
          <p className="text-slate-500 mt-2">Fetching your teaching assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => navigate("/teacher")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl transition-all ${
              viewMode === "marking" 
                ? "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-200"
                : "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-200"
            }`}>
              {viewMode === "marking" ? <UserCheck size={28} /> : <Eye size={28} />}
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                {viewMode === "marking" ? "Daily Roll Call" : "Attendance Records"}
              </h1>
              <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                <CalendarIcon size={14} className="text-indigo-500" />
                <span>{displayDate || "Select a date"}</span>
                <span className="mx-2">•</span>
                <GraduationCap size={14} className="text-indigo-500" />
                <span>{school?.name}</span>
              </p>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                viewMode === "marking" ? "bg-indigo-50" : "bg-emerald-50"
              }`}>
                <Users size={16} className={viewMode === "marking" ? "text-indigo-600" : "text-emerald-600"} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Students</p>
                <p className="text-lg font-bold text-slate-800">
                  {viewMode === "marking" ? stats.total : historyStats.total}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Present</p>
                <p className="text-lg font-bold text-slate-800">
                  {viewMode === "marking" ? stats.present : historyStats.present}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <UserMinus size={16} className="text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Absent</p>
                <p className="text-lg font-bold text-slate-800">
                  {viewMode === "marking" ? stats.absent : historyStats.absent}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock3 size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Late</p>
                <p className="text-lg font-bold text-slate-800">
                  {viewMode === "marking" ? stats.late : historyStats.late}
                </p>
              </div>
            </div>
            
            {viewMode === "marking" && stats.marked > 0 && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 px-3 py-2 rounded-xl border border-indigo-100 shadow-sm">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <ClipboardList size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-indigo-600">Marked</p>
                  <p className="text-lg font-bold text-indigo-800">
                    {stats.marked} / {stats.total}
                  </p>
                </div>
              </div>
            )}
            
            {viewMode === "view" && attendanceHistory.length > 0 && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2 rounded-xl border border-emerald-100 shadow-sm">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600">Attendance Rate</p>
                  <p className="text-lg font-bold text-emerald-800">
                    {historyStats.attendanceRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleViewMode}
            className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm ${
              viewMode === "marking"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            {viewMode === "marking" ? (
              <>
                <Eye size={16} />
                View Attendance
              </>
            ) : (
              <>
                <UserCheckIcon size={16} />
                Mark Attendance
              </>
            )}
          </button>
          
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {viewMode === "marking" && stats.marked > 0 && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-indigo-100">
                <FileSpreadsheet size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-800">Attendance Ready for Submission</h3>
                <p className="text-sm text-indigo-600">
                  {stats.marked} out of {stats.total} students marked • {stats.present} present
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <Shield size={16} />
              <span>Auto-save enabled</span>
            </div>
          </div>
        </div>
      )}
      
      {viewMode === "view" && attendanceHistory.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-emerald-100">
                <CalendarDays size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-800">Attendance Records Loaded</h3>
                <p className="text-sm text-emerald-600">
                  {attendanceHistory.length} records found • {historyStats.present} present ({historyStats.attendanceRate.toFixed(1)}%)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CalendarClock size={16} />
              <span>Date: {displayDate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
          >
            <X size={16} className="text-red-500" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={20} />
            <span className="text-emerald-700 font-medium">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded transition-colors flex-shrink-0"
          >
            <X size={16} className="text-emerald-500" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selection Panel */}
        <Card className="lg:col-span-4 border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 space-y-6 bg-white group hover:shadow-2xl transition-all duration-500">
          {/* Background decoration */}
          <div className="absolute -bottom-4 -right-4 text-slate-50 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700">
            {viewMode === "marking" ? <UserCheck size={180} /> : <Eye size={180} />}
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  viewMode === "marking" ? "bg-indigo-50" : "bg-emerald-50"
                }`}>
                  <Filter size={16} className={viewMode === "marking" ? "text-indigo-600" : "text-emerald-600"} />
                </div>
                <h2 className="text-sm font-bold text-slate-800">
                  {viewMode === "marking" ? "Selection Criteria" : "Viewing Criteria"}
                </h2>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mb-6">
              {viewMode === "marking" 
                ? "Select the criteria to load students for attendance marking"
                : "Select the criteria to view attendance records"
              }
            </p>
          </div>
          
          <div className="space-y-5">
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Calendar size={12} className="text-indigo-500" /> Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer hover:border-indigo-300"
                  disabled={loading || (viewMode === "view" && fetchingAttendance)}
                />
                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Class Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <BookOpen size={12} className="text-indigo-500" /> Academic Class
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer hover:border-indigo-300 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  disabled={loading || classes.length === 0}
                >
                  <option value="">{classes.length === 0 ? "No classes available" : "Select Class..."}</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Level {cls.class_level})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Stream Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Hash size={12} className="text-indigo-500" /> Stream / Group
              </label>
              <div className="relative">
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer hover:border-indigo-300 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  disabled={!selectedClass || loading || streams.length === 0}
                >
                  <option value="">{streams.length === 0 ? "No streams available" : "Select Stream..."}</option>
                  {streams.map((str) => (
                    <option key={str.id} value={str.id}>
                      {str.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Subject Selection - Different for view mode */}
            {viewMode === "marking" ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <FileText size={12} className="text-indigo-500" /> Subject
                </label>
                <div className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
                      ${selectedSubject ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200'}
                    `}
                    disabled={!selectedStream || fetchingSubjects || subjects.length === 0}
                  >
                    <option value="">
                      {fetchingSubjects ? "Loading subjects..." : 
                      !selectedStream ? "Select a stream first" :
                      subjects.length === 0 ? "No subjects available" : 
                      "Select Subject..."}
                    </option>
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.name} ({subj.subject_code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {fetchingSubjects ? (
                      <Loader2 size={16} className="animate-spin text-indigo-500" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400 pointer-events-none" />
                    )}
                  </div>
                </div>
                
                {selectedStream && (
                  <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                    {fetchingSubjects ? (
                      <span className="flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" />
                        Loading subjects...
                      </span>
                    ) : subjects.length > 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-500" />
                        {subjects.length} subject{subjects.length !== 1 ? 's' : ''} available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertCircle size={10} />
                        No subjects assigned
                      </span>
                    )}
                    {selectedSubject && (
                      <button
                        onClick={() => setSelectedSubject("")}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <FileText size={12} className="text-indigo-500" /> Subject (Optional)
                </label>
                <div className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer hover:border-indigo-300"
                    disabled={!selectedStream}
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.name} ({subj.subject_code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {viewMode === "marking" && selectedClass && selectedStream && selectedSubject && (
              <button
                onClick={fetchStudentsForMarking}
                disabled={fetchingStudents}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:shadow-xl"
              >
                {fetchingStudents ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading Students...
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    Load Students for Attendance
                  </>
                )}
              </button>
            )}

            {viewMode === "view" && selectedClass && selectedStream && (
              <button
                onClick={fetchAttendanceRecords}
                disabled={fetchingAttendance}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 hover:shadow-xl"
              >
                {fetchingAttendance ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading Records...
                  </>
                ) : (
                  <>
                    <History size={16} />
                    View Attendance Records
                  </>
                )}
              </button>
            )}

            {/* Current Selection Summary */}
            {(selectedClass || selectedSubject) && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowSelectionSummary(!showSelectionSummary)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 mb-2 hover:text-slate-800"
                >
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-indigo-500" />
                    Current Selection
                  </span>
                  {showSelectionSummary ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
                
                {showSelectionSummary && (
                  <div className="space-y-2 text-sm text-slate-700 animate-fade-in">
                    {selectedDate && (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                          <Calendar size={14} className="text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Date</p>
                          <p className="font-medium">{displayDate}</p>
                        </div>
                      </div>
                    )}
                    {selectedClassName && (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                          <BookOpen size={14} className="text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Class</p>
                          <p className="font-medium">{selectedClassName}</p>
                        </div>
                      </div>
                    )}
                    {selectedStreamName && (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                          <Hash size={14} className="text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Stream</p>
                          <p className="font-medium">{selectedStreamName}</p>
                        </div>
                      </div>
                    )}
                    {selectedSubjectName && (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                          <FileText size={14} className="text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Subject</p>
                          <p className="font-medium">{selectedSubjectName}</p>
                        </div>
                      </div>
                    )}
                    {viewMode === "view" && selectedSubject === "all" && (
                      <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle size={14} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-amber-700">Viewing all subjects</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Main Content Area */}
        <div className="lg:col-span-8">
          {viewMode === "marking" ? (
            /* MARKING VIEW */
            students.length > 0 ? (
              <AttendanceMarkingView
                students={students}
                filteredStudents={filteredStudents}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                stats={stats}
                submitting={submitting}
                handleStatusChange={handleStatusChange}
                handleMarkAll={handleMarkAll}
                handleSubmitAttendance={handleSubmitAttendance}
                setShowHelpSection={setShowHelpSection}
                showHelpSection={showHelpSection}
              />
            ) : (
              /* Empty State for Marking */
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 text-center">
                <div className="max-w-md mx-auto py-8">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="text-slate-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">No Students Loaded</h3>
                  <p className="text-slate-500 mb-6">
                    Select a class, stream, and subject to load students for attendance.
                  </p>
                  {(!selectedClass || !selectedStream || !selectedSubject) && (
                    <div className="inline-flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-100">
                      <AlertCircle size={16} />
                      <span>Complete all selection criteria to load students</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          ) : (
            /* VIEWING MODE */
            attendanceHistory.length > 0 ? (
              <AttendanceHistoryView
                attendanceHistory={filteredHistory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                stats={historyStats}
                fetchingAttendance={fetchingAttendance}
                showHelpSection={showHelpSection}
                setShowHelpSection={setShowHelpSection}
                displayDate={displayDate}
              />
            ) : (
              /* Empty State for Viewing */
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 text-center">
                <div className="max-w-md mx-auto py-8">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="text-slate-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">No Attendance Records</h3>
                  <p className="text-slate-500 mb-6">
                    Select a class, stream, and date to view attendance records.
                    You can view attendance for specific subjects or all subjects.
                  </p>
                  {(!selectedClass || !selectedStream || !selectedDate) && (
                    <div className="inline-flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-100">
                      <AlertCircle size={16} />
                      <span>Select class, stream, and date to view records</span>
                    </div>
                  )}
                  {selectedClass && selectedStream && selectedDate && attendanceHistory.length === 0 && (
                    <div className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-100">
                      <CheckCircle2 size={16} />
                      <span>No attendance records found for selected criteria</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          )}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="text-center pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          {viewMode === "marking" && students.length > 0 ? (
            <>
              <span className="font-medium">{stats.marked} of {students.length}</span> students marked • 
              {stats.present > 0 && <span className="text-emerald-600 ml-2">{stats.present} present</span>}
              {stats.absent > 0 && <span className="text-rose-600 ml-2">{stats.absent} absent</span>}
              {stats.late > 0 && <span className="text-amber-600 ml-2">{stats.late} late</span>}
            </>
          ) : viewMode === "view" && attendanceHistory.length > 0 ? (
            <>
              <span className="font-medium">{attendanceHistory.length}</span> records found • 
              <span className="text-emerald-600 ml-2">{historyStats.present} present ({historyStats.attendanceRate.toFixed(1)}%)</span>
              {historyStats.absent > 0 && <span className="text-rose-600 ml-2">{historyStats.absent} absent</span>}
            </>
          ) : (
            "Select criteria to load data"
          )}
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Attendance data is automatically saved and synchronized with the school registry
        </p>
      </div>
    </div>
  );
};

/* ---------------- SUB-COMPONENTS ---------------- */

const AttendanceMarkingView: React.FC<{
  students: Student[];
  filteredStudents: Student[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  stats: AttendanceSummary;
  submitting: boolean;
  handleStatusChange: (studentId: string, status: Student["status"], reason?: string) => void;
  handleMarkAll: (status: Student["status"]) => void;
  handleSubmitAttendance: () => void;
  setShowHelpSection: (show: boolean) => void;
  showHelpSection: boolean;
}> = ({
  students,
  filteredStudents,
  searchQuery,
  setSearchQuery,
  stats,
  submitting,
  handleStatusChange,
  handleMarkAll,
  handleSubmitAttendance,
  setShowHelpSection,
  showHelpSection
}) => {
  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-0 overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
      {/* Table Header */}
      <div className="relative z-10 p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search by name or admission number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all hover:border-indigo-200"
            disabled={submitting}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Quick Actions:</span>
            <button
              onClick={() => handleMarkAll("present")}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || students.length === 0}
            >
              <Check size={12} />
              Mark All Present
            </button>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <button
            onClick={() => {
              // Clear all statuses
              students.forEach(student => handleStatusChange(student.id, undefined, ""));
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || stats.marked === 0}
          >
            <X size={12} />
            Clear All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative z-10 overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-slate-50 text-slate-600 sticky top-0">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">#</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Adm No</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Attendance Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                <AttendanceRow
                  key={student.id}
                  student={student}
                  index={index}
                  submitting={submitting}
                  handleStatusChange={handleStatusChange}
                />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="text-slate-300 mb-3" size={40} />
                    <p className="text-slate-500 font-medium">No students match your search</p>
                    <p className="text-slate-400 text-sm mt-1">Try a different search term or clear the search</p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-3 px-4 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Clear Search
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="relative z-10 p-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Users size={14} className="text-slate-400" />
              <span>Showing <span className="font-semibold">{filteredStudents.length}</span> of <span className="font-semibold">{students.length}</span> students</span>
            </div>
            {searchQuery && (
              <>
                <div className="w-px h-4 bg-slate-200" />
                <span className="flex items-center gap-1">
                  <Search size={14} className="text-slate-400" />
                  Filtered by: "<span className="font-medium">{searchQuery}</span>"
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHelpSection(!showHelpSection)}
            className="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <BarChart3 size={12} />
            {showHelpSection ? "Hide Tips" : "Show Tips"}
          </button>
          <button
            onClick={handleSubmitAttendance}
            disabled={submitting || stats.marked === 0}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:shadow-xl min-w-[180px]"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save size={16} />
                Submit Attendance
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {stats.marked}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};

const AttendanceHistoryView: React.FC<{
  attendanceHistory: AttendanceRecord[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  stats: AttendanceSummary;
  fetchingAttendance: boolean;
  showHelpSection: boolean;
  setShowHelpSection: (show: boolean) => void;
  displayDate: string;
}> = ({
  attendanceHistory,
  searchQuery,
  setSearchQuery,
  stats,
  fetchingAttendance,
  showHelpSection,
  setShowHelpSection,
  displayDate
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'absent': return <XCircle size={14} className="text-rose-500" />;
      case 'late': return <Clock4 size={14} className="text-amber-500" />;
      case 'sick': return <Stethoscope size={14} className="text-violet-500" />;
      case 'excused': return <BookmarkCheck size={14} className="text-blue-500" />;
      default: return <AlertCircle size={14} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'absent': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'late': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'sick': return 'bg-violet-50 text-violet-700 border-violet-100';
      case 'excused': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-0 overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
      {/* Table Header */}
      <div className="relative z-10 p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search by name, admission number, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all hover:border-indigo-200"
            disabled={fetchingAttendance}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
            {stats.attendanceRate.toFixed(1)}% Attendance Rate
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <button
            className="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative z-10 overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-slate-50 text-slate-600 sticky top-0">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">#</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Adm No</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Subject</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Reason</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Marked By</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fetchingAttendance ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-indigo-500 mb-3" />
                    <p className="text-slate-500 font-medium">Loading attendance records...</p>
                    <p className="text-slate-400 text-sm mt-1">Please wait while we fetch the data</p>
                  </div>
                </td>
              </tr>
            ) : attendanceHistory.length > 0 ? (
              attendanceHistory.map((record, index) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group/row">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-400 font-mono group-hover/row:text-indigo-500 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700 font-mono bg-slate-50 px-2 py-1 rounded-md">
                      {record.student?.admission_number || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {record.student?.first_name} {record.student?.last_name}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {record.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {record.subject?.name || 'N/A'}
                      {record.subject?.subject_code && (
                        <span className="text-xs text-slate-500 ml-1">
                          ({record.subject.subject_code})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 max-w-xs truncate" title={record.reason || ''}>
                      {record.reason || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">
                      {record.teacher ? (
                        <>
                          {record.teacher.user.first_name} {record.teacher.user.last_name}
                          <span className="text-xs text-slate-500 ml-1">
                            ({record.teacher.teacher_code})
                          </span>
                        </>
                      ) : (
                        'System'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-500">
                      {new Date(record.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="text-slate-300 mb-3" size={40} />
                    <p className="text-slate-500 font-medium">No attendance records match your search</p>
                    <p className="text-slate-400 text-sm mt-1">Try a different search term or clear the search</p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-3 px-4 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Clear Search
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="relative z-10 p-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <History size={14} className="text-slate-400" />
              <span>Showing <span className="font-semibold">{attendanceHistory.length}</span> records • {displayDate}</span>
            </div>
            {searchQuery && (
              <>
                <div className="w-px h-4 bg-slate-200" />
                <span className="flex items-center gap-1">
                  <Search size={14} className="text-slate-400" />
                  Filtered by: "<span className="font-medium">{searchQuery}</span>"
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHelpSection(!showHelpSection)}
            className="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <BarChart3 size={12} />
            {showHelpSection ? "Hide Tips" : "Show Tips"}
          </button>
        </div>
      </div>
    </Card>
  );
};

const AttendanceRow: React.FC<{
  student: Student;
  index: number;
  submitting: boolean;
  handleStatusChange: (studentId: string, status: Student["status"], reason?: string) => void;
}> = ({ student, index, submitting, handleStatusChange }) => {
  return (
    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group/row">
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-slate-400 font-mono group-hover/row:text-indigo-500 transition-colors">
          {String(index + 1).padStart(2, '0')}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-slate-700 font-mono bg-slate-50 px-2 py-1 rounded-md">
          {student.admissionNumber}
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-slate-900">{student.fullName}</p>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-2">
          <AttendanceButton 
            active={student.status === "present"} 
            color="emerald" 
            onClick={() => handleStatusChange(student.id, "present")}
            label="Present"
            icon={<Check size={12} />}
            disabled={submitting}
          />
          <AttendanceButton 
            active={student.status === "late"} 
            color="amber" 
            onClick={() => handleStatusChange(student.id, "late")}
            label="Late"
            icon={<Clock4 size={12} />}
            disabled={submitting}
          />
          <AttendanceButton 
            active={student.status === "absent"} 
            color="rose" 
            onClick={() => handleStatusChange(student.id, "absent")}
            label="Absent"
            icon={<XCircle size={12} />}
            disabled={submitting}
          />
          <AttendanceButton 
            active={student.status === "sick"} 
            color="violet" 
            onClick={() => handleStatusChange(student.id, "sick")}
            label="Sick"
            icon={<Stethoscope size={12} />}
            disabled={submitting}
          />
          <AttendanceButton 
            active={student.status === "excused"} 
            color="blue" 
            onClick={() => handleStatusChange(student.id, "excused")}
            label="Excused"
            icon={<BookmarkCheck size={12} />}
            disabled={submitting}
          />
        </div>
      </td>
      <td className="px-6 py-4">
        {(student.status === "absent" || student.status === "late" || student.status === "sick") && (
          <input
            type="text"
            value={student.reason || ""}
            onChange={(e) => handleStatusChange(student.id, student.status, e.target.value)}
            placeholder="Enter reason..."
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all disabled:bg-slate-100"
            disabled={submitting}
          />
        )}
      </td>
    </tr>
  );
};

const StatChip = ({ label, count, color, icon }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
    rose: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300",
    amber: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300",
    violet: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 hover:border-violet-300",
    blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:scale-105 ${colors[color]}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
      <span className="text-sm font-black">{count}</span>
    </div>
  );
};

const AttendanceButton = ({ active, color, onClick, label, icon, disabled = false }: any) => {
  const themes: any = {
    emerald: active 
      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 border-emerald-500 hover:bg-emerald-600" 
      : "bg-white text-slate-400 border-slate-200 hover:border-emerald-300 hover:text-emerald-600",
    rose: active 
      ? "bg-rose-500 text-white shadow-lg shadow-rose-200 border-rose-500 hover:bg-rose-600" 
      : "bg-white text-slate-400 border-slate-200 hover:border-rose-300 hover:text-rose-600",
    amber: active 
      ? "bg-amber-500 text-white shadow-lg shadow-amber-200 border-amber-500 hover:bg-amber-600" 
      : "bg-white text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-600",
    violet: active 
      ? "bg-violet-500 text-white shadow-lg shadow-violet-200 border-violet-500 hover:bg-violet-600" 
      : "bg-white text-slate-400 border-slate-200 hover:border-violet-300 hover:text-violet-600",
    blue: active 
      ? "bg-blue-500 text-white shadow-lg shadow-blue-200 border-blue-500 hover:bg-blue-600" 
      : "bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-600"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${themes[color]}`}
    >
      {icon}
      {label}
    </button>
  );
};

export default Attendance;