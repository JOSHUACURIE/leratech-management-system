import React, { useState, useEffect } from "react";
import Card from "../../components/common/Card";
import { 
  BookOpen, 
  Database,
  RefreshCw,
  AlertCircle,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { assignmentAPI } from "../../services/api";

// Components
import AcademicPeriodFilter from "./assignment/components/filters/AcademicPeriodFilter";
import ClassFilter from "./assignment/components/filters/ClassFilter";
import AssignmentCreator from "./assignment/components/AssignmentCreator/AssignmentCreator";
import StudentTable from "./assignment/components/common/StudentTable";
import CacheManager from "./assignment/components/common/CacheManager";
import AssignmentViewer from "./assignment/components/AssignmentViewer/AssignmentViewer";

// Hooks
import { useAssignmentData } from "./assignment/hooks/useAssignmentData";
import { useCache } from "./assignment/hooks/useCache";
// Types
import { 
  type ClassOption, 
 type  StreamOption, 
  type SubjectOption, 
  type TermOption, 
  type AcademicYear,
  type StudentAssignment,
  type AssignmentType,
  type UploadedFile
} from "./assignment/types/assignment.types";

const Assignments: React.FC = () => {
  // State management
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');
  
  // Data states
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [streams, setStreams] = useState<StreamOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<StudentAssignment[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentAssignment[]>([]);
  
  // Bulk assignment states
  const [bulkTitle, setBulkTitle] = useState<string>("");
  const [bulkDescription, setBulkDescription] = useState<string>("");
  const [bulkDate, setBulkDate] = useState<string>("");
  const [bulkSubject, setBulkSubject] = useState<string>("");
  const [bulkType, setBulkType] = useState<AssignmentType>("homework");
  const [bulkMaxScore, setBulkMaxScore] = useState<number>(100);
  const [bulkWeight, setBulkWeight] = useState<number>(10);
  const [bulkFiles, setBulkFiles] = useState<UploadedFile[]>([]);
  
  // UI states
  const [initError, setInitError] = useState<string | null>(null);
  
  // Hooks
  const { getCacheStats, clearCache, refreshing, setRefreshing } = useCache();
  const {
    loading,
    loadingYears,
    loadingTerms,
    fetchInitialData,
    fetchStreams,
    fetchSubjects,
    fetchStudents,
    refreshData
  } = useAssignmentData({
    selectedClass,
    selectedStream,
    setClasses,
    setStreams,
    setSubjects,
    setStudents,
    setTerms,
    setAcademicYears,
    setInitError,
    setSelectedAcademicYear,
    setSelectedTerm
  });

  const handlePublishAssignments = async (saving: boolean, setSaving: (saving: boolean) => void) => {
    if (!selectedClass || !selectedStream || !selectedTerm) {
      toast.error("Please select class, stream, and term");
      return;
    }

    const assignmentsToPublish = students.filter(s => 
      s.assignment && s.dueDate && s.subjectId
    );

    if (assignmentsToPublish.length === 0) {
      toast.error("No assignments to publish");
      return;
    }

    try {
      setSaving(true);
      
      // Get academic year from selected term
      const selectedTermObj = terms.find(t => t?.id === selectedTerm);
      const academicYearId = selectedTermObj?.academic_year_id || selectedAcademicYear;

      if (!academicYearId) {
        toast.error("Could not determine academic year");
        return;
      }

      // Group assignments by common properties for batch creation
      const groupedByAssignment = new Map<string, any>();
      
      assignmentsToPublish.forEach(studentAssignment => {
        const key = `${studentAssignment.assignment}-${studentAssignment.dueDate}-${studentAssignment.subjectId}-${studentAssignment.assignmentType}`;
        
        if (!groupedByAssignment.has(key)) {
          const selectedClassObj = classes.find(c => c?.id === selectedClass);
          const selectedStreamObj = streams.find(s => s?.id === selectedStream);
          const description = studentAssignment.description || `Assignment for ${selectedClassObj?.class_name || 'Class'} ${selectedStreamObj?.name || ''}`;
          
          groupedByAssignment.set(key, {
            title: studentAssignment.assignment!,
            description: description,
            subject_id: studentAssignment.subjectId!,
            class_id: selectedClass,
            stream_id: selectedStream,
            term_id: selectedTerm,
            academic_year_id: academicYearId,
            due_date: studentAssignment.dueDate!,
            assignment_type: studentAssignment.assignmentType || 'homework',
            format: 'mixed',
            max_score: studentAssignment.maxScore || 100,
            weight: studentAssignment.weight || 10,
            allow_late_submission: true,
            is_published: true,
            attachment_urls: studentAssignment.files?.map(f => f.url).filter(Boolean) || [],
            student_ids: [] as string[]
          });
        }
        
        groupedByAssignment.get(key).student_ids.push(studentAssignment.student.id);
      });

      // Create each assignment group
      const promises = Array.from(groupedByAssignment.values()).map(data =>
        assignmentAPI.createAssignment(data)
      );

      await Promise.all(promises);
      
      toast.success(`Successfully published ${promises.length} assignment(s) with attachments`);
      
      // Reset form after successful publish
      setStudents(prev => prev.map(s => ({
        ...s,
        assignment: "",
        description: "",
        dueDate: "",
        subjectId: "",
        files: []
      })));
      
      setBulkTitle("");
      setBulkDescription("");
      setBulkDate("");
      setBulkSubject("");
      setBulkFiles([]);

    } catch (error: any) {
      console.error("Error publishing assignments:", error);
      toast.error(error.message || "Failed to publish assignments");
    } finally {
      setSaving(false);
    }
  };

  // Filter students based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  // Initialize data
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch streams when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStreams(selectedClass);
    } else {
      setStreams([]);
      setSelectedStream("");
      setSubjects([]);
      setSelectedSubject("");
    }
  }, [selectedClass, fetchStreams]);

  // Fetch subjects when stream changes
  useEffect(() => {
    if (selectedClass && selectedStream) {
      fetchSubjects(selectedClass, selectedStream);
    } else {
      setSubjects([]);
      setSelectedSubject("");
    }
  }, [selectedStream, selectedClass, fetchSubjects]);

  // Fetch students when stream is selected
  useEffect(() => {
    if (selectedStream) {
      fetchStudents(selectedClass, selectedStream);
    } else {
      setStudents([]);
      setFilteredStudents([]);
    }
  }, [selectedStream, selectedClass, fetchStudents]);

  const cacheStats = getCacheStats();

  // Loading state
  if (loading && students.length === 0) {
    return (
      <div className="p-6 bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-700">Loading Assignment Manager</h2>
          <p className="text-slate-500 mt-2">Fetching your teaching assignments and classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-violet-100">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Assignment Manager</h1>
            <p className="text-slate-500 font-medium">Distribute learning tasks with files and track deadlines.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading data...</span>
            </div>
          )}
          
          {initError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-xl text-sm">
              <AlertCircle size={16} />
              <span>{initError}</span>
            </div>
          )}
          
          <CacheManager 
            cacheStats={cacheStats}
            refreshing={refreshing}
            onRefresh={() => refreshData(selectedClass, selectedStream)}
            onClearCache={clearCache}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-colors ${
            activeTab === 'create'
              ? 'text-violet-600 border-b-2 border-violet-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('create')}
        >
          Create Assignments
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm uppercase tracking-widest transition-colors ${
            activeTab === 'view'
              ? 'text-violet-600 border-b-2 border-violet-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('view')}
        >
          View & Grade
        </button>
      </div>

      {initError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <div>
              <p className="text-red-700 font-medium">{initError}</p>
              <p className="text-sm text-red-600 mt-1">
                Please check if you have been assigned to any classes. Contact your administrator if this issue persists.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Filters & Bulk Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Academic Year & Term Selection */}
            <AcademicPeriodFilter
              selectedAcademicYear={selectedAcademicYear}
              selectedTerm={selectedTerm}
              academicYears={academicYears}
              terms={terms}
              loadingYears={loadingYears}
              loadingTerms={loadingTerms}
              onAcademicYearChange={setSelectedAcademicYear}
              onTermChange={setSelectedTerm}
            />

            {/* Class Filters */}
            <ClassFilter
              selectedClass={selectedClass}
              selectedStream={selectedStream}
              classes={classes}
              streams={streams}
              loading={loading}
              onClassChange={setSelectedClass}
              onStreamChange={setSelectedStream}
            />

            {/* Bulk Assignment Creator */}
            <AssignmentCreator
              selectedStream={selectedStream}
              students={students}
              subjects={subjects}
              bulkTitle={bulkTitle}
              bulkDescription={bulkDescription}
              bulkDate={bulkDate}
              bulkSubject={bulkSubject}
              bulkType={bulkType}
              bulkMaxScore={bulkMaxScore}
              bulkWeight={bulkWeight}
              bulkFiles={bulkFiles}
              onBulkTitleChange={setBulkTitle}
              onBulkDescriptionChange={setBulkDescription}
              onBulkDateChange={setBulkDate}
              onBulkSubjectChange={setBulkSubject}
              onBulkTypeChange={setBulkType}
              onBulkMaxScoreChange={setBulkMaxScore}
              onBulkWeightChange={setBulkWeight}
              onBulkFilesChange={setBulkFiles}
              onBulkApply={(updates) => {
                const updatedStudents = students.map(student => ({
                  ...student,
                  ...updates
                }));
                setStudents(updatedStudents);
              }}
            />
            
            {/* Stats Card */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Database size={14} /> Quick Stats
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Students</span>
                  <span className="text-lg font-bold text-slate-800">{students.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Assignments Set</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {students.filter(s => s.assignment).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Files</span>
                  <span className="text-lg font-bold text-violet-600">
                    {students.reduce((acc, s) => acc + (s.files?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Student Table */}
          <div className="lg:col-span-8">
            <StudentTable
              selectedStream={selectedStream}
              filteredStudents={filteredStudents}
              subjects={subjects}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onStudentUpdate={(studentId, updates) => {
                setStudents(prev => prev.map(s => 
                  s.student.id === studentId ? { ...s, ...updates } : s
                ));
              }}
              onPublish={async (saving, setSaving) => {
                await handlePublishAssignments(saving, setSaving);
              }}
            />
          </div>
        </div>
      ) : (
        <AssignmentViewer
          selectedClass={selectedClass}
          selectedStream={selectedStream}
          selectedTerm={selectedTerm}
          selectedAcademicYear={selectedAcademicYear}
        />
      )}
    </div>
  );
};

export default Assignments;