// pages/admin/CBCReportsDashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cbcAPIS, studentAPI, classAPI } from '../../services/api';
import api from '../../services/api';           // raw axios instance — same as RubricManagement
import { toast } from "react-hot-toast";
import Card from "../../components/common/Card";
import {
  Download, FileText, Users, BookOpen, Filter, Search,
  ChevronDown, Loader2, CheckCircle, Eye, Printer, BarChart,
  TrendingUp, Star, RefreshCw, User, GraduationCap, Layers,
  GitBranch, ListTree, ArrowLeft, Grid, Table,
} from "lucide-react";

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────
interface Student {
  id: string;
  admissionNumber: string;      // camelCase, not admission_number
  firstName: string;            // camelCase, not first_name
  lastName: string;             // camelCase, not last_name
  fullName: string;
  gender: string;
  classId: string;
  streamId: string;
  studentType: string;
  enrollmentDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  className: string;            // Direct field, not nested in class object
  classLevel: number;            // Direct field
  streamName: string;            // Direct field, not nested in stream object
}

interface ClassOption {
  id: string;
  class_name: string;
  class_level: number;
  is_active?: boolean;
}

interface StreamOption {
  id: string;
  name: string;
  class_id: string;
}

/** Terms are embedded inside AcademicYear.terms[] — no separate fetch needed */
interface Term {
  id: string;
  term_name: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active?: boolean;
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  terms: Term[];           // ← embedded from /academic/years-with-terms
  _count?: { terms: number };
}

interface RubricLevel {
  id: string;
  level_number: number;
  level_name: string;
  level_code: string;
  color_code: string;
}

interface StrandProgress {
  id: string;
  strand: { id: string; name: string; code: string };
  subject: { id: string; name: string; subject_code: string };
  current_level: RubricLevel;
  previous_level?: RubricLevel;
  assessment_count: number;
  first_assessment_date: string;
  last_assessment_date: string;
  trend: 'improving' | 'stable' | 'declining' | 'new';
  latest_teacher_comment?: string;
  evidence_count: number;
}

interface SubjectStrand {
  strand_id: string;
  strand_name: string;
  strand_code: string;
  current_level?: { level: number; level_name: string; level_code: string; comment?: string };
  trend: string;
}

interface SubjectData {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  strands: SubjectStrand[];
  total_assessments: number;
  assessed_count: number;
}

interface StudentCBCReport {
  student: {
    id: string;
    name: string;
    admission: string;
    class: string;
    stream: string;
    class_level: number;
  };
  term_id: string;
  subjects: SubjectData[];
  summary: {
    total_subjects: number;
    total_assessments: number;
    assessed_count: number;
    completion_rate: number;
  };
}

// ─────────────────────────────────────────────────
// UNWRAP HELPER — identical to RubricManagement's unwrap()
// Handles: raw array | { data: [] } | { success, data: [] }
// ─────────────────────────────────────────────────
function unwrap<T>(res: PromiseSettledResult<any>, label: string): T[] {
  if (res.status === 'rejected') {
    console.error(`[CBCReports] Failed to load "${label}":`, res.reason);
    return [];
  }
  const d = res.value?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d as T[];
  if (d.data && Array.isArray(d.data)) return d.data as T[];
  // last resort: first array-valued key (mirrors RubricManagement)
  if (typeof d === 'object') {
    for (const key in d) {
      if (Array.isArray(d[key])) return d[key] as T[];
    }
  }
  console.warn(`[CBCReports] Unexpected shape for "${label}":`, d);
  return [];
}

// ─────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────

const CBCReportsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── loading ──────────────────────────────────
  const [loading, setLoading]                   = useState(true);
  const [generating, setGenerating]             = useState(false);
  const [fetchingProgress, setFetchingProgress] = useState(false);
  const [fetchingReport, setFetchingReport]     = useState(false);

  // ── data ─────────────────────────────────────
  const [classes, setClasses]             = useState<ClassOption[]>([]);
  const [streams, setStreams]             = useState<StreamOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents]           = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [strandProgress, setStrandProgress]   = useState<StrandProgress[]>([]);
  const [studentReport, setStudentReport]     = useState<StudentCBCReport | null>(null);
  const [assessments, setAssessments]         = useState<any[]>([]);

  // ── filters ──────────────────────────────────
  const [selectedClass, setSelectedClass]               = useState('');
  const [selectedStream, setSelectedStream]             = useState('');
  const [selectedTerm, setSelectedTerm]                 = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [searchQuery, setSearchQuery]                   = useState('');
  const [showFilters, setShowFilters]                   = useState(true);

  // ── ui ───────────────────────────────────────
  const [activeTab, setActiveTab]       = useState<'students' | 'progress' | 'reports' | 'assessments'>('students');
  const [selectedView, setSelectedView] = useState<'grid' | 'table'>('grid');

  // ─────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────

  useEffect(() => { fetchAllData(); }, []);

  useEffect(() => {
    if (selectedClass) fetchStreamsForClass();
    else { setStreams([]); setSelectedStream(''); }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedTerm) fetchStudents();
    else setStudents([]);
  }, [selectedClass, selectedStream, selectedTerm]);

  useEffect(() => {
    if (selectedStudent && selectedTerm && selectedAcademicYear) {
      fetchStrandProgress();
      fetchStudentReport();
    }
  }, [selectedStudent, selectedTerm, selectedAcademicYear]);

  useEffect(() => {
    if (selectedClass && selectedTerm && selectedAcademicYear) fetchAssessments();
  }, [selectedClass, selectedStream, selectedTerm, selectedAcademicYear]);

  // ─────────────────────────────────────────────────
  // INITIAL FETCH — mirrors RubricManagement.fetchAllData()
  //
  //  /classes                    → GET /classes                   ✅
  //  /academic/years-with-terms  → GET /academic/years-with-terms ✅
  //                                terms[] are EMBEDDED, no extra calls
  //
  // RubricManagement uses: api.get("/classes") and api.get("/academic/years-with-terms")
  // We do exactly the same here.
  // ─────────────────────────────────────────────────

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const responses = await Promise.allSettled([
        api.get('/classes'),                   // [0] same as RubricManagement
        api.get('/academic/years-with-terms'), // [1] same as RubricManagement → terms embedded
      ]);

      // ── classes ──────────────────────────────
      setClasses(unwrap<ClassOption>(responses[0], 'classes'));

      // ── academic years WITH embedded terms ───
      const yearsData = unwrap<AcademicYear>(responses[1], 'years-with-terms');
      setAcademicYears(yearsData);

      // Auto-select current year + current term
      if (yearsData.length > 0) {
        const currentYear = yearsData.find((y) => y.is_current) ?? yearsData[0];
        setSelectedAcademicYear(currentYear.id);

        const currentTerm =
          currentYear.terms?.find((t) => t.is_current || t.is_active) ??
          currentYear.terms?.[0];
        if (currentTerm) setSelectedTerm(currentTerm.id);
      }

    } catch (err) {
      console.error('[CBCReports] load error:', err);
      toast.error('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────
  // TERMS — derived from year.terms[] (same as RubricManagement's termsForSelectedYear)
  // Zero extra API calls. RubricManagement does: yr?.terms ?? []
  // ─────────────────────────────────────────────────

  const termsForSelectedYear = useMemo<Term[]>(() => {
    if (!selectedAcademicYear) return [];
    const yr = academicYears.find((y) => y.id === selectedAcademicYear);
    return yr?.terms ?? [];
  }, [academicYears, selectedAcademicYear]);

  // ─────────────────────────────────────────────────
  // STREAMS — classAPI.getStreamsByClass(classId) → GET /streams?classId=... ✅
  // ─────────────────────────────────────────────────

  const fetchStreamsForClass = async () => {
    try {
      const res = await classAPI.getStreamsByClass(selectedClass);
      const d   = res.data;
      let data: StreamOption[] = [];
      if (Array.isArray(d))                      data = d;
      else if (d?.data && Array.isArray(d.data)) data = d.data;
      setStreams(data);
      setSelectedStream('');
    } catch (err) {
      console.error('[CBCReports] streams error:', err);
      setStreams([]);
    }
  };

  // ─────────────────────────────────────────────────
  // STUDENTS — studentAPI.getAll() → GET /students ✅
  // ─────────────────────────────────────────────────

  const fetchStudents = async () => {
    try {
      const params: any = { classId: selectedClass, limit: 200 };
      if (selectedStream) params.streamId = selectedStream;
      const res = await studentAPI.getAll(params);
      const d   = res.data;
      let data: Student[] = [];
      if (Array.isArray(d))                      data = d;
      else if (d?.data && Array.isArray(d.data)) data = d.data;
      setStudents(data);
    } catch (err) {
      console.error('[CBCReports] students error:', err);
      toast.error('Failed to load students');
    }
  };

  // ─────────────────────────────────────────────────
  // ASSESSMENTS — cbcAPIS.getAllCbcAssessments() → GET /cbc/assessments ✅
  // Same call as RubricManagement.fetchAssessments()
  // ─────────────────────────────────────────────────

  const fetchAssessments = async () => {
    try {
      const params: any = {
        classId: selectedClass,
        termId: selectedTerm,
        academicYearId: selectedAcademicYear,
        limit: 50,
      };
      if (selectedStream) params.streamId = selectedStream;
      const res = await cbcAPIS.getAllCbcAssessments(params);
      const d   = res?.data;
      let data: any[] = [];
      if (Array.isArray(d))                       data = d;
      else if (d?.data && Array.isArray(d.data))  data = d.data;
      else if (d?.assessments)                    data = d.assessments;
      setAssessments(data);
    } catch (err) {
      console.error('[CBCReports] assessments error:', err);
    }
  };

  // ─────────────────────────────────────────────────
  // STRAND PROGRESS — GET /cbc/students/:id/strand-progress ✅
  // ─────────────────────────────────────────────────

  const fetchStrandProgress = async () => {
    if (!selectedStudent) return;
    try {
      setFetchingProgress(true);
      const res = await cbcAPIS.getStudentStrandProgress(selectedStudent.id, {
        termId: selectedTerm,
      });
      const d = res.data;
      let data: StrandProgress[] = [];
      if (Array.isArray(d))                      data = d;
      else if (d?.data && Array.isArray(d.data)) data = d.data;
      setStrandProgress(data);
    } catch (err) {
      console.error('[CBCReports] strand progress error:', err);
      toast.error('Failed to load strand progress');
    } finally {
      setFetchingProgress(false);
    }
  };

  // ─────────────────────────────────────────────────
  // STUDENT REPORT JSON — GET /cbc/reports/student/:id ✅
  // ─────────────────────────────────────────────────

  const fetchStudentReport = async () => {
    if (!selectedStudent || !selectedTerm || !selectedAcademicYear) return;
    try {
      setFetchingReport(true);
      const res = await cbcAPIS.generateStudentCBCReport(selectedStudent.id, {
        termId: selectedTerm,
        academicYearId: selectedAcademicYear,
        format: 'json',
      });
      setStudentReport(res.data?.data ?? res.data);
    } catch (err) {
      console.error('[CBCReports] student report error:', err);
    } finally {
      setFetchingReport(false);
    }
  };

  // ─────────────────────────────────────────────────
  // REPORT GENERATION / DOWNLOAD
  // ─────────────────────────────────────────────────

  const generateStudentReport = async (student: Student, format: 'pdf' | 'json' = 'pdf') => {
    if (!selectedTerm || !selectedAcademicYear) {
      toast.error('Please select a term and academic year first');
      return;
    }
    try {
      setGenerating(true);
      const res = await cbcAPIS.generateStudentCBCReport(student.id, {
        termId: selectedTerm,
        academicYearId: selectedAcademicYear,
        format,
      });
      if (format === 'pdf') {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `CBC_Report_${student.first_name}_${student.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Report downloaded successfully');
      } else {
        setStudentReport(res.data?.data ?? res.data);
        setActiveTab('reports');
      }
    } catch (err) {
      console.error('[CBCReports] generate error:', err);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const generateBulkReports = async () => {
    if (!selectedClass || !selectedTerm || !selectedAcademicYear) {
      toast.error('Please select class and term first');
      return;
    }
    if (students.length === 0) {
      toast.error('No students found for the selected criteria');
      return;
    }
    toast.success(`Starting download of ${students.length} reports...`);
    students.forEach((student, i) => {
      setTimeout(async () => {
        try {
          const res  = await cbcAPIS.generateStudentCBCReport(student.id, {
            termId: selectedTerm,
            academicYearId: selectedAcademicYear,
            format: 'pdf',
          });
          const blob = new Blob([res.data], { type: 'application/pdf' });
          const url  = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href     = url;
          link.download = `CBC_Report_${student.first_name}_${student.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success(`Downloaded ${i + 1}/${students.length}: ${student.first_name} ${student.last_name}`);
        } catch {
          toast.error(`Failed: ${student.first_name} ${student.last_name}`);
        }
      }, i * 1500);
    });
  };

  // ─────────────────────────────────────────────────
  // DERIVED DATA
  // ─────────────────────────────────────────────────
const filteredStudents = useMemo(() => {
  if (!searchQuery || !students.length) return students;
  
  const query = searchQuery.toLowerCase().trim();
  
  return students.filter((s) => {
    const fullName = s.fullName?.toLowerCase() || '';
    const firstName = s.firstName?.toLowerCase() || '';
    const lastName = s.lastName?.toLowerCase() || '';
    const admission = s.admissionNumber?.toLowerCase() || '';
    
    return fullName.includes(query) || 
           firstName.includes(query) || 
           lastName.includes(query) || 
           admission.includes(query);
  });
}, [students, searchQuery]);

  // ─────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────

  const getLevelColor = (n: number) => {
    switch (n) {
      case 4:  return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 3:  return 'text-blue-600 bg-blue-50 border-blue-200';
      case 2:  return 'text-amber-600 bg-amber-50 border-amber-200';
      case 1:  return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp size={14} className="text-emerald-500" />;
      case 'declining': return <TrendingUp size={14} className="text-rose-500 rotate-180" />;
      case 'stable':    return <div className="w-3 h-0.5 bg-slate-400" />;
      default:          return <Star size={14} className="text-amber-500" />;
    }
  };

  const formatDate = (ds: string) => {
    if (!ds) return 'N/A';
    return new Date(ds).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ─────────────────────────────────────────────────
  // LOADING SCREEN — same style as RubricManagement
  // ─────────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl animate-pulse" />
          <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        </div>
        <p className="text-lg font-semibold text-slate-700 mt-4">Loading Reports Dashboard</p>
        <p className="text-sm text-slate-500">Fetching your data...</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">

      {/* ── Header ─────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">CBC Reports Dashboard</h1>
              <p className="text-sm text-slate-600 mt-1">Generate and manage competency-based assessment reports</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Filter size={16} />Filters
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={fetchAllData}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">

        {/* ── Filters ────────────────────────────── */}
        {showFilters && (
          <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/*
                Academic Year — from /academic/years-with-terms (same as RubricManagement)
              */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Academic Year</label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => {
                    setSelectedAcademicYear(e.target.value);
                    setSelectedTerm(''); // reset term when year changes (same as RubricManagement)
                  }}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select Year</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.year_name}{y.is_current ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/*
                Term — derived from year.terms[] (same as RubricManagement's termsForSelectedYear)
                Zero API calls. No separate fetch.
              */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  disabled={!selectedAcademicYear}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                >
                  <option value="">Select Term</option>
                  {termsForSelectedYear.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.term_name}{(t.is_current || t.is_active) ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
                {!selectedAcademicYear && (
                  <p className="text-xs text-slate-400 mt-1">Select a year first</p>
                )}
              </div>

              {/*
                Class — from /classes (same as RubricManagement)
              */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name}{cls.class_level > 0 ? ` (Level ${cls.class_level})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/*
                Stream — classAPI.getStreamsByClass(classId) → GET /streams?classId=... ✅
              */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Stream</label>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  disabled={!selectedClass}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                >
                  <option value="">All Streams</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedClass && selectedTerm && selectedAcademicYear && students.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={generateBulkReports}
                  disabled={generating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Generate All Reports ({students.length})
                </button>
              </div>
            )}
          </Card>
        )}

        {/* ── Tabs ───────────────────────────────── */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto pb-1">
          {[
            { key: 'students',    label: 'Students',        icon: <Users size={16} />,    disabled: false },
            { key: 'assessments', label: 'Assessments',     icon: <BookOpen size={16} />, disabled: false },
            { key: 'progress',    label: 'Strand Progress', icon: <BarChart size={16} />, disabled: !selectedStudent },
            { key: 'reports',     label: 'Report Preview',  icon: <FileText size={16} />, disabled: !selectedStudent },
          ].map(({ key, label, icon, disabled }) => (
            <button
              key={key}
              onClick={() => !disabled && setActiveTab(key as any)}
              disabled={disabled}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2
                disabled:opacity-40 disabled:cursor-not-allowed
                ${activeTab === key ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {icon}{label}
            </button>
          ))}
        </div>
{/* ══════════════════════════════════════════
    STUDENTS TAB - UPDATED WITH CORRECT FIELD NAMES
══════════════════════════════════════════ */}
{activeTab === 'students' && (
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by name or admission number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex bg-white rounded-xl border border-slate-200 p-1 self-start">
        <button onClick={() => setSelectedView('grid')} className={`p-2 rounded-lg ${selectedView === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}>
          <Grid size={16} />
        </button>
        <button onClick={() => setSelectedView('table')} className={`p-2 rounded-lg ${selectedView === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}>
          <Table size={16} />
        </button>
      </div>
    </div>

    {filteredStudents.length === 0 ? (
      <Card className="bg-white rounded-2xl p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Students Found</h3>
          <p className="text-sm text-slate-500">
            {selectedClass ? 'No students match your search criteria' : 'Please select a class and term to view students'}
          </p>
        </div>
      </Card>
    ) : selectedView === 'grid' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <Card
            key={student.id}
            className={`bg-white rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg ${
              selectedStudent?.id === student.id ? 'border-indigo-500 shadow-lg' : 'border-slate-200 hover:border-indigo-300'
            }`}
            onClick={() => setSelectedStudent(student)}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <User size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {student.firstName || ''} {student.lastName || ''}
                    </h3>
                    <p className="text-xs text-slate-500">{student.admissionNumber || 'N/A'}</p>
                  </div>
                </div>
                {selectedStudent?.id === student.id && <CheckCircle size={18} className="text-indigo-600" />}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <GraduationCap size={14} />
                <span>
                  {student.className || 'No Class'} {student.streamName || ''}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); generateStudentReport(student, 'pdf'); }}
                  disabled={generating || !selectedTerm || !selectedAcademicYear}
                  className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <Download size={14} />PDF
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); generateStudentReport(student, 'json'); }}
                  disabled={!selectedTerm || !selectedAcademicYear}
                  className="flex-1 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <Eye size={14} />Preview
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    ) : (
      <Card className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Admission</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Stream</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className={`hover:bg-slate-50 cursor-pointer ${selectedStudent?.id === student.id ? 'bg-indigo-50' : ''}`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{student.admissionNumber || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {student.firstName || ''} {student.lastName || ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{student.className || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{student.streamName || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); generateStudentReport(student, 'pdf'); }}
                      disabled={!selectedTerm || !selectedAcademicYear}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-40"
                      title="Download PDF Report"
                    >
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )}
  </div>
)}

        {/* ══════════════════════════════════════════
            ASSESSMENTS TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'assessments' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Class Assessments</h2>
            {assessments.length === 0 ? (
              <Card className="bg-white rounded-2xl p-8 text-center">
                <p className="text-slate-500">
                  {selectedClass && selectedTerm ? 'No assessments found for the selected filters' : 'Select a class and term to view assessments'}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessments.map((a: any) => (
                  <Card key={a.id} className="bg-white rounded-2xl p-5 border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-slate-800">{a.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.is_locked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {a.is_locked ? 'Locked' : 'Active'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      {a.subject?.name    && <div className="flex items-center gap-2 text-slate-600"><BookOpen size={14} /><span>{a.subject.name}</span></div>}
                      {a.strand?.name     && <div className="flex items-center gap-2 text-slate-600"><Layers   size={14} /><span>{a.strand.name}</span></div>}
                      {a.sub_strand?.name && <div className="flex items-center gap-2 text-slate-600"><ListTree  size={14} /><span>{a.sub_strand.name}</span></div>}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(a.created_at)}</span>
                      <span>{a.total_students || 0} students</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            STRAND PROGRESS TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'progress' && selectedStudent && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedStudent.admission_number} • {selectedStudent.class?.class_name} {selectedStudent.stream?.name}
                  </p>
                </div>
                <button
                  onClick={() => generateStudentReport(selectedStudent, 'pdf')}
                  disabled={generating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Download Full Report
                </button>
              </div>
            </Card>

            {fetchingProgress ? (
              <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
            ) : strandProgress.length === 0 ? (
              <Card className="bg-white rounded-2xl p-8 text-center">
                <p className="text-slate-500">No strand progress data found for this student in the selected term</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {strandProgress.map((progress) => (
                  <Card key={progress.id} className="bg-white rounded-2xl p-5 border border-slate-200">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800">{progress.strand.name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{progress.strand.code}</span>
                        </div>
                        <p className="text-sm text-slate-600">{progress.subject.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(progress.trend)}
                        <span className="text-xs capitalize text-slate-600">{progress.trend}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Current Level</p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(progress.current_level?.level_number || 0)}`}>
                          {progress.current_level?.level_code || '—'}
                        </div>
                      </div>
                      <div><p className="text-xs text-slate-500 mb-1">Assessments</p><p className="font-medium text-slate-800">{progress.assessment_count}</p></div>
                      <div><p className="text-xs text-slate-500 mb-1">Evidence</p><p className="font-medium text-slate-800">{progress.evidence_count}</p></div>
                      <div><p className="text-xs text-slate-500 mb-1">Last Assessed</p><p className="text-xs font-medium text-slate-800">{formatDate(progress.last_assessment_date)}</p></div>
                    </div>
                    {progress.latest_teacher_comment && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-1">Latest Comment</p>
                        <p className="text-sm text-slate-700 italic">"{progress.latest_teacher_comment}"</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            REPORT PREVIEW TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'reports' && selectedStudent && (
          <div className="space-y-6">
            {fetchingReport ? (
              <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
            ) : !studentReport ? (
              <Card className="bg-white rounded-2xl p-8 text-center">
                <p className="text-slate-500">No report data available. Click "Preview" on a student to load their report.</p>
              </Card>
            ) : (
              <Card className="bg-white rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Competency-Based Assessment Report</h2>
                    <p className="text-sm text-slate-600 mt-1">{studentReport.student.name} • {studentReport.student.admission}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => generateStudentReport(selectedStudent, 'pdf')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 flex items-center gap-2">
                      <Download size={16} />Download PDF
                    </button>
                    <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 flex items-center gap-2">
                      <Printer size={16} />Print
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div><p className="text-xs text-slate-500 mb-1">Class</p><p className="font-medium text-slate-800">{studentReport.student.class} {studentReport.student.stream}</p></div>
                  <div><p className="text-xs text-slate-500 mb-1">Grade Level</p><p className="font-medium text-slate-800">{studentReport.student.class_level}</p></div>
                  <div><p className="text-xs text-slate-500 mb-1">Completion Rate</p><p className="font-medium text-slate-800">{studentReport.summary.completion_rate}%</p></div>
                  <div><p className="text-xs text-slate-500 mb-1">Assessments</p><p className="font-medium text-slate-800">{studentReport.summary.assessed_count}/{studentReport.summary.total_assessments}</p></div>
                </div>

                <div className={`mb-6 p-4 rounded-xl ${studentReport.summary.completion_rate >= 80 ? 'bg-emerald-50' : studentReport.summary.completion_rate >= 50 ? 'bg-amber-50' : 'bg-rose-50'}`}>
                  <p className={`font-medium ${studentReport.summary.completion_rate >= 80 ? 'text-emerald-700' : studentReport.summary.completion_rate >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                    {studentReport.summary.completion_rate >= 80 && '✅ Progressing Well – Keep up the good work!'}
                    {studentReport.summary.completion_rate >= 50 && studentReport.summary.completion_rate < 80 && '📊 Making Progress – Keep pushing forward!'}
                    {studentReport.summary.completion_rate < 50 && '⚠️ Needs More Practice – Keep working!'}
                  </p>
                </div>

                <div className="space-y-6">
                  {studentReport.subjects.map((subject) => (
                    <div key={subject.subject_id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800">{subject.subject_name}</h3>
                      </div>
                      {subject.strands.map((strand) => {
                        const lvl = strand.current_level;
                        return (
                          <div key={strand.strand_id} className="px-4 py-3 border-b border-slate-100 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <GitBranch size={14} className="text-indigo-500" />
                                <span className="font-medium text-slate-700">{strand.strand_name}</span>
                              </div>
                              {lvl && (
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getLevelColor(lvl.level)}`}>
                                  {lvl.level_code}
                                </div>
                              )}
                            </div>
                            {lvl?.comment && <p className="text-sm text-slate-600 mt-1 italic">"{lvl.comment}"</p>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                  <h4 className="font-semibold text-indigo-800 mb-2">Next Steps &amp; Recommendations</h4>
                  <ul className="space-y-1 text-sm text-indigo-700">
                    <li>✅ Practice regularly to strengthen understanding</li>
                    <li>✅ Focus on strands marked for improvement</li>
                    <li>✅ Encourage {studentReport.student.name.split(' ')[0]} to read more</li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div><div className="w-40 h-0.5 bg-slate-300 mb-1" /><p className="text-xs text-slate-500">Class Teacher</p></div>
                  <div><div className="w-40 h-0.5 bg-slate-300 mb-1" /><p className="text-xs text-slate-500">Head Teacher</p></div>
                  <p className="text-xs text-slate-500">Date: ______________</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
            <span className="font-medium text-slate-700">Generating reports...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBCReportsDashboard;