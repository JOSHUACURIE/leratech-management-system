import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/common/Card";
import {
  Upload,
  Users,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  BookOpen,
  Hash,
  Calendar,
  X,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Trash2,
  Eye,
  Clock,
  BarChart3,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  GraduationCap,
  FileUp,
  FileDown,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Settings
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { teacherAPI } from "../../services/api";


interface TeacherStream {
  id: string;
  name: string;

}

interface TeacherSubject {
  id: string;
  name: string;
  subject_code: string;
  category?: string;
  is_compulsory: boolean;
}
interface TeacherClass {
  id: string; 
  className: string;
  classCode?: string; 
  streams: TeacherStream[];
  subjects: TeacherSubject[];
}

interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
}

interface Term {
  id: string;
  term_name: string;
  academic_year_id: string;
  is_active: boolean;
}
interface TeacherAssignedData {
  assignments: TeacherClass[];
  currentAcademicYear?: AcademicYear;
  activeTerms?: Term[];
  teacherId: string;
  schoolId: string;
  summary?: {
    total_classes: number;
    total_subjects: number;
    total_streams: number;
  };
}

interface StudentForAssignment {
  id: string;
  first_name: string;
  last_name: string;
  fullName: string;
  admission_number: string;
  stream_id?: string;
  stream?: {
    name: string;
  };
  isAssigned: boolean;
  assignmentStatus: 'assigned' | 'unassigned' | 'pending' | 'dropped';
  assignedDate?: string;
}

interface UploadSummary {
  total: number;
  successful: number;
  skipped: number;
  failed: number;
}

interface UploadResult {
  batchId: string;
  summary: UploadSummary;
  results: {
    successful: Array<{ studentId: string; status: 'created' | 'updated' }>;
    skipped: Array<{ studentId: string; status: 'skipped'; reason: string }>;
    failed: Array<{ studentId: string; status: 'failed'; reason: string }>;
  };
  processingTime: number;
  optimalBatchSize: number;
}

interface BatchOperation {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  total_records: number;
  processed_records: number;
  created_at: string;
  completed_at?: string;
  metadata: {
    filename?: string;
    results?: {
      successful: number;
      failed: number;
      skipped: number;
    };
  };
}

interface UploadedFile {
  file: File;
  preview: any[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
}



const StudentSubjectAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'preview'>('upload');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Selection State
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");

  // Data State
  const [assignedData, setAssignedData] = useState<TeacherAssignedData | null>(null);
  const [students, setStudents] = useState<StudentForAssignment[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentForAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Upload State
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [recentBatches, setRecentBatches] = useState<BatchOperation[]>([]);

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState<boolean>(false);



  useEffect(() => {
    fetchTeacherAssignedData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedTerm) {
      fetchStudentsForAssignment();
    }
  }, [selectedClass, selectedStream, selectedSubject, selectedTerm]);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, statusFilter]);

  const fetchTeacherAssignedData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await teacherAPI.getTeacherAssignedData();
      
      if (response.success && response.data) {
        setAssignedData(response.data);
        
        // Set default selections
        if (response.data.currentAcademicYear) {
          setSelectedAcademicYear(response.data.currentAcademicYear.id);
        }
        
        if (response.data.activeTerms && response.data.activeTerms.length > 0) {
          // Select first active term by default
          const activeTerm = response.data.activeTerms.find(t => t.is_active);
          setSelectedTerm(activeTerm?.id || response.data.activeTerms[0].id);
        }
        
        // Fetch recent batch history
        fetchBatchHistory();
      } else {
        setError(response.error || "Failed to load assigned data");
      }
    } catch (err: any) {
      console.error("Error fetching teacher data:", err);
      setError(err.message || "Failed to load your assigned classes and subjects");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForAssignment = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await teacherAPI.getStudentsForAssignment({
        classId: selectedClass,
        subjectId: selectedSubject,
        termId: selectedTerm,
        streamId: selectedStream || undefined
      });

      if (response.success && response.data) {
        setStudents(response.data.students);
        setFilteredStudents(response.data.students);
        
        if (response.data.students.length === 0) {
          setError("No students found for the selected criteria");
        } else {
          setSuccessMessage(`Found ${response.data.students.length} students`);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        setError(response.error || "Failed to load students");
      }
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setError(err.message || "Failed to load students");
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchHistory = async () => {
    try {
      const response = await teacherAPI.getAssignmentHistory({ limit: 5 });
      if (response.success && response.data) {
        setRecentBatches(response.data.batches);
      }
    } catch (err) {
      console.error("Error fetching batch history:", err);
    }
  };

  // ============================================
  // FILTER FUNCTIONS
  // ============================================

  const filterStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => 
          s.fullName.toLowerCase().includes(query) ||
          s.admission_number.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.assignmentStatus === statusFilter);
    }

    setFilteredStudents(filtered);
  };

  // ============================================
  // FILE HANDLING
  // ============================================

