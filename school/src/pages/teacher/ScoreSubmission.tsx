// pages/teacher/ScoreSubmission.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Card from "../../components/common/Card";
import { 
  Save, 
  Search, 
  Users, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  BookOpen,
  Hash,
  Calendar,
  X,
  RefreshCw,
  FileText,
  Percent,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { teacherAPI } from "../../services/api";

// Define types
interface Student {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  existingScore: string | number;
  existingNotes: string;
  score: string | number;
  grade?: string;
  points?: number;
  remarks?: string;
}

interface ClassOption {
  id: string;
  name: string;
  level: number;
}

interface StreamOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface AssessmentOption {
  id: string;
  title: string;
  max_score: number;
  type: string;
  uuid?: string;
  displayId?: string;
}

interface TermOption {
  id: string;
  name: string;
  is_current: boolean;
}

// Helper function to extract UUID from assessment ID
const extractUUID = (assessmentId: string): string => {
  if (!assessmentId) return "";
  const match = assessmentId.match(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
  return match ? match[1] : assessmentId;
};

const ScoreSubmission: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectId } = useParams<{ subjectId?: string }>();

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Selection states
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  
  // Data states
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [streams, setStreams] = useState<StreamOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [assessments, setAssessments] = useState<AssessmentOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Mobile view state
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Get subject from URL params if available
  useEffect(() => {
    if (subjectId) {
      setSelectedSubject(subjectId);
      const subjectName = new URLSearchParams(location.search).get("subjectName");
      if (subjectName) {
        // Subject name from URL can be used for display
      }
    }
  }, [subjectId, location.search]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch students when selections change
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedAssessment && selectedTerm) {
      fetchStudentsForMarking();
    } else {
      setStudents([]);
    }
  }, [selectedClass, selectedStream, selectedSubject, selectedAssessment, selectedTerm]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const assignmentsResponse = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      if (assignmentsResponse.data.success) {
        const assignments = assignmentsResponse.data.data.assignments;
        
        const classSet = new Map<string, ClassOption>();
        const subjectSet = new Map<string, SubjectOption>();
        const streamSet = new Map<string, StreamOption>();
        const termSet = new Map<string, TermOption>();
        
        assignments.forEach((yearData: any) => {
          yearData.terms.forEach((termData: any) => {
            if (!termSet.has(termData.term.id)) {
              termSet.set(termData.term.id, {
                id: termData.term.id,
                name: termData.term.term_name,
                is_current: termData.term.is_current
              });
            }
            
            termData.assignments.forEach((assignment: any) => {
              if (assignment.stream?.class && !classSet.has(assignment.stream.class.id)) {
                classSet.set(assignment.stream.class.id, {
                  id: assignment.stream.class.id,
                  name: assignment.stream.class.class_name,
                  level: assignment.stream.class.class_level || 0
                });
              }
              
              if (assignment.stream && !streamSet.has(assignment.stream.id)) {
                streamSet.set(assignment.stream.id, {
                  id: assignment.stream.id,
                  name: assignment.stream.name
                });
              }
              
              if (assignment.subjects) {
                assignment.subjects.forEach((subject: any) => {
                  if (subject && !subjectSet.has(subject.id)) {
                    subjectSet.set(subject.id, {
                      id: subject.id,
                      name: subject.name,
                      code: subject.subject_code || subject.name.substring(0, 3).toUpperCase()
                    });
                  }
                });
              }
            });
          });
        });

        setClasses(Array.from(classSet.values()));
        setStreams(Array.from(streamSet.values()));
        setSubjects(Array.from(subjectSet.values()));
        setTerms(Array.from(termSet.values()));
        
        if (subjectId && subjectSet.has(subjectId)) {
          setSelectedSubject(subjectId);
        }

        const currentTerm = Array.from(termSet.values()).find(term => term.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }

        if (selectedSubject) {
          await fetchAssessmentsForSubject(selectedSubject);
        }
      } else {
        throw new Error(assignmentsResponse.data.error || 'Failed to load assignments');
      }
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError(error.message || 'Failed to load required data');
      
      setClasses([]);
      setStreams([]);
      setSubjects([]);
      setTerms([]);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentsForSubject = async (subjectId: string) => {
    try {
      if (!selectedTerm) {
        const currentTerm = terms.find(term => term.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }
      }

      const assignmentsResponse = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      if (assignmentsResponse.data.success) {
        const assignments = assignmentsResponse.data.data.assignments;
        const subjectAssessments: AssessmentOption[] = [];
        
        assignments.forEach((yearData: any) => {
          yearData.terms.forEach((termData: any) => {
            if (!selectedTerm || termData.term.id === selectedTerm) {
              termData.assignments.forEach((assignment: any) => {
                if (assignment.subjects) {
                  const hasSubject = assignment.subjects.some(
                    (subject: any) => subject.id === subjectId
                  );
                  
                  if (hasSubject) {
                    const examId = `${assignment.id}-exam`;
                    const testId = `${assignment.id}-test`;
                    
                    subjectAssessments.push({
                      id: examId,
                      uuid: assignment.id,
                      title: 'Term Exam',
                      max_score: 100,
                      type: 'exam',
                      displayId: examId
                    });
                    
                    subjectAssessments.push({
                      id: testId,
                      uuid: assignment.id,
                      title: 'Class Test',
                      max_score: 50,
                      type: 'test',
                      displayId: testId
                    });
                  }
                }
              });
            }
          });
        });

        const uniqueAssessments = Array.from(
          new Map(subjectAssessments.map(item => [item.id, item])).values()
        );

        setAssessments(uniqueAssessments);
        
        if (uniqueAssessments.length > 0 && !selectedAssessment) {
          setSelectedAssessment(uniqueAssessments[0].id);
        } else if (uniqueAssessments.length === 0) {
          setError("No assessments found for this subject in the selected term");
        }
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setError("Failed to load assessments. Please try again.");
      setAssessments([]);
    }
  };

  const fetchStudentsForMarking = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedClass || !selectedSubject || !selectedAssessment) {
        setError("Please select Class, Subject, and Assessment");
        return;
      }

      const streamToUse = selectedStream || await getDefaultStreamForClass(selectedClass);
      
      const response = await teacherAPI.getStudentsForSubject({
        classId: selectedClass,
        subjectId: selectedSubject,
        termId: selectedTerm,
        assessmentId: selectedAssessment,
        streamId: streamToUse || undefined
      });
      
      if (response.data.success) {
        const result = response.data.data;
        
        const apiStudents: Student[] = result.students.map((student: any) => ({
          studentId: student.studentId,
          admissionNumber: student.admissionNumber,
          fullName: student.fullName,
          streamId: student.streamId,
          streamName: student.streamName,
          existingScore: student.existingScore?.toString() || "",
          existingNotes: student.existingNotes || "",
          existingGrade: student.existingGrade || "",
          existingPoints: student.existingPoints?.toString() || "",
          score: student.score?.toString() || "",
          notes: student.notes || "",
          isEnrolled: student.isEnrolled
        }));

        setStudents(apiStudents);
        
        if (apiStudents.length > 0) {
          const subjectName = result.assessmentInfo?.subjectName || "this subject";
          setSuccessMessage(`Loaded ${apiStudents.length} students enrolled in ${subjectName}`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(`No students found enrolled in this subject`);
        }
      } else {
        throw new Error(response.data.error || "Failed to load students");
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      
      if (error.response?.status === 404) {
        setError("No students enrolled in this subject for the selected criteria");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to mark this subject");
      } else if (error.response?.status === 400) {
        setError("Invalid selection. Please check your inputs");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to load students. Please try again.");
      }
      
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultStreamForClass = async (classId: string): Promise<string> => {
    try {
      const classStreams = streams.filter(stream => {
        return true;
      });
      
      if (classStreams.length > 0) {
        return classStreams[0].id;
      }
      
      const assignmentsResponse = await teacherAPI.getMyAssignments({
        status: 'active'
      });
      
      if (assignmentsResponse.data.success) {
        const assignments = assignmentsResponse.data.data.assignments;
        for (const yearData of assignments) {
          for (const termData of yearData.terms) {
            for (const assignment of termData.assignments) {
              if (assignment.stream?.class?.id === classId) {
                return assignment.stream.id;
              }
            }
          }
        }
      }
      
      return "";
    } catch (error) {
      console.error('Error getting default stream:', error);
      return "";
    }
  };

  const handleScoreChange = (studentId: string, value: string) => {
    const score = value === "" ? "" : Number(value);
    
    if (score !== "" && (score < 0 || score > 100)) {
      setError("Score must be between 0 and 100");
      return;
    }
    
    setStudents((prev) => 
      prev.map((s) => 
        s.studentId === studentId ? { ...s, score } : s
      )
    );
    
    if (error && error.includes("Score must be between")) {
      setError(null);
    }
  };

  const handleSubmitScores = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const studentsToSubmit = students.filter(student => {
        const hasScore = student.score !== "";
        const scoreChanged = student.score !== student.existingScore;
        return hasScore && scoreChanged;
      });

      if (studentsToSubmit.length === 0) {
        setError("No new scores to submit. Please enter scores first.");
        return;
      }

      const invalidScores = studentsToSubmit.filter(student => {
        const score = Number(student.score);
        return isNaN(score) || score < 0 || score > 100;
      });

      if (invalidScores.length > 0) {
        setError(`Invalid scores found. Please ensure all scores are between 0-100.`);
        return;
      }

      const selectedAssessmentObj = assessments.find(a => a.id === selectedAssessment);
      const assessmentUUID = selectedAssessmentObj?.uuid || extractUUID(selectedAssessment);
      
      const bulkPayload = {
        assessmentId: assessmentUUID,
        subjectId: selectedSubject,
        termId: selectedTerm,
        scores: studentsToSubmit.map(student => ({
          studentId: student.studentId,
          score: Number(student.score),
          teacherNotes: student.existingNotes || ""
        }))
      };

      const response = await teacherAPI.submitBulkScoresJUMA(bulkPayload);

      if (response.data.success) {
        const result = response.data;
        
        const processingTime = (result.meta.processingTime / 1000).toFixed(2);
        const throughput = result.meta.throughput;
        
        setSuccessMessage(
          `✅ JUMA processed ${result.data.totalProcessed} scores in ${processingTime}s ` +
          `(${throughput}) with ${result.meta.cacheHitRate} cache hit rate`
        );

        const submittedMap = new Map(
          studentsToSubmit.map((s) => [
            s.studentId, 
            {
              ...s,
              grade: calculateGrade(Number(s.score)),
              points: calculatePoints(Number(s.score))
            }
          ])
        );

        setStudents(prev => prev.map(student => {
          const submitted = submittedMap.get(student.studentId);
          if (submitted) {
            return {
              ...student,
              existingScore: student.score,
              grade: submitted.grade,
              points: submitted.points,
              remarks: "Saved"
            };
          }
          return student;
        }));

        setTimeout(() => setSuccessMessage(null), 5000);
      }
      
    } catch (error: any) {
      console.error('❌ JUMA Submission Error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.partialSuccess) {
          setError(
            `⚠️ Partial success: ${errorData.data?.newScores || 0} saved, ` +
            `${errorData.data?.failed?.length || 0} failed. ` +
            `Please check and retry failed entries.`
          );
          
          if (errorData.data?.successful) {
            const successfulIds = new Set(errorData.data.successful.map(s => s.studentId));
            
            setStudents(prev => prev.map(student => {
              if (successfulIds.has(student.studentId) && student.score !== "") {
                return {
                  ...student,
                  existingScore: student.score,
                  remarks: "Saved"
                };
              }
              return student;
            }));
          }
        } 
        else if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(e => 
            `Row ${e.row}: ${e.error}`
          ).join('. ');
          
          setError(`Validation failed: ${errorMessages}`);
          highlightInvalidRows(errorData.errors);
        }
        else if (errorData.error) {
          setError(errorData.error);
        } else {
          setError("Failed to submit scores. Please try again.");
        }
      } 
      else if (error.message) {
        setError(error.message);
      } 
      else {
        setError("Failed to submit scores. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const calculateGrade = (score: number): string => {
    if (score >= 80) return 'A';
    if (score >= 75) return 'A-';
    if (score >= 70) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 60) return 'B-';
    if (score >= 55) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 45) return 'C-';
    if (score >= 40) return 'D+';
    if (score >= 35) return 'D';
    if (score >= 30) return 'D-';
    return 'E';
  };

  const calculatePoints = (score: number): number => {
    if (score >= 80) return 12;
    if (score >= 75) return 11;
    if (score >= 70) return 10;
    if (score >= 65) return 9;
    if (score >= 60) return 8;
    if (score >= 55) return 7;
    if (score >= 50) return 6;
    if (score >= 45) return 5;
    if (score >= 40) return 4;
    if (score >= 35) return 3;
    if (score >= 30) return 2;
    return 1;
  };

  const highlightInvalidRows = (errors: any[]) => {
    document.querySelectorAll('.invalid-score').forEach(el => {
      el.classList.remove('invalid-score', 'bg-red-50', 'border-red-300');
    });
    
    errors.forEach(error => {
      const rowElement = document.querySelector(`[data-row="${error.row}"]`);
      if (rowElement) {
        rowElement.classList.add('invalid-score', 'bg-red-50', 'border-red-300');
      }
    });
  };

  const handleRefresh = () => {
    setStudents([]);
    setSelectedClass("");
    setSelectedStream("");
    setSelectedAssessment("");
    fetchInitialData();
  };

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const entriesCount = students.filter(s => s.score !== "").length;
  const changedCount = students.filter(s => 
    s.score !== "" && s.score !== s.existingScore
  ).length;
  const averageScore = entriesCount > 0 
    ? (students.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / entriesCount).toFixed(1)
    : "0";

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || "";
  const selectedAssessmentObj = assessments.find(a => a.id === selectedAssessment);
  const selectedAssessmentTitle = selectedAssessmentObj?.title || "";
  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "";
  const selectedStreamName = streams.find(s => s.id === selectedStream)?.name || "";

  if (loading && students.length === 0) {
    return (
      <div className="p-4 sm:p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-700">Loading Score Entry</h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">Preparing the marking interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-[#F8FAFC] min-h-screen space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <button 
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm font-semibold transition-colors mb-2 group"
          >
            <ArrowLeft size={14} className="sm:size-16 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">Bulk Score Entry</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {selectedSubjectName && selectedAssessmentTitle ? (
              <>
                Recording scores for <span className="font-semibold text-indigo-600">{selectedSubjectName}</span> • 
                <span className="font-semibold text-slate-700 ml-1">{selectedAssessmentTitle}</span>
              </>
            ) : (
              "Record student performance for assessments"
            )}
          </p>
          {selectedClassName && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Class: <span className="font-medium">{selectedClassName}</span>
              {selectedStreamName && <span className="ml-2">Stream: <span className="font-medium">{selectedStreamName}</span></span>}
            </p>
          )}
        </div>

        {students.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-4 bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <div className="px-2 sm:px-4 border-r border-slate-100 text-center min-w-[60px]">
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">Entered</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800">{entriesCount} / {students.length}</p>
            </div>
            <div className="px-2 sm:px-4 border-r border-slate-100 text-center min-w-[60px]">
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">Pending</p>
              <p className="text-xs sm:text-sm font-bold text-amber-600">{changedCount}</p>
            </div>
            <div className="px-2 sm:px-4 text-center min-w-[60px]">
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">Average</p>
              <p className="text-xs sm:text-sm font-bold text-indigo-600">{averageScore}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
            <span className="text-xs sm:text-sm text-red-700 font-medium break-words">{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
          >
            <X size={14} className="text-red-500" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 sm:p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={16} />
            <span className="text-xs sm:text-sm text-emerald-700 font-medium break-words">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded transition-colors flex-shrink-0"
          >
            <X size={14} className="text-emerald-500" />
          </button>
        </div>
      )}

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between px-4"
        >
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-indigo-500" />
            <span className="font-medium text-slate-700">Selection Criteria</span>
          </div>
          {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Selection Panel - Hidden on mobile unless toggled */}
        <Card className={`lg:col-span-4 border-none shadow-xl shadow-slate-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-800">Selection Criteria</h2>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              title="Refresh data"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {/* Class Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <BookOpen size={12} /> Academic Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                disabled={loading || classes.length === 0}
              >
                <option value="">{classes.length === 0 ? "No classes available" : "Select Class..."}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Level {cls.level})
                  </option>
                ))}
              </select>
            </div>

            {/* Stream Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Hash size={12} /> Stream / Group
              </label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!selectedClass || loading || streams.length === 0}
              >
                <option value="">All Streams</option>
                {streams.map((str) => (
                  <option key={str.id} value={str.id}>
                    {str.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <FileText size={12} /> Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  fetchAssessmentsForSubject(e.target.value);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                disabled={loading || subjects.length === 0}
              >
                <option value="">{subjects.length === 0 ? "No subjects available" : "Select Subject..."}</option>
                {subjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name} ({subj.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Term Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Calendar size={12} /> Academic Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                disabled={loading || terms.length === 0}
              >
                <option value="">{terms.length === 0 ? "No terms available" : "Select Term..."}</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name} {term.is_current && "(Current)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Assessment Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Percent size={12} /> Assessment
              </label>
              <select
                value={selectedAssessment}
                onChange={(e) => setSelectedAssessment(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!selectedSubject || assessments.length === 0 || loading}
              >
                <option value="">{assessments.length === 0 ? "No assessments available" : "Select Assessment..."}</option>
                {assessments.map((assess) => (
                  <option key={assess.id} value={assess.id}>
                    {assess.title} (Max: {assess.max_score})
                  </option>
                ))}
              </select>
            </div>

            {/* Load Students Button */}
            {selectedClass && selectedSubject && selectedAssessment && selectedTerm && (
              <button
                onClick={fetchStudentsForMarking}
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Loading Students...
                  </>
                ) : (
                  <>
                    <Users size={14} />
                    Load Students
                  </>
                )}
              </button>
            )}

            {/* Current Selection Summary */}
            {(selectedClass || selectedSubject || selectedAssessment) && (
              <div className="pt-3 sm:pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-600 mb-2">Current Selection:</h3>
                <div className="space-y-1 text-xs text-slate-700">
                  {selectedClassName && <p>• Class: <span className="font-medium">{selectedClassName}</span></p>}
                  {selectedStreamName && <p>• Stream: <span className="font-medium">{selectedStreamName}</span></p>}
                  {selectedSubjectName && <p>• Subject: <span className="font-medium">{selectedSubjectName}</span></p>}
                  {selectedAssessmentTitle && <p>• Assessment: <span className="font-medium">{selectedAssessmentTitle}</span></p>}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Students List */}
        <div className="lg:col-span-8">
          {students.length > 0 ? (
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl sm:rounded-2xl overflow-hidden bg-white">
              {/* Table Header */}
              <div className="p-3 sm:p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Search by name or admission..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300"
                    disabled={submitting}
                  />
                </div>
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1.5 rounded-lg self-start sm:self-auto">
                  <CheckCircle2 size={12} />
                  <span className="text-[10px] sm:text-xs font-semibold">Ready for Submission</span>
                </div>
              </div>

              {/* Mobile View - Card List */}
              <div className="block lg:hidden">
                <div className="divide-y divide-slate-100">
                  {filteredStudents.map((student, index) => (
                    <div key={student.studentId} className="p-3 sm:p-4 hover:bg-slate-50/50 transition-colors" data-row={index + 1}>
                      <div className="flex flex-col gap-2">
                        {/* Row 1: Admission and Name */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-medium text-slate-500">Adm: </span>
                            <span className="text-sm font-medium text-slate-700 font-mono">
                              {student.admissionNumber}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleStudentExpand(student.studentId)}
                            className="p-1 hover:bg-slate-100 rounded"
                          >
                            {expandedStudent === student.studentId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                        
                        <div className="font-medium text-slate-900 text-sm break-words">
                          {student.fullName}
                        </div>

                        {/* Row 2: Score Input and Status */}
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex-1">
                            <label className="text-xs text-slate-500 mb-1 block">Score (0-100)</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={student.score}
                                onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg text-center font-medium text-sm outline-none transition-all focus:ring-2 focus:ring-offset-1
                                  ${student.score === "" 
                                    ? "bg-slate-50 text-slate-400 focus:ring-indigo-500/20 focus:bg-white border border-slate-200" 
                                    : Number(student.score) < 40 
                                      ? "bg-rose-50 text-rose-700 focus:ring-rose-500/20 border border-rose-200" 
                                      : "bg-emerald-50 text-emerald-700 focus:ring-emerald-500/20 border border-emerald-200"
                                  }
                                `}
                                placeholder="Score"
                                disabled={submitting}
                              />
                              {student.score !== "" && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                  %
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <label className="text-xs text-slate-500 mb-1 block">Status</label>
                            <div className="flex items-center gap-2 min-w-[80px]">
                              {student.score !== "" ? (
                                student.score !== student.existingScore ? (
                                  <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                                    <AlertCircle size={12} />
                                    Pending
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                    <CheckCircle2 size={12} />
                                    Saved
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold">
                                  Not Entered
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {expandedStudent === student.studentId && (
                          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-slate-500">Previous Score:</span>
                              <span className="ml-2 font-medium">{student.existingScore || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Grade:</span>
                              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                ${student.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                  student.grade === 'A-' ? 'bg-emerald-100 text-emerald-800' :
                                  student.grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                                  student.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                  student.grade === 'B-' ? 'bg-blue-100 text-blue-800' :
                                  student.grade === 'C+' ? 'bg-amber-100 text-amber-800' :
                                  student.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                                  student.grade === 'C-' ? 'bg-amber-100 text-amber-800' :
                                  student.grade === 'D+' ? 'bg-orange-100 text-orange-800' :
                                  student.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                                  student.grade === 'D-' ? 'bg-orange-100 text-orange-800' :
                                  student.grade === 'E' ? 'bg-rose-100 text-rose-800' :
                                  'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {student.grade || '-'}
                              </span>
                            </div>
                            {student.remarks && (
                              <div className="col-span-2">
                                <span className="text-slate-500">Remarks:</span>
                                <span className="ml-2 font-medium">{student.remarks}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop View - Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Adm No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Score (0-100)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student, index) => (
                      <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors" data-row={index + 1}>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-700 font-mono">
                            {student.admissionNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{student.fullName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative w-28">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={student.score}
                              onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg text-center font-medium text-sm outline-none transition-all focus:ring-2 focus:ring-offset-1
                                ${student.score === "" 
                                  ? "bg-slate-50 text-slate-400 focus:ring-indigo-500/20 focus:bg-white border border-slate-200" 
                                  : Number(student.score) < 40 
                                    ? "bg-rose-50 text-rose-700 focus:ring-rose-500/20 border border-rose-200" 
                                    : "bg-emerald-50 text-emerald-700 focus:ring-emerald-500/20 border border-emerald-200"
                                }
                              `}
                              placeholder="Enter"
                              disabled={submitting}
                            />
                            {student.score !== "" && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                %
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {student.score !== "" ? (
                              student.score !== student.existingScore ? (
                                <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                                  <AlertCircle size={12} />
                                  Pending
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                  <CheckCircle2 size={12} />
                                  Saved
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">
                                Not Entered
                              </span>
                            )}
                            {student.remarks && (
                              <span className="text-xs text-slate-500" title={student.remarks}>
                                ({student.remarks})
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-slate-600">
                  Showing <span className="font-semibold">{filteredStudents.length}</span> of <span className="font-semibold">{students.length}</span> students
                  {searchQuery && (
                    <span className="ml-2 hidden sm:inline">
                      • Filtered by: "<span className="font-medium">{searchQuery}</span>"
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    disabled={!searchQuery || submitting}
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSubmitScores}
                    disabled={submitting || changedCount === 0}
                    className="px-4 sm:px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Submit {changedCount > 0 ? `${changedCount}` : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            /* Empty State */
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center">
              <div className="max-w-md mx-auto py-4 sm:py-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="text-slate-400" size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-700 mb-2">No Students Loaded</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">
                  Select a class, subject, and assessment to load students for marking.
                </p>
                {(!selectedClass || !selectedSubject || !selectedAssessment) && (
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs sm:text-sm font-medium">
                    <AlertCircle size={14} />
                    <span>Complete all selection criteria</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Help/Info Section - Simplified for mobile */}
      <div className="mt-4 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Quick Tips
          </h4>
          <ul className="text-[10px] sm:text-xs text-slate-600 space-y-1">
            <li>• Enter scores between 0-100</li>
            <li>• Grades auto-calculated</li>
            <li>• Pending shows unsaved scores</li>
          </ul>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            Notes
          </h4>
          <ul className="text-[10px] sm:text-xs text-slate-600 space-y-1">
            <li>• Only assigned classes</li>
            <li>• Scores can be edited</li>
          </ul>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 sm:col-span-2 lg:col-span-1">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Percent size={14} className="text-indigo-500" />
            Grading Scale
          </h4>
          <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs">
            <div className="text-emerald-700 font-medium">A: 80-100%</div>
            <div className="text-blue-700 font-medium">B: 70-79%</div>
            <div className="text-amber-700 font-medium">C: 60-69%</div>
            <div className="text-orange-700 font-medium">D: 50-59%</div>
            <div className="text-rose-700 font-medium">E: 0-49%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreSubmission;