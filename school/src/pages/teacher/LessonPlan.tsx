import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../../components/common/Card";
import { 
  BookOpen, 
  Plus, 
  Target, 
  Lightbulb, 
  Calendar, 
  GraduationCap, 
  ArrowRight,
  Search,
  MoreHorizontal,
  Bookmark,
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
  FileText
} from "lucide-react";
import { teacherAPI } from "../../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

/* ---------------- TYPES ---------------- */
interface Subject {
  id: string;
  name: string;
  subject_code: string;
  color_code?: string;
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
}

interface LessonPlan {
  id: string;
  title: string;
  subject: Subject;
  class: Class;
  stream?: Stream;
  lesson_date: string;
  lesson_time: string | null;
  duration: number;
  lesson_number: number | null;
  learning_objectives: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  scheme_topic: {
    id: string;
    topic_title: string;
    week_number: number;
  } | null;
  created_at: string;
  updated_at: string;
  metadata: {
    has_reflection: boolean;
    has_homework: boolean;
    has_assessment: boolean;
    is_completed: boolean;
  };
}

interface CreateLessonPlanData {
  lesson_title: string;
  subject_id: string;
  class_id: string;
  stream_id?: string;
  lesson_date: string;
  learning_objectives: string[];
  main_activities: string[];
  lesson_time?: string;
  duration_minutes?: number;
  lesson_number?: number;
  scheme_topic_id?: string;
  success_criteria?: string[];
  starter_activity?: string;
  plenary_activity?: string;
  support_for_struggling?: string;
  extension_for_gifted?: string;
  sen_accommodations?: string[];
  resources_needed?: string[];
  technology_used?: string[];
  assessment_strategies?: string[];
  formative_assessment?: string;
  homework_task?: string;
  homework_duration?: number;
  status?: string;
}

