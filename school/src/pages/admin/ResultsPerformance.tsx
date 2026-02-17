import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  TrendingUp, 
  Award, 
  Target, 
  BarChart2, 
  Star, 
  Download, 
  Filter,
  Loader2,
  Users,
  BookOpen,
  Calendar,
  ChevronDown,
  AlertCircle,
  TrendingDown,
  ChevronRight,
  School,
  GitCompare,
  PieChart,
  LineChart,
  Radar,
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  DownloadCloud,
  FileSpreadsheet,
  FileText,
  Printer,
  Mail,
  Share2,
  Sparkles,
  Zap,
  Brain,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";
import Card from "../../components/common/Card";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import api, { 
  resultsAPI, 
  type StudentResult, 
  type PerformanceStats, 
  type StudentDetailed,
  type StreamPerformance,
  type ResultsFilterParams,
  type ClassOption,
  type StreamOption,
  type TermOption,
} from "../../services/api";
import {
  LineChart as ReLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as ReRadar,
  Legend,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  ComposedChart,
  Scatter
} from 'recharts';

// ============================================
// LOCAL TYPE DEFINITIONS
// ============================================

interface AcademicYearOption {
  id: string;
  year_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
}

interface CurriculumOption {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface GradingSystem {
  id: string;
  name: string;
  description: string;
  min_pass_mark: string;
  is_default: boolean;
  type: string;
  grades: Array<{
    id: string;
    grading_system_id: string;
    min_score: string;
    max_score: string;
    grade: string;
    points: string;
    description: string | null;
    color_code: string | null;
    is_passing: boolean;
    cbc_level: string | null;
    display_order: number;
  }>;
}

interface ClassOptionWithStreams extends ClassOption {
  streamCount: number;
  total_streams?: number;
}

interface StreamOptionWithCount extends StreamOption {
  studentCount?: number;
  student_count?: number;
  class_id: string;
}

interface ExtendedPerformanceStats extends PerformanceStats {
  summary: PerformanceStats['summary'] & {
    passRate: number;
    distinctionRate: number;
    creditRate: number;
    topStudent: {
      name: string;
      points: number;
      stream: string;
    } | null;
  };
}

// ============================================
// CONSTANTS
// ============================================

const COLORS = {
  primary: ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
  grades: {
    A: '#10b981',
    'A-': '#34d399',
    'B+': '#fbbf24',
    B: '#f59e0b',
    'B-': '#f97316',
    'C+': '#ef4444',
    C: '#dc2626',
    'C-': '#b91c1c',
    D: '#6b7280',
    E: '#4b5563'
  },
  streams: ['#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6']
};

const GRADE_LEVELS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E'];

const VIEW_MODES = [
  { value: 'class', label: 'Class Overview', icon: <Layers size={16} /> },
  { value: 'stream', label: 'Stream Comparison', icon: <GitCompare size={16} /> },
  { value: 'student', label: 'Student Deep Dive', icon: <Users size={16} /> }
];

// ============================================
// MAIN COMPONENT
// ============================================

const ResultsPerformance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [selectedViewMode, setSelectedViewMode] = useState<'class' | 'stream' | 'student'>('class');
  
  const [results, setResults] = useState<StudentResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<StudentResult[]>([]);
  const [stats, setStats] = useState<ExtendedPerformanceStats | null>(null);

  // ============================================
  // FIX: filters in BOTH state (for UI) and a ref (for async access without stale closures)
  // ============================================
  type FiltersType = ResultsFilterParams & { viewMode?: 'class' | 'stream' | 'student'; selectedStudentId?: string };
  const [filters, setFilters] = useState<FiltersType>({ viewMode: 'class' });
  const filtersRef = useRef<FiltersType>({ viewMode: 'class' });