const handleFileUpload = (file: File) => {
  // Validate file type
  const validTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (!validTypes.includes(file.type)) {
    setError("Invalid file type. Please upload CSV or Excel files only.");
    return;
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    setError("File size exceeds 10MB limit");
    return;
  }

  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter(line => line.trim());
      
      // Parse and normalize headers
      const rawHeaders = lines[0].split(',').map(h => h.trim());
      const headers = rawHeaders.map(h => h.toLowerCase());
      
      // Normalize common variants
      const headerMap: { [key: string]: string } = {};
      const normalizedHeaders = headers.map((h, index) => {
        if (h === 'admissionnumber' || h === 'admission_no' || h === 'admissionno' || h === 'admissionNumber') {
          headerMap[rawHeaders[index]] = 'admission_number';
          return 'admission_number';
        }
        if (h === 'studentid' || h === 'studentId' || h === 'student_id') {
          headerMap[rawHeaders[index]] = 'student_id';
          return 'student_id';
        }
        headerMap[rawHeaders[index]] = h;
        return h;
      });
      
      // Validate required column exists
      const hasRequired = normalizedHeaders.some(h => 
        h === 'admission_number' || h === 'student_id'
      );
      
      if (!hasRequired) {
        setError("File must contain either 'admission_number' or 'student_id' column");
        return;
      }

      // Parse data rows with normalized headers
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        normalizedHeaders.forEach((header, index) => {
          if (values[index] !== undefined) {
            row[header] = values[index];
          }
        });
        return row;
      });

      // Validate data
      const errors: string[] = [];
      const warnings: string[] = [];
      
      data.forEach((row, index) => {
        const hasIdentifier = row.admission_number || row.student_id;
        if (!hasIdentifier) {
          errors.push(`Row ${index + 2}: Missing student identifier`);
        }
      });

      if (data.length > 1000) {
        warnings.push("Large file detected. Processing may take a few moments.");
      }

      // Create preview with original values for display
      const previewData = data.slice(0, 5).map(row => ({
        ...row,
        // Keep original admission number display
        display_admission: row.admission_number || row.student_id || '-'
      }));

      setUploadedFile({
        file,
        preview: previewData,
        isValid: errors.length === 0,
        errors,
        warnings
      });

      setActiveTab('preview');
      setError(null);
      
    } catch (err) {
      console.error("Error parsing file:", err);
      setError("Failed to parse file. Please check the format.");
    }
  };

  reader.readAsText(file);
};

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setActiveTab('upload');
  };

  // ============================================
  // SUBMIT HANDLER
  // ============================================

  const handleSubmitAssignment = async () => {
    if (!uploadedFile || !uploadedFile.isValid) return;

    try {
      setSubmitting(true);
      setError(null);
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await teacherAPI.bulkAssignSubjects({
        classId: selectedClass,
        subjectId: selectedSubject,
        termId: selectedTerm,
        academicYearId: selectedAcademicYear,
        streamId: selectedStream || undefined,
        overwriteExisting: 'true',
        file: uploadedFile.file
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data) {
        setUploadResult(response.data);
        setSuccessMessage(
          `✅ Successfully processed ${response.data.summary.successful} students. ` +
          `Skipped: ${response.data.summary.skipped}, Failed: ${response.data.summary.failed}`
        );
        
        // Refresh student list and history
        fetchStudentsForAssignment();
        fetchBatchHistory();
        
        // Switch to history tab after successful upload
        setTimeout(() => {
          setActiveTab('history');
          setUploadProgress(0);
        }, 2000);
      } else {
        setError(response.error || "Upload failed");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = async (format: 'csv' | 'excel') => {
    try {
      const blob = await teacherAPI.downloadTemplate({ format });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subject_assignment_template.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccessMessage(`Template downloaded successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error downloading template:", err);
      setError("Failed to download template");
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Assigned</span>;
      case 'unassigned':
        return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Unassigned</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>;
      case 'dropped':
        return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">Dropped</span>;
      default:
        return null;
    }
  };

  const getBatchStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Completed</span>;
      case 'processing':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Processing</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">Failed</span>;
      case 'partial':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Partial</span>;
      default:
        return null;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return 'bg-rose-500';
    if (percentage < 60) return 'bg-amber-500';
    if (percentage < 80) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading && !assignedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-indigo-600 opacity-50" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-6">Loading Your Dashboard</h2>
          <p className="text-slate-500 mt-2">Preparing your classes and subjects...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => navigate("/teacher")}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors mb-2 group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <Users className="text-indigo-600" size={24} />
                </div>
                Student Subject Assignment
              </h1>
              <p className="text-slate-500 mt-1">
                {assignedData?.assignments.length} classes • {assignedData?.activeTerms?.length} active terms
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 px-4 py-2 rounded-xl">
                <p className="text-xs text-slate-600">Total Students</p>
                <p className="text-xl font-bold text-slate-800">{students.length}</p>
              </div>
              <div className="bg-emerald-100 px-4 py-2 rounded-xl">
                <p className="text-xs text-emerald-600">Assigned</p>
                <p className="text-xl font-bold text-emerald-700">
                  {students.filter(s => s.isAssigned).length}
                </p>
              </div>
              <div className="bg-amber-100 px-4 py-2 rounded-xl">
                <p className="text-xs text-amber-600">Pending</p>
                <p className="text-xl font-bold text-amber-700">
                  {students.filter(s => !s.isAssigned).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between animate-slideDown">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <span className="text-rose-700 font-medium block">{error}</span>
                <span className="text-rose-600 text-sm">Please check your selections and try again</span>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-rose-100 rounded transition-colors"
            >
              <X size={16} className="text-rose-500" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between animate-slideDown">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
              <span className="text-emerald-700 font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="p-1 hover:bg-emerald-100 rounded transition-colors"
            >
              <X size={16} className="text-emerald-500" />
            </button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Selection Panel */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-800">Selection Criteria</h2>
                </div>
                <button
                  onClick={fetchTeacherAssignedData}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Academic Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <Calendar size={12} /> Academic Year
                  </label>
                  <select
                    value={selectedAcademicYear}
                    onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">Select Year...</option>
                    {assignedData?.currentAcademicYear && (
                      <option value={assignedData.currentAcademicYear.id}>
                        {assignedData.currentAcademicYear.year_name} (Current)
                      </option>
                    )}
                  </select>
                </div>

                {/* Class Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <BookOpen size={12} /> Class
                  </label>
                 <select
  value={selectedClass}
  onChange={(e) => {
    setSelectedClass(e.target.value);
    setSelectedStream("");
  }}
  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
  disabled={!assignedData?.assignments.length}
>
  <option value="">Select Class...</option>
  {assignedData?.assignments.map((cls) => (
    <option key={cls.id} value={cls.id}> {/* Changed from cls.classId to cls.id */}
      {cls.className} {cls.classCode ? `(${cls.classCode})` : ''}
    </option>
  ))}
</select>
                </div>

                {/* Stream Selection */}
                {selectedClass && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                      <Hash size={12} /> Stream (Optional)
                    </label>
                  <select
  value={selectedStream}
  onChange={(e) => setSelectedStream(e.target.value)}
  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
>
  <option value="">All Streams</option>
  {assignedData?.assignments
    .find(c => c.id === selectedClass) // Changed from cls.classId to cls.id
    ?.streams.map((stream) => (
      <option key={stream.id} value={stream.id}>
        {stream.name}
      </option>
    ))}
</select>
                  </div>
                )}

                {/* Subject Selection */}
                {selectedClass && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                      <Layers size={12} /> Subject
                    </label>
                   <select
  value={selectedSubject}
  onChange={(e) => setSelectedSubject(e.target.value)}
  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
>
  <option value="">Select Subject...</option>
  {assignedData?.assignments
    .find(c => c.id === selectedClass) // Changed from cls.classId to cls.id
    ?.subjects.map((subject) => (
      <option key={subject.id} value={subject.id}>
        {subject.name} ({subject.subject_code})
        {subject.is_compulsory && " ★"}
      </option>
    ))}
</select>
                  </div>
                )}

                {/* Term Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <Calendar size={12} /> Term
                  </label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">Select Term...</option>
                    {assignedData?.activeTerms?.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.term_name} {term.is_active && "(Active)"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selection Summary */}
                {(selectedClass || selectedSubject || selectedTerm) && (
                  <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <h3 className="text-xs font-semibold text-indigo-800 mb-3 flex items-center gap-1">
                      <Info size={12} /> Current Selection
                    </h3>
                    <div className="space-y-2 text-sm">
                      {selectedClass && (
                        <div className="flex items-center gap-2">
                          <BookOpen size={12} className="text-indigo-600" />
                          <span className="text-slate-700">
                            Class: <span className="font-medium">
                              {assignedData?.assignments.find(c => c.classId === selectedClass)?.className}
                            </span>
                          </span>
                        </div>
                      )}
                      {selectedStream && (
                        <div className="flex items-center gap-2">
                          <Hash size={12} className="text-indigo-600" />
                          <span className="text-slate-700">
                            Stream: <span className="font-medium">
                              {assignedData?.assignments
                                .find(c => c.classId === selectedClass)
                                ?.streams.find(s => s.id === selectedStream)?.name}
                            </span>
                          </span>
                        </div>
                      )}
                      {selectedSubject && (
                        <div className="flex items-center gap-2">
                          <Layers size={12} className="text-indigo-600" />
                          <span className="text-slate-700">
                            Subject: <span className="font-medium">
                              {assignedData?.assignments
                                .find(c => c.classId === selectedClass)
                                ?.subjects.find(s => s.id === selectedSubject)?.name}
                            </span>
                          </span>
                        </div>
                      )}
                      {selectedTerm && (
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-indigo-600" />
                          <span className="text-slate-700">
                            Term: <span className="font-medium">
                              {assignedData?.activeTerms?.find(t => t.id === selectedTerm)?.term_name}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Template Download Card */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-6 bg-white">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileDown size={16} className="text-indigo-500" />
                Download Templates
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDownloadTemplate('csv')}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                >
                  <FileText className="mx-auto text-slate-400 group-hover:text-indigo-500 mb-2" size={24} />
                  <p className="text-xs font-medium text-slate-600 group-hover:text-indigo-700">CSV Template</p>
                </button>
                <button
                  onClick={() => handleDownloadTemplate('excel')}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
                >
                  <FileSpreadsheet className="mx-auto text-slate-400 group-hover:text-emerald-500 mb-2" size={24} />
                  <p className="text-xs font-medium text-slate-600 group-hover:text-emerald-700">Excel Template</p>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">
                Templates include required columns and examples
              </p>
            </Card>

            {/* Recent Batches */}
            {recentBatches.length > 0 && (
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-6 bg-white">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-indigo-500" />
                  Recent Uploads
                </h3>
                <div className="space-y-3">
                  {recentBatches.map((batch) => (
                    <div key={batch.id} className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-700">
                          {batch.metadata.filename || 'Bulk Upload'}
                        </p>
                        {getBatchStatusBadge(batch.status)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{batch.total_records} records</span>
                        <span>{new Date(batch.created_at).toLocaleDateString()}</span>
                      </div>
                      {batch.metadata.results && (
                        <div className="mt-2 flex gap-2 text-xs">
                          <span className="text-emerald-600">✓ {batch.metadata.results.successful}</span>
                          <span className="text-amber-600">⤴ {batch.metadata.results.skipped}</span>
                          <span className="text-rose-600">✗ {batch.metadata.results.failed}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-1 flex">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileUp size={16} />
                Upload File
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                disabled={!uploadedFile}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : uploadedFile
                    ? 'text-slate-600 hover:bg-slate-50'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <Eye size={16} />
                Preview
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock size={16} />
                History
              </button>
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-12 border-3 border-dashed transition-all ${
                    isDragging
                      ? 'border-indigo-400 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="text-indigo-500" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                      Upload Student List
                    </h3>
                    <p className="text-slate-500 mb-4">
                      Drag and drop your CSV or Excel file here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shadow-lg shadow-indigo-200"
                    >
                      <FileUp size={16} />
                      Choose File
                    </label>
                    <p className="text-xs text-slate-400 mt-4">
                      Supported formats: CSV, Excel (.xlsx, .xls) • Max size: 10MB
                    </p>
                  </div>
                </div>

                {/* Student List Preview (if loaded) */}
                {filteredStudents.length > 0 && (
                  <div className="p-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Users size={16} className="text-indigo-500" />
                        Current Students ({filteredStudents.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Grid3X3 size={16} />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <List size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search by name or admission number..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Unassigned</option>
                        <option value="pending">Pending</option>
                        <option value="dropped">Dropped</option>
                      </select>
                    </div>

                    {/* Student Grid/List */}
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-slate-800">{student.fullName}</p>
                                <p className="text-xs text-slate-500 font-mono mt-1">{student.admission_number}</p>
                              </div>
                              {getStatusBadge(student.assignmentStatus)}
                            </div>
                            {student.stream && (
                              <p className="text-xs text-slate-500">
                                Stream: {student.stream.name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Adm No</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Student Name</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Stream</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student) => (
                              <tr key={student.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 text-sm font-mono text-slate-700">
                                  {student.admission_number}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-medium text-slate-900">{student.fullName}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {student.stream?.name || '-'}
                                </td>
                                <td className="px-4 py-3">
                                  {getStatusBadge(student.assignmentStatus)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {filteredStudents.length === 0 && searchQuery && (
                      <div className="text-center py-8">
                        <Search className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-500">No students match your search</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

           {/* Preview Tab */}
{activeTab === 'preview' && uploadedFile && (
  <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Eye size={20} className="text-indigo-500" />
          File Preview
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {uploadedFile.file.name} ({(uploadedFile.file.size / 1024).toFixed(2)} KB) • {uploadedFile.preview.length} records shown
        </p>
      </div>
      <button
        onClick={clearUpload}
        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        title="Clear upload"
      >
        <Trash2 size={16} />
      </button>
    </div>

    {/* Validation Messages */}
    {uploadedFile.errors.length > 0 && (
      <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
        <h4 className="text-sm font-semibold text-rose-700 mb-2 flex items-center gap-2">
          <AlertTriangle size={16} />
          Validation Errors
        </h4>
        <ul className="list-disc list-inside text-xs text-rose-600 space-y-1">
          {uploadedFile.errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      </div>
    )}

    {uploadedFile.warnings.length > 0 && (
      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
          <Info size={16} />
          Warnings
        </h4>
        <ul className="list-disc list-inside text-xs text-amber-600 space-y-1">
          {uploadedFile.warnings.map((warn, idx) => (
            <li key={idx}>{warn}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Preview Table */}
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Admission Number</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">First Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Last Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Full Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {uploadedFile.preview.map((row, idx) => {
              // Handle different column name formats
              const admissionNumber = row.admission_number || row.admissionNumber || row.admissionnumber || '-';
              const firstName = row.first_name || row.firstName || row.firstname || '';
              const lastName = row.last_name || row.lastName || row.lastname || '';
              const fullName = row.full_name || row.fullName || row.fullname || row.name || 
                              `${firstName} ${lastName}`.trim() || '-';
              
              return (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-mono text-indigo-600 font-medium">
                    {admissionNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {firstName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {lastName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {fullName}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {uploadedFile.preview.length === 0 && (
        <div className="text-center py-8">
          <FileText className="mx-auto text-slate-300 mb-2" size={32} />
          <p className="text-slate-500">No preview data available</p>
        </div>
      )}
    </div>

    {/* Submit Button */}
    {uploadedFile.isValid && (
      <div className="space-y-4">
        {/* Progress Bar */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Uploading...</span>
              <span className="font-medium text-indigo-600">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(uploadProgress)} transition-all duration-300`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSubmitAssignment}
          disabled={submitting || !uploadedFile.isValid}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing {uploadedFile.preview.length} students...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload and Assign {uploadedFile.preview.length} Student{uploadedFile.preview.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    )}

    {/* Upload Result */}
    {uploadResult && (
      <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500" />
          Upload Complete
        </h4>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{uploadResult.summary.successful}</p>
            <p className="text-xs text-emerald-700 font-medium">Successful</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{uploadResult.summary.skipped}</p>
            <p className="text-xs text-amber-700 font-medium">Skipped</p>
          </div>
          <div className="text-center p-3 bg-rose-50 rounded-lg">
            <p className="text-2xl font-bold text-rose-600">{uploadResult.summary.failed}</p>
            <p className="text-xs text-rose-700 font-medium">Failed</p>
          </div>
        </div>
        
        {/* Detailed Results */}
        {(uploadResult.results.successful.length > 0 || 
          uploadResult.results.skipped.length > 0 || 
          uploadResult.results.failed.length > 0) && (
          <div className="mt-4 text-xs">
            <details className="cursor-pointer">
              <summary className="text-indigo-600 hover:text-indigo-800 font-medium">
                View Details
              </summary>
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {uploadResult.results.successful.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={12} />
                    <span>Student {item.studentId}: {item.status}</span>
                  </div>
                ))}
                {uploadResult.results.skipped.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-amber-600">
                    <AlertCircle size={12} />
                    <span>Student {item.studentId}: {item.reason}</span>
                  </div>
                ))}
                {uploadResult.results.failed.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle size={12} />
                    <span>Student {item.studentId}: {item.reason}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        
        <p className="text-xs text-slate-500 text-center mt-4 pt-4 border-t border-slate-200">
          Processed in {(uploadResult.processingTime / 1000).toFixed(2)}s • 
          Optimal batch size: {uploadResult.optimalBatchSize}
        </p>
      </div>
    )}
  </Card>
)}

            {/* History Tab */}
            {activeTab === 'history' && (
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-indigo-500" />
                  Upload History
                </h3>

                {recentBatches.length > 0 ? (
                  <div className="space-y-4">
                    {recentBatches.map((batch) => (
                      <div
                        key={batch.id}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <FileText size={16} className="text-indigo-500" />
                              <span className="font-medium text-slate-800">
                                {batch.metadata.filename || 'Bulk Upload'}
                              </span>
                              {getBatchStatusBadge(batch.status)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>{batch.total_records} records</span>
                              <span>{new Date(batch.created_at).toLocaleString()}</span>
                              {batch.completed_at && (
                                <span>Completed: {new Date(batch.completed_at).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          {batch.metadata.results && (
                            <div className="flex gap-3">
                              <span className="text-emerald-600 text-sm font-medium">
                                ✓ {batch.metadata.results.successful}
                              </span>
                              <span className="text-amber-600 text-sm font-medium">
                                ⤴ {batch.metadata.results.skipped}
                              </span>
                              <span className="text-rose-600 text-sm font-medium">
                                ✗ {batch.metadata.results.failed}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Progress for processing batches */}
                        {batch.status === 'processing' && batch.total_records > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-600">Progress</span>
                              <span className="font-medium text-indigo-600">
                                {Math.round((batch.processed_records / batch.total_records) * 100)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 transition-all duration-300"
                                style={{
                                  width: `${(batch.processed_records / batch.total_records) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-500">No upload history yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Your uploaded files will appear here
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText size={16} className="text-indigo-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Step 1</h4>
            </div>
            <p className="text-xs text-slate-600">Download template and prepare your student list with admission numbers</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Upload size={16} className="text-indigo-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Step 2</h4>
            </div>
            <p className="text-xs text-slate-600">Upload your file and preview the data to ensure it's correct</p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CheckCircle2 size={16} className="text-indigo-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Step 3</h4>
            </div>
            <p className="text-xs text-slate-600">Submit for processing - JUMA will handle the bulk assignment</p>
          </div>
          
                   <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BarChart3 size={16} className="text-indigo-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Step 4</h4>
            </div>
            <p className="text-xs text-slate-600">Review results in history tab and verify assignments</p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Info size={12} />
          <span>Powered by JUMA - Intelligent bulk assignment processing</span>
        </div>
      </div>
    </div>
  );
};

export default StudentSubjectAssignment;