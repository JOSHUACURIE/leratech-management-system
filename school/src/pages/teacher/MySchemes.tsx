import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../../components/common/Card";
import { 
  BookOpen, 
  Plus, 
  Target, 
  Calendar, 
  GraduationCap, 
  ArrowRight,
  Search,
  MoreHorizontal,
  FileText,
  Loader2,
  Filter,
  Download,
  Copy,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowLeft,
  Users,
  Hash,
  RefreshCw,
  Send,
  AlertTriangle,
  BookCheck,
  FileCheck,
  History,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck
} from "lucide-react";
import { teacherAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ---------------- TYPES ---------------- */
interface Subject {
  id: string;
  name: string;
  subject_code: string;
  category?: string;
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
  class?: Class;
}

interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
  start_date?: string;
  end_date?: string;
}

interface Term {
  id: string;
  term_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
  academic_year?: AcademicYear;
}

interface Assignment {
  id: string;
  stream: Stream;
  subjects: Subject[];
  is_active: boolean;
  assigned_at: string;
}

interface YearAssignment {
  academic_year: AcademicYear;
  terms: {
    term: Term;
    assignments: Assignment[];
  }[];
}

interface SchemeOfWork {
  id: string;
  title: string;
  subject: Subject;
  class: Class;
  stream?: Stream;
  academic_year: AcademicYear;
  term: Term;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'in_revision';
  topics_count: number;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: {
    id: string;
    name: string;
  } | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  metadata: {
    coverage_percentage: number;
    has_been_used: boolean;
    total_weeks: number;
  };
}

interface CreateSchemeData {
  title: string;
  subject_id: string;
  class_id: string;
  stream_id?: string;
  term_id: string;
  academic_year_id: string;
  description?: string;
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
const schemeAPI = {
  // Get schemes
  getSchemes: async (params?: any) => {
    try {
      const response = await teacherAPI.getMySchemes(params);
      return response.data || { data: { schemes: [], statistics: {} } };
    } catch (error) {
      console.error("Error fetching schemes:", error);
      throw error;
    }
  },

  // Get scheme details
  getSchemeDetails: async (schemeId: string) => {
    try {
      const response = await teacherAPI.getSchemeDetails(schemeId);
      return response.data;
    } catch (error) {
      console.error("Error fetching scheme details:", error);
      throw error;
    }
  },

  // Create scheme
  createScheme: async (data: CreateSchemeData) => {
    try {
      const response = await teacherAPI.createSchemeOfWork(data);
      return response.data;
    } catch (error) {
      console.error("Error creating scheme:", error);
      throw error;
    }
  },

  // Update scheme
  updateScheme: async (schemeId: string, data: any) => {
    try {
      const response = await teacherAPI.updateSchemeOfWork(schemeId, data);
      return response.data;
    } catch (error) {
      console.error("Error updating scheme:", error);
      throw error;
    }
  },

  // Delete scheme
  deleteScheme: async (schemeId: string) => {
    try {
      const response = await teacherAPI.deleteSchemeOfWork(schemeId);
      return response.data;
    } catch (error) {
      console.error("Error deleting scheme:", error);
      throw error;
    }
  },

  // Submit for approval
  submitForApproval: async (schemeId: string) => {
    try {
      const response = await teacherAPI.submitSchemeForApproval(schemeId);
      return response.data;
    } catch (error) {
      console.error("Error submitting scheme:", error);
      throw error;
    }
  },

  // Get topics
  getSchemeTopics: async (schemeId: string, params?: any) => {
    try {
      const response = await teacherAPI.getSchemeTopics(schemeId, params);
      return response.data || { data: { topics: [] } };
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw error;
    }
  },

  // Create topic
  createTopic: async (schemeId: string, data: any) => {
    try {
      const response = await teacherAPI.createSchemeTopic(schemeId, data);
      return response.data;
    } catch (error) {
      console.error("Error creating topic:", error);
      throw error;
    }
  },

  // Update topic
  updateTopic: async (topicId: string, data: any) => {
    try {
      const response = await teacherAPI.updateSchemeTopic(topicId, data);
      return response.data;
    } catch (error) {
      console.error("Error updating topic:", error);
      throw error;
    }
  },

  // Delete topic
  deleteTopic: async (topicId: string) => {
    try {
      const response = await teacherAPI.deleteSchemeTopic(topicId);
      return response.data;
    } catch (error) {
      console.error("Error deleting topic:", error);
      throw error;
    }
  },

  // Export scheme
  exportScheme: async (schemeId: string, format: 'pdf' | 'docx' | 'excel') => {
    try {
      const response = await teacherAPI.exportScheme(schemeId, format);
      return response.data;
    } catch (error) {
      console.error("Error exporting scheme:", error);
      throw error;
    }
  }
};

/* ---------------- STATUS CONFIG ---------------- */
const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-slate-100 text-slate-800",
    icon: FileText,
    badgeColor: "bg-slate-500",
    canEdit: true,
    canDelete: true,
    canSubmit: true
  },
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800",
    icon: Clock,
    badgeColor: "bg-amber-500",
    canEdit: false,
    canDelete: false,
    canSubmit: false
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-800",
    icon: ShieldCheck,
    badgeColor: "bg-emerald-500",
    canEdit: false,
    canDelete: false,
    canSubmit: false
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-100 text-rose-800",
    icon: ShieldAlert,
    badgeColor: "bg-rose-500",
    canEdit: true,
    canDelete: true,
    canSubmit: true
  },
  in_revision: {
    label: "Needs Revision",
    color: "bg-orange-100 text-orange-800",
    icon: AlertTriangle,
    badgeColor: "bg-orange-500",
    canEdit: true,
    canDelete: false,
    canSubmit: true
  }
};