  // Always update both state and ref together — use this instead of setFilters directly
  const updateFilters = useCallback((updater: (prev: FiltersType) => FiltersType) => {
    setFilters(prev => {
      const next = updater(prev);
      filtersRef.current = next;
      return next;
    });
  }, []);
  
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [streams, setStreams] = useState<StreamOptionWithCount[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<StreamOptionWithCount[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [curricula, setCurricula] = useState<CurriculumOption[]>([]);
  const [gradingSystems, setGradingSystems] = useState<GradingSystem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailed | null>(null);
  const [studentDetails, setStudentDetails] = useState<Map<string, StudentDetailed>>(new Map());
  
  const [chartType, setChartType] = useState<'bar' | 'line' | 'radar' | 'area'>('bar');
  const [showPercentages, setShowPercentages] = useState(true);
  const [comparisonMode, setComparisonMode] = useState<'stream' | 'subject' | 'student'>('stream');
  
  const initialized = useRef(false);
  // FIX: tracks when initialization is fully done so the results useEffect doesn't double-fire
  const initDone = useRef(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const getClassesWithStreamCounts = useCallback((): ClassOptionWithStreams[] => {
    return classes.map(cls => {
      const classStreams = streams.filter(s => s.class_id === cls.id);
      return {
        ...cls,
        streamCount: (cls as any).total_streams ?? classStreams.length
      };
    });
  }, [classes, streams]);

  // ============================================
  // FIX: Sequential initialization — collect all IDs, then fire results directly.
  // This avoids the stale closure problem where the results useEffect captured
  // the initial empty filters before any async fetches completed.
  // ============================================
  useEffect(() => {
    if (!user?.first_name || initialized.current) return;
    initialized.current = true;

    const initialize = async () => {
      let classId: string | undefined;
      let termId: string | undefined;
      let gradingSystemId: string | undefined;
      let curriculumId: string | undefined;

      // Step 1: Classes
      try {
        const response = await api.get('/classes');
        if (response.data.success) {
          const classesData = response.data.data || [];
          setClasses(classesData);
          if (classesData.length > 0) {
            classId = classesData[0].id;
            updateFilters(prev => ({ ...prev, classId }));
            fetchStreams(classId!);
          }
        }
      } catch (error: any) {
        if (error.response?.status !== 304) {
          toast.error(error.response?.data?.error || 'Failed to load classes');
        }
      }

      // Step 2: Academic years + terms (sequential — terms depend on year)
      try {
        const yearsResponse = await api.get('/academic/years');
        if (yearsResponse.data.success) {
          const yearsData = yearsResponse.data.data || [];
          setAcademicYears(yearsData);

          const currentYear = yearsData.find((y: AcademicYearOption) => y.is_current) || yearsData[0];
          if (currentYear) {
            setSelectedAcademicYear(currentYear.id);
            updateFilters(prev => ({ ...prev, academicYearId: currentYear.id }));

            // Fetch terms for this year immediately
            try {
              const termsResponse = await api.get(`/academic/years/${currentYear.id}/terms`);
              if (termsResponse.data.success) {
                let termsData = termsResponse.data.data || [];
                if (termsResponse.data.data?.terms && Array.isArray(termsResponse.data.data.terms)) {
                  termsData = termsResponse.data.data.terms;
                } else if (Array.isArray(termsResponse.data.data)) {
                  termsData = termsResponse.data.data;
                }

                const termsWithYear = termsData.map((term: TermOption) => ({
                  ...term,
                  name: term.name || term.term_name,
                  academicYear: currentYear
                }));
                setTerms(termsWithYear);

                const currentTerm = termsWithYear.find((t: TermOption) => t.is_current) || termsWithYear[0];
                if (currentTerm) {
                  termId = currentTerm.id;
                  updateFilters(prev => ({ ...prev, termId }));
                }
              }
            } catch (termError: any) {
              if (termError.response?.status !== 304) {
                toast.error(termError.response?.data?.error || 'Failed to load terms');
              }
            }
          }
        }
      } catch (error: any) {
        if (error.response?.status !== 304) {
          toast.error(error.response?.data?.error || 'Failed to load academic years');
        }
      }

      // Step 3: Grading systems
      try {
        const response = await api.get('/grading/systems', { params: { type: 'overall_points' } });
        if (response.data.success) {
          let systemsData = response.data.data;
          if (!Array.isArray(systemsData)) {
            if (systemsData?.raw && Array.isArray(systemsData.raw)) {
              systemsData = systemsData.raw;
            } else if (systemsData?.systems?.subject && Array.isArray(systemsData.systems.subject)) {
              systemsData = systemsData.systems.subject;
            } else if (systemsData?.data && Array.isArray(systemsData.data)) {
              systemsData = systemsData.data;
            } else {
              systemsData = [];
            }
          }
          if (!Array.isArray(systemsData)) systemsData = [];

          console.log('Grading systems found:', systemsData.length, systemsData);
          setGradingSystems(systemsData);

          const defaultSystem = systemsData.find((sys: GradingSystem) => sys.is_default) || systemsData[0];
          if (defaultSystem) {
            gradingSystemId = defaultSystem.id;
            updateFilters(prev => ({ ...prev, gradingSystemId }));
          }
        }
      } catch (error: any) {
        if (error.response?.status !== 304) {
          toast.error(error.response?.data?.error || 'Failed to load grading systems');
        }
      }

      // Step 4: Curricula (optional — non-blocking)
      try {
        const response = await api.get('/academic');
        if (response.data.success) {
          const curriculaData = response.data.data || [];
          setCurricula(curriculaData);
          if (curriculaData.length > 0) {
            curriculumId = curriculaData[0].id;
            updateFilters(prev => ({ ...prev, curriculumId }));
          }
        }
      } catch (error: any) {
        if (error.response?.status !== 304) {
          toast.error(error.response?.data?.error || 'Failed to load curricula');
        }
      }

      // Step 5: Subjects (fire and forget)
      api.get('/subjects')
        .then(r => { if (r.data.success) setSubjects(r.data.data || []); })
        .catch(() => {});

      // Step 6: Fire results with the IDs we collected above (NOT from stale state)
      const finalClassId = classId || filtersRef.current.classId;
      const finalTermId = termId || filtersRef.current.termId;
      const finalGradingSystemId = gradingSystemId || filtersRef.current.gradingSystemId;
      const finalCurriculumId = curriculumId || filtersRef.current.curriculumId;

      console.log('Initialization complete — firing results with:', {
        finalClassId, finalTermId, finalGradingSystemId
      });

      if (finalClassId && finalTermId && finalGradingSystemId) {
        await Promise.all([
          fetchResultsWithIds(finalClassId, finalTermId, finalGradingSystemId, undefined, finalCurriculumId),
          fetchStatsWithIds(finalClassId, finalTermId, finalGradingSystemId, undefined)
        ]);
      } else {
        console.warn('Missing IDs after init — results not fetched:', { finalClassId, finalTermId, finalGradingSystemId });
        setLoading(false);
      }

      // Mark init as done so the manual-filter useEffect can now respond
      initDone.current = true;
    };

    initialize();
  }, [user?.first_name]);

  // ============================================
  // FIX: Only react to manual filter changes AFTER initialization is complete.
  // During init, fetchResultsWithIds is called directly above — skip double-firing.
  // ============================================
  useEffect(() => {
    if (!initDone.current) return;

    if (filters.classId && filters.termId && filters.gradingSystemId) {
      fetchResultsWithIds(
        filters.classId,
        filters.termId,
        filters.gradingSystemId,
        filters.streamId,
        filters.curriculumId
      );
      fetchStatsWithIds(
        filters.classId,
        filters.termId,
        filters.gradingSystemId,
        filters.streamId
      );
    }
  }, [filters.classId, filters.termId, filters.gradingSystemId, filters.streamId]);

  // Fetch streams when class changes (manual filter change)
  useEffect(() => {
    if (filters.classId) {
      setStreams([]);
      setFilteredStreams([]);
      fetchStreams(filters.classId);
    } else {
      setStreams([]);
      setFilteredStreams([]);
      updateFilters(prev => ({ ...prev, streamId: undefined }));
    }
  }, [filters.classId]);

  // Filter streams based on selected class
  useEffect(() => {
    if (filters.classId && streams.length > 0) {
      const filtered = streams.filter(s => s.class_id === filters.classId);
      setFilteredStreams(filtered);
    } else {
      setFilteredStreams([]);
    }
  }, [filters.classId, streams]);

  // Fetch terms when academic year changes manually (skip during init)
  useEffect(() => {
    if (!initDone.current) return;
    if (selectedAcademicYear) {
      fetchTerms(selectedAcademicYear);
    } else {
      setTerms([]);
      updateFilters(prev => ({ ...prev, termId: undefined }));
    }
  }, [selectedAcademicYear]);

  // Filter results based on stream selection
  useEffect(() => {
    if (results.length > 0) {
      if (filters.streamId) {
        const streamName = streams.find(s => s.id === filters.streamId)?.name;
        setFilteredResults(results.filter(r => r.streamName === streamName));
      } else {
        setFilteredResults(results);
      }
    }
  }, [results, filters.streamId, streams]);

  // ============================================
  // CORE FETCH FUNCTIONS — accept IDs directly to bypass stale closures
  // ============================================

  const fetchResultsWithIds = async (
    classId: string,
    termId: string,
    gradingSystemId: string,
    streamId?: string,
    curriculumId?: string
  ) => {
    if (!classId || !termId || !gradingSystemId) return;

    console.log('fetchResultsWithIds called with:', { classId, termId, gradingSystemId, streamId });
    setLoading(true);
    try {
      const params = {
        classId,
        termId,
        gradingSystemId,
        ...(curriculumId && { curriculumId }),
        ...(streamId && { streamId }),
        includeSubjects: true,
        includeHistory: true
      };

      const response = await resultsAPI.getClassResultsDetailed(params);
      console.log('Results API response:', response.data);

      if (response.data.success) {
        const resultsData = response.data.results || [];
        const enrichedResults = resultsData.map((result: StudentResult) => ({
          ...result,
          trend: calculateTrend(result.previousRanks || []),
          subjects: result.subjects || []
        }));
        setResults(enrichedResults);
        setFilteredResults(enrichedResults);
      } else {
        toast.error('Failed to fetch results');
      }
    } catch (error: any) {
      console.error('Failed to fetch results:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsWithIds = async (
    classId: string,
    termId: string,
    gradingSystemId: string,
    streamId?: string
  ) => {
    if (!classId || !termId || !gradingSystemId) return;

    setStatsLoading(true);
    try {
      const params = {
        classId,
        termId,
        gradingSystemId,
        ...(streamId && { streamId }),
        includeStreamComparison: true,
        includeHeatmap: true
      };

      const response = await resultsAPI.getClassStatsEnhanced(params);

      if (response.data.success) {
        const statsData = response.data;
        const passRate = calculatePassRateFromStats(statsData);
        const distinctionRate = calculateDistinctionRateFromStats(statsData);
        const creditRate = calculateCreditRateFromStats(statsData);

        setStats({
          summary: {
            ...statsData.summary,
            passRate,
            distinctionRate,
            creditRate,
            topStudent: statsData.summary?.topStudent || null
          },
          data: statsData.data
        } as ExtendedPerformanceStats);
      } else {
        toast.error('Failed to fetch statistics');
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      if (error.response?.status === 304) return;
      toast.error(error.response?.data?.error || 'Failed to fetch statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // ============================================
  // DATA FETCHING — supporting fetchers
  // ============================================

  const fetchStreams = async (classId: string) => {
    try {
      const response = await api.get(`/classes/${classId}/streams`);
      if (response.data.success) {
        const rawStreams: any[] = response.data.data?.streams ?? [];
        const normalizedStreams: StreamOptionWithCount[] = rawStreams.map((s: any) => ({
          ...s,
          class_id: classId,
          studentCount: s.student_count,
        }));
        setStreams(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newStreams = normalizedStreams.filter(s => !existingIds.has(s.id));
          return [...prev, ...newStreams];
        });
      }
    } catch (error: any) {
      if (error.response?.status === 304) return;
      toast.error(error.response?.data?.error || 'Failed to load streams');
    }
  };

  const fetchTerms = async (academicYearId: string) => {
    try {
      const response = await api.get(`/academic/years/${academicYearId}/terms`);
      if (response.data.success) {
        let termsData = response.data.data || [];
        if (response.data.data?.terms && Array.isArray(response.data.data.terms)) {
          termsData = response.data.data.terms;
        } else if (Array.isArray(response.data.data)) {
          termsData = response.data.data;
        }

        const year = academicYears.find(y => y.id === academicYearId);
        const termsWithYear = termsData.map((term: TermOption) => ({
          ...term,
          name: term.name || term.term_name,
          academicYear: year
        }));
        setTerms(termsWithYear);

        const currentTerm = termsWithYear.find((term: TermOption) => term.is_current) || termsWithYear[0];
        if (currentTerm) {
          updateFilters(prev => ({ ...prev, termId: currentTerm.id }));
        }
      }
    } catch (error: any) {
      if (error.response?.status === 304) return;
      toast.error(error.response?.data?.error || 'Failed to load terms');
    }
  };

  // ============================================
  // RESULTS API INTEGRATION
  // ============================================

  // Legacy wrappers — read from filtersRef to avoid stale closures
  const fetchResults = async () => {
    const f = filtersRef.current;
    await fetchResultsWithIds(f.classId!, f.termId!, f.gradingSystemId!, f.streamId, f.curriculumId);
  };

  const fetchPerformanceStats = async () => {
    const f = filtersRef.current;
    await fetchStatsWithIds(f.classId!, f.termId!, f.gradingSystemId!, f.streamId);
  };

  const fetchStreamPerformance = async (streamId: string) => {
    const f = filtersRef.current;
    if (!f.termId || !f.gradingSystemId) return;
    try {
      const params = { streamId, termId: f.termId, gradingSystemId: f.gradingSystemId };
      const response = await resultsAPI.getStreamPerformance(params);
      if (response.data.success && stats) {
        console.log('Stream performance data:', response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch stream performance:', error);
    }
  };

  const fetchStudentDetails = async (studentId: string) => {
    const f = filtersRef.current;
    if (!f.termId || !f.gradingSystemId) return;

    if (studentDetails.has(studentId)) {
      setSelectedStudent(studentDetails.get(studentId) || null);
      return;
    }

    try {
      const params = {
        studentId,
        termId: f.termId,
        gradingSystemId: f.gradingSystemId,
        includeSubjects: true,
        includeHistory: true,
        includeRecommendations: true
      };
      const response = await resultsAPI.getStudentDetailed(params);
      if (response.data.success) {
        const studentData = response.data.data;
        studentDetails.set(studentId, studentData);
        setStudentDetails(new Map(studentDetails));
        setSelectedStudent(studentData);
      }
    } catch (error: any) {
      console.error('Failed to fetch student details:', error);
      toast.error('Failed to load student details');
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const calculateTrend = (history: any[]): 'up' | 'down' | 'stable' => {
    if (!history || history.length < 2) return 'stable';
    const sorted = [...history].sort((a, b) =>
      new Date(a.termId).getTime() - new Date(b.termId).getTime()
    );
    const first = sorted[0].meanPoints;
    const last = sorted[sorted.length - 1].meanPoints;
    if (last > first * 1.05) return 'up';
    if (last < first * 0.95) return 'down';
    return 'stable';
  };

  const getGradeColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  const getGrade = (points: number) => {
    if (points >= 10) return "A";
    if (points >= 8) return "B";
    if (points >= 6) return "C";
    if (points >= 4) return "D";
    return "E";
  };

  const getMeanPercentage = (meanPoints: number) => Math.round((meanPoints / 12) * 100);

  const calculatePassRateFromStats = (statsData: any) => {
    if (!statsData?.data?.gradeDistribution?.length) return 0;
    const passingGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+'];
    const total = statsData.data.gradeDistribution.reduce((s: number, g: any) => s + g.count, 0);
    const passing = statsData.data.gradeDistribution
      .filter((g: any) => passingGrades.includes(g.grade))
      .reduce((s: number, g: any) => s + g.count, 0);
    return total > 0 ? Math.round((passing / total) * 100) : 0;
  };

  const calculateDistinctionRateFromStats = (statsData: any) => {
    if (!statsData?.data?.gradeDistribution?.length) return 0;
    const total = statsData.data.gradeDistribution.reduce((s: number, g: any) => s + g.count, 0);
    const distinctions = statsData.data.gradeDistribution
      .filter((g: any) => ['A', 'A-'].includes(g.grade))
      .reduce((s: number, g: any) => s + g.count, 0);
    return total > 0 ? Math.round((distinctions / total) * 100) : 0;
  };

  const calculateCreditRateFromStats = (statsData: any) => {
    if (!statsData?.data?.gradeDistribution?.length) return 0;
    const total = statsData.data.gradeDistribution.reduce((s: number, g: any) => s + g.count, 0);
    const credits = statsData.data.gradeDistribution
      .filter((g: any) => ['B+', 'B', 'B-'].includes(g.grade))
      .reduce((s: number, g: any) => s + g.count, 0);
    return total > 0 ? Math.round((credits / total) * 100) : 0;
  };

  const getTopPerformerScore = (statsData: ExtendedPerformanceStats) => {
    if (!statsData?.data?.topPerformers?.length) return 0;
    return Math.round((statsData.data.topPerformers[0].totalPoints / 12) * 100);
  };

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================

  const handleExportExcel = async (type: 'broadsheet' | 'stream' | 'individual' = 'broadsheet') => {
    const f = filtersRef.current;
    if (!f.classId || !f.termId || !f.gradingSystemId) {
      toast.error('Please select class, term, and grading system first');
      return;
    }
    setExportLoading(true);
    try {
      const params = {
        classId: f.classId,
        termId: f.termId,
        gradingSystemId: f.gradingSystemId,
        ...(f.streamId && { streamId: f.streamId }),
        type
      };
      const response = await resultsAPI.exportResultsExcel(params);
      const filename = resultsAPI.generateFilename(type, {
        classId: f.classId,
        termId: f.termId,
        streamId: f.streamId
      });
      resultsAPI.downloadBlob(response.data, filename);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.response?.data?.error || 'Failed to export Excel');
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const handleExportPDF = async (type: 'class' | 'stream' | 'student') => {
    const f = filtersRef.current;
    if (!f.classId || !f.termId || !f.gradingSystemId) {
      toast.error('Please select class, term, and grading system first');
      return;
    }
    setExportLoading(true);
    try {
      const params: any = {
        classId: f.classId,
        termId: f.termId,
        gradingSystemId: f.gradingSystemId,
        type
      };
      if (type === 'student' && f.selectedStudentId) {
        params.studentId = f.selectedStudentId;
      } else if (type === 'stream' && f.streamId) {
        params.streamId = f.streamId;
      }
      const response = await resultsAPI.exportClassPDF(params);
      let filename = '';
      if (type === 'student' && f.selectedStudentId) {
        const student = results.find(r => r.studentId === f.selectedStudentId);
        filename = resultsAPI.generateFilename('student', {}, student?.studentName);
      } else {
        filename = resultsAPI.generateFilename('broadsheet', {
          classId: f.classId,
          termId: f.termId
        }).replace('.xlsx', '.pdf');
      }
      resultsAPI.downloadBlob(response.data, filename);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.response?.data?.error || 'Failed to export PDF');
    } finally {
      setExportLoading(false);
      setShowExportModal(false);
    }
  };

  const handlePrint = async () => {
    const f = filtersRef.current;
    if (!f.classId || !f.termId || !f.gradingSystemId) {
      toast.error('Please select class, term, and grading system first');
      return;
    }
    try {
      const params = {
        classId: f.classId,
        termId: f.termId,
        gradingSystemId: f.gradingSystemId,
        ...(f.streamId && { streamId: f.streamId })
      };
      const response = await resultsAPI.getPrintView(params);
      const url = window.URL.createObjectURL(response.data);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onload = () => { printWindow.print(); };
      }
    } catch (error: any) {
      console.error('Print failed:', error);
      toast.error('Failed to generate print view');
    }
  };

  // ============================================
  // STATS CALCULATIONS
  // ============================================

  const enhancedStats = useMemo(() => {
    if (!stats || !filteredResults.length) return null;
    const topStudent = filteredResults.length > 0 ? filteredResults[0] : null;
    return {
      ...stats,
      summary: {
        ...stats.summary,
        topStudent: topStudent ? {
          name: topStudent.studentName,
          points: topStudent.meanPoints,
          stream: topStudent.streamName || ''
        } : null
      }
    };
  }, [stats, filteredResults]);

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderFilterDropdown = () => {
    const classesWithStreamCounts = getClassesWithStreamCounts();
    return (
      <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 min-w-[400px] z-50">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-black text-slate-800">Filter Results</h3>

          {/* View Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Eye size={14} className="inline mr-2" />
              View Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VIEW_MODES.map(mode => (
                <button
                  key={mode.value}
                  onClick={() => {
                    setSelectedViewMode(mode.value as any);
                    updateFilters(prev => ({ ...prev, viewMode: mode.value as any }));
                  }}
                  className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedViewMode === mode.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Users size={14} className="inline mr-2" />
              Class
            </label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.classId || ''}
              onChange={(e) => updateFilters(prev => ({ ...prev, classId: e.target.value, streamId: undefined }))}
            >
              <option value="">Select Class</option>
              {classesWithStreamCounts.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.streamCount} {cls.streamCount === 1 ? 'stream' : 'streams'})
                </option>
              ))}
            </select>
          </div>

          {/* Stream Selection */}
          {filters.classId && filteredStreams.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Layers size={14} className="inline mr-2" />
                Stream (Optional)
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.streamId || ''}
                onChange={(e) => updateFilters(prev => ({ ...prev, streamId: e.target.value || undefined }))}
              >
                <option value="">All Streams</option>
                {filteredStreams.map(stream => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name} ({stream.studentCount ?? 0} {stream.studentCount === 1 ? 'student' : 'students'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Academic Year */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Calendar size={14} className="inline mr-2" />
              Academic Year
            </label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedAcademicYear}
              onChange={(e) => {
                setSelectedAcademicYear(e.target.value);
                updateFilters(prev => ({ ...prev, termId: undefined }));
              }}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.year_name} {year.is_current && '(Current)'}
                </option>
              ))}
            </select>
          </div>

          {/* Term */}
          {selectedAcademicYear && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Clock size={14} className="inline mr-2" />
                Term
              </label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.termId || ''}
                onChange={(e) => updateFilters(prev => ({ ...prev, termId: e.target.value }))}
                disabled={!selectedAcademicYear || terms.length === 0}
              >
                <option value="">{terms.length === 0 ? 'No terms available' : 'Select Term'}</option>
                {terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name} {term.is_current && '(Current)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Curriculum */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <BookOpen size={14} className="inline mr-2" />
              Curriculum
            </label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.curriculumId || ''}
              onChange={(e) => updateFilters(prev => ({ ...prev, curriculumId: e.target.value }))}
            >
              <option value="">All Curricula</option>
              {curricula.map(curr => (
                <option key={curr.id} value={curr.id}>
                  {curr.name} ({curr.code})
                </option>
              ))}
            </select>
          </div>

          {/* Grading System */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <BarChart2 size={14} className="inline mr-2" />
              Grading System
            </label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.gradingSystemId || ''}
              onChange={(e) => updateFilters(prev => ({ ...prev, gradingSystemId: e.target.value }))}
            >
              <option value="">Default System</option>
              {gradingSystems.map(sys => (
                <option key={sys.id} value={sys.id}>
                  {sys.name} {sys.is_default && '(Default)'}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50"
              onClick={() => {
                const reset: FiltersType = { viewMode: 'class' };
                setFilters(reset);
                filtersRef.current = reset;
                setSelectedAcademicYear("");
                setShowFilters(false);
              }}
            >
              Clear All
            </button>
            <button
              className="flex-1 px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
              onClick={() => setShowFilters(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderExportModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-800">Export Options</h3>
          <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Excel Exports */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Excel Reports</h4>
            <button onClick={() => handleExportExcel('broadsheet')} disabled={exportLoading}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-50">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-emerald-600" />
                <div className="text-left">
                  <p className="font-bold">Class BroadSheet</p>
                  <p className="text-xs text-slate-500">Complete class results with all subjects</p>
                </div>
              </div>
              {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>

            {filters.streamId && (
              <button onClick={() => handleExportExcel('stream')} disabled={exportLoading}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-50">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={20} className="text-blue-600" />
                  <div className="text-left">
                    <p className="font-bold">Stream Results</p>
                    <p className="text-xs text-slate-500">Results for selected stream only</p>
                  </div>
                </div>
                {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </button>
            )}

            <button onClick={() => handleExportExcel('individual')} disabled={exportLoading}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-50">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-purple-600" />
                <div className="text-left">
                  <p className="font-bold">Individual Results</p>
                  <p className="text-xs text-slate-500">Separate sheet for each student</p>
                </div>
              </div>
              {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
          </div>

          {/* PDF Exports */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">PDF Reports</h4>
            <button onClick={() => handleExportPDF('class')} disabled={exportLoading}
              className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-50">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-rose-600" />
                <div className="text-left">
                  <p className="font-bold">Class Summary</p>
                  <p className="text-xs text-slate-500">Performance statistics and rankings</p>
                </div>
              </div>
              {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>

            {filters.streamId && (
              <button onClick={() => handleExportPDF('stream')} disabled={exportLoading}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-50">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-amber-600" />
                  <div className="text-left">
                    <p className="font-bold">Stream Report</p>
                    <p className="text-xs text-slate-500">Detailed stream performance</p>
                  </div>
                </div>
                {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </button>
            )}

            {filters.selectedStudentId && (
              <button onClick={() => handleExportPDF('student')} disabled={exportLoading}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-50">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-indigo-600" />
                  <div className="text-left">
                    <p className="font-bold">Student Report Card</p>
                    <p className="text-xs text-slate-500">Individual student performance</p>
                  </div>
                </div>
                {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </button>
            )}
          </div>

          {/* Print Option */}
          <button onClick={handlePrint} disabled={exportLoading}
            className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-50 mt-4">
            <div className="flex items-center gap-3">
              <Printer size={20} className="text-slate-600" />
              <div className="text-left">
                <p className="font-bold">Print View</p>
                <p className="text-xs text-slate-500">Open printer-friendly version</p>
              </div>
            </div>
            <Printer size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStatsCards = () => {
    if (statsLoading) {
      return Array(6).fill(0).map((_, i) => (
        <div key={i} className="p-1 rounded-[2.5rem] bg-gradient-to-br from-slate-200 to-slate-300 shadow-xl animate-pulse">
          <div className="bg-white/10 backdrop-blur-sm rounded-[2.4rem] p-6 h-32" />
        </div>
      ));
    }

    if (!enhancedStats) {
      return (
        <div className="col-span-6 p-8 bg-white/50 border border-slate-200 rounded-3xl text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            {loading ? 'Loading results...' : 'Select filters to view performance statistics'}
          </p>
        </div>
      );
    }

    const statCards = [
      {
        label: "Class Average",
        value: `${enhancedStats.summary?.classMeanPoints || '0.00'} pts`,
        subLabel: `${enhancedStats.summary?.classMeanGrade || ''} Grade`,
        icon: <Target />, color: "from-blue-600 to-indigo-700", trend: "+0.3", trendUp: true
      },
      {
        label: "Pass Rate",
        value: `${enhancedStats.summary?.passRate || 0}%`,
        subLabel: `${enhancedStats.summary?.creditRate || 0}% Credit`,
        icon: <TrendingUp />, color: "from-emerald-500 to-teal-600", trend: "+5%", trendUp: true
      },
      {
        label: "Distinctions",
        value: `${enhancedStats.summary?.distinctionRate || 0}%`,
        subLabel: "A & A- Grades",
        icon: <Award />, color: "from-purple-600 to-fuchsia-600", trend: "+2%", trendUp: true
      },
      {
        label: "Total Students",
        value: enhancedStats.summary?.totalStudents || 0,
        subLabel: `${filteredStreams.length} Streams`,
        icon: <Users />, color: "from-amber-400 to-orange-500", trend: ""
      },
      {
        label: "Top Performer",
        value: enhancedStats.summary?.topStudent?.name?.split(' ')[0] || 'N/A',
        subLabel: `${enhancedStats.summary?.topStudent?.points || 0} pts • ${enhancedStats.summary?.topStudent?.stream || ''}`,
        icon: <Star />, color: "from-pink-500 to-rose-600", trend: ""
      },
      {
        label: "Grading System",
        value: enhancedStats.summary?.gradingSystemName || 'Standard',
        subLabel: `${enhancedStats.data?.gradeDistribution?.length || 0} Grade Levels`,
        icon: <BarChart2 />, color: "from-slate-700 to-slate-900", trend: ""
      }
    ];

    return statCards.map((stat, i) => (
      <div key={i} className={`p-1 rounded-[2.5rem] bg-gradient-to-br ${stat.color} shadow-2xl shadow-slate-200 transition-transform hover:scale-105`}>
        <div className="bg-white/10 backdrop-blur-sm rounded-[2.4rem] p-6 text-white h-full border border-white/20">
          <div className="flex justify-between items-start">
            <span className="p-2 bg-white/20 rounded-xl">{stat.icon}</span>
            {stat.trend && (
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.trendUp ? 'text-emerald-200' : 'text-rose-200'}`}>
                {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.trend}
              </div>
            )}
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest opacity-70">{stat.label}</p>
          <p className="text-3xl font-black">{stat.value}</p>
          <p className="text-xs font-medium opacity-80 mt-1">{stat.subLabel}</p>
        </div>
      </div>
    ));
  };

  const renderStreamComparison = () => {
    if (!stats?.data?.streamComparison || stats.data.streamComparison.length === 0) return null;

    return (
      <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <GitCompare size={20} className="text-blue-500" />
              Stream Comparison
            </h3>
            <p className="text-sm text-slate-500 mt-1">Performance across streams</p>
          </div>
          <button
            onClick={() => setFullscreenChart(fullscreenChart === 'stream' ? null : 'stream')}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            {fullscreenChart === 'stream' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        <div className={`p-6 ${fullscreenChart === 'stream' ? 'h-[600px]' : ''}`}>
          <ResponsiveContainer width="100%" height={fullscreenChart === 'stream' ? 550 : 350}>
            <BarChart data={stats.data.streamComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="streamName" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[0, 12]} />
              <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="meanPoints" fill="#6366f1" name="Mean Points" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-2 text-left">Stream</th>
                  <th className="px-4 py-2 text-center">Students</th>
                  <th className="px-4 py-2 text-center">Mean Points</th>
                  <th className="px-4 py-2 text-center">Grade</th>
                  <th className="px-4 py-2 text-center">Pass Rate</th>
                  <th className="px-4 py-2 text-center">Rank</th>
                  <th className="px-4 py-2 text-right">Top Student</th>
                </tr>
              </thead>
              <tbody>
                {stats.data.streamComparison.map((stream, idx) => (
                  <tr key={stream.streamId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.streams[idx % COLORS.streams.length] }} />
                        {stream.streamName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{stream.studentCount}</td>
                    <td className="px-4 py-3 text-center font-bold">{stream.meanPoints.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        stream.meanGrade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                        stream.meanGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                        stream.meanGrade === 'C' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>{stream.meanGrade}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">{stream.passRate}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        stream.rank === 1 ? 'bg-emerald-100 text-emerald-700' :
                        stream.rank === 2 ? 'bg-blue-100 text-blue-700' :
                        stream.rank === 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>#{stream.rank}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600">{stream.topStudent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    );
  };

  const renderSubjectHeatmap = () => {
    if (!stats?.data?.subjectHeatmap || stats.data.subjectHeatmap.length === 0) return null;

    return (
      <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-purple-500" />
              Subject Performance Matrix
            </h3>
            <p className="text-sm text-slate-500 mt-1">Heatmap of subject performance by stream</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setChartType(chartType === 'bar' ? 'radar' : 'bar')} className="p-2 hover:bg-slate-100 rounded-xl">
              {chartType === 'bar' ? <Radar size={18} /> : <BarChart2 size={18} />}
            </button>
            <button onClick={() => setFullscreenChart(fullscreenChart === 'subject' ? null : 'subject')} className="p-2 hover:bg-slate-100 rounded-xl">
              {fullscreenChart === 'subject' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        <div className={`p-6 ${fullscreenChart === 'subject' ? 'h-[600px]' : ''}`}>
          {chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height={fullscreenChart === 'subject' ? 550 : 350}>
              <BarChart data={stats.data.subjectHeatmap} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={70} stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 12]} />
                <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                {(stats.data.subjectHeatmap?.[0]?.streams ?? []).map((_, idx) => (
                  <Bar key={idx} dataKey={`streams[${idx}].meanScore`}
                    name={stats.data.subjectHeatmap?.[0]?.streams[idx]?.streamName ?? `Stream ${idx + 1}`}
                    fill={COLORS.streams[idx % COLORS.streams.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={fullscreenChart === 'subject' ? 550 : 350}>
              <RadarChart outerRadius={150} data={stats.data.subjectHeatmap}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" />
                <PolarRadiusAxis stroke="#64748b" domain={[0, 12]} />
                {(stats.data.subjectHeatmap?.[0]?.streams ?? []).map((_, idx) => (
                  <ReRadar key={idx}
                    name={stats.data.subjectHeatmap?.[0]?.streams[idx]?.streamName ?? `Stream ${idx + 1}`}
                    dataKey={`streams[${idx}].meanScore`}
                    stroke={COLORS.streams[idx % COLORS.streams.length]}
                    fill={COLORS.streams[idx % COLORS.streams.length]} fillOpacity={0.2} />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    );
  };

  const renderPerformanceTrend = () => {
    if (!stats?.data?.performanceTrend || stats.data.performanceTrend.length === 0) return null;

    return (
      <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <LineChart size={20} className="text-emerald-500" />
              Performance Trend
            </h3>
            <p className="text-sm text-slate-500 mt-1">Progress across terms</p>
          </div>
          <button onClick={() => setFullscreenChart(fullscreenChart === 'trend' ? null : 'trend')} className="p-2 hover:bg-slate-100 rounded-xl">
            {fullscreenChart === 'trend' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        <div className={`p-6 ${fullscreenChart === 'trend' ? 'h-[500px]' : ''}`}>
          <ResponsiveContainer width="100%" height={fullscreenChart === 'trend' ? 450 : 300}>
            <ComposedChart data={stats.data.performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="term" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[0, 12]} />
              <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Legend />
              <Area type="monotone" dataKey="classMean" fill="#6366f1" stroke="#4f46e5" fillOpacity={0.1} name="Class Average" />
              {stats.data.performanceTrend[0]?.streamAMean !== undefined && (
                <Line type="monotone" dataKey="streamAMean" stroke="#10b981" name="Stream A" strokeWidth={2} />
              )}
              {stats.data.performanceTrend[0]?.streamBMean !== undefined && (
                <Line type="monotone" dataKey="streamBMean" stroke="#f59e0b" name="Stream B" strokeWidth={2} />
              )}
              {stats.data.performanceTrend[0]?.streamCMean !== undefined && (
                <Line type="monotone" dataKey="streamCMean" stroke="#ef4444" name="Stream C" strokeWidth={2} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  };

  const renderStudentRankings = () => {
    if (loading) {
      return (
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white overflow-hidden">
          <div className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-spin" />
            <p className="text-slate-500 font-medium">Loading results...</p>
          </div>
        </Card>
      );
    }

    if (filteredResults.length === 0) {
      return (
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white overflow-hidden">
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              {filters.classId && filters.termId && filters.gradingSystemId
                ? 'No results found for the selected filters'
                : 'Select a class, term, and grading system to view results'}
            </p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">
              {filters.streamId ? 'Stream Rankings' : 'Class Rankings'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {filteredResults.length} students • Sorted by total points
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPercentages(!showPercentages)}
              className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              {showPercentages ? <Eye size={14} /> : <EyeOff size={14} />}
              {showPercentages ? 'Show Points' : 'Show Percentages'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Admission</th>
                <th className="px-6 py-4">Stream</th>
                <th className="px-6 py-4 text-center">Mean Points</th>
                <th className="px-6 py-4 text-center">Grade</th>
                <th className="px-6 py-4 text-center">Total Marks</th>
                <th className="px-6 py-4 text-center">Trend</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredResults.map((item, index) => {
                const percentage = getMeanPercentage(item.meanPoints);
                const trend = item.trend || 'stable';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-all cursor-pointer"
                    onClick={() => {
                      updateFilters(prev => ({ ...prev, selectedStudentId: item.studentId }));
                      fetchStudentDetails(item.studentId);
                      setSelectedViewMode('student');
                    }}
                  >
                    <td className="px-6 py-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0 ? 'bg-emerald-500 text-white' :
                        index === 1 ? 'bg-blue-500 text-white' :
                        index === 2 ? 'bg-amber-500 text-white' :
                        'bg-slate-100 text-slate-600'
                      }`}>#{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800">{item.studentName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{item.termName} • {item.academicYear}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-600">{item.admissionNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold">{item.streamName || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            item.meanPoints >= 8 ? 'bg-emerald-500' :
                            item.meanPoints >= 6 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="font-black text-slate-700">
                          {showPercentages ? `${percentage}%` : `${item.meanPoints.toFixed(1)} pts`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1.5 rounded-xl border text-xs font-black shadow-sm ${getGradeColor(percentage)}`}>
                        {item.overallGrade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-700">{item.totalMarks}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1 font-bold text-xs ${
                        trend === 'up' ? 'text-emerald-500' :
                        trend === 'down' ? 'text-rose-500' : 'text-slate-400'
                      }`}>
                        {trend === 'up' ? <TrendingUp size={14} /> :
                         trend === 'down' ? <TrendingDown size={14} /> :
                         <Activity size={14} />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFilters(prev => ({ ...prev, selectedStudentId: item.studentId }));
                          fetchStudentDetails(item.studentId);
                          setSelectedViewMode('student');
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye size={16} className="text-slate-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderStudentDetailView = () => {
    if (!selectedStudent) return null;

    return (
      <div className="space-y-6">
        {/* Student Header */}
        <Card className="border-none shadow-xl rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
          <div className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Student Profile</p>
                <h2 className="text-3xl font-black mt-2">{selectedStudent.name}</h2>
                <div className="flex items-center gap-4 mt-4">
                  <span className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold">{selectedStudent.admission}</span>
                  <span className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold">{selectedStudent.class} • {selectedStudent.stream}</span>
                  <span className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Attendance: {selectedStudent.attendance}%
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedViewMode('class')} className="p-3 bg-white/10 rounded-xl hover:bg-white/20">
                <XCircle size={20} />
              </button>
            </div>
          </div>
        </Card>

        {/* Subject Performance Radar */}
        <Card className="border-none shadow-xl rounded-3xl bg-white">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Radar size={18} className="text-purple-500" />
              Subject Performance Profile
            </h3>
          </div>
          <div className="p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={150} data={selectedStudent.subjects}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="name" stroke="#64748b" />
                <PolarRadiusAxis stroke="#64748b" domain={[0, 12]} />
                <ReRadar name="Student" dataKey="points" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                <ReRadar name="Class Average" dataKey="classAvg" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subject Breakdown */}
        <Card className="border-none shadow-xl rounded-3xl bg-white">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-extrabold text-slate-800">Subject Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Grade</th>
                  <th className="px-6 py-4 text-center">Points</th>
                  <th className="px-6 py-4 text-center">Class Avg</th>
                  <th className="px-6 py-4 text-center">Percentile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedStudent.subjects.map((subject, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{subject.name}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${
                            subject.score >= 80 ? 'bg-emerald-500' :
                            subject.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} style={{ width: `${subject.score}%` }} />
                        </div>
                        <span className="text-sm font-bold">{subject.score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        subject.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                        subject.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                        subject.grade === 'C' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>{subject.grade}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">{subject.points}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{subject.classAvg}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-bold ${
                        subject.percentile >= 80 ? 'text-emerald-600' :
                        subject.percentile >= 60 ? 'text-amber-600' : 'text-rose-600'
                      }`}>{subject.percentile}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Strengths & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-xl rounded-3xl bg-white">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Award size={18} className="text-emerald-500" />Strengths
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {selectedStudent.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="border-none shadow-xl rounded-3xl bg-white">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Target size={18} className="text-amber-500" />Areas for Improvement
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {selectedStudent.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="col-span-2 border-none shadow-xl rounded-3xl bg-white">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-500" />Recommendations
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {selectedStudent.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Zap size={16} className="text-purple-500" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Academic Insights
            {stats && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                {selectedViewMode === 'class' ? 'Class View' :
                 selectedViewMode === 'stream' ? 'Stream View' : 'Student View'}
              </span>
            )}
          </h1>
          <p className="text-slate-500 font-medium">
            {stats?.summary?.gradingSystemName
              ? `Using ${stats.summary.gradingSystemName} Grading • ${filters.streamId ? 'Filtered by stream' : 'All streams'}`
              : 'Visualizing student performance and grading trends'}
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1">
            <button onClick={() => setChartType('bar')}
              className={`p-2 rounded-xl transition-colors ${chartType === 'bar' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
              <BarChart2 size={18} />
            </button>
            <button onClick={() => setChartType('line')}
              className={`p-2 rounded-xl transition-colors ${chartType === 'line' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
              <LineChart size={18} />
            </button>
            <button onClick={() => setChartType('radar')}
              className={`p-2 rounded-xl transition-colors ${chartType === 'radar' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>
              <Radar size={18} />
            </button>
          </div>

          {/* Filter Button */}
          <button
            className="relative p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:shadow-lg transition-all"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            {(filters.classId || filters.termId || filters.streamId) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>

          {/* Export Button */}
          <button
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            disabled={exportLoading || !filters.classId || !filters.termId || !filters.gradingSystemId}
            onClick={() => setShowExportModal(true)}
          >
            {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} />}
            Export
          </button>

          {showFilters && renderFilterDropdown()}
        </div>
      </div>

      {/* Filters Summary */}
      {(filters.classId || filters.termId || selectedAcademicYear || filters.streamId) && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {selectedAcademicYear && (
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
              <Calendar size={14} />
              <span className="font-medium">{academicYears.find(y => y.id === selectedAcademicYear)?.year_name || 'Academic Year'}</span>
            </div>
          )}
          {filters.classId && (
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
              <Users size={14} />
              <span className="font-medium">{classes.find(c => c.id === filters.classId)?.class_name || 'Class'}</span>
            </div>
          )}
          {filters.streamId && (
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
              <Layers size={14} />
              <span className="font-medium">{streams.find(s => s.id === filters.streamId)?.name || 'Stream'}</span>
            </div>
          )}
          {filters.termId && (
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
              <Clock size={14} />
              <span className="font-medium">{terms.find(t => t.id === filters.termId)?.name || 'Term'}</span>
            </div>
          )}
          {filters.curriculumId && (
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
              <BookOpen size={14} />
              <span className="font-medium">{curricula.find(c => c.id === filters.curriculumId)?.name || ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content based on view mode */}
      {selectedViewMode === 'student' && selectedStudent ? (
        renderStudentDetailView()
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
            {renderStatsCards()}
          </div>

          {/* Stream Comparison (only show in class view) */}
          {selectedViewMode === 'class' && renderStreamComparison()}

          {/* Subject Heatmap */}
          {renderSubjectHeatmap()}

          {/* Performance Trend */}
          {renderPerformanceTrend()}

          {/* Student Rankings */}
          {renderStudentRankings()}
        </>
      )}

      {/* Export Modal */}
      {showExportModal && renderExportModal()}
    </div>
  );
};


export default ResultsPerformance;