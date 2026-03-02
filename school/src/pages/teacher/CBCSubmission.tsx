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
import { cbcAPIS, academicAPI, teacherAPI } from '../../services/api';
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
}

interface TermOption {
  id: string;
  term_name: string;
  is_current: boolean;
  academic_year_id: string;
}

interface AcademicYearOption {
  id: string;
  year_name: string;
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
  subStrands?: SubStrand[];
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
  scale_code?: string;
  levels: RubricLevel[];
  is_system_default?: boolean;
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

// Assignment data structure from teacherAPI.getMyAssignments
interface AssignmentStream {
  id: string;
  name: string;
  class?: {
    id: string;
    class_name: string;
    class_level: number;
  };
}

interface AssignmentSubject {
  id: string;
  name: string;
  subject_code?: string;
}

interface Assignment {
  id: string;
  stream?: AssignmentStream;
  subjects?: AssignmentSubject[];
}

interface TermAssignments {
  term: {
    id: string;
    term_name: string;
    is_current: boolean;
    academic_year_id?: string;
  };
  assignments: Assignment[];
}

interface YearData {
  academic_year: {
    id: string;
    year_name: string;
    is_current: boolean;
  };
  terms: TermAssignments[];
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
  const [selectedRubricScale, setSelectedRubricScale] = useState<string>("");
  const [academicYearId, setAcademicYearId] = useState<string>("");
  
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
  
  // Data states — now derived from teacher assignments
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [allStreams, setAllStreams] = useState<StreamOption[]>([]);            // all streams across assignments
  const [filteredStreams, setFilteredStreams] = useState<StreamOption[]>([]);  // streams for selected class
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);        // all subjects across assignments
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectOption[]>([]); // subjects for selected class+stream
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Raw assignments cache for subject filtering
  const [rawAssignments, setRawAssignments] = useState<YearData[]>([]);
  
