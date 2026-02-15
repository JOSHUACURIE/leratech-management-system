// pages/teacher/CBCAssessment.tsx
import React, { useEffect, useState } from "react";
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
  CheckSquare
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cbcAPI } from '../../services/api';
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
}

interface TermOption {
  id: string;
  name: string;
  is_current: boolean;
}

interface Strand {
  id: string;
  name: string;
  code: string;
  subStrands: SubStrand[];
}

interface SubStrand {
  id: string;
  name: string;
  code: string;
  strand_id: string;
}

interface AssessmentOption {
  id: string;
  title: string;
  type: string;
  schemeTopicId?: string;
  // CBC specific fields
  strand_id?: string;
  sub_strand_id?: string;
}

interface AssessmentConfig {
  strandId: string;
  subStrandId: string;
  strandName: string;
  subStrandName: string;
}

const levelConfig: Record<CBCLevel, { color: string; bg: string; border: string }> = {
  "Exceeding Expectation": { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Meeting Expectation": { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  "Approaching Expectation": { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  "Below Expectation": { color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

const CBCAssessment: React.FC = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fetchingStreams, setFetchingStreams] = useState<boolean>(false);
  const [fetchingSubjects, setFetchingSubjects] = useState<boolean>(false);
  const [fetchingStrands, setFetchingStrands] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Selection states
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState("");
  
  // NEW: Strand/Sub-strand states
  const [showStrandModal, setShowStrandModal] = useState(false);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [selectedStrand, setSelectedStrand] = useState("");
  const [selectedSubStrand, setSelectedSubStrand] = useState("");
  const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig | null>(null);
  
  // Data states
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [streams, setStreams] = useState<StreamOption[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<StreamOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [assessments, setAssessments] = useState<AssessmentOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch streams when class changes
  useEffect(() => {
    const fetchStreamsForClass = async () => {
      if (selectedClass) {
        try {
          setFetchingStreams(true);
          const streamsRes = await cbcAPI.getStreams(selectedClass);
          
          if (streamsRes.data.success) {
            setStreams(streamsRes.data.data);
            const filtered = streamsRes.data.data.filter((stream: StreamOption) => stream.class_id === selectedClass);
            setFilteredStreams(filtered);
            
            if (filtered.length === 1) {
              setSelectedStream(filtered[0].id);
            } else if (filtered.length === 0) {
              setSelectedStream("");
            }
          }
        } catch (error: any) {
          console.error('Error fetching streams:', error);
          setError("Failed to load streams for selected class");
          setStreams([]);
          setFilteredStreams([]);
        } finally {
          setFetchingStreams(false);
        }
      } else {
        setStreams([]);
        setFilteredStreams([]);
        setSelectedStream("");
      }
    };

    fetchStreamsForClass();
  }, [selectedClass]);

  // Fetch subjects when class and stream change
  useEffect(() => {
    const fetchSubjectsForClassStream = async () => {
      if (selectedClass && selectedStream) {
        try {
          setFetchingSubjects(true);
          const subjectsRes = await cbcAPI.getSubjects(selectedClass, selectedStream);
          
          if (subjectsRes.data.success) {
            setSubjects(subjectsRes.data.data);
          } else {
            setSubjects([]);
          }
        } catch (error: any) {
          console.error('Error fetching subjects:', error);
          setError("Failed to load subjects");
          setSubjects([]);
        } finally {
          setFetchingSubjects(false);
        }
      } else {
        setSubjects([]);
      }
    };

    fetchSubjectsForClassStream();
  }, [selectedClass, selectedStream]);

  // Fetch assessments when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchAssessmentsForSubject(selectedSubject);
    }
  }, [selectedSubject]);

  // NEW: Fetch strands when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchStrandsForSubject(selectedSubject);
    }
  }, [selectedSubject]);

  // NEW: Reset sub-strand when strand changes
  useEffect(() => {
    setSelectedSubStrand("");
  }, [selectedStrand]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesRes, termsRes] = await Promise.all([
        cbcAPI.getClasses(),
        cbcAPI.getTerms()
      ]);

      if (classesRes.data.success) {
        setClasses(classesRes.data.data);
      }

      if (termsRes.data.success) {
        setTerms(termsRes.data.data);
        const currentTerm = termsRes.data.data.find((term: TermOption) => term.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }
      }

    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError(error.message || 'Failed to load required data');
      setClasses([]);
      setTerms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentsForSubject = async (subjectId: string) => {
    try {
      const assessmentsResponse = await cbcAPI.getAssessmentsBySubject(subjectId, {
        type: 'CBC_EVALUATION'
      });
      
      if (assessmentsResponse.data.success) {
        setAssessments(assessmentsResponse.data.data);
        
        if (assessmentsResponse.data.data.length > 0 && !selectedAssessment) {
          setSelectedAssessment(assessmentsResponse.data.data[0].id);
        }
      } else {
        setAssessments([]);
        setError("No CBC assessments found for this subject");
      }
    } catch (error: any) {
      console.error('Error fetching assessments:', error);
      setError("Failed to load assessments. Please try again.");
      setAssessments([]);
    }
  };

  // NEW: Fetch strands and sub-strands for subject
  const fetchStrandsForSubject = async (subjectId: string) => {
    try {
      setFetchingStrands(true);
      const strandsResponse = await cbcAPI.getStrandsBySubject(subjectId);
      
      if (strandsResponse.data.success) {
        setStrands(strandsResponse.data.data);
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

  // NEW: Handle assessment selection - show modal if strand/sub-strand needed
  const handleAssessmentSelect = (assessmentId: string) => {
    setSelectedAssessment(assessmentId);
    
    // Check if assessment already has strand/sub-strand configured
    const assessment = assessments.find(a => a.id === assessmentId);
    
    // If assessment doesn't have strand/sub-strand, show modal
    if (assessment && (!assessment.strand_id || !assessment.sub_strand_id)) {
      setShowStrandModal(true);
    } else if (assessment) {
      // Assessment already configured
      setAssessmentConfig({
        strandId: assessment.strand_id!,
        subStrandId: assessment.sub_strand_id!,
        strandName: "", // Would need to fetch names
        subStrandName: ""
      });
    }
  };

  // NEW: Confirm strand/sub-strand selection
  const handleConfirmStrandSelection = () => {
    if (!selectedStrand || !selectedSubStrand) {
      setError("Please select both strand and sub-strand");
      return;
    }

    const strand = strands.find(s => s.id === selectedStrand);
    const subStrand = strand?.subStrands.find(ss => ss.id === selectedSubStrand);

    setAssessmentConfig({
      strandId: selectedStrand,
      subStrandId: selectedSubStrand,
      strandName: strand?.name || "",
      subStrandName: subStrand?.name || ""
    });

    setShowStrandModal(false);
  };

  const fetchStudentsForMarking = async () => {
    try {
      setLoading(true);
      setError(null);
      setStudents([]);

      // Validate required selections including strand/sub-strand
      if (!selectedClass || !selectedStream || !selectedAssessment || !assessmentConfig) {
        setError("Please complete all selections including strand and sub-strand");
        return;
      }

      const studentsResponse = await cbcAPI.getStudentsForMarking({
        assessmentId: selectedAssessment,
        streamId: selectedStream,
        strandId: assessmentConfig.strandId,
        subStrandId: assessmentConfig.subStrandId
      });

      if (studentsResponse.data.success) {
        const apiStudents: Student[] = studentsResponse.data.data.map((student: any) => {
          const score = student.currentEvaluation?.score;
          let level: CBCLevel | "" = "";
          
          if (score !== null && score !== undefined) {
            if (score >= 3.5) level = "Exceeding Expectation";
            else if (score >= 2.5) level = "Meeting Expectation";
            else if (score >= 1.5) level = "Approaching Expectation";
            else level = "Below Expectation";
          }

          return {
            id: student.id,
            admissionNo: student.adm,
            name: student.name,
            level: level,
            comment: student.currentEvaluation?.teacher_notes || "",
            existingScore: student.currentEvaluation?.score || null,
            existingComment: student.currentEvaluation?.teacher_notes || ""
          };
        });

        setStudents(apiStudents);
        
        if (apiStudents.length > 0) {
          setSuccessMessage(`Loaded ${apiStudents.length} learners for assessment`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError("No learners found for this assessment");
        }
      } else {
        throw new Error(studentsResponse.data.error || "Failed to load learners");
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      
      if (error.response?.status === 404) {
        setError("No learners found for the selected criteria");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to assess this class");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to load learners. Please try again.");
      }
      
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

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

      const levelToScore = (level: CBCLevel): number => {
        switch(level) {
          case "Exceeding Expectation": return 4;
          case "Meeting Expectation": return 3;
          case "Approaching Expectation": return 2;
          case "Below Expectation": return 1;
          default: return 0;
        }
      };

      const scoresToSubmit = students
        .filter(student => {
          const hasLevel = student.level !== "";
          const levelChanged = student.level !== mapScoreToLevel(student.existingScore);
          const commentChanged = student.comment !== student.existingComment;
          return hasLevel && (levelChanged || commentChanged);
        })
        .map(student => ({
          studentId: student.id,
          assessmentId: selectedAssessment,
          score: levelToScore(student.level as CBCLevel),
          teacherNotes: student.comment || "",
          termId: selectedTerm,
          classId: selectedClass,
          streamId: selectedStream,
          strandId: assessmentConfig?.strandId,
          subStrandId: assessmentConfig?.subStrandId
        }));

      if (scoresToSubmit.length === 0) {
        setError("No new assessments to submit. Please evaluate learners first.");
        return;
      }

      const response = await cbcAPI.submitScoresBatch(scoresToSubmit);
      
      if (response.data.success) {
        setSuccessMessage(`Successfully submitted ${scoresToSubmit.length} assessments`);
        
        setStudents(prev => prev.map(student => {
          const submittedStudent = scoresToSubmit.find(s => s.studentId === student.id);
          if (submittedStudent) {
            return {
              ...student,
              existingScore: levelToScore(student.level as CBCLevel),
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

  const handleRefresh = () => {
    setStudents([]);
    setSelectedClass("");
    setSelectedStream("");
    setSelectedAssessment("");
    setSelectedSubject("");
    setSelectedStrand("");
    setSelectedSubStrand("");
    setAssessmentConfig(null);
    fetchInitialData();
  };

  const mapScoreToLevel = (score: number | null | undefined): CBCLevel | "" => {
    if (score === null || score === undefined) return "";
    if (score >= 3.5) return "Exceeding Expectation";
    if (score >= 2.5) return "Meeting Expectation";
    if (score >= 1.5) return "Approaching Expectation";
    return "Below Expectation";
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
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
  const selectedAssessmentTitle = assessments.find(a => a.id === selectedAssessment)?.title || "";
  const selectedTermName = terms.find(t => t.id === selectedTerm)?.name || "";

  if (loading && students.length === 0) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-700">Loading CBC Assessment</h2>
          <p className="text-slate-500 mt-2">Preparing the assessment interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header - unchanged */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          {selectedClassName && selectedStreamName && (
            <p className="text-sm text-slate-600 mt-1">
              Class: <span className="font-medium">{selectedClassName}</span>
              {selectedStreamName && <span className="ml-2">Stream: <span className="font-medium">{selectedStreamName}</span></span>}
              {selectedTermName && <span className="ml-2">Term: <span className="font-medium">{selectedTermName}</span></span>}
            </p>
          )}
          {/* NEW: Show selected strand/sub-strand */}
          {assessmentConfig && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                <GitBranch size={12} />
                {assessmentConfig.strandName}
              </span>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                <ListTree size={12} />
                {assessmentConfig.subStrandName}
              </span>
            </div>
          )}
        </div>
        
        {students.length > 0 && (
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-4 border-r border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-semibold">Evaluated</p>
              <p className="text-sm font-bold text-slate-800">{evaluatedCount} / {students.length}</p>
            </div>
            <div className="px-4 border-r border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-semibold">Pending</p>
              <p className="text-sm font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="px-4 text-center">
              <p className="text-xs text-slate-500 font-semibold">To Save</p>
              <p className="text-sm font-bold text-emerald-600">{changedCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error/Success Messages - unchanged */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded transition-colors"
          >
            <X size={16} className="text-red-500" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-600" size={20} />
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

      {/* Selection Panel */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Selection Criteria</h2>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Class Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Class</label>
            <select 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              disabled={loading || classes.length === 0 || submitting}
            >
              <option value="">{classes.length === 0 ? "No classes" : "Select Class..."}</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} (Level {cls.level})
                </option>
              ))}
            </select>
          </div>

          {/* Stream Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Stream</label>
            <select 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Subject</label>
            <select 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              disabled={!selectedClass || !selectedStream || fetchingSubjects || subjects.length === 0 || submitting}
            >
              <option value="">
                {fetchingSubjects ? "Loading..." : (subjects.length === 0 ? "No subjects" : "Select Subject...")}
              </option>
              {subjects.map(subj => (
                <option key={subj.id} value={subj.id}>
                  {subj.name} ({subj.code})
                </option>
              ))}
            </select>
          </div>

          {/* Term Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Term</label>
            <select 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
              value={selectedTerm}
              onChange={e => setSelectedTerm(e.target.value)}
              disabled={loading || terms.length === 0 || submitting}
            >
              <option value="">{terms.length === 0 ? "No terms" : "Select Term..."}</option>
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.name} {term.is_current && "(Current)"}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assessment</label>
            <select 
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer disabled:opacity-50"
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

        {/* Load Students Button - Only enabled when strand/sub-strand selected */}
        {selectedClass && selectedStream && selectedSubject && selectedAssessment && assessmentConfig && (
          <button
            onClick={fetchStudentsForMarking}
            disabled={loading || submitting}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
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

        {/* Current Selection Summary */}
        {(selectedClass || selectedSubject || selectedAssessment) && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Current Selection:</h3>
            <div className="space-y-1 text-sm text-slate-700">
              {selectedClassName && <p>• Class: <span className="font-medium">{selectedClassName}</span></p>}
              {selectedStreamName && <p>• Stream: <span className="font-medium">{selectedStreamName}</span></p>}
              {selectedSubjectName && <p>• Subject: <span className="font-medium">{selectedSubjectName}</span></p>}
              {selectedAssessmentTitle && <p>• Assessment: <span className="font-medium">{selectedAssessmentTitle}</span></p>}
              {selectedTermName && <p>• Term: <span className="font-medium">{selectedTermName}</span></p>}
            </div>
          </div>
        )}
      </Card>

      {/* NEW: Strand/Sub-strand Modal */}
      {showStrandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <BookOpen className="text-emerald-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Configure Assessment</h2>
                  <p className="text-sm text-slate-500">Select strand and sub-strand for this assessment</p>
                </div>
              </div>
              <button
                onClick={() => setShowStrandModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {fetchingStrands ? (
              <div className="py-12 text-center">
                <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Loading strands...</p>
              </div>
            ) : strands.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle size={32} className="text-amber-500 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No strands found for this subject</p>
                <p className="text-sm text-slate-400 mt-2">Please configure strands in the curriculum setup</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Strand Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
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
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
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
                        ?.subStrands.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowStrandModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmStrandSelection}
                    disabled={!selectedStrand || !selectedSubStrand}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Assessment Table - unchanged but shows strand context */}
      {students.length > 0 ? (
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[3rem] p-0 overflow-hidden bg-white">
          {/* Assessment Context Header - NEW */}
          {assessmentConfig && (
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-emerald-100">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <GitBranch size={14} className="text-emerald-600" />
                  <span className="font-medium text-emerald-700">Strand:</span>
                  <span className="text-slate-700">{assessmentConfig.strandName}</span>
                </div>
                <div className="w-px h-4 bg-emerald-200"></div>
                <div className="flex items-center gap-2">
                  <ListTree size={14} className="text-blue-600" />
                  <span className="font-medium text-blue-700">Sub-strand:</span>
                  <span className="text-slate-700">{assessmentConfig.subStrandName}</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300"
                disabled={submitting}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs font-bold text-slate-400">
                Total Learners: <span className="text-slate-900">{students.length}</span>
                {searchQuery && (
                  <span className="ml-2">
                    • Filtered: <span className="text-emerald-600">{filteredStudents.length}</span>
                  </span>
                )}
              </div>
              <button
                onClick={handleSubmitScores}
                disabled={submitting || changedCount === 0}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Submit {changedCount > 0 ? `${changedCount} Changes` : 'Assessments'}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Learner Details</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Performance Level</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Teacher's Observation</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((s) => {
                  const hasChanges = s.level !== "" && (s.level !== mapScoreToLevel(s.existingScore) || s.comment !== s.existingComment);
                  const existingLevel = mapScoreToLevel(s.existingScore);
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                      {/* Learner Info */}
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{s.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s.admissionNo}</p>
                          </div>
                        </div>
                      </td>

                      {/* Performance Level Picker */}
                      <td className="px-6 py-6">
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(levelConfig) as CBCLevel[]).map((lvl) => {
                            const active = s.level === lvl;
                            const config = levelConfig[lvl];
                            
                            return (
                              <button
                                key={lvl}
                                onClick={() => updateLevel(s.id, lvl)}
                                disabled={submitting}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border
                                  ${active 
                                    ? `${config.bg} ${config.color} ${config.border} shadow-sm ring-2 ring-emerald-500/10` 
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                                  }
                                  ${hasChanges ? 'animate-pulse ring-2 ring-emerald-500/20' : ''}
                                  disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                              >
                                {lvl === "Exceeding Expectation" && "EE"}
                                {lvl === "Meeting Expectation" && "ME"}
                                {lvl === "Approaching Expectation" && "AE"}
                                {lvl === "Below Expectation" && "BE"}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <p className={`text-[11px] font-bold ${s.level ? levelConfig[s.level as CBCLevel].color : 'text-slate-300 italic'}`}>
                            {s.level || "Pending Assessment"}
                          </p>
                          {existingLevel && s.level === existingLevel && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Saved
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Observations */}
                      <td className="px-6 py-6 min-w-[300px]">
                        <div className="relative group/input">
                          <MessageSquare size={14} className="absolute left-3 top-3 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors" />
                          <input
                            type="text"
                            value={s.comment}
                            onChange={e => updateComment(s.id, e.target.value)}
                            placeholder="Individual learner observation..."
                            disabled={submitting}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-300 transition-all disabled:opacity-50"
                          />
                          {s.comment !== s.existingComment && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                          {s.level === "" ? (
                            <span className="text-amber-600 text-xs font-semibold flex items-center gap-1">
                              <AlertCircle size={12} />
                              Not Evaluated
                            </span>
                          ) : hasChanges ? (
                            <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                              <CheckCircle size={12} />
                              Changes Pending
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs font-semibold">
                              Up to Date
                            </span>
                          )}
                          {s.existingScore && (
                            <span className="text-[10px] text-slate-400">
                              Previous: {existingLevel}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              Showing <span className="font-semibold">{filteredStudents.length}</span> of <span className="font-semibold">{students.length}</span> learners
              {searchQuery && (
                <span className="ml-2">
                  • Filtered by: "<span className="font-medium">{searchQuery}</span>"
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={!searchQuery || submitting}
              >
                Clear Search
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-8 text-center">
          <div className="max-w-md mx-auto py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-slate-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No Learners Loaded</h3>
            <p className="text-slate-500 mb-6">
              {!assessmentConfig 
                ? "Please configure strand and sub-strand for this assessment first."
                : "Select a class, stream, subject, and assessment to load learners for CBC assessment."}
            </p>
            {(!selectedClass || !selectedStream || !selectedSubject || !selectedAssessment) && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                <AlertCircle size={16} />
                <span>Complete all selection criteria to load learners</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Help Section - unchanged */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500" />
            CBC Levels Guide
          </h4>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="font-medium">EE (4.0):</span>
              <span>Exceeding Expectation</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">ME (3.0):</span>
              <span>Meeting Expectation</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">AE (2.0):</span>
              <span>Approaching Expectation</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">BE (1.0):</span>
              <span>Below Expectation</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            Assessment Notes
          </h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Strand & sub-strand must be selected for each assessment</li>
            <li>• Use observations to note specific competencies</li>
            <li>• Assessments are saved immediately upon submission</li>
            <li>• You can edit assessments before final submission</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Info size={14} className="text-blue-500" />
            Quick Actions
          </h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Click EE/ME/AE/BE buttons to set levels</li>
            <li>• Add observations for each learner</li>
            <li>• Submit all changed assessments at once</li>
            <li>• Strand/Sub-strand context shown in assessment</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CBCAssessment;