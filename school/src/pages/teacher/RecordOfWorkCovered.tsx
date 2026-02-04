import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../../components/common/Card";
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  TrendingUp,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Filter,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  ArrowLeft,
  BookCheck,
  CalendarDays,
  Users,
  GraduationCap,
  Hash,
  ArrowRight,
  FileCheck,
  ClipboardCheck,
  AlertTriangle,
  ThumbsUp,
  TrendingDown
} from "lucide-react";
import { teacherAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ---------------- TYPES ---------------- */
interface Subject {
  id: string;
  name: string;
  subject_code: string;
}

interface Class {
  id: string;
  class_name: string;
  class_level: number;
  name?: string;
}

interface Stream {
  id: string;
  name: string;
  class_id: string;
}

interface Term {
  id: string;
  term_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
}

interface SchemeOfWork {
  id: string;
  title: string;
  subject: Subject;
  class: Class;
  stream?: Stream;
  status: 'approved';
  topics_count: number;
}

interface SchemeTopic {
  id: string;
  topic_title: string;
  week_number: number;
  cbc_strand?: string;
  cbc_sub_strand?: string;
  learning_objectives: string[];
}

interface RecordOfWork {
  id: string;
  week_number: number;
  lesson_date: string;
  topics_covered: string[];
  activities_done: string[];
  challenges: string;
  remarks: string;
  status: 'recorded' | 'submitted' | 'verified';
  scheme_of_work: SchemeOfWork;
  scheme_topic?: SchemeTopic;
  coverage_percentage: number;
  attachments: string[];
  verified_at: string | null;
  verified_by: {
    id: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface CreateRecordData {
  scheme_of_work_id: string;
  week_number: number;
  lesson_date: string;
  topics_covered: string[];
  activities_done: string[];
  challenges: string;
  remarks: string;
  scheme_topic_id?: string;
}

interface CoverageReport {
  total_topics: number;
  covered_topics: number;
  coverage_percentage: number;
  weekly_progress: Array<{
    week: number;
    topics_covered: number;
    coverage_percentage: number;
    status: 'on_track' | 'behind' | 'ahead';
  }>;
  subject_coverage: Array<{
    subject: string;
    coverage: number;
    target: number;
    status: 'on_track' | 'behind' | 'ahead';
  }>;
}

interface ApiError {
  message: string;
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
}

/* ---------------- API FUNCTIONS ---------------- */
const recordAPI = {
  // Get records
  getRecords: async (params?: any) => {
    try {
      const response = await teacherAPI.getMyRecordsOfWork(params);
      return response.data || { data: { records: [], statistics: {}, coverage: {} } };
    } catch (error) {
      console.error("Error fetching records:", error);
      throw error;
    }
  },

  // Get record details
  getRecordDetails: async (recordId: string) => {
    try {
      const response = await teacherAPI.getRecordDetails(recordId);
      return response.data;
    } catch (error) {
      console.error("Error fetching record details:", error);
      throw error;
    }
  },

  // Create record
  createRecord: async (data: CreateRecordData) => {
    try {
      const response = await teacherAPI.createRecordOfWork(data);
      return response.data;
    } catch (error) {
      console.error("Error creating record:", error);
      throw error;
    }
  },

  // Update record
  updateRecord: async (recordId: string, data: any) => {
    try {
      const response = await teacherAPI.updateRecordOfWork(recordId, data);
      return response.data;
    } catch (error) {
      console.error("Error updating record:", error);
      throw error;
    }
  },

  // Delete record
  deleteRecord: async (recordId: string) => {
    try {
      const response = await teacherAPI.deleteRecordOfWork(recordId);
      return response.data;
    } catch (error) {
      console.error("Error deleting record:", error);
      throw error;
    }
  },

  // Submit record (for verification)
  submitRecord: async (recordId: string) => {
    try {
      const response = await teacherAPI.submitRecordOfWork(recordId);
      return response.data;
    } catch (error) {
      console.error("Error submitting record:", error);
      throw error;
    }
  },

  // Get coverage report
  getCoverageReport: async (params?: any) => {
    try {
      const response = await teacherAPI.getCoverageReport(params);
      return response.data || { data: { coverage: {}, weekly_progress: [] } };
    } catch (error) {
      console.error("Error fetching coverage report:", error);
      throw error;
    }
  },

  // Export records
  exportRecords: async (params: any) => {
    try {
      const response = await teacherAPI.exportRecordsOfWork(params);
      return response.data;
    } catch (error) {
      console.error("Error exporting records:", error);
      throw error;
    }
  }
};

/* ---------------- STATUS CONFIG ---------------- */
const statusConfig = {
  recorded: {
    label: "Recorded",
    color: "bg-blue-100 text-blue-800",
    icon: FileText,
    badgeColor: "bg-blue-500"
  },
  submitted: {
    label: "Submitted",
    color: "bg-amber-100 text-amber-800",
    icon: Clock,
    badgeColor: "bg-amber-500"
  },
  verified: {
    label: "Verified",
    color: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle,
    badgeColor: "bg-emerald-500"
  }
};

/* ---------------- MAIN COMPONENT ---------------- */
const RecordOfWorkCovered: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateRecordData>({
    scheme_of_work_id: "",
    week_number: 1,
    lesson_date: new Date().toISOString().split('T')[0],
    topics_covered: [""],
    activities_done: [""],
    challenges: "",
    remarks: ""
  });

  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [schemes, setSchemes] = useState<SchemeOfWork[]>([]);
  const [schemeTopics, setSchemeTopics] = useState<SchemeTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [weeks, setWeeks] = useState<number[]>(Array.from({length: 14}, (_, i) => i + 1));

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch approved schemes (for creating records)
      const schemesResponse = await teacherAPI.getMySchemes({ status: 'approved' });
      if (schemesResponse.data.success) {
        setSchemes(schemesResponse.data.data.schemes || []);
        
        // Extract unique classes, subjects
        const classSet = new Map<string, Class>();
        const subjectSet = new Map<string, Subject>();
        
        schemesResponse.data.data.schemes.forEach((scheme: any) => {
          if (!classSet.has(scheme.class.id)) {
            classSet.set(scheme.class.id, scheme.class);
          }
          if (!subjectSet.has(scheme.subject.id)) {
            subjectSet.set(scheme.subject.id, scheme.subject);
          }
        });
        
        setClasses(Array.from(classSet.values()));
        setSubjects(Array.from(subjectSet.values()));
      }

      // Fetch terms
      const termsResponse = await teacherAPI.getCbcTerms();
      if (termsResponse.data?.success) {
        setTerms(termsResponse.data.data);
      }

    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch scheme topics when scheme changes
  useEffect(() => {
    if (formData.scheme_of_work_id) {
      fetchSchemeTopics(formData.scheme_of_work_id);
    } else {
      setSchemeTopics([]);
    }
  }, [formData.scheme_of_work_id]);

  const fetchSchemeTopics = async (schemeId: string) => {
    try {
      const response = await teacherAPI.getSchemeTopics(schemeId);
      if (response.data.success) {
        setSchemeTopics(response.data.data.topics || []);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  // Fetch records with React Query
  const { 
    data: recordsData, 
    isLoading: isLoadingRecords, 
    error: recordsError,
    refetch: refetchRecords 
  } = useQuery({
    queryKey: ['records', selectedStatus, selectedSubject, selectedClass, selectedTerm, selectedWeek, searchQuery],
    queryFn: () => recordAPI.getRecords({
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      subjectId: selectedSubject || undefined,
      classId: selectedClass || undefined,
      termId: selectedTerm || undefined,
      week: selectedWeek || undefined,
      search: searchQuery || undefined
    }),
    retry: 1,
    enabled: !loading
  });

  // Fetch coverage report
  const { 
    data: coverageData, 
    isLoading: isLoadingCoverage 
  } = useQuery({
    queryKey: ['coverage', selectedTerm],
    queryFn: () => recordAPI.getCoverageReport({
      termId: selectedTerm || undefined
    }),
    retry: 1,
    enabled: !loading
  });

  // Mutations
  const createRecordMutation = useMutation({
    mutationFn: recordAPI.createRecord,
    onSuccess: () => {
      toast.success("Record of Work created successfully!");
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['coverage'] });
      resetForm();
      setIsCreating(false);
    },
    onError: (error: ApiError) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to create record";
      toast.error(errorMessage);
    }
  });

  const submitRecordMutation = useMutation({
    mutationFn: recordAPI.submitRecord,
    onSuccess: () => {
      toast.success("Record submitted for verification!");
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
    onError: (error: ApiError) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to submit record";
      toast.error(errorMessage);
    }
  });

  const deleteRecordMutation = useMutation({
    mutationFn: recordAPI.deleteRecord,
    onSuccess: () => {
      toast.success("Record deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['coverage'] });
    },
    onError: (error: ApiError) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to delete record";
      toast.error(errorMessage);
    }
  });

  // Data extraction
  const records = recordsData?.data?.records || [];
  const statistics = recordsData?.data?.statistics || {};
  const coverage = coverageData?.data?.coverage || {};
  const weeklyProgress = coverageData?.data?.weekly_progress || [];
  const subjectCoverage = coverageData?.data?.subject_coverage || [];

  // Handlers
  const handleFormChange = (field: keyof CreateRecordData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTopic = () => {
    setFormData(prev => ({
      ...prev,
      topics_covered: [...prev.topics_covered, ""]
    }));
  };

  const handleUpdateTopic = (index: number, value: string) => {
    const newTopics = [...formData.topics_covered];
    newTopics[index] = value;
    setFormData(prev => ({
      ...prev,
      topics_covered: newTopics
    }));
  };

  const handleRemoveTopic = (index: number) => {
    const newTopics = formData.topics_covered.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      topics_covered: newTopics
    }));
  };

  const handleAddActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities_done: [...prev.activities_done, ""]
    }));
  };

  const handleUpdateActivity = (index: number, value: string) => {
    const newActivities = [...formData.activities_done];
    newActivities[index] = value;
    setFormData(prev => ({
      ...prev,
      activities_done: newActivities
    }));
  };

  const handleRemoveActivity = (index: number) => {
    const newActivities = formData.activities_done.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      activities_done: newActivities
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.scheme_of_work_id || !formData.week_number || !formData.lesson_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.topics_covered.length === 0 || formData.topics_covered[0] === "") {
      toast.error("Please add at least one topic covered");
      return;
    }

    if (formData.activities_done.length === 0 || formData.activities_done[0] === "") {
      toast.error("Please add at least one activity");
      return;
    }

    createRecordMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      scheme_of_work_id: "",
      week_number: 1,
      lesson_date: new Date().toISOString().split('T')[0],
      topics_covered: [""],
      activities_done: [""],
      challenges: "",
      remarks: ""
    });
  };

  const handleSubmitForVerification = (recordId: string) => {
    if (window.confirm("Submit this record for HOD/Principal verification?")) {
      submitRecordMutation.mutate(recordId);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      deleteRecordMutation.mutate(recordId);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const params = {
        format,
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        subjectId: selectedSubject || undefined,
        classId: selectedClass || undefined,
        termId: selectedTerm || undefined,
        week: selectedWeek || undefined
      };

      const blob = await recordAPI.exportRecords(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `records-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Records exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to export records";
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getCoverageStatusColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-100 text-emerald-800";
    if (percentage >= 60) return "bg-amber-100 text-amber-800";
    return "bg-rose-100 text-rose-800";
  };

  const getCoverageStatusIcon = (percentage: number) => {
    if (percentage >= 80) return <ThumbsUp size={12} />;
    if (percentage >= 60) return <AlertTriangle size={12} />;
    return <TrendingDown size={12} />;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">Loading records...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle size={48} className="text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Data</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchInitialData();
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => navigate("/teacher")}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
          </div>
          
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Records of Work</h1>
          <p className="text-slate-500 font-medium italic">Documenting the reality of classroom teaching.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <Search size={18} className="text-slate-400 ml-2" />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="bg-transparent outline-none text-sm font-bold p-2 w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <Filter size={16} className="text-slate-600" />
            <span className="text-sm font-bold text-slate-700">Filter</span>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {/* Create New Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm font-bold">New Record</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-none shadow-sm rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="recorded">Recorded</option>
                <option value="submitted">Submitted</option>
                <option value="verified">Verified</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Subject
              </label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map((subject: Subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Class
              </label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((cls: Class) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Term
              </label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
              >
                <option value="">All Terms</option>
                {terms.map((term: Term) => (
                  <option key={term.id} value={term.id}>
                    {term.term_name} {term.is_current && "(Current)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Week
              </label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                <option value="">All Weeks</option>
                {weeks.map((week) => (
                  <option key={week} value={week}>
                    Week {week}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="Total Records" 
                value={statistics.total || 0} 
                color="text-slate-700"
              />
              <StatCard 
                label="Recorded" 
                value={statistics.recorded || 0} 
                color="text-blue-600"
              />
              <StatCard 
                label="Submitted" 
                value={statistics.submitted || 0} 
                color="text-amber-600"
              />
              <StatCard 
                label="Verified" 
                value={statistics.verified || 0} 
                color="text-emerald-600"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Coverage Report */}
      {!isLoadingCoverage && coverage && (
        <Card className="border-none shadow-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={20} />
              Curriculum Coverage Report
            </h2>
            <div className="text-sm text-slate-600">
              Term: {selectedTerm ? terms.find(t => t.id === selectedTerm)?.term_name || 'All' : 'All Terms'}
            </div>
          </div>
          
          {/* Overall Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Overall Coverage</h3>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${getCoverageStatusColor(coverage.coverage_percentage || 0)}`}>
                  {getCoverageStatusIcon(coverage.coverage_percentage || 0)}
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800">
                {coverage.coverage_percentage || 0}%
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {coverage.covered_topics || 0} of {coverage.total_topics || 0} topics covered
              </p>
              <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${coverage.coverage_percentage || 0}%` }}
                />
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="p-6 bg-white rounded-2xl border border-slate-100 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Weekly Progress</h3>
              <div className="space-y-3">
                {weeklyProgress.slice(0, 4).map((week: any) => (
                  <div key={week.week} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-700">W{week.week}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {week.topics_covered} topics covered
                        </p>
                        <p className="text-xs text-slate-500">
                          {week.coverage_percentage}% of weekly target
                        </p>
                      </div>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                      week.status === 'on_track' ? 'bg-emerald-100 text-emerald-800' :
                      week.status === 'ahead' ? 'bg-blue-100 text-blue-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {week.status === 'on_track' ? 'On Track' :
                       week.status === 'ahead' ? 'Ahead' : 'Behind'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subject-wise Coverage */}
          {subjectCoverage.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Subject Coverage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectCoverage.slice(0, 4).map((subject: any) => (
                  <div key={subject.subject} className="p-4 bg-white rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-800">{subject.subject}</h4>
                      <div className={`text-xs font-bold px-2 py-1 rounded-full ${getCoverageStatusColor(subject.coverage)}`}>
                        {subject.coverage}%
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Target: {subject.target}%</span>
                      <span className={`font-medium ${
                        subject.status === 'on_track' ? 'text-emerald-600' :
                        subject.status === 'ahead' ? 'text-blue-600' :
                        'text-rose-600'
                      }`}>
                        {subject.status === 'on_track' ? 'On Track' :
                         subject.status === 'ahead' ? 'Ahead' : 'Behind'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Create New Record Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="border-none shadow-xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Record This Week's Work</h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Scheme Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Scheme of Work *
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                    value={formData.scheme_of_work_id}
                    onChange={(e) => handleFormChange('scheme_of_work_id', e.target.value)}
                    required
                  >
                    <option value="">Select a scheme...</option>
                    {schemes.map((scheme: SchemeOfWork) => (
                      <option key={scheme.id} value={scheme.id}>
                        {scheme.subject.name} - {scheme.class.class_name} {scheme.stream ? `(${scheme.stream.name})` : ''} - {scheme.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Week and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Week Number *
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={formData.week_number}
                      onChange={(e) => handleFormChange('week_number', parseInt(e.target.value))}
                      required
                    >
                      {weeks.map((week) => (
                        <option key={week} value={week}>
                          Week {week}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Lesson Date *
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={formData.lesson_date}
                      onChange={(e) => handleFormChange('lesson_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Topics Covered */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Topics Covered *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      + Add Topic
                    </button>
                  </div>
                  {formData.topics_covered.map((topic, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={`Topic ${index + 1}...`}
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                        value={topic}
                        onChange={(e) => handleUpdateTopic(index, e.target.value)}
                        required
                      />
                      {formData.topics_covered.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(index)}
                          className="px-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Activities Done */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Activities Done *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddActivity}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      + Add Activity
                    </button>
                  </div>
                  {formData.activities_done.map((activity, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <textarea
                        placeholder={`Activity ${index + 1}...`}
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[60px]"
                        value={activity}
                        onChange={(e) => handleUpdateActivity(index, e.target.value)}
                        required
                      />
                      {formData.activities_done.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveActivity(index)}
                          className="px-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors self-start mt-3"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Challenges */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Challenges Encountered
                  </label>
                  <textarea
                    placeholder="Describe any challenges or difficulties..."
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px]"
                    value={formData.challenges}
                    onChange={(e) => handleFormChange('challenges', e.target.value)}
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Remarks / Observations
                  </label>
                  <textarea
                    placeholder="Additional observations, student performance, etc..."
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none min-h-[80px]"
                    value={formData.remarks}
                    onChange={(e) => handleFormChange('remarks', e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    disabled={createRecordMutation.isPending}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {createRecordMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Record <FileCheck size={16} />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      resetForm();
                    }}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Records List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookCheck className="text-indigo-600" size={20} /> 
            Weekly Records
            {isLoadingRecords && (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            )}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Download size={14} /> Export PDF
            </button>
            <button 
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Download size={14} /> Export Excel
            </button>
          </div>
        </div>

        {isLoadingRecords ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium">Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <Card className="border-none shadow-lg rounded-2xl p-12 text-center">
            <BookCheck size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No records found</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || selectedStatus !== 'all' || selectedSubject || selectedClass || selectedTerm || selectedWeek
                ? "Try adjusting your filters"
                : "Record your first week of teaching to get started"}
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Record This Week's Work
            </button>
          </Card>
        ) : (
          <div className="space-y-4">
            {records.map((record: RecordOfWork) => {
              const statusInfo = statusConfig[record.status];
              const StatusIcon = statusInfo?.icon || FileText;
              
              return (
                <Card 
                  key={record.id} 
                  className="border-none shadow-lg shadow-slate-200/40 rounded-2xl p-0 bg-white hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusInfo?.color}`}>
                            <span className="flex items-center gap-1">
                              <StatusIcon size={12} />
                              {statusInfo?.label}
                            </span>
                          </span>
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                            Week {record.week_number}
                          </span>
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            {record.coverage_percentage}% Coverage
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">
                            {record.scheme_of_work.subject.name} - {record.scheme_of_work.class.class_name}
                            {record.scheme_of_work.stream && ` (${record.scheme_of_work.stream.name})`}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {formatDate(record.lesson_date)} • {record.topics_covered.length} topics covered
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="relative">
                        <button 
                          className="text-slate-300 hover:text-slate-600 p-1"
                          onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        
                        {expandedRecordId === record.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-10">
                            <button 
                              onClick={() => {
                                setExpandedRecordId(null);
                                // View details
                              }}
                              className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 first:rounded-t-2xl"
                            >
                              <Eye size={14} /> View Details
                            </button>
                            
                            {record.status === 'recorded' && (
                              <button 
                                onClick={() => {
                                  handleSubmitForVerification(record.id);
                                  setExpandedRecordId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                              >
                                <CheckCircle size={14} /> Submit for Verification
                              </button>
                            )}
                            
                            <div className="border-t border-slate-100">
                              <button 
                                onClick={() => {
                                  setExpandedRecordId(null);
                                  // Duplicate record
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Copy size={14} /> Duplicate
                              </button>
                              <button 
                                onClick={() => {
                                  setExpandedRecordId(null);
                                  // Edit record
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit size={14} /> Edit
                              </button>
                            </div>
                            
                            {record.status === 'recorded' && (
                              <button 
                                onClick={() => {
                                  handleDeleteRecord(record.id);
                                  setExpandedRecordId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2 last:rounded-b-2xl border-t border-slate-100"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Topics Covered */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                        <Target size={14} /> Topics Covered
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {record.topics_covered.slice(0, 3).map((topic, idx) => (
                          <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                            {topic}
                          </span>
                        ))}
                        {record.topics_covered.length > 3 && (
                          <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-medium rounded-lg">
                            +{record.topics_covered.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Challenges and Remarks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {record.challenges && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                            <AlertCircle size={14} /> Challenges
                          </h4>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {record.challenges}
                          </p>
                        </div>
                      )}
                      {record.remarks && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                            <ClipboardCheck size={14} /> Remarks
                          </h4>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {record.remarks}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        <span>Created {formatDate(record.created_at)}</span>
                        {record.verified_at && (
                          <span className="ml-3">Verified {formatDate(record.verified_at)}</span>
                        )}
                      </div>
                      <button 
                        className="text-indigo-600 hover:text-indigo-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1"
                      >
                        View Full Details <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- SUB-COMPONENTS ---------------- */
const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="p-4 bg-white rounded-xl border border-slate-100">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
  </div>
);

export default RecordOfWorkCovered;