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
  Percent
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
  // Add these fields for proper UUID handling
  uuid?: string; // The actual UUID without suffix
  displayId?: string; // The full ID with suffix for display
}

interface TermOption {
  id: string;
  name: string;
  is_current: boolean;
}

// Helper function to extract UUID from assessment ID
const extractUUID = (assessmentId: string): string => {
  if (!assessmentId) return "";
  // Match UUID pattern (8-4-4-4-12)
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

      // Fetch teacher's assignments to get classes and subjects
      const assignmentsResponse = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      if (assignmentsResponse.data.success) {
        const assignments = assignmentsResponse.data.data.assignments;
        
        // Extract unique classes and subjects
        const classSet = new Map<string, ClassOption>();
        const subjectSet = new Map<string, SubjectOption>();
        const streamSet = new Map<string, StreamOption>();
        const termSet = new Map<string, TermOption>();
        
        assignments.forEach((yearData: any) => {
          yearData.terms.forEach((termData: any) => {
            // Add term
            if (!termSet.has(termData.term.id)) {
              termSet.set(termData.term.id, {
                id: termData.term.id,
                name: termData.term.term_name,
                is_current: termData.term.is_current
              });
            }
            
            termData.assignments.forEach((assignment: any) => {
              // Add class
              if (assignment.stream?.class && !classSet.has(assignment.stream.class.id)) {
                classSet.set(assignment.stream.class.id, {
                  id: assignment.stream.class.id,
                  name: assignment.stream.class.class_name,
                  level: assignment.stream.class.class_level || 0
                });
              }
              
              // Add stream
              if (assignment.stream && !streamSet.has(assignment.stream.id)) {
                streamSet.set(assignment.stream.id, {
                  id: assignment.stream.id,
                  name: assignment.stream.name
                });
              }
              
              // Add subjects
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
        
        // If a subject was pre-selected from URL, select it
        if (subjectId && subjectSet.has(subjectId)) {
          setSelectedSubject(subjectId);
        }

        // Set current term by default
        const currentTerm = Array.from(termSet.values()).find(term => term.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }

        // Fetch assessments for the selected subject
        if (selectedSubject) {
          await fetchAssessmentsForSubject(selectedSubject);
        }
      } else {
        throw new Error(assignmentsResponse.data.error || 'Failed to load assignments');
      }
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError(error.message || 'Failed to load required data');
      
      // If API fails, show empty state but don't crash
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
      // REAL API CALL: Get assessments for subject
      // First, let's check if we have current term to filter assessments
      if (!selectedTerm) {
        const currentTerm = terms.find(term => term.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }
      }

      // Note: You need to implement this endpoint in your backend
      // Example: GET /api/v1/teachers/subjects/:subjectId/assessments?termId=:termId
      
      // For now, we'll use a fallback approach - fetch assessments from teacher's assignments
      const assignmentsResponse = await teacherAPI.getMyAssignments({
        status: 'active',
        include_subjects: 'true'
      });

      if (assignmentsResponse.data.success) {
        const assignments = assignmentsResponse.data.data.assignments;
        const subjectAssessments: AssessmentOption[] = [];
        
        // Extract assessments from assignments for this subject
        assignments.forEach((yearData: any) => {
          yearData.terms.forEach((termData: any) => {
            // Only include assessments for selected term
            if (!selectedTerm || termData.term.id === selectedTerm) {
              termData.assignments.forEach((assignment: any) => {
                // Check if this assignment includes the selected subject
                if (assignment.subjects) {
                  const hasSubject = assignment.subjects.some(
                    (subject: any) => subject.id === subjectId
                  );
                  
                  if (hasSubject) {
                    // Create assessment entries based on assignment
                    // Store both the full ID (with suffix) and the UUID
                    const examId = `${assignment.id}-exam`;
                    const testId = `${assignment.id}-test`;
                    
                    subjectAssessments.push({
                      id: examId, // Keep full ID for selection
                      uuid: assignment.id, // Store UUID for API calls
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

        // Remove duplicates
        const uniqueAssessments = Array.from(
          new Map(subjectAssessments.map(item => [item.id, item])).values()
        );

        setAssessments(uniqueAssessments);
        
        // Select first assessment by default if none selected
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

      // Validate required selections
      if (!selectedClass || !selectedSubject || !selectedAssessment) {
        setError("Please select Class, Subject, and Assessment");
        return;
      }

      // REAL API CALL: Get students for score entry
      // First, get the students in this class/stream
      const streamToUse = selectedStream || await getDefaultStreamForClass(selectedClass);
      
      if (!streamToUse) {
        setError("No stream found for selected class");
        return;
      }

      // Fetch students for this class/stream
      const studentsResponse = await teacherAPI.getClassStudents(selectedClass, streamToUse);
      
      if (studentsResponse.data.success) {
        const classStudents = studentsResponse.data.data.students;
        
        // Transform to our Student interface
        const apiStudents: Student[] = classStudents.map((student: any) => {
          return {
            studentId: student.id,
            admissionNumber: student.admission_number,
            fullName: `${student.first_name} ${student.last_name}`,
            existingScore: "",
            existingNotes: "",
            score: "",
            grade: "",
            points: 0,
            remarks: ""
          };
        });

        setStudents(apiStudents);
        
        // Show success message if students were loaded
        if (apiStudents.length > 0) {
          setSuccessMessage(`Loaded ${apiStudents.length} students for marking`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError("No students found in this class");
        }
      } else {
        throw new Error(studentsResponse.data.error || "Failed to load students");
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        setError("No students found for the selected criteria");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to mark this class");
      } else if (error.response?.status === 400) {
        setError("Invalid selection. Please check your inputs");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to load students. Please try again.");
      }
      
      // Set empty students array on error
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get default stream for a class
  const getDefaultStreamForClass = async (classId: string): Promise<string> => {
    try {
      // Get streams for this class from our already loaded data
      const classStreams = streams.filter(stream => {
        // Since we don't have class-stream mapping, use the first stream
        // In a real app, you would fetch this from API
        return true;
      });
      
      if (classStreams.length > 0) {
        return classStreams[0].id;
      }
      
      // If no streams found, try to get from teacher assignments
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
    
    // Validate score range (0-100)
    if (score !== "" && (score < 0 || score > 100)) {
      setError("Score must be between 0 and 100");
      return;
    }
    
    setStudents((prev) => 
      prev.map((s) => 
        s.studentId === studentId ? { ...s, score } : s
      )
    );
    
    // Clear error if score is valid
    if (error && error.includes("Score must be between")) {
      setError(null);
    }
  };

  const handleSubmitScores = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      // Filter students with new scores
      const studentsToSubmit = students.filter(student => {
        const hasScore = student.score !== "";
        const scoreChanged = student.score !== student.existingScore;
        return hasScore && scoreChanged;
      });

      if (studentsToSubmit.length === 0) {
        setError("No new scores to submit. Please enter scores first.");
        return;
      }

      // Validate all scores are within range
      const invalidScores = studentsToSubmit.filter(student => {
        const score = Number(student.score);
        return isNaN(score) || score < 0 || score > 100;
      });

      if (invalidScores.length > 0) {
        setError(`Invalid scores found. Please ensure all scores are between 0-100.`);
        return;
      }

      // Show loading toast or indicator
      console.log(`🚀 JUMA Processing ${studentsToSubmit.length} scores...`);

      // Find the selected assessment to get its UUID
      const selectedAssessmentObj = assessments.find(a => a.id === selectedAssessment);
      
      // IMPORTANT FIX: Extract UUID from assessment ID
      // If we have a stored UUID, use that, otherwise extract from the ID
      const assessmentUUID = selectedAssessmentObj?.uuid || extractUUID(selectedAssessment);
      
      console.log('📋 Assessment details:', {
        selectedId: selectedAssessment,
        extractedUUID: assessmentUUID,
        originalObj: selectedAssessmentObj
      });

      // PREPARE BULK PAYLOAD FOR JUMA - using UUID without suffix
      const bulkPayload = {
        assessmentId: assessmentUUID, // Send only the UUID part
        subjectId: selectedSubject,
        termId: selectedTerm,
        scores: studentsToSubmit.map(student => ({
          studentId: student.studentId,
          score: Number(student.score),
          teacherNotes: student.existingNotes || ""
        }))
      };

      console.log('📦 Sending payload:', bulkPayload);

      // SINGLE BULK API CALL
      const response = await teacherAPI.submitBulkScoresJUMA(bulkPayload);

      if (response.data.success) {
        const result = response.data;
        
        // Format success message with performance metrics
        const processingTime = (result.meta.processingTime / 1000).toFixed(2);
        const throughput = result.meta.throughput;
        
        setSuccessMessage(
          `✅ JUMA processed ${result.data.totalProcessed} scores in ${processingTime}s ` +
          `(${throughput}) with ${result.meta.cacheHitRate} cache hit rate`
        );

        // Create a map of submitted scores for quick lookup
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

        // Update local state with results
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

        // Show detailed summary
        console.log('📊 JUMA Submission Summary:', {
          totalProcessed: result.data.totalProcessed,
          newScores: result.data.newScores,
          updatedScores: result.data.updatedScores,
          batches: result.data.batches,
          processingTime: `${processingTime}s`,
          throughput: result.meta.throughput,
          cacheHitRate: result.meta.cacheHitRate
        });

        // Auto-clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      
    } catch (error: any) {
      console.error('❌ JUMA Submission Error:', error);
      
      // Handle JUMA-specific error responses
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
          
          // Highlight invalid rows
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

  // Helper function to calculate grade (can also come from API response)
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

  // Helper function to calculate points
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

  // Helper function to highlight invalid rows (optional)
  const highlightInvalidRows = (errors: any[]) => {
    // Reset all highlights first
    document.querySelectorAll('.invalid-score').forEach(el => {
      el.classList.remove('invalid-score', 'bg-red-50', 'border-red-300');
    });
    
    // Highlight invalid rows
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

  // Calculate statistics
  const entriesCount = students.filter(s => s.score !== "").length;
  const changedCount = students.filter(s => 
    s.score !== "" && s.score !== s.existingScore
  ).length;
  const averageScore = entriesCount > 0 
    ? (students.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / entriesCount).toFixed(1)
    : "0";

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected subject name for display
  const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || "";
  const selectedAssessmentObj = assessments.find(a => a.id === selectedAssessment);
  const selectedAssessmentTitle = selectedAssessmentObj?.title || "";
  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "";
  const selectedStreamName = streams.find(s => s.id === selectedStream)?.name || "";

  // Loading state
  if (loading && students.length === 0) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-700">Loading Score Entry</h2>
          <p className="text-slate-500 mt-2">Preparing the marking interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors mb-2 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Bulk Score Entry</h1>
          <p className="text-slate-500 mt-1">
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
            <p className="text-sm text-slate-600 mt-1">
              Class: <span className="font-medium">{selectedClassName}</span>
              {selectedStreamName && <span className="ml-2">Stream: <span className="font-medium">{selectedStreamName}</span></span>}
            </p>
          )}
        </div>

        {students.length > 0 && (
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 border-r border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-semibold">Entered</p>
              <p className="text-sm font-bold text-slate-800">{entriesCount} / {students.length}</p>
            </div>
            <div className="px-4 border-r border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-semibold">Pending</p>
              <p className="text-sm font-bold text-amber-600">{changedCount}</p>
            </div>
            <div className="px-4 text-center">
              <p className="text-xs text-slate-500 font-semibold">Average</p>
              <p className="text-sm font-bold text-indigo-600">{averageScore}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
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
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600" size={20} />
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selection Panel */}
        <Card className="lg:col-span-4 border-none shadow-xl shadow-slate-200/50 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-800">Selection Criteria</h2>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              title="Refresh data"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Class Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <BookOpen size={12} /> Academic Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
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
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
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
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
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
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
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
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
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
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading Students...
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    Load Students for Marking
                  </>
                )}
              </button>
            )}

            {/* Current Selection Summary */}
            {(selectedClass || selectedSubject || selectedAssessment) && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-600 mb-2">Current Selection:</h3>
                <div className="space-y-1 text-sm text-slate-700">
                  {selectedClassName && <p>• Class: <span className="font-medium">{selectedClassName}</span></p>}
                  {selectedStreamName && <p>• Stream: <span className="font-medium">{selectedStreamName}</span></p>}
                  {selectedSubjectName && <p>• Subject: <span className="font-medium">{selectedSubjectName}</span></p>}
                  {selectedAssessmentTitle && <p>• Assessment: <span className="font-medium">{selectedAssessmentTitle}</span></p>}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Students Table */}
        <div className="lg:col-span-8">
          {students.length > 0 ? (
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-0 overflow-hidden bg-white">
              {/* Table Header */}
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search by name or admission number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300"
                    disabled={submitting}
                  />
                </div>
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 size={14} />
                  <span className="text-xs font-semibold">Ready for Submission</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Adm No</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Previous</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Score (0-100)</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student, index) => (
                      <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors" data-row={index + 1}>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-700 font-mono">
                            {student.admissionNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">{student.fullName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {student.existingScore || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={student.score}
                              onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                              className={`w-24 px-3 py-2 rounded-lg text-center font-medium text-sm outline-none transition-all focus:ring-2 focus:ring-offset-1 focus:z-10 relative disabled:bg-slate-100 disabled:text-slate-400
                                ${student.score === "" 
                                  ? "bg-slate-50 text-slate-400 focus:ring-indigo-500/20 focus:bg-white border border-slate-200" 
                                  : Number(student.score) < 40 
                                    ? "bg-rose-50 text-rose-700 focus:ring-rose-500/20 border border-rose-200" 
                                    : "bg-emerald-50 text-emerald-700 focus:ring-emerald-500/20 border border-emerald-200"
                                }
                              `}
                              placeholder="Enter score"
                              disabled={submitting}
                            />
                            {student.score !== "" && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                %
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
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
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {student.score !== "" ? (
                              student.score !== student.existingScore ? (
                                <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                                  <AlertCircle size={12} />
                                  Pending Save
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
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  Showing <span className="font-semibold">{filteredStudents.length}</span> of <span className="font-semibold">{students.length}</span> students
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
                  <button
                    onClick={handleSubmitScores}
                    disabled={submitting || changedCount === 0}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Submit {changedCount > 0 ? `${changedCount} Scores` : 'Scores'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            /* Empty State */
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-8 text-center">
              <div className="max-w-md mx-auto py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-slate-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">No Students Loaded</h3>
                <p className="text-slate-500 mb-6">
                  Select a class, subject, and assessment to load students for marking.
                  Make sure all required fields are selected in the panel on the left.
                </p>
                {(!selectedClass || !selectedSubject || !selectedAssessment) && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                    <AlertCircle size={16} />
                    <span>Complete all selection criteria to load students</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Help/Info Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Quick Tips
          </h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Enter scores between 0-100, decimals allowed</li>
            <li>• Grades are automatically calculated</li>
            <li>• Unsaved scores show as "Pending Save"</li>
            <li>• Search by name or admission number</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            Notes
          </h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• You can only submit scores for your assigned classes</li>
            <li>• Scores can be edited before final submission</li>
            <li>• Submitted scores require admin approval to change</li>
            <li>• Back up data before closing the page</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Percent size={14} className="text-indigo-500" />
            Grading Scale
          </h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
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