/* ---------------- MAIN COMPONENT ---------------- */
const MySchemes: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateSchemeData>({
    title: "",
    subject_id: "",
    class_id: "",
    stream_id: "",
    term_id: "",
    academic_year_id: ""
  });

  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  
  // Separate subjects state for form and filter
  const [formSubjects, setFormSubjects] = useState<Subject[]>([]);
  const [filterSubjects, setFilterSubjects] = useState<Subject[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [yearAssignments, setYearAssignments] = useState<YearAssignment[]>([]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teacher's assignments
      const assignmentsResponse = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      console.log('Assignments response:', assignmentsResponse.data);

      if (assignmentsResponse.data.success) {
        const assignmentsData = assignmentsResponse.data.data;
        const yearAssignments: YearAssignment[] = assignmentsData.assignments || [];
        
        setYearAssignments(yearAssignments);

        // Extract unique classes, streams, subjects, terms, and academic years
        const classSet = new Map<string, Class>();
        const streamSet = new Map<string, Stream>();
        const subjectSet = new Map<string, Subject>();
        const termSet = new Map<string, Term>();
        const academicYearSet = new Map<string, AcademicYear>();
        
        yearAssignments.forEach((yearData: YearAssignment) => {
          // Add academic year
          if (yearData.academic_year && !academicYearSet.has(yearData.academic_year.id)) {
            academicYearSet.set(yearData.academic_year.id, yearData.academic_year);
          }
          
          yearData.terms.forEach((termData) => {
            // Add term
            if (termData.term && !termSet.has(termData.term.id)) {
              termSet.set(termData.term.id, {
                ...termData.term,
                academic_year: yearData.academic_year
              });
            }
            
            termData.assignments.forEach((assignment: Assignment) => {
              // Add class from stream
              if (assignment.stream?.class && !classSet.has(assignment.stream.class.id)) {
                classSet.set(assignment.stream.class.id, {
                  id: assignment.stream.class.id,
                  class_name: assignment.stream.class.class_name,
                  class_level: assignment.stream.class.class_level || 0,
                  name: assignment.stream.class.class_name
                });
              }
              
              // Add stream
              if (assignment.stream && !streamSet.has(assignment.stream.id)) {
                streamSet.set(assignment.stream.id, {
                  id: assignment.stream.id,
                  name: assignment.stream.name,
                  class_id: assignment.stream.class_id,
                  class: assignment.stream.class
                });
              }
              
              // Add subjects
              if (assignment.subjects && assignment.subjects.length > 0) {
                assignment.subjects.forEach((subject: Subject) => {
                  if (subject && !subjectSet.has(subject.id)) {
                    subjectSet.set(subject.id, {
                      id: subject.id,
                      name: subject.name,
                      subject_code: subject.subject_code || subject.name.substring(0, 3).toUpperCase(),
                      category: subject.category
                    });
                  }
                });
              }
            });
          });
        });

        console.log('Extracted data:', {
          classes: Array.from(classSet.values()),
          streams: Array.from(streamSet.values()),
          subjects: Array.from(subjectSet.values()),
          terms: Array.from(termSet.values()),
          academicYears: Array.from(academicYearSet.values())
        });

        setClasses(Array.from(classSet.values()));
        setAllStreams(Array.from(streamSet.values()));
        setFilterSubjects(Array.from(subjectSet.values()));
        setTerms(Array.from(termSet.values()));
        setAcademicYears(Array.from(academicYearSet.values()));

        // Set current academic year by default if available
        const currentAcademicYear = Array.from(academicYearSet.values()).find(year => year.is_current);
        if (currentAcademicYear && !formData.academic_year_id) {
          setFormData(prev => ({
            ...prev,
            academic_year_id: currentAcademicYear.id
          }));
        }

        // Set current term by default if available
        const currentTerm = Array.from(termSet.values()).find(term => term.is_current);
        if (currentTerm && !formData.term_id) {
          setFormData(prev => ({
            ...prev,
            term_id: currentTerm.id
          }));
        }

      } else {
        throw new Error(assignmentsResponse.data.error || 'Failed to load assignments');
      }

    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError(error.message || 'Failed to load data');
      
      // Set empty arrays on error
      setClasses([]);
      setAllStreams([]);
      setFilterSubjects([]);
      setTerms([]);
      setAcademicYears([]);
    } finally {
      setLoading(false);
    }
  };

  // Computed value for streams based on selected class
  const availableStreams = React.useMemo(() => {
    if (!formData.class_id) {
      return allStreams;
    }
    return allStreams.filter(stream => stream.class_id === formData.class_id);
  }, [formData.class_id, allStreams]);

  // Update stream and subject when class changes
  useEffect(() => {
    if (formData.class_id) {
      const streamsForClass = allStreams.filter(stream => stream.class_id === formData.class_id);
      
      // Clear stream and subject if current stream is not valid for this class
      if (formData.stream_id && !streamsForClass.find(s => s.id === formData.stream_id)) {
        setFormData(prev => ({ ...prev, stream_id: "", subject_id: "" }));
        setFormSubjects([]);
      }
    }
  }, [formData.class_id, allStreams, formData.stream_id]);

  // Fetch subjects when stream changes in FORM
  useEffect(() => {
    if (formData.stream_id) {
      // Find subjects for the selected stream from year assignments
      let streamSubjects: Subject[] = [];
      
      yearAssignments.forEach(yearData => {
        yearData.terms.forEach(termData => {
          termData.assignments.forEach(assignment => {
            if (assignment.stream?.id === formData.stream_id && assignment.subjects) {
              streamSubjects = [...streamSubjects, ...assignment.subjects];
            }
          });
        });
      });

      // Remove duplicates
      const uniqueSubjects = Array.from(
        new Map(streamSubjects.map(subject => [subject.id, subject])).values()
      );

      setFormSubjects(uniqueSubjects);
      
      // Clear subject if current subject is not valid for this stream
      if (formData.subject_id && !uniqueSubjects.find(s => s.id === formData.subject_id)) {
        setFormData(prev => ({ ...prev, subject_id: "" }));
      }
    } else {
      setFormSubjects([]);
      if (formData.subject_id) {
        setFormData(prev => ({ ...prev, subject_id: "" }));
      }
    }
  }, [formData.stream_id, yearAssignments, formData.subject_id]);

  // When term changes, update academic year based on term (only if academic year is not already set)
  useEffect(() => {
    if (formData.term_id && !formData.academic_year_id) {
      const selectedTerm = terms.find(term => term.id === formData.term_id);
      if (selectedTerm?.academic_year?.id) {
        setFormData(prev => ({
          ...prev,
          academic_year_id: selectedTerm.academic_year!.id
        }));
      }
    }
  }, [formData.term_id, terms, formData.academic_year_id]);

  // Computed value for filtered terms
  const filteredTerms = React.useMemo(() => {
    if (!formData.academic_year_id) {
      return terms;
    }
    return terms.filter(term => term.academic_year?.id === formData.academic_year_id);
  }, [formData.academic_year_id, terms]);

  // Clear term if it's not valid for the selected academic year
  useEffect(() => {
    if (formData.academic_year_id && formData.term_id) {
      const isValidTerm = filteredTerms.find(term => term.id === formData.term_id);
      if (!isValidTerm) {
        setFormData(prev => ({ ...prev, term_id: "" }));
      }
    }
  }, [formData.academic_year_id, formData.term_id, filteredTerms]);

  // Fetch schemes with React Query
  const { 
    data: schemesData, 
    isLoading: isLoadingSchemes, 
    error: schemesError,
    refetch: refetchSchemes 
  } = useQuery({
    queryKey: ['schemes', selectedStatus, selectedSubject, selectedClass, selectedTerm, searchQuery],
    queryFn: () => schemeAPI.getSchemes({
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      subjectId: selectedSubject || undefined,
      classId: selectedClass || undefined,
      termId: selectedTerm || undefined,
      search: searchQuery || undefined
    }),
    retry: 1,
    enabled: !loading
  });

  // Mutations
  const createSchemeMutation = useMutation({
    mutationFn: schemeAPI.createScheme,
    onSuccess: (data) => {
      toast.success("Scheme created successfully!");
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
      resetForm();
      setIsCreating(false);
      // Navigate to topics page for the new scheme
      navigate(`/teacher/schemes/${data.data.id}/topics`);
    },
    onError: (error: ApiError) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to create scheme";
      toast.error(errorMessage);
    }
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: schemeAPI.submitForApproval,
    onSuccess: () => {
      toast.success("Scheme submitted for approval!");
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
    },
    onError: (error: ApiError) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to submit scheme";
      toast.error(errorMessage);
    }
  });

  const deleteSchemeMutation = useMutation({
    mutationFn: schemeAPI.deleteScheme,
    onSuccess: () => {
      toast.success("Scheme deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['schemes'] });
    },
    onError: (error: ApiError) => {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to delete scheme";
      toast.error(errorMessage);
    }
  });

  // Data extraction
  const schemes = schemesData?.data?.schemes || [];
  const statistics = schemesData?.data?.statistics || {};

  // Handlers
  const handleFormChange = (field: keyof CreateSchemeData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClassChange = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      class_id: classId,
      stream_id: "",
      subject_id: ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['title', 'subject_id', 'class_id', 'term_id', 'academic_year_id'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof CreateSchemeData]);
    
    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    createSchemeMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subject_id: "",
      class_id: "",
      stream_id: "",
      term_id: "",
      academic_year_id: ""
    });
    setFormSubjects([]);
  };

  const handleSubmitForApproval = (schemeId: string) => {
    if (window.confirm("Are you sure you want to submit this scheme for approval? You won't be able to edit it while it's pending.")) {
      submitForApprovalMutation.mutate(schemeId);
    }
  };

  const handleDeleteScheme = (schemeId: string) => {
    if (window.confirm("Are you sure you want to delete this scheme? This action cannot be undone.")) {
      deleteSchemeMutation.mutate(schemeId);
    }
  };

  const handleExport = async (schemeId: string, format: 'pdf' | 'docx' | 'excel') => {
    try {
      const blob = await schemeAPI.exportScheme(schemeId, format);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `scheme-${schemeId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Scheme exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to export scheme";
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

  // Refresh all data
  const handleRefreshData = async () => {
    await fetchInitialData();
    refetchSchemes();
    toast.success("Data refreshed successfully!");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">Loading schemes...</p>
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
          
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Schemes of Work</h1>
          <p className="text-slate-500 font-medium italic">Strategic planning for academic excellence.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefreshData}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={16} className="text-slate-600" />
          </button>
          
          {/* Search */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <Search size={18} className="text-slate-400 ml-2" />
            <input 
              type="text" 
              placeholder="Search schemes..." 
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
            <span className="text-sm font-bold">New Scheme</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-none shadow-sm rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="in_revision">Needs Revision</option>
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
                {filterSubjects.map((subject: Subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.subject_code})
                  </option>
                ))}
                {filterSubjects.length === 0 && (
                  <option value="" disabled>No subjects available</option>
                )}
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
                    {cls.class_name} (Level {cls.class_level})
                  </option>
                ))}
                {classes.length === 0 && (
                  <option value="" disabled>No classes available</option>
                )}
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
                {terms.length === 0 && (
                  <option value="" disabled>No terms available</option>
                )}
              </select>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard 
                label="Total" 
                value={statistics.total || 0} 
                color="text-slate-700"
              />
              <StatCard 
                label="Draft" 
                value={statistics.draft || 0} 
                color="text-slate-600"
              />
              <StatCard 
                label="Pending" 
                value={statistics.pending || 0} 
                color="text-amber-600"
              />
              <StatCard 
                label="Approved" 
                value={statistics.approved || 0} 
                color="text-emerald-600"
              />
              <StatCard 
                label="Rejected" 
                value={statistics.rejected || 0} 
                color="text-rose-600"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Create New Scheme Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="border-none shadow-xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Create New Scheme of Work</h2>
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
                {/* Scheme Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Scheme Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mathematics Grade 5 Term 1 2024"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    required
                  />
                </div>

                {/* Class and Stream */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Class *
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={formData.class_id}
                      onChange={(e) => handleClassChange(e.target.value)}
                      required
                      disabled={classes.length === 0}
                    >
                      <option value="">
                        {classes.length === 0 ? "No classes available" : "Select Class..."}
                      </option>
                      {classes.map((cls: Class) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.class_name} (Level {cls.class_level})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Stream
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={formData.stream_id}
                      onChange={(e) => handleFormChange('stream_id', e.target.value)}
                      disabled={!formData.class_id || availableStreams.length === 0}
                    >
                      <option value="">Select Stream (Optional)</option>
                      {availableStreams.map((stream: Stream) => (
                        <option key={stream.id} value={stream.id}>
                          {stream.name}
                        </option>
                      ))}
                      {availableStreams.length === 0 && formData.class_id && (
                        <option value="" disabled>No streams available for this class</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Subject *
                  </label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                    value={formData.subject_id}
                    onChange={(e) => handleFormChange('subject_id', e.target.value)}
                    required
                    disabled={formSubjects.length === 0}
                  >
                    <option value="">
                      {!formData.class_id ? "Select class first" :
                       formSubjects.length === 0 ? "No subjects available" : 
                       "Select Subject..."}
                    </option>
                    {formSubjects.map((subject: Subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.subject_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Academic Year and Term */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Academic Year *
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={formData.academic_year_id}
                      onChange={(e) => handleFormChange('academic_year_id', e.target.value)}
                      required
                      disabled={academicYears.length === 0}
                    >
                      <option value="">
                        {academicYears.length === 0 ? "No academic years available" : "Select Academic Year..."}
                      </option>
                      {academicYears.map((year: AcademicYear) => (
                        <option key={year.id} value={year.id}>
                          {year.year_name} {year.is_current && "(Current)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Term *
                    </label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={formData.term_id}
                      onChange={(e) => handleFormChange('term_id', e.target.value)}
                      required
                      disabled={filteredTerms.length === 0}
                    >
                      <option value="">
                        {filteredTerms.length === 0 ? 
                          (formData.academic_year_id ? "No terms available for selected year" : "Select academic year first") 
                          : "Select Term..."}
                      </option>
                      {filteredTerms.map((term: Term) => (
                        <option key={term.id} value={term.id}>
                          {term.term_name} {term.is_current && "(Current)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Brief description of the scheme..."
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none min-h-[80px]"
                    value={formData.description || ''}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    disabled={createSchemeMutation.isPending}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {createSchemeMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Scheme <ArrowRight size={16} />
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

      {/* Schemes List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={20} /> 
            All Schemes of Work
            {isLoadingSchemes && (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            )}
          </h2>
        </div>

        {isLoadingSchemes ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium">Loading schemes...</p>
          </div>
        ) : schemes.length === 0 ? (
          <Card className="border-none shadow-lg rounded-2xl p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No schemes found</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || selectedStatus !== 'all' || selectedSubject || selectedClass || selectedTerm
                ? "Try adjusting your filters or search terms"
                : "Create your first scheme of work to get started"}
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Create First Scheme
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes.map((scheme: SchemeOfWork) => {
              const statusInfo = statusConfig[scheme.status];
              const StatusIcon = statusInfo?.icon || FileText;
              
              return (
                <Card 
                  key={scheme.id} 
                  className="border-none shadow-lg shadow-slate-200/40 rounded-2xl p-0 bg-white group overflow-hidden flex flex-col hover:shadow-xl transition-shadow"
                >
                  <div className="p-6 flex-1 space-y-4">
                    {/* Header with Status */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusInfo?.color}`}>
                            <span className="flex items-center gap-1">
                              <StatusIcon size={12} />
                              {statusInfo?.label}
                            </span>
                          </span>
                          {scheme.metadata?.has_been_used && (
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                              <BookCheck size={12} /> In Use
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight line-clamp-2">
                          {scheme.title}
                        </h3>
                      </div>
                      
                      {/* Actions Menu */}
                      <div className="relative">
                        <button 
                          className="text-slate-300 hover:text-slate-600 p-1"
                          onClick={() => setExpandedSchemeId(expandedSchemeId === scheme.id ? null : scheme.id)}
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        
                        {expandedSchemeId === scheme.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-10">
                            <button 
                              onClick={() => {
                                setExpandedSchemeId(null);
                                navigate(`/teacher/schemes/${scheme.id}/topics`);
                              }}
                              className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 first:rounded-t-2xl"
                            >
                              <Eye size={14} /> Manage Topics
                            </button>
                            
                            {statusInfo?.canEdit && (
                              <button 
                                onClick={() => {
                                  setExpandedSchemeId(null);
                                  navigate(`/teacher/schemes/${scheme.id}/edit`);
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit size={14} /> Edit Scheme
                              </button>
                            )}
                            
                            {statusInfo?.canSubmit && (
                              <button 
                                onClick={() => {
                                  handleSubmitForApproval(scheme.id);
                                  setExpandedSchemeId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                              >
                                <Send size={14} /> Submit for Approval
                              </button>
                            )}
                            
                            <div className="border-t border-slate-100">
                              <button 
                                onClick={() => {
                                  handleExport(scheme.id, 'pdf');
                                  setExpandedSchemeId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Download size={14} /> Export as PDF
                              </button>
                              <button 
                                onClick={() => {
                                  handleExport(scheme.id, 'docx');
                                  setExpandedSchemeId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Download size={14} /> Export as Word
                              </button>
                            </div>
                            
                            {statusInfo?.canDelete && (
                              <button 
                                onClick={() => {
                                  handleDeleteScheme(scheme.id);
                                  setExpandedSchemeId(null);
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

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <GraduationCap size={14} />
                        <span className="font-medium">{scheme.subject.name}</span>
                        <span className="text-slate-400">•</span>
                        <span>{scheme.class.class_name}</span>
                        {scheme.stream && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span>{scheme.stream.name}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} />
                        <span>{scheme.term.term_name}</span>
                        <span className="text-slate-400">•</span>
                        <span>{scheme.academic_year.year_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ClipboardCheck size={14} />
                        <span>{scheme.topics_count} topics</span>
                        <span className="text-slate-400">•</span>
                        <span>{scheme.metadata?.coverage_percentage || 0}% coverage</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Created:</span>
                        <span>{formatDate(scheme.created_at)}</span>
                      </div>
                      {scheme.submitted_at && (
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Submitted:</span>
                          <span>{formatDate(scheme.submitted_at)}</span>
                        </div>
                      )}
                      {scheme.approved_at && (
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Approved:</span>
                          <span>{formatDate(scheme.approved_at)}</span>
                        </div>
                      )}
                      {scheme.rejection_reason && (
                        <div className="mt-2 p-3 bg-rose-50 rounded-xl">
                          <p className="text-xs font-medium text-rose-700">
                            <AlertTriangle size={12} className="inline mr-1" />
                            {scheme.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="border-t border-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => navigate(`/teacher/schemes/${scheme.id}/topics`)}
                        className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1"
                      >
                        Manage Topics
                        <ArrowRight size={14} />
                      </button>
                      {scheme.metadata?.coverage_percentage > 0 && (
                        <div className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                          {scheme.metadata.coverage_percentage}% Complete
                        </div>
                      )}
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

export default MySchemes;