import React, { useState, useEffect } from "react";
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
  TrendingDown
} from "lucide-react";
import Card from "../../components/common/Card";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import api from "../../services/api"; // Import your axios instance
import { academicAPI } from "../../services/api";
// Types
interface StudentResult {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  streamName: string;
  termName: string;
  academicYear: string;
  totalMarks: number;
  totalPoints: number;
  meanPoints: number;
  overallGrade: string;
  rank: number;
  totalStudents: number;
  curriculum?: string;
}

interface PerformanceStats {
  classMeanPoints: number;
  classMeanGrade: string;
  totalStudents: number;
  totalSubjects: number;
  passRate: number;
  topPerformerScore: number;
  topPerformerName: string;
  gradingSystemName: string;
  subjectRanking: Array<{
    subject: string;
    meanPoints: number;
    meanGrade: string;
    studentCount: number;
  }>;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  topPerformers: Array<{
    name: string;
    totalPoints: number;
  }>;
}

interface FilterOptions {
  classId?: string;
  termId?: string;
  curriculumId?: string;
  gradingSystemId?: string;
}

interface ClassOption {
  id: string;
  className: string;
  streamCount: number;
}

interface TermOption {
  id: string;
  termName: string;
  academicYear: string;
  isCurrent: boolean;
}

interface CurriculumOption {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

const ResultsPerformance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [results, setResults] = useState<StudentResult[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [curricula, setCurricula] = useState<CurriculumOption[]>([]);
  const [gradingSystems, setGradingSystems] = useState<any[]>([]);

  // Initialize with default current term
  useEffect(() => {
    if (user?.first_name) {
      fetchCurrentTerm();
      fetchClasses();
      fetchCurricula();
      fetchGradingSystems();
    }
  }, [user?.first_name]);

  useEffect(() => {
    if (filters.classId && filters.termId) {
      fetchResults();
      fetchPerformanceStats();
    }
  }, [filters]);

  const fetchCurrentTerm = async () => {
    try {
      const response = await api.get('/academic/terms');
      
      if (response.data.success && response.data.data) {
        setFilters(prev => ({
          ...prev,
          termId: response.data.data.id
        }));
        // Also fetch all terms for the dropdown
        fetchTerms();
      }
    } catch (error: any) {
      console.error('Failed to fetch current term:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch current term');
    }
  };
const fetchClasses = async () => {
  try {
    const response = await api.get('/classes');
    
    if (response.data.success) {
      // Access the array from response.data.data
      setClasses(response.data.data);
      // Auto-select first class if none selected
      if (response.data.data.length > 0 && !filters.classId) {
        setFilters(prev => ({
          ...prev,
          classId: response.data.data[0].id
        }));
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch classes:', error);
    toast.error(error.response?.data?.error || 'Failed to load classes');
  }
};

 const fetchTerms = async () => {
  try {
    const response = await api.get('/academic/terms');
    
    if (response.data.success) {
      // Check if data is an array or object
      let termsData = response.data.data;
      
      // If it's not an array, check for nested structure
      if (!Array.isArray(termsData) && termsData && typeof termsData === 'object') {
        // Try to find an array in the object
        if (termsData.terms && Array.isArray(termsData.terms)) {
          termsData = termsData.terms;
        } else if (termsData.data && Array.isArray(termsData.data)) {
          termsData = termsData.data;
        } else {
          // Convert object values to array if needed
          termsData = Object.values(termsData);
        }
      }
      
      setTerms(termsData);
    }
  } catch (error: any) {
    console.error('Failed to fetch terms:', error);
    
    // Handle 304 Not Modified
    if (error.response?.status === 304) {
      console.log('Terms unchanged (304)');
      return;
    }
    
    toast.error(error.response?.data?.error || 'Failed to load terms');
  }
};

const fetchCurricula = async () => {
  try {
    const response = await api.get('/academic');
    
    if (response.data.success) {
      // Access the array from response.data.data
      setCurricula(response.data.data);
      // Auto-select first curriculum if none selected
      if (response.data.data.length > 0 && !filters.curriculumId) {
        setFilters(prev => ({
          ...prev,
          curriculumId: response.data.data[0].id
        }));
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch curricula:', error);
    toast.error(error.response?.data?.error || 'Failed to load curricula');
  }
};
const fetchGradingSystems = async () => {
  try {
    const response = await api.get('/grading/systems', {
      params: { type: 'overall_points' }
    });
    
    if (response.data.success) {
      let systemsData = response.data.data;
      
      // Check if data is an array or object
      if (!Array.isArray(systemsData)) {
        // Try to extract from nested structure
        if (systemsData.raw && Array.isArray(systemsData.raw)) {
          systemsData = systemsData.raw;
        } else if (systemsData.systems?.subject && Array.isArray(systemsData.systems.subject)) {
          systemsData = systemsData.systems.subject;
        } else if (systemsData.data && Array.isArray(systemsData.data)) {
          systemsData = systemsData.data;
        } else {
          // If still not an array, log for debugging
          console.warn('Ugrading systems structure:', systemsData);
          systemsData = [];
        }
      }
      
      setGradingSystems(systemsData);
      
      // Auto-select default grading system
      const defaultSystem = systemsData.find((sys: any) => sys.is_default);
      if (defaultSystem && !filters.gradingSystemId) {
        setFilters(prev => ({
          ...prev,
          gradingSystemId: defaultSystem.id
        }));
      }
    }
  } catch (error: any) {
    console.error('Failed to fetch grading systems:', error);
    
    // Handle 304 Not Modified
    if (error.response?.status === 304) {
      console.log('Grading systems unchanged (304)');
      return;
    }
    
    toast.error(error.response?.data?.error || 'Failed to load grading systems');
  }
};
  const fetchResults = async () => {
    if (!filters.classId || !filters.termId) return;
    
    setLoading(true);
    try {
      const params = {
        classId: filters.classId,
        termId: filters.termId,
        ...(filters.gradingSystemId && { gradingSystemId: filters.gradingSystemId }),
        ...(filters.curriculumId && { curriculumId: filters.curriculumId })
      };

      const response = await api.get('/results/class', { params });
      
      if (response.data.success) {
        setResults(response.data.results || []);
      } else {
        toast.error(response.data.error || 'Failed to fetch results');
      }
    } catch (error: any) {
      console.error('Failed to fetch results:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceStats = async () => {
    if (!filters.classId || !filters.termId || !filters.gradingSystemId) return;
    
    setStatsLoading(true);
    try {
      const params = {
        classId: filters.classId,
        termId: filters.termId,
        gradingSystemId: filters.gradingSystemId
      };

      const response = await api.get('/results/class-stats', { params });
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        toast.error(response.data.error || 'Failed to fetch statistics');
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleExportPDF = async (type: 'individual' | 'class' | 'stats') => {
    if (!filters.classId || !filters.termId) {
      toast.error('Please select class and term first');
      return;
    }

    setExportLoading(true);
    try {
      const params = {
        classId: filters.classId,
        termId: filters.termId,
        ...(filters.gradingSystemId && { gradingSystemId: filters.gradingSystemId }),
        ...(filters.curriculumId && { curriculumId: filters.curriculumId })
      };

      let endpoint = '';
      let filename = '';

      switch (type) {
        case 'class':
          endpoint = '/results/class-broadsheet';
          filename = `class_broadsheet_${filters.classId}_${filters.termId}.pdf`;
          break;
        case 'stats':
          endpoint = '/results/class-stats-pdf';
          filename = `performance_stats_${filters.classId}_${filters.termId}.pdf`;
          break;
        default:
          return;
      }

      // Make API call to get PDF blob
      const response = await api.get(endpoint, {
        params,
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.response?.data?.error || 'Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!filters.classId || !filters.termId || !filters.gradingSystemId) {
      toast.error('Please select class, term, and grading system first');
      return;
    }

    setExportLoading(true);
    try {
      const params = {
        classId: filters.classId,
        termId: filters.termId,
        gradingSystemId: filters.gradingSystemId
      };

      const response = await api.get('/results/class-excel', {
        params,
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `broadsheet_${filters.classId}_${filters.termId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel report downloaded');
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.response?.data?.error || 'Failed to export Excel');
    } finally {
      setExportLoading(false);
    }
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

  const getMeanPercentage = (meanPoints: number) => {
    // Convert mean points (0-12 scale) to percentage (0-100)
    return Math.round((meanPoints / 12) * 100);
  };

  const calculatePassRate = (stats: PerformanceStats) => {
    if (!stats.gradeDistribution.length) return 0;
    const passingGrades = ['A', 'B', 'C'];
    const totalGrades = stats.gradeDistribution.reduce((sum, g) => sum + g.count, 0);
    const passingGradesCount = stats.gradeDistribution
      .filter(g => passingGrades.includes(g.grade))
      .reduce((sum, g) => sum + g.count, 0);
    
    return totalGrades > 0 ? Math.round((passingGradesCount / totalGrades) * 100) : 0;
  };

  const statsArray = stats ? [
    { 
      label: "Class Average", 
      val: `${stats.classMeanPoints.toFixed(1)}`, 
      subLabel: "Mean Points",
      icon: <Target />, 
      color: "from-blue-600 to-indigo-700" 
    },
    { 
      label: "Mean Grade", 
      val: stats.classMeanGrade, 
      subLabel: "Overall",
      icon: <Award />, 
      color: "from-purple-600 to-fuchsia-600" 
    },
    { 
      label: "Pass Rate", 
      val: `${calculatePassRate(stats)}%`, 
      subLabel: "A-C Grades",
      icon: <TrendingUp />, 
      color: "from-emerald-500 to-teal-600" 
    },
    { 
      label: "Top Performer", 
      val: stats.topPerformerScore ? `${Math.round((stats.topPerformerScore / 12) * 100)}%` : "N/A", 
      subLabel: stats.topPerformerName?.split(' ')[0] || '',
      icon: <Star />, 
      color: "from-amber-400 to-orange-500" 
    },
  ] : [];

  const renderFilterDropdown = () => (
    <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 min-w-[300px] z-50">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <Users size={14} className="inline mr-2" />
            Class
          </label>
          <select 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.classId || ''}
            onChange={(e) => setFilters({...filters, classId: e.target.value})}
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.className}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <Calendar size={14} className="inline mr-2" />
            Term
          </label>
          <select 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.termId || ''}
            onChange={(e) => setFilters({...filters, termId: e.target.value})}
          >
            <option value="">Select Term</option>
            {terms.map(term => (
              <option key={term.id} value={term.id}>
                {term.termName} - {term.academicYear} {term.isCurrent && '(Current)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <BookOpen size={14} className="inline mr-2" />
            Curriculum
          </label>
          <select 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.curriculumId || ''}
            onChange={(e) => setFilters({...filters, curriculumId: e.target.value})}
          >
            <option value="">All Curricula</option>
            {curricula.map(curr => (
              <option key={curr.id} value={curr.id}>
                {curr.name} ({curr.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <BarChart2 size={14} className="inline mr-2" />
            Grading System
          </label>
          <select 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.gradingSystemId || ''}
            onChange={(e) => setFilters({...filters, gradingSystemId: e.target.value})}
          >
            <option value="">Default System</option>
            {gradingSystems.map(sys => (
              <option key={sys.id} value={sys.id}>
                {sys.name} {sys.is_default && '(Default)'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-4">
          <button 
            className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50"
            onClick={() => {
              setFilters({});
              setShowFilters(false);
            }}
          >
            Clear
          </button>
          <button 
            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
            onClick={() => setShowFilters(false)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Academic Insights</h1>
          <p className="text-slate-500 font-medium">
            {stats?.gradingSystemName ? `Using ${stats.gradingSystemName} Grading` : 'Visualizing student performance and grading trends'}
          </p>
        </div>
        <div className="flex items-center gap-3 relative">
          <button 
            className="relative p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:shadow-lg transition-all"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            {(filters.classId || filters.termId) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
          
          <div className="relative group">
            <button 
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
              disabled={exportLoading || !filters.classId || !filters.termId}
              onClick={() => handleExportExcel()}
            >
              {exportLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Export Report
            </button>
            
            {/* Export Dropdown */}
            <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 min-w-[180px] hidden group-hover:block z-50">
              <button 
                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                onClick={() => handleExportExcel()}
                disabled={exportLoading}
              >
                Excel BroadSheet
              </button>
              <button 
                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                onClick={() => handleExportPDF('class')}
                disabled={exportLoading}
              >
                Class BroadSheet PDF
              </button>
              <button 
                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => handleExportPDF('stats')}
                disabled={exportLoading}
              >
                Statistics PDF
              </button>
            </div>
          </div>
          
          {showFilters && renderFilterDropdown()}
        </div>
      </div>

      {/* Filters Summary */}
      {(filters.classId || filters.termId) && (
        <div className="flex items-center gap-3 text-sm">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
            <Users size={14} />
            <span className="font-medium">
              {classes.find(c => c.id === filters.classId)?.className || 'All Classes'}
            </span>
          </div>
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
            <Calendar size={14} />
            <span className="font-medium">
              {terms.find(t => t.id === filters.termId)?.termName || 'All Terms'}
            </span>
          </div>
          {filters.curriculumId && (
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
              <BookOpen size={14} />
              <span className="font-medium">
                {curricula.find(c => c.id === filters.curriculumId)?.name || ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-1 rounded-[2.5rem] bg-gradient-to-br from-slate-200 to-slate-300 shadow-xl animate-pulse">
              <div className="bg-white/10 backdrop-blur-sm rounded-[2.4rem] p-6 h-32" />
            </div>
          ))
        ) : stats ? (
          statsArray.map((stat, i) => (
            <div key={i} className={`p-1 rounded-[2.5rem] bg-gradient-to-br ${stat.color} shadow-2xl shadow-slate-200 transition-transform hover:scale-105`}>
              <div className="bg-white/10 backdrop-blur-sm rounded-[2.4rem] p-6 text-white h-full border border-white/20">
                <div className="flex justify-between items-start">
                  <span className="p-2 bg-white/20 rounded-xl">{stat.icon}</span>
                  <BarChart2 size={16} className="opacity-40" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-widest opacity-70">{stat.label}</p>
                <p className="text-3xl font-black">{stat.val}</p>
                {stat.subLabel && (
                  <p className="text-xs font-medium opacity-80 mt-1">{stat.subLabel}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-4 p-8 bg-white/50 border border-slate-200 rounded-3xl text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Select a class and term to view performance statistics</p>
          </div>
        )}
      </div>

      {/* Main Results Display */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">Student Rankings</h3>
            {stats && (
              <p className="text-sm text-slate-500 mt-1">
                {stats.totalStudents} students • {stats.subjectRanking.length} subjects • {stats.gradingSystemName}
              </p>
            )}
          </div>
          <div className="flex gap-2 text-xs font-bold text-slate-400 uppercase">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> A-B
            </span>
            <span className="flex items-center gap-1 ml-4">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> C-D
            </span>
            <span className="flex items-center gap-1 ml-4">
              <div className="w-2 h-2 rounded-full bg-rose-500" /> E
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto px-4 pb-4">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
              <p className="text-slate-500 mt-4">Loading student results...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No results found for selected filters</p>
              <p className="text-slate-400 text-sm mt-2">Try selecting a different class or term</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                  <th className="px-6 py-6">Student & Rank</th>
                  <th className="px-6 py-6">Admission</th>
                  <th className="px-6 py-6">Class/Stream</th>
                  <th className="px-6 py-6 text-center">Mean Points</th>
                  <th className="px-6 py-6 text-center">Grade</th>
                  <th className="px-6 py-6 text-center">Total Marks</th>
                  <th className="px-6 py-6 text-right">Curriculum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map((item) => {
                  const percentage = getMeanPercentage(item.meanPoints);
                  const grade = getGrade(item.meanPoints);
                  const trend = item.rank <= 3 ? 'up' : item.rank > Math.floor(item.totalStudents / 2) ? 'down' : 'stable';
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all rounded-3xl">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <span className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                            ${item.rank <= 3 ? 'bg-emerald-500 text-white' : 
                              item.rank <= 10 ? 'bg-blue-500 text-white' : 
                              'bg-slate-200 text-slate-600'}
                          `}>
                            #{item.rank}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800">{item.studentName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              {item.termName} • {item.academicYear}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-mono text-slate-600">{item.admissionNumber}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-600">{item.className}</span>
                          <span className="text-xs text-slate-400 font-medium">
                            Stream {item.streamName || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-full max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.meanPoints >= 8 ? 'bg-emerald-500' : 
                                item.meanPoints >= 6 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="font-black text-slate-700">
                            {item.meanPoints.toFixed(1)} pts
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-xl border text-xs font-black shadow-sm ${getGradeColor(percentage)}`}>
                          {grade}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="font-bold text-slate-700">{item.totalMarks}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-medium text-slate-500 px-2 py-1 bg-slate-100 rounded">
                            {item.curriculum || 'Standard'}
                          </span>
                          <div className={`inline-flex items-center gap-1 font-bold text-xs ${
                            trend === 'up' ? 'text-emerald-500' : 
                            trend === 'down' ? 'text-rose-500' : 'text-slate-400'
                          }`}>
                            {trend === 'up' ? <TrendingUp size={14} /> : 
                             trend === 'down' ? <TrendingDown size={14} /> : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination/Fetch Status */}
        {results.length > 0 && (
          <div className="px-8 py-4 border-t border-slate-100 flex justify-between items-center text-sm">
            <span className="text-slate-500">
              Showing {results.length} of {stats?.totalStudents || 0} students
            </span>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">
                Previous
              </button>
              <button className="px-4 py-2 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800">
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Grade Distribution Visualizer (if stats available) */}
      {stats && stats.gradeDistribution.length > 0 && (
        <Card className="border-none shadow-xl rounded-3xl bg-white">
          <div className="p-8 border-b border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-800">Grade Distribution</h3>
            <p className="text-slate-500 text-sm mt-1">Performance spread across {stats.totalStudents} students</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {stats.gradeDistribution.map((dist) => (
                <div key={dist.grade} className="text-center">
                  <div className="mb-2">
                    <span className={`inline-block w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg`}
                          style={{ backgroundColor: dist.color }}>
                      {dist.grade}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-700">{dist.count} students</div>
                  <div className="text-xs text-slate-500">{dist.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Subject Performance (if stats available) */}
      {stats && stats.subjectRanking.length > 0 && (
        <Card className="border-none shadow-xl rounded-3xl bg-white">
          <div className="p-8 border-b border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-800">Subject Performance Ranking</h3>
            <p className="text-slate-500 text-sm mt-1">Subjects ranked by average performance</p>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              {stats.subjectRanking.map((subject, index) => (
                <div key={subject.subject} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800">{subject.subject}</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        subject.meanGrade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                        subject.meanGrade === 'B' ? 'bg-blue-100 text-blue-700' :
                        subject.meanGrade === 'C' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {subject.meanGrade}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{ width: `${(subject.meanPoints / 12) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 min-w-[60px]">
                        {subject.meanPoints.toFixed(1)} pts
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      {subject.studentCount} students assessed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResultsPerformance;