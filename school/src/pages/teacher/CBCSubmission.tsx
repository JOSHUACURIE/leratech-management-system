// pages/teacher/CBCAssessment.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Card from "../../components/common/Card";
import { 
  ClipboardCheck, 
  Search, 
  Layers, 
  ChevronRight, 
  MessageSquare, 
  CheckCircle,
  GraduationCap,
  Loader2,
  Info,
  Users,
  X,
  AlertCircle,
  Filter,
  Save,
  RefreshCw,
  ArrowLeft,
  BookOpen,
  GitBranch,
  ListTree,
  CheckSquare,
  Menu,
  Eye,
  EyeOff,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cbcAPIS } from '../../services/api';
import { useNavigate } from "react-router-dom";

/* ---------------- TYPES ---------------- */
type CBCLevel = "Exceeding Expectation" | "Meeting Expectation" | "Approaching Expectation" | "Below Expectation";

interface Student {
  id: string;
  admissionNo: string;
  name: string;
  level: CBCLevel | "";
  comment: string;
  existingScore?: number | null;
  existingComment?: string;
  learnerAssessmentId?: string;
}

interface ClassOption {
  id: string;
  name: string;
  level: number;
}

interface StreamOption {
  id: string;
  name: string;
  class_id: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  subject_code?: string;
}

interface TermOption {
  id: string;
  name: string;
  term_name?: string;
  is_current: boolean;
}

interface SubStrand {
  id: string;
  name: string;
  code: string;
  description?: string;
  order: number;
}

interface Strand {
  id: string;
  name: string;
  code: string;
  description?: string;
  sub_strands?: SubStrand[];
  subStrands?: SubStrand[]; // For compatibility
}

interface RubricLevel {
  id: string;
  level_number: number;
  level_name: string;
  level_code?: string;
  cbc_descriptor?: string;
  color_code?: string;
  is_pass_level: boolean;
}

interface RubricScale {
  id: string;
  scale_name: string;
  levels: RubricLevel[];
}

interface LearnerAssessment {
  id: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  currentLevel?: RubricLevel | null;
  teacherComment?: string;
  hasEvidence: boolean;
  isLocked: boolean;
  assessedAt?: string;
}

interface MarkingSheetResponse {
  assessment: {
    id: string;
    title: string;
    description?: string;
    type: string;
    isLocked: boolean;
    strand: Strand;
    subStrand?: SubStrand;
    subject: any;
    class: any;
    stream?: any;
  };
  rubricScale: RubricScale;
  markingSheet: LearnerAssessment[];
  totalStudents: number;
  assessedCount: number;
}

const levelConfig: Record<CBCLevel, { color: string; bg: string; border: string; short: string; score: number }> = {
  "Exceeding Expectation": { 
    color: "text-emerald-700", 
    bg: "bg-emerald-50", 
    border: "border-emerald-200",
    short: "EE",
    score: 4
  },
  "Meeting Expectation": { 
    color: "text-blue-700", 
    bg: "bg-blue-50", 
    border: "border-blue-200",
    short: "ME",
    score: 3
  },
  "Approaching Expectation": { 
    color: "text-amber-700", 
    bg: "bg-amber-50", 
    border: "border-amber-200",
    short: "AE",
    score: 2
  },
  "Below Expectation": { 
    color: "text-rose-700", 
    bg: "bg-rose-50", 
    border: "border-rose-200",
    short: "BE",
    score: 1
  },
};

const CBCAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fetchingStreams, setFetchingStreams] = useState<boolean>(false);
  const [fetchingSubjects, setFetchingSubjects] = useState<boolean>(false);
  const [fetchingStrands, setFetchingStrands] = useState<boolean>(false);
  const [fetchingRubrics, setFetchingRubrics] = useState<boolean>(false);
  const [fetchingStudents, setFetchingStudents] = useState<boolean>(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Selection states
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [selectedRubricScale, setSelectedRubricScale] = useState<string>("");
  
  // Strand/Sub-strand states
  const [showStrandModal, setShowStrandModal] = useState(false);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [selectedStrand, setSelectedStrand] = useState("");
  const [selectedSubStrand, setSelectedSubStrand] = useState("");
  const [assessmentConfig, setAssessmentConfig] = useState<{
    strandId: string;
    subStrandId: string;
    strandName: string;
    subStrandName: string;
  } | null>(null);
  
  // Rubric scale state
  const [rubricScales, setRubricScales] = useState<RubricScale[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<RubricScale | null>(null);
  
  // Data states
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [streams, setStreams] = useState<StreamOption[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<StreamOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // UI states
  const [showFilters, setShowFilters] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch streams when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStreamsForClass();
    } else {
      setStreams([]);
      setFilteredStreams([]);
      setSelectedStream("");
    }
  }, [selectedClass]);

  // Fetch subjects when class and stream change
  useEffect(() => {
    if (selectedClass && selectedStream) {
      fetchSubjectsForClassStream();
    } else {
      setSubjects([]);
      setSelectedSubject("");
    }
  }, [selectedClass, selectedStream]);

  // Fetch strands when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchStrandsForSubject();
    } else {
      setStrands([]);
    }
  }, [selectedSubject]);

  // Fetch rubric scales
  useEffect(() => {
    fetchRubricScales();
  }, []);

  // Reset sub-strand when strand changes
  useEffect(() => {
    setSelectedSubStrand("");
  }, [selectedStrand]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesRes, termsRes] = await Promise.allSettled([
        cbcAPIS.getClasses(),
        cbcAPIS.getTerms()
      ]);

      if (classesRes.status === 'fulfilled' && classesRes.value.data?.success) {
        setClasses(classesRes.value.data.data || []);
      } else {
        console.warn('Failed to fetch classes');
        setClasses([]);
      }

      if (termsRes.status === 'fulfilled' && termsRes.value.data?.success) {
        const termsData = termsRes.value.data.data || [];
        setTerms(termsData);
        const currentTerm = termsData.find((term: TermOption) => term.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }
      } else {
        console.warn('Failed to fetch terms');
        setTerms([]);
      }

    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load required data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamsForClass = async () => {
    try {
      setFetchingStreams(true);
      const response = await cbcAPIS.getStreams(selectedClass);
      
      if (response.data?.success) {
        const streamsData = response.data.data || [];
        setStreams(streamsData);
        const filtered = streamsData.filter((stream: StreamOption) => stream.class_id === selectedClass);
        setFilteredStreams(filtered);
        
        if (filtered.length === 1) {
          setSelectedStream(filtered[0].id);
        } else if (filtered.length === 0) {
          setSelectedStream("");
        }
      } else {
        setStreams([]);
        setFilteredStreams([]);
        setSelectedStream("");
      }
    } catch (error: any) {
      console.error('Error fetching streams:', error);
      setStreams([]);
      setFilteredStreams([]);
      setSelectedStream("");
    } finally {
      setFetchingStreams(false);
    }
  };

  const fetchSubjectsForClassStream = async () => {
    try {
      setFetchingSubjects(true);
      const response = await cbcAPIS.getSubjects(selectedClass, selectedStream);
      
      if (response.data?.success) {
        setSubjects(response.data.data || []);
      } else {
        setSubjects([]);
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    } finally {
      setFetchingSubjects(false);
    }
  };

  const fetchStrandsForSubject = async () => {
    try {
      setFetchingStrands(true);
      const response = await cbcAPIS.getStrandsBySubject({ 
        subjectId: selectedSubject 
      });
      
      if (response.data?.success) {
        const strandsData = response.data.data || [];
        // Ensure sub_strands is mapped correctly
        const formattedStrands = strandsData.map((strand: any) => ({
          ...strand,
          subStrands: strand.sub_strands || strand.subStrands || []
        }));
        setStrands(formattedStrands);
      } else {
        setStrands([]);
      }
    } catch (error: any) {
      console.error('Error fetching strands:', error);
      setStrands([]);
    } finally {
      setFetchingStrands(false);
    }
  };

  const fetchRubricScales = async () => {
    try {
      setFetchingRubrics(true);
      const response = await cbcAPIS.getRubricScales({ 
        scaleType: 'competency',
        isActive: true,
        includeSystemDefault: true
      });
      
      if (response.data?.success) {
        setRubricScales(response.data.data || []);
        const defaultScale = response.data.data?.find((scale: RubricScale) => scale.is_system_default);
        if (defaultScale) {
          setSelectedRubricScale(defaultScale.id);
          setSelectedRubric(defaultScale);
        }
      }
    } catch (error: any) {
      console.error('Error fetching rubric scales:', error);
    } finally {
      setFetchingRubrics(false);
    }
  };

  const handleAssessmentSelect = async (assessmentId: string) => {
    setSelectedAssessment(assessmentId);
    
    // If we already have strand config, just use it
    if (assessmentConfig) {
      return;
    }
    
    // Otherwise show modal to select strand/sub-strand
    if (strands.length > 0) {
      setShowStrandModal(true);
    } else {
      setError("No strands available for this subject. Please configure strands first.");
    }
  };

  const handleConfirmStrandSelection = () => {
    if (!selectedStrand || !selectedSubStrand) {
      setError("Please select both strand and sub-strand");
      return;
    }

    const strand = strands.find(s => s.id === selectedStrand);
    const subStrand = strand?.subStrands?.find(ss => ss.id === selectedSubStrand);

    setAssessmentConfig({
      strandId: selectedStrand,
      subStrandId: selectedSubStrand,
      strandName: strand?.name || "",
      subStrandName: subStrand?.name || ""
    });

    setShowStrandModal(false);
    setError(null);
    
    // After confirming, fetch the marking sheet
    fetchMarkingSheet();
  };

  const fetchMarkingSheet = useCallback(async () => {
    if (!selectedAssessment || !assessmentConfig) {
      setError("Please complete all selections including strand and sub-strand");
      return;
    }

    try {
      setFetchingStudents(true);
      setError(null);
      setStudents([]);

      const response = await cbcAPIS.getCbcMarkingSheet(selectedAssessment);
      
      if (response.data?.success) {
        const data: MarkingSheetResponse = response.data.data;
        
        // Verify strand matches
        if (data.assessment.strand.id !== assessmentConfig.strandId) {
          setError("Assessment strand mismatch. Please reconfigure.");
          setShowStrandModal(true);
          return;
        }

        // Transform to student format
        const studentList: Student[] = data.markingSheet.map(item => {
          const level = item.currentLevel?.level_name as CBCLevel || "";
          
          return {
            id: item.student.id,
            learnerAssessmentId: item.id,
            admissionNo: item.student.admission_number,
            name: `${item.student.first_name} ${item.student.last_name}`,
            level: level,
            comment: item.teacherComment || "",
            existingScore: item.currentLevel?.level_number || null,
            existingComment: item.teacherComment || ""
          };
        });

        setStudents(studentList);
        
        if (studentList.length > 0) {
          setSuccessMessage(`Loaded ${studentList.length} learners for assessment`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setWarnings(["No learners found for this assessment"]);
        }
      } else {
        throw new Error(response.data?.error || "Failed to load marking sheet");
      }
    } catch (error: any) {
      console.error('Error fetching marking sheet:', error);
      
      if (error.response?.status === 404) {
        setError("Assessment not found. Please select a different assessment.");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to access this assessment.");
      } else {
        setError(error.message || "Failed to load marking sheet. Please try again.");
      }
      
      setStudents([]);
    } finally {
      setFetchingStudents(false);
    }
  }, [selectedAssessment, assessmentConfig]);

  const updateLevel = (id: string, level: CBCLevel) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, level } : s));
  };

  const updateComment = (id: string, comment: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, comment } : s));
  };

  const handleSubmitScores = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const assessments = students
        .filter(student => {
          const hasLevel = student.level !== "";
          const levelChanged = student.level !== mapScoreToLevel(student.existingScore);
          const commentChanged = student.comment !== student.existingComment;
          return hasLevel && (levelChanged || commentChanged);
        })
        .map(student => ({
          learnerAssessmentId: student.learnerAssessmentId || "",
          rubricLevelId: getRubricLevelId(student.level as CBCLevel),
          teacherComment: student.comment || "",
          hasEvidence: false
        }));

      if (assessments.length === 0) {
        setError("No changes to submit. Please evaluate learners first.");
        return;
      }

      const response = await cbcAPIS.submitCbcLearnerAssessmentsBatch(
        selectedAssessment,
        { assessments }
      );
      
      if (response.data?.success) {
        setSuccessMessage(`Successfully submitted ${assessments.length} assessments`);
        
        // Update existing scores
        setStudents(prev => prev.map(student => {
          const submitted = assessments.find(a => a.learnerAssessmentId === student.learnerAssessmentId);
          if (submitted) {
            return {
              ...student,
              existingScore: levelConfig[student.level as CBCLevel]?.score || null,
              existingComment: student.comment
            };
          }
          return student;
        }));
      }
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error submitting assessments:', error);
      
      if (error.response?.status === 403) {
        setError("You don't have permission to submit assessments");
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Failed to submit assessments. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getRubricLevelId = (level: CBCLevel): string => {
    // This would need to map the level to the actual rubric level ID
    // For now, return empty string - implement based on your rubric scale
    return "";
  };

  const handleLockAssessment = async () => {
    if (!selectedAssessment) return;
    
    try {
      setSubmitting(true);
      const response = await cbcAPIS.lockCbcAssessment(selectedAssessment);
      
      if (response.data?.success) {
        setSuccessMessage("Assessment locked successfully. No further edits allowed.");
        // Refresh the marking sheet to show locked state
        await fetchMarkingSheet();
      }
    } catch (error: any) {
      console.error('Error locking assessment:', error);
      setError(error.response?.data?.error || "Failed to lock assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = () => {
    setStudents([]);
    setSelectedClass("");
    setSelectedStream("");
    setSelectedAssessment("");
    setSelectedSubject("");
    setSelectedStrand("");
    setSelectedSubStrand("");
    setAssessmentConfig(null);
    setError(null);
    setWarnings([]);
    setSearchQuery("");
    fetchInitialData();
  };

  const mapScoreToLevel = (score: number | null | undefined): CBCLevel | "" => {
    if (score === null || score === undefined) return "";
    if (score >= 3.5) return "Exceeding Expectation";
    if (score >= 2.5) return "Meeting Expectation";
    if (score >= 1.5) return "Approaching Expectation";
    return "Below Expectation";
  };

  const toggleRowExpand = (studentId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const filteredStudents = useMemo(() => 
    students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
    ), [students, searchQuery]
  );

  const evaluatedCount = students.filter(s => s.level !== "").length;
  const pendingCount = students.filter(s => s.level === "").length;
  const changedCount = students.filter(s => {
    const hasLevel = s.level !== "";
    const levelChanged = s.level !== mapScoreToLevel(s.existingScore);
    const commentChanged = s.comment !== s.existingComment;
    return hasLevel && (levelChanged || commentChanged);
  }).length;

  const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || "";
  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "";
  const selectedStreamName = streams.find(s => s.id === selectedStream)?.name || "";
  const selectedTermName = terms.find(t => t.id === selectedTerm)?.term_name || terms.find(t => t.id === selectedTerm)?.name || "";

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading CBC Assessment</h2>
          <p className="text-slate-500">Preparing the assessment interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">CBC Assessment</h1>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Filter size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
        {/* Desktop Header */}
        <div className="hidden lg:flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 text-sm font-semibold transition-colors mb-2 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">CBC Assessment</h1>
            <p className="text-slate-500 font-medium">Competency-based performance tracking</p>
          </div>
          
          {students.length > 0 && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-3 lg:px-4 border-r border-slate-100 text-center">
                <p className="text-[10px] lg:text-xs text-slate-500 font-semibold">Evaluated</p>
                <p className="text-sm lg:text-base font-bold text-slate-800">{evaluatedCount}/{students.length}</p>
              </div>
              <div className="px-3 lg:px-4 border-r border-slate-100 text-center">
                <p className="text-[10px] lg:text-xs text-slate-500 font-semibold">Pending</p>
                <p className="text-sm lg:text-base font-bold text-amber-600">{pendingCount}</p>
              </div>
              <div className="px-3 lg:px-4 text-center">
                <p className="text-[10px] lg:text-xs text-slate-500 font-semibold">To Save</p>
                <p className="text-sm lg:text-base font-bold text-emerald-600">{changedCount}</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Stats */}
        {students.length > 0 && (
          <div className="lg:hidden grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Evaluated</p>
              <p className="text-lg font-bold text-slate-800">{evaluatedCount}/{students.length}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500">To Save</p>
              <p className="text-lg font-bold text-emerald-600">{changedCount}</p>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start lg:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start lg:items-center gap-3 flex-1">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 lg:mt-0" size={20} />
              <span className="text-red-700 text-sm lg:text-base font-medium">{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
            >
              <X size={16} className="text-red-500" />
            </button>
          </div>
        )}

        {warnings.map((warning, index) => (
          <div key={index} className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600" size={20} />
              <span className="text-amber-700 text-sm lg:text-base font-medium">{warning}</span>
            </div>
            <button 
              onClick={() => setWarnings(prev => prev.filter((_, i) => i !== index))}
              className="p-1 hover:bg-amber-100 rounded transition-colors"
            >
              <X size={16} className="text-amber-500" />
            </button>
          </div>
        ))}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start lg:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start lg:items-center gap-3 flex-1">
              <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5 lg:mt-0" size={20} />
              <span className="text-emerald-700 text-sm lg:text-base font-medium">{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="p-1 hover:bg-emerald-100 rounded transition-colors flex-shrink-0"
            >
              <X size={16} className="text-emerald-500" />
            </button>
          </div>
        )}

        {/* Selection Panel */}
        {(showFilters || !students.length) && (
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 space-y-4 lg:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-emerald-500" />
                <h2 className="text-xs lg:text-sm font-bold text-slate-800 uppercase tracking-widest">Selection Criteria</h2>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                title="Refresh data"
                disabled={loading || submitting}
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
              {/* Class Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">
                  Class <span className="text-red-400">*</span>
                </label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  disabled={loading || classes.length === 0 || submitting}
                >
                  <option value="">{classes.length === 0 ? "No classes" : "Select Class..."}</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.level > 0 && `(Level ${cls.level})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stream Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">
                  Stream <span className="text-red-400">*</span>
                </label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
                  value={selectedStream}
                  onChange={e => setSelectedStream(e.target.value)}
                  disabled={!selectedClass || fetchingStreams || filteredStreams.length === 0 || submitting}
                >
                  <option value="">
                    {fetchingStreams ? "Loading..." : (filteredStreams.length === 0 ? "No streams" : "Select Stream...")}
                  </option>
                  {filteredStreams.map(str => (
                    <option key={str.id} value={str.id}>{str.name}</option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">
                  Subject <span className="text-red-400">*</span>
                </label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  disabled={!selectedClass || !selectedStream || fetchingSubjects || subjects.length === 0 || submitting}
                >
                  <option value="">
                    {fetchingSubjects ? "Loading..." : (subjects.length === 0 ? "No subjects" : "Select Subject...")}
                  </option>
                  {subjects.map(subj => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name} ({subj.code || subj.subject_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Term Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">
                  Term <span className="text-red-400">*</span>
                </label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
                  value={selectedTerm}
                  onChange={e => setSelectedTerm(e.target.value)}
                  disabled={loading || terms.length === 0 || submitting}
                >
                  <option value="">{terms.length === 0 ? "No terms" : "Select Term..."}</option>
                  {terms.map(term => (
                    <option key={term.id} value={term.id}>
                      {term.term_name || term.name} {term.is_current && "(Current)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assessment Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">
                  Assessment <span className="text-red-400">*</span>
                </label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl px-3 lg:px-4 py-2.5 lg:py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
                  value={selectedAssessment}
                  onChange={e => handleAssessmentSelect(e.target.value)}
                  disabled={!selectedSubject || assessments.length === 0 || submitting}
                >
                  <option value="">{assessments.length === 0 ? "No assessments" : "Select Assessment..."}</option>
                  {assessments.map(assess => (
                    <option key={assess.id} value={assess.id}>
                      {assess.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Load Students Button */}
            {selectedClass && selectedStream && selectedSubject && selectedAssessment && assessmentConfig && (
              <button
                onClick={fetchMarkingSheet}
                disabled={fetchingStudents || submitting}
                className="w-full py-3 lg:py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm lg:text-base"
              >
                {fetchingStudents ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading Learners...
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    Load Learners for Assessment
                  </>
                )}
              </button>
            )}

            {/* Selection Summary - Mobile */}
            {(selectedClass || selectedSubject || selectedAssessment) && (
              <div className="lg:hidden pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Selected:</h3>
                <div className="space-y-1 text-xs">
                  {selectedClassName && <p>• Class: {selectedClassName}</p>}
                  {selectedStreamName && <p>• Stream: {selectedStreamName}</p>}
                  {selectedSubjectName && <p>• Subject: {selectedSubjectName}</p>}
                  {selectedTermName && <p>• Term: {selectedTermName}</p>}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Mobile Toggle Filters Button */}
        {students.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 flex items-center justify-center gap-2"
          >
            <Filter size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        )}

        {/* Strand/Sub-strand Modal */}
        {showStrandModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl lg:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 lg:p-8 shadow-2xl animate-slideUp">
              <div className="flex items-start lg:items-center justify-between mb-4 lg:mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-50 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-black text-slate-800">Configure Assessment</h2>
                    <p className="text-xs lg:text-sm text-slate-500">Select strand and sub-strand</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStrandModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {fetchingStrands ? (
                <div className="py-8 lg:py-12 text-center">
                  <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-sm lg:text-base text-slate-600 font-medium">Loading strands...</p>
                </div>
              ) : strands.length === 0 ? (
                <div className="py-8 lg:py-12 text-center">
                  <AlertCircle size={32} className="text-amber-500 mx-auto mb-4" />
                  <p className="text-sm lg:text-base text-slate-600 font-medium">No strands found</p>
                  <p className="text-xs lg:text-sm text-slate-400 mt-2">Please configure strands in curriculum setup</p>
                </div>
              ) : (
                <div className="space-y-4 lg:space-y-6">
                  {/* Strand Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">
                      Strand <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={selectedStrand}
                      onChange={(e) => setSelectedStrand(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="">Select Strand...</option>
                      {strands.map(strand => (
                        <option key={strand.id} value={strand.id}>
                          {strand.name} ({strand.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Strand Selection */}
                  {selectedStrand && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">
                        Sub-strand <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={selectedSubStrand}
                        onChange={(e) => setSelectedSubStrand(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      >
                        <option value="">Select Sub-strand...</option>
                        {strands
                          .find(s => s.id === selectedStrand)
                          ?.subStrands?.map(sub => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} ({sub.code})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => setShowStrandModal(false)}
                      className="w-full sm:flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmStrandSelection}
                      disabled={!selectedStrand || !selectedSubStrand}
                      className="w-full sm:flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckSquare size={16} />
                      Confirm Selection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assessment Table */}
        {students.length > 0 ? (
          <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-2xl lg:rounded-[2rem] overflow-hidden bg-white">
            {/* Assessment Context Header */}
            {assessmentConfig && (
              <div className="px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-emerald-100">
                <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm">
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <GitBranch size={14} className="text-emerald-600 flex-shrink-0" />
                    <span className="font-medium text-emerald-700">Strand:</span>
                    <span className="text-slate-700 truncate max-w-[150px] lg:max-w-none">{assessmentConfig.strandName}</span>
                  </div>
                  <div className="hidden lg:block w-px h-4 bg-emerald-200"></div>
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <ListTree size={14} className="text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-blue-700">Sub-strand:</span>
                    <span className="text-slate-700 truncate max-w-[150px] lg:max-w-none">{assessmentConfig.subStrandName}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Actions */}
            <div className="p-4 lg:p-6 bg-slate-50/50 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search learners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300"
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSubmitScores}
                    disabled={submitting || changedCount === 0}
                    className="px-4 lg:px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Submit {changedCount > 0 && `(${changedCount})`}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleLockAssessment}
                    disabled={submitting || changedCount > 0}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
                    title="Lock assessment to prevent further edits"
                  >
                    Lock Assessment
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Showing {filteredStudents.length} of {students.length} learners
                {searchQuery && (
                  <span className="ml-2">
                    • Filtered by: "{searchQuery}"
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Learner</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Performance Level</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Observation</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => {
                    const hasChanges = s.level !== "" && (s.level !== mapScoreToLevel(s.existingScore) || s.comment !== s.existingComment);
                    
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Learner Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400">
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{s.admissionNo}</p>
                            </div>
                          </div>
                        </td>

                        {/* Level Picker */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {(Object.entries(levelConfig) as [CBCLevel, typeof levelConfig[CBCLevel]][]).map(([lvl, config]) => {
                              const active = s.level === lvl;
                              
                              return (
                                <button
                                  key={lvl}
                                  onClick={() => updateLevel(s.id, lvl)}
                                  disabled={submitting}
                                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all border
                                    ${active 
                                      ? `${config.bg} ${config.color} ${config.border} shadow-sm ring-2 ring-emerald-500/10` 
                                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                  `}
                                >
                                  {config.short}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Observation */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={s.comment}
                            onChange={e => updateComment(s.id, e.target.value)}
                            placeholder="Add observation..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300"
                            disabled={submitting}
                          />
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {s.level === "" ? (
                            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                              <AlertCircle size={12} />
                              Pending
                            </span>
                          ) : hasChanges ? (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle size={12} />
                              Unsaved
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              Saved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredStudents.map((s) => {
                const hasChanges = s.level !== "" && (s.level !== mapScoreToLevel(s.existingScore) || s.comment !== s.existingComment);
                const isExpanded = expandedRows.has(s.id);
                
                return (
                  <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors">
                    {/* Header - Always Visible */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.admissionNo}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleRowExpand(s.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ChevronDown 
                          size={18} 
                          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </button>
                    </div>

                    {/* Current Level Badge - Always Visible */}
                    <div className="flex items-center gap-2 mb-2">
                      {s.level ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${levelConfig[s.level].bg} ${levelConfig[s.level].color}`}>
                          {levelConfig[s.level].short} - {s.level}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
                          <AlertCircle size={12} />
                          Not Evaluated
                        </span>
                      )}
                      {hasChanges && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle size={12} />
                          Unsaved
                        </span>
                      )}
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 pt-4 border-t border-slate-100">
                        {/* Level Picker */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Performance Level</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(Object.entries(levelConfig) as [CBCLevel, typeof levelConfig[CBCLevel]][]).map(([lvl, config]) => {
                              const active = s.level === lvl;
                              
                              return (
                                <button
                                  key={lvl}
                                  onClick={() => updateLevel(s.id, lvl)}
                                  disabled={submitting}
                                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border text-center
                                    ${active 
                                      ? `${config.bg} ${config.color} ${config.border} shadow-sm ring-2 ring-emerald-500/10` 
                                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                  `}
                                >
                                  {config.short}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Observation */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Teacher's Observation</label>
                          <textarea
                            value={s.comment}
                            onChange={e => updateComment(s.id, e.target.value)}
                            placeholder="Add observation..."
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300"
                            disabled={submitting}
                          />
                        </div>

                        {/* Previous Assessment */}
                        {s.existingScore && (
                          <div className="text-xs bg-slate-50 p-3 rounded-lg">
                            <p className="font-medium text-slate-600 mb-1">Previous Assessment:</p>
                            <p>{mapScoreToLevel(s.existingScore)}</p>
                            {s.existingComment && (
                              <p className="text-slate-500 mt-1 italic">"{s.existingComment}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Table Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="text-slate-600">
                  Showing <span className="font-semibold">{filteredStudents.length}</span> of <span className="font-semibold">{students.length}</span> learners
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    disabled={submitting}
                  >
                    <X size={14} />
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-8 text-center">
            <div className="max-w-md mx-auto py-6 lg:py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-slate-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">No Learners Loaded</h3>
              <p className="text-sm text-slate-500 mb-6">
                {!assessmentConfig 
                  ? "Please configure strand and sub-strand for this assessment first."
                  : "Select a class, stream, subject, and assessment to load learners."}
              </p>
            </div>
          </Card>
        )}

        {/* Help Section - Collapsible on Mobile */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200"
          >
            <div className="flex items-center gap-2">
              <Info size={18} className="text-emerald-500" />
              <span className="font-semibold text-slate-700">Assessment Guide</span>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showHelp ? 'rotate-180' : ''}`} />
          </button>
          
          {showHelp && (
            <div className="mt-3 space-y-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  CBC Levels Guide
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
                    <span className="font-bold text-emerald-700">EE (4.0)</span>
                    <span className="text-emerald-600">Exceeding Expectation</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                    <span className="font-bold text-blue-700">ME (3.0)</span>
                    <span className="text-blue-600">Meeting Expectation</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
                    <span className="font-bold text-amber-700">AE (2.0)</span>
                    <span className="text-amber-600">Approaching Expectation</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
                    <span className="font-bold text-rose-700">BE (1.0)</span>
                    <span className="text-rose-600">Below Expectation</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Help Section */}
        <div className="hidden lg:grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              CBC Levels Guide
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-medium">EE (4.0):</span>
                <span className="text-emerald-600">Exceeding Expectation</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">ME (3.0):</span>
                <span className="text-blue-600">Meeting Expectation</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">AE (2.0):</span>
                <span className="text-amber-600">Approaching Expectation</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">BE (1.0):</span>
                <span className="text-rose-600">Below Expectation</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" />
              Assessment Notes
            </h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Strand & sub-strand must be selected</li>
              <li>• Use observations to note specific competencies</li>
              <li>• Lock assessment when marking is complete</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Info size={14} className="text-blue-500" />
              Quick Actions
            </h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Click EE/ME/AE/BE to set levels</li>
              <li>• Add observations for each learner</li>
              <li>• Submit all changed assessments at once</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CBCAssessment;