interface LessonPlanTemplate {
  id: string;
  name: string;
  subject: Subject | null;
  class: Class | null;
  teacher: {
    id: string;
    teacher_code: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  is_shared: boolean;
  shared_with_department: boolean;
  shared_with_school: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface LessonPlansResponse {
  data: {
    plans: LessonPlan[];
    statistics?: {
      total?: number;
      planned?: number;
      in_progress?: number;
      completed?: number;
      cancelled?: number;
    };
    pagination?: {
      page: number;
      pages: number;
      total: number;
    };
  };
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
const lessonPlanAPI = {
  // Get lesson plans
  getLessonPlans: async (params?: any): Promise<LessonPlansResponse> => {
    try {
      const response = await teacherAPI.getMyLessonPlans(params);
      return response.data || { data: { plans: [], statistics: {}, pagination: { page: 1, pages: 1, total: 0 } } };
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
      throw error;
    }
  },

  // Get lesson plan details
  getLessonPlanDetails: async (planId: string) => {
    try {
      const response = await teacherAPI.getLessonPlanDetails(planId);
      return response.data;
    } catch (error) {
      console.error("Error fetching lesson plan details:", error);
      throw error;
    }
  },

  // Create lesson plan
  createLessonPlan: async (data: CreateLessonPlanData) => {
    try {
      const response = await teacherAPI.createLessonPlan(data);
      return response.data;
    } catch (error) {
      console.error("Error creating lesson plan:", error);
      throw error;
    }
  },

  // Update lesson plan
  updateLessonPlan: async (planId: string, data: any) => {
    try {
      const response = await teacherAPI.updateLessonPlan(planId, data);
      return response.data;
    } catch (error) {
      console.error("Error updating lesson plan:", error);
      throw error;
    }
  },

  // Delete lesson plan
  deleteLessonPlan: async (planId: string, data?: { reason?: string }) => {
    try {
      const response = await teacherAPI.deleteLessonPlan(planId, data);
      return response.data;
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
      throw error;
    }
  },

  // Get templates
  getTemplates: async (params?: any) => {
    try {
      const response = await teacherAPI.getLessonPlanTemplates(params);
      return response.data || { data: { templates: [] } };
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }
  },

  // Create from template
  createFromTemplate: async (templateId: string, data: any) => {
    try {
      const response = await teacherAPI.createFromTemplate(templateId, data);
      return response.data;
    } catch (error) {
      console.error("Error creating from template:", error);
      throw error;
    }
  },

  // Duplicate lesson plan
  duplicateLessonPlan: async (planId: string, data?: any) => {
    try {
      const response = await teacherAPI.duplicateLessonPlan(planId, data);
      return response.data;
    } catch (error) {
      console.error("Error duplicating lesson plan:", error);
      throw error;
    }
  },

  // Export lesson plans
  exportLessonPlans: async (params: any): Promise<Blob> => {
    try {
      const response = await teacherAPI.exportLessonPlans(params);
      
      // Ensure response is a Blob
      if (response instanceof Blob) {
        return response;
      } else if (response.data instanceof Blob) {
        return response.data;
      } else {
        // Create a fallback Blob
        return new Blob([JSON.stringify({ message: "Export data" })], { 
          type: 'application/pdf' 
        });
      }
    } catch (error) {
      console.error("Error exporting lesson plans:", error);
      throw error;
    }
  }
};

/* ---------------- SUBJECT COLORS ---------------- */
const subjectColors: Record<string, string> = {
  Mathematics: "bg-blue-600",
  English: "bg-orange-500",
  Science: "bg-emerald-600",
  History: "bg-amber-600",
  Physics: "bg-purple-600",
  Chemistry: "bg-pink-600",
  Biology: "bg-green-600",
  Geography: "bg-teal-600",
  "Computer Science": "bg-indigo-600",
  "Business Studies": "bg-rose-600",
  Economics: "bg-yellow-600",
  "Religious Education": "bg-cyan-600",
  "Physical Education": "bg-lime-600",
  Music: "bg-fuchsia-600",
  Art: "bg-violet-600",
  Drama: "bg-amber-700",
  "Foreign Languages": "bg-sky-600",
  Default: "bg-slate-600"
};

/* ---------------- STATUS CONFIG ---------------- */
const statusConfig = {
  planned: {
    label: "Planned",
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
    badgeColor: "bg-blue-500"
  },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-100 text-amber-800",
    icon: Clock,
    badgeColor: "bg-amber-500"
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle,
    badgeColor: "bg-emerald-500"
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-rose-100 text-rose-800",
    icon: XCircle,
    badgeColor: "bg-rose-500"
  }
};

/* ---------------- MAIN COMPONENT ---------------- */
const LessonPlan: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Data states - similar to Attendance component
  const [classes, setClasses] = useState<Class[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingSubjects, setFetchingSubjects] = useState<boolean>(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateLessonPlanData>({
    lesson_title: "",
    subject_id: "",
    class_id: "",
    stream_id: "",
    lesson_date: new Date().toISOString().split('T')[0],
    learning_objectives: [""],
    main_activities: [""],
    duration_minutes: 40,
    status: "planned"
  });

  // Fetch initial data (classes from assignments)
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch streams when class changes
  useEffect(() => {
    if (formData.class_id) {
      fetchStreamsForClass(formData.class_id);
    } else {
      setStreams([]);
      setFormData(prev => ({ ...prev, stream_id: "" }));
      setSubjects([]);
      setFormData(prev => ({ ...prev, subject_id: "" }));
    }
  }, [formData.class_id]);

  // Fetch subjects when stream changes
  useEffect(() => {
    if (formData.class_id && formData.stream_id) {
      fetchSubjectsForStream(formData.stream_id);
    } else {
      setSubjects([]);
      setFormData(prev => ({ ...prev, subject_id: "" }));
    }
  }, [formData.class_id, formData.stream_id]);

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
        const classSet = new Map<string, Class>();
        
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
      
      // Fallback: try to get classes from CBC API
      try {
        const cbcResponse = await teacherAPI.getCbcClasses();
        if (cbcResponse.data?.data) {
          const cbcClasses = cbcResponse.data.data.map((cls: any) => ({
            id: cls.id,
            name: cls.name || cls.class_name,
            class_name: cls.name || cls.class_name,
            class_level: cls.class_level || 0
          }));
          setClasses(cbcClasses);
          setError(null);
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamsForClass = async (classId: string) => {
    try {
      setStreams([]);
      setFormData(prev => ({ ...prev, stream_id: "" }));
      
      const response = await teacherAPI.getClassStreams(classId);
      
      if (response.data.success) {
        const apiStreams: Stream[] = response.data.data.streams.map((stream: any) => ({
          id: stream.id,
          name: stream.name,
          class_id: stream.class_id
        }));
        
        setStreams(apiStreams);
        
        if (apiStreams.length === 1) {
          setFormData(prev => ({ ...prev, stream_id: apiStreams[0].id }));
        }
      } else {
        throw new Error(response.data.error || 'Failed to load streams');
      }
    } catch (error: any) {
      console.error('Error fetching streams:', error);
      
      // Fallback: try CBC streams
      try {
        const cbcResponse = await teacherAPI.getCbcStreams(classId);
        if (cbcResponse.data?.data) {
          const cbcStreams = cbcResponse.data.data.map((stream: any) => ({
            id: stream.id,
            name: stream.name,
            class_id: stream.class_id || classId
          }));
          setStreams(cbcStreams);
        }
      } catch (fallbackError) {
        console.error('Fallback streams error:', fallbackError);
        setError("Failed to load streams for this class");
      }
    }
  };

  const fetchSubjectsForStream = async (streamId: string) => {
    try {
      setFetchingSubjects(true);
      setSubjects([]);
      setFormData(prev => ({ ...prev, subject_id: "" }));
      
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
        
        const apiSubjects: Subject[] = subjectsArray.map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          subject_code: subject.subject_code || subject.code || subject.name.substring(0, 3).toUpperCase(),
          category: subject.category || "General"
        }));
        
        setSubjects(apiSubjects);
        
        if (apiSubjects.length === 1) {
          setFormData(prev => ({ ...prev, subject_id: apiSubjects[0].id }));
        }
      } else {
        throw new Error(response.data.error || 'Failed to load subjects');
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      
      // Fallback: try to get subjects from teacher's subjects
      try {
        const mySubjectsResponse = await teacherAPI.getMySubjects();
        if (mySubjectsResponse.data?.data) {
          const mySubjects = mySubjectsResponse.data.data.map((subject: any) => ({
            id: subject.id,
            name: subject.name,
            subject_code: subject.subject_code || subject.code || subject.name.substring(0, 3).toUpperCase(),
            category: subject.category || "General"
          }));
          setSubjects(mySubjects);
        }
      } catch (fallbackError) {
        console.error('Fallback subjects error:', fallbackError);
        setError("Failed to load subjects for this stream");
      }
    } finally {
      setFetchingSubjects(false);
    }
  };

  // Fetch lesson plans with React Query
  const { 
    data: plansData, 
    isLoading: isLoadingPlans, 
    error: plansError,
    refetch: refetchPlans 
  } = useQuery({
    queryKey: ['lessonPlans', selectedStatus, selectedSubject, selectedClass, selectedStream, searchQuery],
    queryFn: () => lessonPlanAPI.getLessonPlans({
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      subjectId: selectedSubject || undefined,
      classId: selectedClass || undefined,
      streamId: selectedStream || undefined,
      search: searchQuery || undefined
    }),
    retry: 1,
    enabled: !loading // Only fetch lesson plans after initial data is loaded
  });

  const { 
    data: templatesData, 
    isLoading: isLoadingTemplates,
    error: templatesError 
  } = useQuery({
    queryKey: ['templates'],
    queryFn: () => lessonPlanAPI.getTemplates({ shared: 'all' }),
    retry: 1
  });

  // Handle errors
  useEffect(() => {
    if (plansError) {
      console.error("Query error:", plansError);
      const errorMessage = (plansError as ApiError).response?.data?.message || (plansError as ApiError).message || "Failed to load lesson plans";
      toast.error(errorMessage);
    }
  }, [plansError]);

  useEffect(() => {
    if (templatesError) {
      console.error("Templates error:", templatesError);
      const errorMessage = (templatesError as ApiError).response?.data?.message || (templatesError as ApiError).message || "Failed to load templates";
      toast.error(errorMessage);
    }
  }, [templatesError]);

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: lessonPlanAPI.createLessonPlan,
    onSuccess: () => {
      toast.success("Lesson plan created successfully!");
      queryClient.invalidateQueries({ queryKey: ['lessonPlans'] });
      resetForm();
      setIsCreating(false);
    },
    onError: (error: ApiError) => {
      console.error("Create error:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to create lesson plan";
      toast.error(errorMessage);
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string, data: any }) => 
      lessonPlanAPI.updateLessonPlan(planId, data),
    onSuccess: () => {
      toast.success("Lesson plan updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['lessonPlans'] });
    },
    onError: (error: ApiError) => {
      console.error("Update error:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to update lesson plan";
      toast.error(errorMessage);
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: ({ planId, reason }: { planId: string, reason?: string }) => 
      lessonPlanAPI.deleteLessonPlan(planId, reason ? { reason } : undefined),
    onSuccess: () => {
      toast.success("Lesson plan deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['lessonPlans'] });
    },
    onError: (error: ApiError) => {
      console.error("Delete error:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to delete lesson plan";
      toast.error(errorMessage);
    }
  });

  const duplicatePlanMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: string, data?: any }) => 
      lessonPlanAPI.duplicateLessonPlan(planId, data),
    onSuccess: () => {
      toast.success("Lesson plan duplicated successfully!");
      queryClient.invalidateQueries({ queryKey: ['lessonPlans'] });
    },
    onError: (error: ApiError) => {
      console.error("Duplicate error:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to duplicate lesson plan";
      toast.error(errorMessage);
    }
  });

  // Data extraction with fallbacks
  const lessonPlans = plansData?.data?.plans || [];
  const statistics = plansData?.data?.statistics || {};
  const templates = templatesData?.data?.templates || [];

  // Handlers
  const handleFormChange = (field: keyof CreateLessonPlanData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle class change - reset stream when class changes
  const handleClassChange = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      class_id: classId,
      stream_id: "", // Reset stream when class changes
      subject_id: "" // Reset subject when class changes
    }));
  };

  const handleAddObjective = () => {
    setFormData(prev => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, ""]
    }));
  };

  const handleUpdateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.learning_objectives];
    newObjectives[index] = value;
    setFormData(prev => ({
      ...prev,
      learning_objectives: newObjectives
    }));
  };

  const handleRemoveObjective = (index: number) => {
    const newObjectives = formData.learning_objectives.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      learning_objectives: newObjectives
    }));
  };

  const handleAddActivity = () => {
    setFormData(prev => ({
      ...prev,
      main_activities: [...prev.main_activities, ""]
    }));
  };

  const handleUpdateActivity = (index: number, value: string) => {
    const newActivities = [...formData.main_activities];
    newActivities[index] = value;
    setFormData(prev => ({
      ...prev,
      main_activities: newActivities
    }));
  };

  const handleRemoveActivity = (index: number) => {
    const newActivities = formData.main_activities.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      main_activities: newActivities
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.lesson_title || !formData.subject_id || !formData.class_id || !formData.lesson_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.learning_objectives.length === 0 || formData.learning_objectives[0] === "") {
      toast.error("Please add at least one learning objective");
      return;
    }

    if (formData.main_activities.length === 0 || formData.main_activities[0] === "") {
      toast.error("Please add at least one main activity");
      return;
    }

    createPlanMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      lesson_title: "",
      subject_id: "",
      class_id: "",
      stream_id: "",
      lesson_date: new Date().toISOString().split('T')[0],
      learning_objectives: [""],
      main_activities: [""],
      duration_minutes: 40,
      status: "planned"
    });
  };

  const handleMarkComplete = (planId: string) => {
    updatePlanMutation.mutate({
      planId,
      data: { 
        status: 'completed',
        lesson_reflection: 'Lesson completed successfully.'
      }
    });
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm("Are you sure you want to delete this lesson plan?")) {
      deletePlanMutation.mutate({ planId });
    }
  };

  const handleDuplicatePlan = (planId: string) => {
    duplicatePlanMutation.mutate({ planId });
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'word') => {
    try {
      const params = {
        format,
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        subjectId: selectedSubject || undefined,
        classId: selectedClass || undefined,
        streamId: selectedStream || undefined
      };

      const response = await lessonPlanAPI.exportLessonPlans(params);
      
      if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lesson-plans-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`Lesson plans exported as ${format.toUpperCase()}`);
      } else {
        toast.error("Export failed: Invalid response format");
      }
    } catch (error: any) {
      console.error("Export error:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to export lesson plans";
      toast.error(errorMessage);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getSubjectColor = (subjectName: string) => {
    return subjectColors[subjectName] || subjectColors.Default;
  };

  // Show loading state for initial data
  if (loading) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700">Loading lesson plans...</p>
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
      {/* 1. Header */}
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
          
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pedagogical Planning</h1>
          <p className="text-slate-500 font-medium italic">Architecting the future, one lesson at a time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <Search size={18} className="text-slate-400 ml-2" />
            <input 
              type="text" 
              placeholder="Search plans..." 
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
          
          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl shadow-sm hover:bg-indigo-700 transition-colors">
              <Download size={16} />
              <span className="text-sm font-bold">Export</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button 
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 first:rounded-t-2xl last:rounded-b-2xl"
              >
                Export as PDF
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Export as Excel
              </button>
              <button 
                onClick={() => handleExport('word')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Export as Word
              </button>
            </div>
          </div>
        </div>
      </div>

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
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
                disabled={isLoadingPlans}
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
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStream(""); // Reset stream when class changes
                }}
                disabled={isLoadingPlans}
              >
                <option value="">All Classes</option>
                {classes.map((cls: Class) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stream Filter (only shown when class is selected) */}
            {selectedClass && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Stream
                </label>
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                >
                  <option value="">All Streams</option>
                  <option value="no_stream">No Stream</option>
                  {streams.filter(s => s.class_id === selectedClass).map((stream: Stream) => (
                    <option key={stream.id} value={stream.id}>
                      {stream.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Statistics */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="Total Plans" 
                value={statistics.total || 0} 
                color="text-slate-700"
              />
              <StatCard 
                label="Planned" 
                value={statistics.planned || 0} 
                color="text-blue-600"
              />
              <StatCard 
                label="In Progress" 
                value={statistics.in_progress || 0} 
                color="text-amber-600"
              />
              <StatCard 
                label="Completed" 
                value={statistics.completed || 0} 
                color="text-emerald-600"
              />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* 2. Composition Side (Left) */}
        <div className="xl:col-span-4">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-6 sticky top-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Plus size={24} />
                </div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  {isCreating ? "New Lesson Plan" : "Create New"}
                </h2>
              </div>
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Start Planning
                </button>
              )}
            </div>

            {isCreating ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Lesson Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter lesson title..."
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    value={formData.lesson_title}
                    onChange={(e) => handleFormChange('lesson_title', e.target.value)}
                    required
                  />
                </div>

                {/* Subject, Class, and Stream */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Subject *
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                        value={formData.subject_id}
                        onChange={(e) => handleFormChange('subject_id', e.target.value)}
                        required
                        disabled={fetchingSubjects || subjects.length === 0}
                      >
                        <option value="">
                          {fetchingSubjects ? "Loading subjects..." : 
                          !formData.stream_id ? "Select a stream first" :
                          subjects.length === 0 ? "No subjects available" : 
                          "Select Subject..."}
                        </option>
                        {subjects.map((subject: Subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
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
                  </div>
                  
                  {/* Class */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Class *
                    </label>
                    <div className="relative">
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
                            {cls.class_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Stream */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Stream
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                        value={formData.stream_id}
                        onChange={(e) => handleFormChange('stream_id', e.target.value)}
                        disabled={!formData.class_id || streams.length === 0}
                      >
                        <option value="">
                          {!formData.class_id ? "Select class first" :
                           streams.length === 0 ? "No streams available" : 
                           "Select Stream..."}
                        </option>
                        {streams.map((stream: Stream) => (
                          <option key={stream.id} value={stream.id}>
                            {stream.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Date and Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={formData.lesson_date}
                      onChange={(e) => handleFormChange('lesson_date', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="240"
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                      value={formData.duration_minutes}
                      onChange={(e) => handleFormChange('duration_minutes', parseInt(e.target.value) || 40)}
                    />
                  </div>
                </div>

                {/* Learning Objectives */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Learning Objectives *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddObjective}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      + Add Objective
                    </button>
                  </div>
                  {formData.learning_objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={`Objective ${index + 1}...`}
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                        value={objective}
                        onChange={(e) => handleUpdateObjective(index, e.target.value)}
                        required
                      />
                      {formData.learning_objectives.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveObjective(index)}
                          className="px-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Main Activities */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Main Activities *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddActivity}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      + Add Activity
                    </button>
                  </div>
                  {formData.main_activities.map((activity, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={`Activity ${index + 1}...`}
                        className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none"
                        value={activity}
                        onChange={(e) => handleUpdateActivity(index, e.target.value)}
                        required
                      />
                      {formData.main_activities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveActivity(index)}
                          className="px-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createPlanMutation.isPending}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createPlanMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Save Lesson Plan <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      resetForm();
                    }}
                    className="px-6 py-4 bg-slate-100 text-slate-700 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* Templates Section */
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-700">Quick Start Templates</h3>
                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-slate-400" />
                  </div>
                ) : templates.length > 0 ? (
                  <div className="space-y-3">
                    {templates.slice(0, 3).map((template: LessonPlanTemplate) => (
                      <div 
                        key={template.id}
                        className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 cursor-pointer transition-colors group"
                        onClick={() => {
                          toast("Template selection coming soon!");
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 group-hover:text-indigo-600">
                              {template.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {template.subject?.name || 'General'} • {template.class?.class_name || 'All Classes'}
                            </p>
                          </div>
                          <BookOpen size={16} className="text-slate-400 group-hover:text-indigo-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No templates available. Create your first lesson plan!
                  </p>
                )}
                
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-2xl text-sm font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  + Create New Plan
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* 3. The Repository (Right) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Bookmark className="text-indigo-600" size={20} /> 
              Lesson Plans Repository
              {isLoadingPlans && (
                <Loader2 size={16} className="animate-spin text-slate-400" />
              )}
            </h2>
            <div className="flex gap-2">
              <button 
                className={`text-[10px] font-black uppercase pb-1 transition-colors ${selectedStatus === 'all' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setSelectedStatus('all')}
              >
                All Plans ({statistics.total || 0})
              </button>
              <button 
                className={`text-[10px] font-black uppercase pb-1 transition-colors ${selectedStatus === 'planned' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setSelectedStatus('planned')}
              >
                Planned ({statistics.planned || 0})
              </button>
              <button 
                className={`text-[10px] font-black uppercase pb-1 transition-colors ${selectedStatus === 'completed' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setSelectedStatus('completed')}
              >
                Completed ({statistics.completed || 0})
              </button>
            </div>
          </div>

          {isLoadingPlans ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
              <p className="text-slate-500 font-medium">Loading lesson plans...</p>
            </div>
          ) : lessonPlans.length === 0 ? (
            <Card className="border-none shadow-lg rounded-2xl p-12 text-center">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">No lesson plans found</h3>
              <p className="text-slate-500 mb-6">
                {searchQuery || selectedStatus !== 'all' || selectedSubject || selectedClass
                  ? "Try adjusting your filters or search terms"
                  : "Create your first lesson plan to get started"}
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                Create First Lesson Plan
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lessonPlans.map((plan: LessonPlan) => {
                const StatusIcon = statusConfig[plan.status]?.icon || Clock;
                const statusColor = statusConfig[plan.status]?.color || "bg-slate-100 text-slate-800";
                
                return (
                  <Card 
                    key={plan.id} 
                    className="border-none shadow-lg shadow-slate-200/40 rounded-[2.5rem] p-0 bg-white group overflow-hidden flex flex-col hover:shadow-xl transition-shadow"
                  >
                    {/* Subject Color Bar */}
                    <div 
                      className={`h-2 ${getSubjectColor(plan.subject.name)}`}
                    />
                    
                    <div className="p-6 flex-1 space-y-4">
                      {/* Header with Title and Actions */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className={`w-2 h-2 rounded-full ${getSubjectColor(plan.subject.name)}`}
                            />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {plan.subject.name}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusColor}`}>
                              <span className="flex items-center gap-1">
                                <StatusIcon size={10} />
                                {statusConfig[plan.status]?.label || plan.status}
                              </span>
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {plan.title}
                          </h3>
                        </div>
                        
                        {/* Actions Menu */}
                        <div className="relative">
                          <button 
                            className="text-slate-300 hover:text-slate-600 p-1"
                            onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                          >
                            <MoreHorizontal size={20} />
                          </button>
                          
                          {expandedPlanId === plan.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-10">
                              <button 
                                onClick={() => {
                                  setExpandedPlanId(null);
                                  toast("View details feature coming soon!");
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 first:rounded-t-2xl"
                              >
                                <Eye size={14} /> View Details
                              </button>
                              <button 
                                onClick={() => {
                                  handleDuplicatePlan(plan.id);
                                  setExpandedPlanId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Copy size={14} /> Duplicate
                              </button>
                              {plan.status !== 'completed' && (
                                <button 
                                  onClick={() => {
                                    handleMarkComplete(plan.id);
                                    setExpandedPlanId(null);
                                  }}
                                  className="w-full px-4 py-3 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <CheckCircle size={14} /> Mark Complete
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  handleDeletePlan(plan.id);
                                  setExpandedPlanId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-2 last:rounded-b-2xl"
                                disabled={deletePlanMutation.isPending}
                              >
                                <Trash2 size={14} /> 
                                {deletePlanMutation.isPending ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Class and Date Badges */}
                      <div className="flex gap-2">
                        <Badge 
                          icon={<GraduationCap size={10} />} 
                          text={plan.class.class_name} 
                        />
                        {plan.stream && (
                          <Badge 
                            icon={<Hash size={10} />} 
                            text={plan.stream.name} 
                          />
                        )}
                        <Badge 
                          icon={<Calendar size={10} />} 
                          text={formatDate(plan.lesson_date)} 
                        />
                        {plan.lesson_time && (
                          <Badge 
                            icon={<Clock size={10} />} 
                            text={plan.lesson_time.substring(0, 5)} 
                          />
                        )}
                      </div>

                      {/* Objectives Preview */}
                      <div className="space-y-3 pt-2">
                        <div className="flex gap-3">
                          <div className="mt-1">
                            <Target size={14} className="text-indigo-500" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-600">Learning Objectives:</p>
                            <div className="space-y-1">
                              {plan.learning_objectives.slice(0, 2).map((objective, idx) => (
                                <p key={idx} className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                  • {objective}
                                </p>
                              ))}
                              {plan.learning_objectives.length > 2 && (
                                <p className="text-xs text-slate-500 italic">
                                  +{plan.learning_objectives.length - 2} more objectives
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Lightbulb size={12} />
                            <span>{plan.learning_objectives.length} objectives</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{plan.duration} minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="border-t border-slate-50 p-4">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span>Created {formatDate(plan.created_at)}</span>
                          {plan.updated_at !== plan.created_at && (
                            <span className="text-slate-400">• Updated</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            className="text-indigo-600 hover:text-indigo-700 font-bold text-[10px] uppercase tracking-wider"
                            onClick={() => toast("Full plan view coming soon!")}
                          >
                            Open Full Plan
                          </button>
                          <ArrowRight size={12} className="text-indigo-600" />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {plansData?.data?.pagination && plansData.data.pagination.pages > 1 && (
            <div className="flex items-center justify-center pt-6">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    toast("Pagination coming soon!");
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm font-medium text-slate-700">
                  Page {plansData.data.pagination.page} of {plansData.data.pagination.pages}
                </span>
                <button 
                  onClick={() => {
                    toast("Pagination coming soon!");
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- SUB-COMPONENTS ---------------- */
const Badge = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tighter">
    {icon}
    <span className="whitespace-nowrap">{text}</span>
  </div>
);

const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="p-4 bg-white rounded-xl border border-slate-100">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
  </div>
);

export default LessonPlan;