  // UI states
  const [showFilters, setShowFilters] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // ─────────────────────────────────────────────────────────────
  // INITIAL DATA — uses teacherAPI.getMyAssignments (same as ScoreSubmission)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchInitialData();
    fetchRubricScales();
  }, []);

  // Filter streams whenever selectedClass changes
  useEffect(() => {
    if (!selectedClass) {
      setFilteredStreams([]);
      setSelectedStream("");
      setFilteredSubjects([]);
      setSelectedSubject("");
      return;
    }

    const streamsForClass = allStreams.filter(s => s.class_id === selectedClass);
    setFilteredStreams(streamsForClass);
    setSelectedStream("");
    setFilteredSubjects([]);
    setSelectedSubject("");
  }, [selectedClass, allStreams]);

  // Filter subjects whenever selectedClass + selectedStream change
  useEffect(() => {
    if (!selectedClass || !selectedStream) {
      setFilteredSubjects([]);
      setSelectedSubject("");
      return;
    }

    // Find subjects from assignments that match selected class + stream
    const subjectMap = new Map<string, SubjectOption>();

    rawAssignments.forEach((yearData) => {
      yearData.terms.forEach((termData) => {
        termData.assignments.forEach((assignment) => {
          const streamClassId = assignment.stream?.class?.id;
          const streamId = assignment.stream?.id;

          if (streamClassId === selectedClass && streamId === selectedStream) {
            assignment.subjects?.forEach((subject) => {
              if (subject && !subjectMap.has(subject.id)) {
                subjectMap.set(subject.id, {
                  id: subject.id,
                  name: subject.name,
                  subject_code: subject.subject_code || subject.name.substring(0, 3).toUpperCase()
                });
              }
            });
          }
        });
      });
    });

    setFilteredSubjects(Array.from(subjectMap.values()));
    setSelectedSubject("");
  }, [selectedClass, selectedStream, rawAssignments]);

  // Fetch strands when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchStrandsForSubject();
    } else {
      setStrands([]);
      setSelectedStrand("");
      setSelectedSubStrand("");
      setAssessmentConfig(null);
    }
  }, [selectedSubject]);

  // Reset sub-strand when strand changes
  useEffect(() => {
    setSelectedSubStrand("");
  }, [selectedStrand]);

  // (default term is set directly inside fetchInitialData after the termMap is built)

  // ─────────────────────────────────────────────────────────────
  // FETCH: teacher's assigned classes/streams/subjects/terms
  // Mirrors the exact pattern used in ScoreSubmission.tsx
  // ─────────────────────────────────────────────────────────────
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const assignmentsResponse = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      if (assignmentsResponse.data.success) {
        const assignments: YearData[] = assignmentsResponse.data.data.assignments;

        // Cache raw assignments for later subject filtering
        setRawAssignments(assignments);

        const classMap  = new Map<string, ClassOption>();
        const streamMap = new Map<string, StreamOption>();
        const subjectMap = new Map<string, SubjectOption>();
        const termMap   = new Map<string, TermOption>();

        assignments.forEach((yearData) => {
          // academic_year_id lives on the year wrapper — confirmed from API response
          const yearId: string = yearData.academic_year.id;

          yearData.terms.forEach((termData) => {
            // Terms do NOT have their own academic_year_id — it comes from the parent year
            if (!termMap.has(termData.term.id)) {
              termMap.set(termData.term.id, {
                id: termData.term.id,
                term_name: termData.term.term_name,
                is_current: termData.term.is_current,
                academic_year_id: yearId   // ← always populated from parent
              });
            }

            termData.assignments.forEach((assignment) => {
              // Collect classes
              if (assignment.stream?.class && !classMap.has(assignment.stream.class.id)) {
                classMap.set(assignment.stream.class.id, {
                  id: assignment.stream.class.id,
                  class_name: assignment.stream.class.class_name,
                  class_level: assignment.stream.class.class_level || 0
                });
              }

              // Collect streams (with class_id for filtering)
              if (assignment.stream && !streamMap.has(assignment.stream.id)) {
                streamMap.set(assignment.stream.id, {
                  id: assignment.stream.id,
                  name: assignment.stream.name,
                  class_id: assignment.stream.class?.id || ""
                });
              }

              // Collect subjects (all, for global reference)
              assignment.subjects?.forEach((subject) => {
                if (subject && !subjectMap.has(subject.id)) {
                  subjectMap.set(subject.id, {
                    id: subject.id,
                    name: subject.name,
                    subject_code: subject.subject_code || subject.name.substring(0, 3).toUpperCase()
                  });
                }
              });
            });
          });
        });

        setClasses(Array.from(classMap.values()));
        setAllStreams(Array.from(streamMap.values()));
        setAllSubjects(Array.from(subjectMap.values()));
        setTerms(Array.from(termMap.values()));

        // Auto-select current term and always set academicYearId alongside it
        const allTerms = Array.from(termMap.values());
        const currentTerm = allTerms.find(t => t.is_current) || allTerms[0];
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
          // academic_year_id should now be resolved — log a warning if still missing
          if (currentTerm.academic_year_id) {
            setAcademicYearId(currentTerm.academic_year_id);
          } else {
            console.warn(
              "[CBCAssessment] academic_year_id missing on term — check API response shape.",
              currentTerm
            );
          }
        }

        if (Array.from(classMap.values()).length === 0) {
          setError("No active class assignments found. Please contact your administrator.");
        }
      } else {
        throw new Error(assignmentsResponse.data.error || 'Failed to load assignments');
      }
    } catch (error: any) {
      console.error('Error fetching teacher assignments:', error);
      setError(error.message || 'Failed to load required data. Please refresh the page.');
      setClasses([]);
      setAllStreams([]);
      setAllSubjects([]);
      setTerms([]);
    } finally {
      setLoading(false);
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
        const scales = response.data.data || [];
        setRubricScales(scales);
        
        const defaultScale = scales.find((scale: RubricScale) => scale.is_system_default);
        if (defaultScale) {
          setSelectedRubricScale(defaultScale.id);
          setSelectedRubric(defaultScale);
        } else if (scales.length > 0) {
          setSelectedRubricScale(scales[0].id);
          setSelectedRubric(scales[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching rubric scales:', error);
    } finally {
      setFetchingRubrics(false);
    }
  };

  const handleStrandModalOpen = () => {
    if (strands.length === 0) {
      setError("No strands available for this subject. Please configure strands first.");
      return;
    }
    if (rubricScales.length === 0) {
      setError("No rubric scales available. Please create a rubric scale first.");
      return;
    }
    setShowStrandModal(true);
  };

  const handleConfirmStrandSelection = () => {
    if (!selectedStrand || !selectedSubStrand) {
      setError("Please select both strand and sub-strand");
      return;
    }
    if (!selectedRubricScale) {
      setError("Please select a rubric scale");
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
  };

  const createAndLoadAssessment = async () => {
    if (!selectedClass || !selectedStream || !selectedSubject || !assessmentConfig || !selectedTerm || !selectedRubricScale) {
      setError("Please complete all selections including strand, sub-strand, and rubric scale");
      return;
    }

    // Resolve academicYearId: use state if set, otherwise look it up from the terms list
    const resolvedYearId =
      academicYearId ||
      terms.find(t => t.id === selectedTerm)?.academic_year_id ||
      "";

    if (!resolvedYearId) {
      setError(
        "Academic year could not be determined for the selected term. " +
        "Please try re-selecting the term, or contact your administrator."
      );
      return;
    }

    try {
      setFetchingStudents(true);
      setError(null);
      setStudents([]);

      const subject    = filteredSubjects.find(s => s.id === selectedSubject);
      const className  = classes.find(c => c.id === selectedClass)?.class_name || "";
      const streamName = filteredStreams.find(s => s.id === selectedStream)?.name || "";

      const assessmentData = {
        title: `${assessmentConfig.strandName} - ${assessmentConfig.subStrandName}`,
        description: `CBC Assessment for ${subject?.name || selectedSubject} - ${className} ${streamName}`,
        assessmentType: 'formative',
        subjectId: selectedSubject,
        classId: selectedClass,
        streamId: selectedStream,
        strandId: assessmentConfig.strandId,
        subStrandId: assessmentConfig.subStrandId,
        termId: selectedTerm,
        academicYearId: resolvedYearId,
        rubricScaleId: selectedRubricScale
      };

      const createResponse = await cbcAPIS.createCbcAssessment(assessmentData);
      
      if (createResponse.data?.success) {
        const newAssessmentId = createResponse.data.data.id;
        setCurrentAssessmentId(newAssessmentId);
        
        const markingResponse = await cbcAPIS.getCbcMarkingSheet(newAssessmentId);
        
        if (markingResponse.data?.success) {
          const data: MarkingSheetResponse = markingResponse.data.data;

          const studentList: Student[] = data.markingSheet.map(item => {
            let level: CBCLevel | "" = "";
            if (item.currentLevel) {
              const levelName = item.currentLevel.level_name;
              if (levelName.includes('Exceeding') || levelName.includes('EE')) level = "Exceeding Expectation";
              else if (levelName.includes('Meeting') || levelName.includes('ME')) level = "Meeting Expectation";
              else if (levelName.includes('Approaching') || levelName.includes('AE')) level = "Approaching Expectation";
              else if (levelName.includes('Below') || levelName.includes('BE')) level = "Below Expectation";
            }
            
            return {
              id: item.student.id,
              learnerAssessmentId: item.id,
              admissionNo: item.student.admission_number,
              name: `${item.student.first_name} ${item.student.last_name}`,
              level,
              comment: item.teacherComment || "",
              existingScore: item.currentLevel?.level_number || null,
              existingComment: item.teacherComment || ""
            };
          });

          setStudents(studentList);
          
          if (studentList.length > 0) {
            setSuccessMessage(`Created assessment and loaded ${studentList.length} learners`);
            setTimeout(() => setSuccessMessage(null), 3000);
            // Collapse filters on mobile once students are loaded
            setShowFilters(false);
          } else {
            setWarnings(["No learners found for this assessment"]);
          }
        }
      } else {
        throw new Error(createResponse.data?.error || "Failed to create assessment");
      }
    } catch (error: any) {
      console.error('Error creating assessment:', error);
      setError(error.message || "Failed to create assessment. Please try again.");
    } finally {
      setFetchingStudents(false);
    }
  };

  const updateLevel = (id: string, level: CBCLevel) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, level } : s));
  };

  const updateComment = (id: string, comment: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, comment } : s));
  };

  const handleSubmitScores = async () => {
    if (!currentAssessmentId) {
      setError("No active assessment found");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const getRubricLevelId = (level: CBCLevel): string | null => {
        if (!selectedRubric) return null;
        const levelNum = levelConfig[level].score;
        const rubricLevel = selectedRubric.levels.find(l => l.level_number === levelNum);
        return rubricLevel?.id || null;
      };

      const assessments = students
        .filter(student => {
          const hasLevel = student.level !== "";
          const levelChanged = student.level !== mapScoreToLevel(student.existingScore);
          const commentChanged = student.comment !== student.existingComment;
          return hasLevel && (levelChanged || commentChanged);
        })
        .map(student => {
          const rubricLevelId = getRubricLevelId(student.level as CBCLevel);
          return {
            learnerAssessmentId: student.learnerAssessmentId || "",
            rubricLevelId: rubricLevelId || undefined,
            teacherComment: student.comment || "",
            hasEvidence: false
          };
        })
        .filter(a => a.rubricLevelId);

      if (assessments.length === 0) {
        setError("No valid changes to submit. Please evaluate learners with proper levels.");
        return;
      }

      const response = await cbcAPIS.submitCbcLearnerAssessmentsBatch(
        currentAssessmentId,
        { assessments }
      );
      
      if (response.data?.success) {
        setSuccessMessage(`Successfully submitted ${assessments.length} assessments`);
        
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

  const handleLockAssessment = async () => {
    if (!currentAssessmentId) return;
    
    try {
      setSubmitting(true);
      const response = await cbcAPIS.lockCbcAssessment(currentAssessmentId);
      
      if (response.data?.success) {
        setSuccessMessage("Assessment locked successfully. No further edits allowed.");
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
    setSelectedSubject("");
    setSelectedStrand("");
    setSelectedSubStrand("");
    setAssessmentConfig(null);
    setCurrentAssessmentId("");
    setError(null);
    setWarnings([]);
    setSearchQuery("");
    setRawAssignments([]);
    fetchInitialData();
    fetchRubricScales();
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
  const pendingCount   = students.filter(s => s.level === "").length;
  const changedCount   = students.filter(s => {
    const hasLevel       = s.level !== "";
    const levelChanged   = s.level !== mapScoreToLevel(s.existingScore);
    const commentChanged = s.comment !== s.existingComment;
    return hasLevel && (levelChanged || commentChanged);
  }).length;

  const selectedSubjectName = filteredSubjects.find(s => s.id === selectedSubject)?.name || "";
  const selectedClassName   = classes.find(c => c.id === selectedClass)?.class_name || "";
  const selectedStreamName  = filteredStreams.find(s => s.id === selectedStream)?.name || "";
  const selectedTermName    = terms.find(t => t.id === selectedTerm)?.term_name || "";

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
              <div className="px-4 border-r border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-semibold">Evaluated</p>
                <p className="text-base font-bold text-slate-800">{evaluatedCount}/{students.length}</p>
              </div>
              <div className="px-4 border-r border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-semibold">Pending</p>
                <p className="text-base font-bold text-amber-600">{pendingCount}</p>
              </div>
              <div className="px-4 text-center">
                <p className="text-xs text-slate-500 font-semibold">To Save</p>
                <p className="text-base font-bold text-emerald-600">{changedCount}</p>
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

        {/* Error / Success / Warnings */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start lg:items-center justify-between gap-3">
            <div className="flex items-start lg:items-center gap-3 flex-1">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5 lg:mt-0" size={20} />
              <span className="text-red-700 text-sm lg:text-base font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0">
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
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start lg:items-center justify-between gap-3">
            <div className="flex items-start lg:items-center gap-3 flex-1">
              <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5 lg:mt-0" size={20} />
              <span className="text-emerald-700 text-sm lg:text-base font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="p-1 hover:bg-emerald-100 rounded transition-colors flex-shrink-0">
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {/* Class Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block">
                  Class <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-black shadow-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={loading || submitting}
                >
                  <option value="" disabled>
                    {loading ? "Loading assigned classes..." : classes.length === 0 ? "No assigned classes" : "Select class"}
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name}{cls.class_level > 0 ? ` (Level ${cls.class_level})` : ""}
                    </option>
                  ))}
                </select>
                {classes.length === 0 && !loading && (
                  <p className="text-xs text-slate-400 ml-1">No assigned classes found.</p>
                )}
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
                  disabled={!selectedClass || filteredStreams.length === 0 || submitting}
                >
                  <option value="">
                    {!selectedClass ? "Select class first" : filteredStreams.length === 0 ? "No streams available" : "Select Stream..."}
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
                  disabled={!selectedClass || !selectedStream || filteredSubjects.length === 0 || submitting}
                >
                  <option value="">
                    {!selectedStream ? "Select stream first" : filteredSubjects.length === 0 ? "No subjects assigned" : "Select Subject..."}
                  </option>
                  {filteredSubjects.map(subj => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name} ({subj.subject_code})
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
                  onChange={e => {
                    const termId = e.target.value;
                    setSelectedTerm(termId);
                    const term = terms.find(t => t.id === termId);
                    if (term?.academic_year_id) {
                      setAcademicYearId(term.academic_year_id);
                    } else {
                      console.warn(
                        "[CBCAssessment] Selected term has no academic_year_id — check API response.",
                        term
                      );
                    }
                  }}
                  disabled={loading || terms.length === 0 || submitting}
                >
                  <option value="">{terms.length === 0 ? "No terms" : "Select Term..."}</option>
                  {terms.map(term => (
                    <option key={term.id} value={term.id}>
                      {term.term_name} {term.is_current && "(Current)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Configure Strand Button */}
            {selectedSubject && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleStrandModalOpen}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  disabled={fetchingStrands || submitting}
                >
                  {fetchingStrands ? <Loader2 size={18} className="animate-spin" /> : <GitBranch size={18} />}
                  {assessmentConfig ? "Change Strand/Sub-strand" : "Configure Strand & Sub-strand"}
                </button>
              </div>
            )}

            {/* Current Configuration Display */}
            {assessmentConfig && (
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <h3 className="text-sm font-bold text-emerald-800 mb-2">Assessment Configuration:</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-600">Strand:</span>
                    <span className="text-emerald-700">{assessmentConfig.strandName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-600">Sub-strand:</span>
                    <span className="text-emerald-700">{assessmentConfig.subStrandName}</span>
                  </div>
                  {selectedRubric && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-600">Rubric:</span>
                      <span className="text-emerald-700">{selectedRubric.scale_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create and Load Assessment Button */}
            {selectedClass && selectedStream && selectedSubject && selectedTerm && assessmentConfig && selectedRubricScale && (
              <button
                onClick={createAndLoadAssessment}
                disabled={fetchingStudents || submitting}
                className="w-full py-3 lg:py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm lg:text-base"
              >
                {fetchingStudents ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating Assessment & Loading Learners...
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    Create Assessment & Load Learners
                  </>
                )}
              </button>
            )}

            {/* Selection Summary - Mobile */}
            {(selectedClass || selectedSubject || selectedTerm) && (
              <div className="lg:hidden pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Selected:</h3>
                <div className="space-y-1 text-xs">
                  {selectedClassName  && <p>• Class: {selectedClassName}</p>}
                  {selectedStreamName && <p>• Stream: {selectedStreamName}</p>}
                  {selectedSubjectName && <p>• Subject: {selectedSubjectName}</p>}
                  {selectedTermName   && <p>• Term: {selectedTermName}</p>}
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
            <div className="bg-white rounded-2xl lg:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 lg:p-8 shadow-2xl">
              <div className="flex items-start lg:items-center justify-between mb-4 lg:mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-50 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-black text-slate-800">Configure Assessment</h2>
                    <p className="text-xs lg:text-sm text-slate-500">Select strand, sub-strand, and rubric scale</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStrandModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {fetchingStrands || fetchingRubrics ? (
                <div className="py-8 lg:py-12 text-center">
                  <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-sm lg:text-base text-slate-600 font-medium">Loading...</p>
                </div>
              ) : strands.length === 0 ? (
                <div className="py-8 lg:py-12 text-center">
                  <AlertCircle size={32} className="text-amber-500 mx-auto mb-4" />
                  <p className="text-sm lg:text-base text-slate-600 font-medium">No strands found</p>
                  <p className="text-xs lg:text-sm text-slate-400 mt-2">Please configure strands in curriculum setup</p>
                </div>
              ) : rubricScales.length === 0 ? (
                <div className="py-8 lg:py-12 text-center">
                  <AlertCircle size={32} className="text-amber-500 mx-auto mb-4" />
                  <p className="text-sm lg:text-base text-slate-600 font-medium">No rubric scales found</p>
                  <p className="text-xs lg:text-sm text-slate-400 mt-2">Please create a rubric scale first</p>
                </div>
              ) : (
                <div className="space-y-4 lg:space-y-6">
                  {/* Rubric Scale Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block">
                      Rubric Scale <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={selectedRubricScale}
                      onChange={(e) => {
                        setSelectedRubricScale(e.target.value);
                        const rubric = rubricScales.find(r => r.id === e.target.value);
                        setSelectedRubric(rubric || null);
                      }}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                      <option value="">Select Rubric Scale...</option>
                      {rubricScales.map(rubric => (
                        <option key={rubric.id} value={rubric.id}>
                          {rubric.scale_name} ({rubric.levels.length} levels) {rubric.is_system_default ? "(Default)" : ""}
                        </option>
                      ))}
                    </select>
                    {selectedRubric && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedRubric.levels.map(level => (
                          <span 
                            key={level.id}
                            className="text-xs px-2 py-1 rounded-full"
                            style={{ backgroundColor: level.color_code || '#E5E7EB', color: '#1F2937' }}
                          >
                            {level.level_code || level.level_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

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
                      disabled={!selectedStrand || !selectedSubStrand || !selectedRubricScale}
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
            {assessmentConfig && selectedRubric && (
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
                  <div className="hidden lg:block w-px h-4 bg-emerald-200"></div>
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <BookOpen size={14} className="text-purple-600 flex-shrink-0" />
                    <span className="font-medium text-purple-700">Rubric:</span>
                    <span className="text-slate-700 truncate max-w-[150px] lg:max-w-none">{selectedRubric.scale_name}</span>
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
                {searchQuery && <span className="ml-2">• Filtered by: "{searchQuery}"</span>}
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
                            <span className="text-xs text-slate-400 font-medium">Saved</span>
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

                    {isExpanded && (
                      <div className="mt-4 space-y-4 pt-4 border-t border-slate-100">
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
                  ? "Please configure strand, sub-strand, and rubric scale first."
                  : "Click 'Create Assessment & Load Learners' to begin."}
              </p>
            </div>
          </Card>
        )}

        {/* Help Section - Mobile */}
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
                  {(Object.entries(levelConfig) as [CBCLevel, typeof levelConfig[CBCLevel]][]).map(([lvl, cfg]) => (
                    <div key={lvl} className={`flex justify-between items-center p-2 ${cfg.bg} rounded-lg`}>
                      <span className={`font-bold ${cfg.color}`}>{cfg.short} ({cfg.score}.0)</span>
                      <span className={cfg.color}>{lvl}</span>
                    </div>
                  ))}
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
              {(Object.entries(levelConfig) as [CBCLevel, typeof levelConfig[CBCLevel]][]).map(([lvl, cfg]) => (
                <div key={lvl} className="flex justify-between items-center">
                  <span className="font-medium">{cfg.short} ({cfg.score}.0):</span>
                  <span className={cfg.color}>{lvl}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" />
              Assessment Notes
            </h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Only your assigned classes are shown</li>
              <li>• Strand, sub-strand, and rubric must be selected</li>
              <li>• Assessment is created automatically when you load learners</li>
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