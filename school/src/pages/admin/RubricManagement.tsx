// pages/admin/RubricManagement.tsx
import React, { useState, useEffect, useMemo } from "react";
import Card from "../../components/common/Card";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Download,
  Upload,
  Share2,
  Lock,
  Unlock,
  RefreshCw,
  Save,
  BarChart,
  BookOpen,
  Layers,
  Grid,
  Table,
  List,
  GraduationCap,
  Award,
  Star,
  Target,
  TrendingUp,
  Users,
  FileText,
  Printer,
  Mail,
  Calendar,
  Clock,
  ArrowUpDown,
  MoreVertical,
  Settings,
  BookMarked,
  GitBranch,
  ListTree,
  CheckSquare,
  HelpCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cbcAPIS } from '../../services/api';
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// ================================================
// TYPES
// ================================================

interface RubricLevel {
  id: string;
  level_number: number;
  level_name: string;
  level_code?: string;
  cbc_descriptor?: string;
  description?: string;
  min_score?: number;
  max_score?: number;
  points?: number;
  color_code?: string;
  background_color?: string;
  icon?: string;
  is_pass_level: boolean;
  is_target_level: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface RubricScale {
  id: string;
  scale_name: string;
  scale_code?: string;
  description?: string;
  scale_type: 'competency' | 'feedback' | 'effort' | 'behavior' | 'custom';
  target_audience: 'all' | 'teachers' | 'students' | 'parents';
  min_levels: number;
  max_levels: number;
  use_for_assessment: boolean;
  use_for_reports: boolean;
  use_for_feedback: boolean;
  default_color_scheme?: string;
  is_active: boolean;
  is_system_default: boolean;
  school_id?: string;
  created_by?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
  levels: RubricLevel[];
  _count?: {
    cbc_assessments: number;
  };
}

interface CBCAssessment {
  id: string;
  title: string;
  description?: string;
  assessment_type: string;
  subject: {
    id: string;
    name: string;
    subject_code: string;
  };
  class: {
    id: string;
    class_name: string;
    class_level: number;
  };
  stream?: {
    id: string;
    name: string;
  };
  strand: {
    id: string;
    name: string;
    code: string;
  };
  sub_strand?: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
  total_students: number;
  assessed_count?: number;
  is_locked: boolean;
  locked_at?: string;
  created_at: string;
  rubric_scale?: RubricScale;
}

interface AssessmentReport {
  assessment: {
    id: string;
    title: string;
    type: string;
    isLocked: boolean;
    createdAt: string;
    lockedAt?: string;
  };
  context: {
    strand: any;
    subStrand?: any;
    subject: any;
    class: any;
    stream?: any;
    teacher?: {
      first_name: string;
      last_name: string;
    };
  };
  rubricScale: RubricScale;
  statistics: {
    totalStudents: number;
    levelDistribution: Record<string, number>;
    averageLevel: string;
    averageLevelDescriptor: string;
    passRate?: number;
    excellenceRate?: number;
  };
  results: Array<{
    student: {
      id: string;
      first_name: string;
      last_name: string;
      admission_number: string;
    };
    level: RubricLevel;
    teacherComment?: string;
    hasEvidence: boolean;
  }>;
}

interface ClassOption {
  id: string;
  class_name: string;
  class_level: number;
}

interface TermOption {
  id: string;
  term_name: string;
  is_current: boolean;
  academic_year_id: string;
}

interface SubjectOption {
  id: string;
  name: string;
  subject_code: string;
  curriculum?: {
    id: string;
    name: string;
  };
}

interface ReportFilterParams {
  classId?: string;
  termId?: string;
  subjectId?: string;
  strandId?: string;
  assessmentId?: string;
  startDate?: string;
  endDate?: string;
}

// ================================================
// MAIN COMPONENT
// ================================================

const RubricManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingReports, setFetchingReports] = useState(false);
  
  // Data states
  const [rubricScales, setRubricScales] = useState<RubricScale[]>([]);
  const [assessments, setAssessments] = useState<CBCAssessment[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedReport, setSelectedReport] = useState<AssessmentReport | null>(null);
  
  // Modal states
  const [showModal, setShowModal] = useState<string | null>(null); // 'rubric', 'report'
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filter states
  const [filterParams, setFilterParams] = useState<ReportFilterParams>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'grid' | 'table' | 'compact'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    reports: true,
    rubrics: true
  });
  
  // Form state for rubric creation
  const [formData, setFormData] = useState<{
    scaleName: string;
    scaleCode: string;
    description: string;
    scaleType: 'competency' | 'feedback' | 'effort' | 'behavior' | 'custom';
    targetAudience: 'all' | 'teachers' | 'students' | 'parents';
    minLevels: number;
    maxLevels: number;
    useForAssessment: boolean;
    useForReports: boolean;
    useForFeedback: boolean;
    defaultColorScheme: string;
    levels: Array<{
      levelNumber: number;
      levelName: string;
      levelCode: string;
      cbcDescriptor: string;
      description: string;
      minScore: string;
      maxScore: string;
      points: string;
      colorCode: string;
      backgroundColor: string;
      icon: string;
      isPassLevel: boolean;
      isTargetLevel: boolean;
      displayOrder: number;
    }>;
  }>({
    scaleName: '',
    scaleCode: '',
    description: '',
    scaleType: 'competency',
    targetAudience: 'all',
    minLevels: 1,
    maxLevels: 4,
    useForAssessment: true,
    useForReports: true,
    useForFeedback: true,
    defaultColorScheme: 'default',
    levels: [
      {
        levelNumber: 1,
        levelName: 'Beginning',
        levelCode: 'B',
        cbcDescriptor: 'Below Expectations',
        description: 'Learner requires significant support',
        minScore: '0',
        maxScore: '1.4',
        points: '1',
        colorCode: '#EF4444',
        backgroundColor: '#FEE2E2',
        icon: '🔴',
        isPassLevel: false,
        isTargetLevel: false,
        displayOrder: 1
      },
      {
        levelNumber: 2,
        levelName: 'Developing',
        levelCode: 'D',
        cbcDescriptor: 'Approaching Expectations',
        description: 'Learner demonstrates with guidance',
        minScore: '1.5',
        maxScore: '2.4',
        points: '2',
        colorCode: '#F59E0B',
        backgroundColor: '#FEF3C7',
        icon: '🟡',
        isPassLevel: true,
        isTargetLevel: false,
        displayOrder: 2
      },
      {
        levelNumber: 3,
        levelName: 'Proficient',
        levelCode: 'P',
        cbcDescriptor: 'Meeting Expectations',
        description: 'Learner independently demonstrates',
        minScore: '2.5',
        maxScore: '3.4',
        points: '3',
        colorCode: '#3B82F6',
        backgroundColor: '#DBEAFE',
        icon: '🔵',
        isPassLevel: true,
        isTargetLevel: true,
        displayOrder: 3
      },
      {
        levelNumber: 4,
        levelName: 'Advanced',
        levelCode: 'A',
        cbcDescriptor: 'Exceeding Expectations',
        description: 'Learner demonstrates deeper understanding',
        minScore: '3.5',
        maxScore: '4.0',
        points: '4',
        colorCode: '#10B981',
        backgroundColor: '#D1FAE5',
        icon: '🟢',
        isPassLevel: true,
        isTargetLevel: false,
        displayOrder: 4
      }
    ]
  });

  // ================================================
  // DATA FETCHING
  // ================================================

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [rubricRes, classesRes, termsRes, subjectsRes] = await Promise.allSettled([
        cbcAPIS.getRubricScales({ 
          includeSystemDefault: 'true',
          isActive: true 
        }),
        cbcAPIS.getClasses(),
        cbcAPIS.getTerms(),
        cbcAPIS.getSubjects()
      ]);

      if (rubricRes.status === 'fulfilled' && rubricRes.value.data?.success) {
        setRubricScales(rubricRes.value.data.data || []);
      }

      if (classesRes.status === 'fulfilled' && classesRes.value.data?.success) {
        setClasses(classesRes.value.data.data || []);
      }

      if (termsRes.status === 'fulfilled' && termsRes.value.data?.success) {
        setTerms(termsRes.value.data.data || []);
      }

      if (subjectsRes.status === 'fulfilled' && subjectsRes.value.data?.success) {
        setSubjects(subjectsRes.value.data.data || []);
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load rubric data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentsForReport = async () => {
    try {
      setFetchingReports(true);
      
      // This would need a real API endpoint - for now, we'll use a placeholder
      // You might need to add a new endpoint to your API
      const response = await cbcAPIS.getCbcAssessments?.(filterParams) || 
                       { data: { success: false, data: [] } };
      
      if (response.data?.success) {
        setAssessments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setFetchingReports(false);
    }
  };

  const fetchAssessmentReport = async (assessmentId: string) => {
    try {
      setFetchingReports(true);
      const response = await cbcAPIS.getCbcAssessmentReport(assessmentId);
      
      if (response.data?.success) {
        setSelectedReport(response.data.data);
        setShowModal('report');
      } else {
        toast.error('Failed to load assessment report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load assessment report');
    } finally {
      setFetchingReports(false);
    }
  };

  // ================================================
  // RUBRIC CRUD OPERATIONS
  // ================================================

  const handleCreateRubric = async () => {
    try {
      setSubmitting(true);
      
      const payload = {
        scaleName: formData.scaleName,
        scaleCode: formData.scaleCode || undefined,
        description: formData.description,
        scaleType: formData.scaleType,
        targetAudience: formData.targetAudience,
        minLevels: formData.minLevels,
        maxLevels: formData.maxLevels,
        useForAssessment: formData.useForAssessment,
        useForReports: formData.useForReports,
        useForFeedback: formData.useForFeedback,
        defaultColorScheme: formData.defaultColorScheme,
        levels: formData.levels.map(level => ({
          levelNumber: level.levelNumber,
          levelName: level.levelName,
          levelCode: level.levelCode,
          cbcDescriptor: level.cbcDescriptor,
          description: level.description,
          minScore: parseFloat(level.minScore),
          maxScore: parseFloat(level.maxScore),
          points: parseFloat(level.points),
          colorCode: level.colorCode,
          backgroundColor: level.backgroundColor,
          icon: level.icon,
          isPassLevel: level.isPassLevel,
          isTargetLevel: level.isTargetLevel,
          displayOrder: level.displayOrder
        }))
      };

      if (editingId) {
        await cbcAPIS.updateRubricScale(editingId, payload);
        toast.success('Rubric scale updated successfully');
      } else {
        await cbcAPIS.createRubricScale(payload);
        toast.success('Rubric scale created successfully');
      }

      await fetchInitialData();
      closeModal();
    } catch (error: any) {
      console.error('Error saving rubric:', error);
      toast.error(error.response?.data?.error || 'Failed to save rubric scale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRubric = async (scaleId: string, scaleName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${scaleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSubmitting(true);
      await cbcAPIS.deleteRubricScale(scaleId);
      await fetchInitialData();
      toast.success('Rubric scale deleted successfully');
    } catch (error: any) {
      console.error('Error deleting rubric:', error);
      toast.error(error.response?.data?.error || 'Failed to delete rubric scale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRubricStatus = async (scaleId: string, currentStatus: boolean) => {
    try {
      await cbcAPIS.updateRubricScale(scaleId, { isActive: !currentStatus });
      await fetchInitialData();
      toast.success(`Rubric scale ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling rubric status:', error);
      toast.error('Failed to update rubric status');
    }
  };

  // ================================================
  // FORM HANDLERS
  // ================================================

  const openEditModal = (rubric: RubricScale) => {
    setEditingId(rubric.id);
    setFormData({
      scaleName: rubric.scale_name,
      scaleCode: rubric.scale_code || '',
      description: rubric.description || '',
      scaleType: rubric.scale_type,
      targetAudience: rubric.target_audience,
      minLevels: rubric.min_levels,
      maxLevels: rubric.max_levels,
      useForAssessment: rubric.use_for_assessment,
      useForReports: rubric.use_for_reports,
      useForFeedback: rubric.use_for_feedback,
      defaultColorScheme: rubric.default_color_scheme || 'default',
      levels: rubric.levels.map(level => ({
        levelNumber: level.level_number,
        levelName: level.level_name,
        levelCode: level.level_code || '',
        cbcDescriptor: level.cbc_descriptor || '',
        description: level.description || '',
        minScore: level.min_score?.toString() || '',
        maxScore: level.max_score?.toString() || '',
        points: level.points?.toString() || '',
        colorCode: level.color_code || '#3B82F6',
        backgroundColor: level.background_color || '#EFF6FF',
        icon: level.icon || '',
        isPassLevel: level.is_pass_level,
        isTargetLevel: level.is_target_level,
        displayOrder: level.display_order
      }))
    });
    setShowModal('rubric');
  };

  const closeModal = () => {
    setShowModal(null);
    setEditingId(null);
    setFormData({
      scaleName: '',
      scaleCode: '',
      description: '',
      scaleType: 'competency',
      targetAudience: 'all',
      minLevels: 1,
      maxLevels: 4,
      useForAssessment: true,
      useForReports: true,
      useForFeedback: true,
      defaultColorScheme: 'default',
      levels: [
        {
          levelNumber: 1,
          levelName: 'Beginning',
          levelCode: 'B',
          cbcDescriptor: 'Below Expectations',
          description: 'Learner requires significant support',
          minScore: '0',
          maxScore: '1.4',
          points: '1',
          colorCode: '#EF4444',
          backgroundColor: '#FEE2E2',
          icon: '🔴',
          isPassLevel: false,
          isTargetLevel: false,
          displayOrder: 1
        },
        {
          levelNumber: 2,
          levelName: 'Developing',
          levelCode: 'D',
          cbcDescriptor: 'Approaching Expectations',
          description: 'Learner demonstrates with guidance',
          minScore: '1.5',
          maxScore: '2.4',
          points: '2',
          colorCode: '#F59E0B',
          backgroundColor: '#FEF3C7',
          icon: '🟡',
          isPassLevel: true,
          isTargetLevel: false,
          displayOrder: 2
        },
        {
          levelNumber: 3,
          levelName: 'Proficient',
          levelCode: 'P',
          cbcDescriptor: 'Meeting Expectations',
          description: 'Learner independently demonstrates',
          minScore: '2.5',
          maxScore: '3.4',
          points: '3',
          colorCode: '#3B82F6',
          backgroundColor: '#DBEAFE',
          icon: '🔵',
          isPassLevel: true,
          isTargetLevel: true,
          displayOrder: 3
        },
        {
          levelNumber: 4,
          levelName: 'Advanced',
          levelCode: 'A',
          cbcDescriptor: 'Exceeding Expectations',
          description: 'Learner demonstrates deeper understanding',
          minScore: '3.5',
          maxScore: '4.0',
          points: '4',
          colorCode: '#10B981',
          backgroundColor: '#D1FAE5',
          icon: '🟢',
          isPassLevel: true,
          isTargetLevel: false,
          displayOrder: 4
        }
      ]
    });
  };

  const addLevel = () => {
    const newLevelNumber = formData.levels.length + 1;
    setFormData({
      ...formData,
      levels: [
        ...formData.levels,
        {
          levelNumber: newLevelNumber,
          levelName: '',
          levelCode: '',
          cbcDescriptor: '',
          description: '',
          minScore: '',
          maxScore: '',
          points: '',
          colorCode: '#3B82F6',
          backgroundColor: '#EFF6FF',
          icon: '',
          isPassLevel: true,
          isTargetLevel: false,
          displayOrder: newLevelNumber
        }
      ]
    });
  };

  const removeLevel = (index: number) => {
    if (formData.levels.length <= 2) {
      toast.error('Rubric scale must have at least 2 levels');
      return;
    }
    
    const newLevels = formData.levels.filter((_, i) => i !== index);
    // Reorder level numbers
    const reorderedLevels = newLevels.map((level, idx) => ({
      ...level,
      levelNumber: idx + 1,
      displayOrder: idx + 1
    }));
    
    setFormData({ ...formData, levels: reorderedLevels });
  };

  const updateLevel = (index: number, field: string, value: any) => {
    const newLevels = [...formData.levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setFormData({ ...formData, levels: newLevels });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ================================================
  // FILTERED DATA
  // ================================================

  const filteredRubrics = useMemo(() => {
    return rubricScales.filter(rubric => 
      rubric.scale_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rubric.scale_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rubric.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rubricScales, searchQuery]);

  // ================================================
  // RENDER
  // ================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Rubric Management</h2>
          <p className="text-slate-500">Preparing assessment tools and reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Rubric Management</h1>
                <p className="text-sm text-slate-600 mt-1">Create and manage assessment rubrics, generate reports</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search rubrics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              
              <button
                onClick={() => setShowModal('rubric')}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={18} />
                New Rubric
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['reports', 'rubrics'].map((tab) => (
            <button
              key={tab}
              onClick={() => toggleSection(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                expandedSections[tab] 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'reports' && <BarChart size={16} />}
              {tab === 'rubrics' && <BookMarked size={16} />}
              <span className="capitalize">{tab}</span>
              <ChevronDown size={16} className={`transition-transform ${expandedSections[tab] ? 'rotate-180' : ''}`} />
            </button>
          ))}
        </div>

        {/* Reports Section */}
        {expandedSections.reports && (
          <div className="space-y-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart className="text-indigo-600" size={20} />
                Assessment Reports
              </h2>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Filter size={16} />
                  Filters
                  <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                
                <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                  <button
                    onClick={() => setSelectedView('grid')}
                    className={`p-2 rounded-lg ${selectedView === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                    title="Grid View"
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedView('table')}
                    className={`p-2 rounded-lg ${selectedView === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                    title="Table View"
                  >
                    <Table size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedView('compact')}
                    className={`p-2 rounded-lg ${selectedView === 'compact' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                    title="Compact View"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-1">
                      Class
                    </label>
                    <select
                      value={filterParams.classId || ''}
                      onChange={(e) => setFilterParams({...filterParams, classId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value="">All Classes</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-1">
                      Term
                    </label>
                    <select
                      value={filterParams.termId || ''}
                      onChange={(e) => setFilterParams({...filterParams, termId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value="">All Terms</option>
                      {terms.map(t => (
                        <option key={t.id} value={t.id}>{t.term_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-1">
                      Subject
                    </label>
                    <select
                      value={filterParams.subjectId || ''}
                      onChange={(e) => setFilterParams({...filterParams, subjectId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filterParams.startDate || ''}
                      onChange={(e) => setFilterParams({...filterParams, startDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filterParams.endDate || ''}
                      onChange={(e) => setFilterParams({...filterParams, endDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={fetchAssessmentsForReport}
                    disabled={fetchingReports}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {fetchingReports ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Filter size={16} />
                        Apply Filters
                      </>
                    )}
                  </button>
                </div>
              </Card>
            )}

            {/* Reports Display */}
            {fetchingReports ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
              </div>
            ) : assessments.length === 0 ? (
              <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart className="text-slate-400" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No Assessments Found</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Apply filters to view assessment reports, or create a new assessment from the teacher dashboard.
                  </p>
                </div>
              </Card>
            ) : (
              <div className={selectedView === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
                : selectedView === 'table' 
                ? "space-y-4" 
                : "space-y-2"
              }>
                {assessments.map(assessment => (
                  <Card 
                    key={assessment.id} 
                    className={`bg-white rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer ${
                      selectedView === 'compact' ? 'p-3' : 'p-4'
                    }`}
                    onClick={() => fetchAssessmentReport(assessment.id)}
                  >
                    {selectedView === 'grid' && (
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 line-clamp-1">{assessment.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {assessment.class.class_name} {assessment.stream?.name}
                            </p>
                          </div>
                          {assessment.is_locked ? (
                            <Lock size={14} className="text-slate-400" />
                          ) : (
                            <Unlock size={14} className="text-emerald-500" />
                          )}
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-xs">
                            <BookOpen size={12} className="text-indigo-500" />
                            <span className="text-slate-600 line-clamp-1">{assessment.strand.name}</span>
                          </div>
                          {assessment.sub_strand && (
                            <div className="flex items-center gap-2 text-xs">
                              <GitBranch size={12} className="text-emerald-500" />
                              <span className="text-slate-600 line-clamp-1">{assessment.sub_strand.name}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{new Date(assessment.created_at).toLocaleDateString()}</span>
                          <span>{assessment.total_students} students</span>
                        </div>

                        {assessment.assessed_count !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{Math.round((assessment.assessed_count / assessment.total_students) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${(assessment.assessed_count / assessment.total_students) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedView === 'table' && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800 truncate">{assessment.title}</h4>
                            {assessment.is_locked && <Lock size={12} className="text-slate-400" />}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>{assessment.class.class_name} {assessment.stream?.name}</span>
                            <span>•</span>
                            <span>{assessment.subject.name}</span>
                            <span>•</span>
                            <span>{assessment.strand.name}</span>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium text-slate-700">{assessment.total_students} students</p>
                          <p className="text-xs text-slate-400">{new Date(assessment.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}

                    {selectedView === 'compact' && (
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                          {assessment.assessment_type}
                        </div>
                        <p className="text-sm font-medium text-slate-800 truncate flex-1">{assessment.title}</p>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rubrics Section */}
        {expandedSections.rubrics && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BookMarked className="text-indigo-600" size={20} />
                Rubric Scales
              </h2>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {filteredRubrics.length} of {rubricScales.length} rubrics
                </span>
                <button
                  onClick={fetchInitialData}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={16} className="text-slate-600" />
                </button>
              </div>
            </div>

            {filteredRubrics.length === 0 ? (
              <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookMarked className="text-slate-400" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No Rubrics Found</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {searchQuery 
                      ? 'No rubrics match your search criteria.' 
                      : 'Create your first rubric scale to start assessing students.'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowModal('rubric')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Create Rubric
                    </button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredRubrics.map(rubric => (
                  <Card key={rubric.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden group hover:shadow-xl transition-all">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-slate-800">{rubric.scale_name}</h3>
                            {rubric.scale_code && (
                              <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full text-slate-600">
                                {rubric.scale_code}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{rubric.description}</p>
                        </div>
                        
                        <div className="flex gap-1">
                          {rubric.is_system_default && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Star size={10} />
                              Default
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleRubricStatus(rubric.id, rubric.is_active)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              rubric.is_active 
                                ? 'text-emerald-600 hover:bg-emerald-50' 
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title={rubric.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {rubric.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => openEditModal(rubric)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          {!rubric.is_system_default && (
                            <button
                              onClick={() => handleDeleteRubric(rubric.id, rubric.scale_name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Levels Preview */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Levels ({rubric.levels.length})
                        </span>
                        <span className="text-xs text-slate-500">
                          Type: <span className="font-medium capitalize">{rubric.scale_type.replace('_', ' ')}</span>
                        </span>
                      </div>

                      <div className="space-y-2">
                        {rubric.levels
                          .sort((a, b) => a.level_number - b.level_number)
                          .map(level => (
                            <div 
                              key={level.id} 
                              className="flex items-center justify-between p-2 rounded-lg"
                              style={{ backgroundColor: level.background_color || '#F8FAFC' }}
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: level.color_code || '#3B82F6' }}
                                >
                                  {level.level_code || level.level_number}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{level.level_name}</p>
                                  <p className="text-xs text-slate-500">{level.cbc_descriptor}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-700">
                                  {level.min_score || 0} - {level.max_score || 0}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {level.points || 0} pts
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Footer Stats */}
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-slate-500">Usage</p>
                          <p className="font-semibold text-slate-800">{rubric._count?.cbc_assessments || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Min Levels</p>
                          <p className="font-semibold text-slate-800">{rubric.min_levels}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Max Levels</p>
                          <p className="font-semibold text-slate-800">{rubric.max_levels}</p>
                        </div>
                      </div>

                      {/* Usage Tags */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {rubric.use_for_assessment && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            Assessment
                          </span>
                        )}
                        {rubric.use_for_reports && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Reports
                          </span>
                        )}
                        {rubric.use_for_feedback && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Feedback
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rubric Creation Modal */}
      {showModal === 'rubric' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingId ? 'Edit Rubric Scale' : 'Create New Rubric Scale'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Define competency levels and scoring criteria for assessments
                  </p>
                </div>
                <button 
                  onClick={closeModal} 
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Scale Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.scaleName}
                        onChange={(e) => setFormData({...formData, scaleName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="e.g., CBC 4-Level Scale"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Scale Code
                      </label>
                      <input
                        type="text"
                        value={formData.scaleCode}
                        onChange={(e) => setFormData({...formData, scaleCode: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="e.g., CBC4"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all min-h-[80px]"
                      placeholder="Describe the purpose and usage of this rubric scale..."
                    />
                  </div>
                </div>

                {/* Scale Configuration */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">Scale Configuration</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Scale Type</label>
                      <select
                        value={formData.scaleType}
                        onChange={(e) => setFormData({...formData, scaleType: e.target.value as any})}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      >
                        <option value="competency">Competency</option>
                        <option value="feedback">Feedback</option>
                        <option value="effort">Effort</option>
                        <option value="behavior">Behavior</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
                      <select
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({...formData, targetAudience: e.target.value as any})}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      >
                        <option value="all">All</option>
                        <option value="teachers">Teachers Only</option>
                        <option value="students">Students Only</option>
                        <option value="parents">Parents Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Color Scheme</label>
                      <select
                        value={formData.defaultColorScheme}
                        onChange={(e) => setFormData({...formData, defaultColorScheme: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      >
                        <option value="default">Default (Blue/Green)</option>
                        <option value="traffic_light">Traffic Light</option>
                        <option value="green_scale">Green Scale</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Usage Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">Usage Settings</h3>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.useForAssessment}
                        onChange={(e) => setFormData({...formData, useForAssessment: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-indigo-500 checked:border-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Use for Assessments</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.useForReports}
                        onChange={(e) => setFormData({...formData, useForReports: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-indigo-500 checked:border-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Use for Reports</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.useForFeedback}
                        onChange={(e) => setFormData({...formData, useForFeedback: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 checked:bg-indigo-500 checked:border-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Use for Feedback</span>
                    </label>
                  </div>
                </div>

                {/* Levels */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-700">Rubric Levels</h3>
                    <button
                      type="button"
                      onClick={addLevel}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Plus size={16} />
                      Add Level
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {formData.levels.map((level, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-700">Level {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeLevel(index)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Level Name</label>
                            <input
                              type="text"
                              value={level.levelName}
                              onChange={(e) => updateLevel(index, 'levelName', e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                              placeholder="Beginning"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Level Code</label>
                            <input
                              type="text"
                              value={level.levelCode}
                              onChange={(e) => updateLevel(index, 'levelCode', e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                              placeholder="B"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">CBC Descriptor</label>
                            <input
                              type="text"
                              value={level.cbcDescriptor}
                              onChange={(e) => updateLevel(index, 'cbcDescriptor', e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                              placeholder="Below Expectations"
                            />
                          </div>

                          <div className="col-span-full">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                            <textarea
                              value={level.description}
                              onChange={(e) => updateLevel(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm min-h-[60px]"
                              placeholder="Describe what this level represents..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Min Score</label>
                            <input
                              type="number"
                              step="0.1"
                              value={level.minScore}
                              onChange={(e) => updateLevel(index, 'minScore', e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Max Score</label>
                            <input
                              type="number"
                              step="0.1"
                              value={level.maxScore}
                              onChange={(e) => updateLevel(index, 'maxScore', e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                              placeholder="1.4"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Points</label>
                            <input
                              type="number"
                              step="0.1"
                              value={level.points}
                              onChange={(e) => updateLevel(index, 'points', e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                              placeholder="1"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={level.colorCode}
                                onChange={(e) => updateLevel(index, 'colorCode', e.target.value)}
                                className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={level.colorCode}
                                onChange={(e) => updateLevel(index, 'colorCode', e.target.value)}
                                className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                                placeholder="#EF4444"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4 pt-6">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={level.isPassLevel}
                                onChange={(e) => updateLevel(index, 'isPassLevel', e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-slate-300 checked:bg-emerald-500"
                              />
                              <span className="text-xs font-medium text-slate-600">Pass Level</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={level.isTargetLevel}
                                onChange={(e) => updateLevel(index, 'isTargetLevel', e.target.checked)}
                                className="w-4 h-4 rounded border-2 border-slate-300 checked:bg-indigo-500"
                              />
                              <span className="text-xs font-medium text-slate-600">Target Level</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRubric}
                  disabled={submitting || !formData.scaleName}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingId ? 'Update Rubric' : 'Create Rubric'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showModal === 'report' && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Assessment Report</h2>
                  <p className="text-sm text-slate-600">{selectedReport.assessment.title}</p>
                </div>
                <button 
                  onClick={() => setShowModal(null)} 
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Report Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Class</p>
                    <p className="font-medium text-slate-800">
                      {selectedReport.context.class.class_name}
                      {selectedReport.context.stream && ` - ${selectedReport.context.stream.name}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Subject</p>
                    <p className="font-medium text-slate-800">{selectedReport.context.subject.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Teacher</p>
                    <p className="font-medium text-slate-800">
                      {selectedReport.context.teacher?.first_name} {selectedReport.context.teacher?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Date</p>
                    <p className="font-medium text-slate-800">
                      {new Date(selectedReport.assessment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Students</p>
                      <p className="text-2xl font-bold text-slate-800">{selectedReport.statistics.totalStudents}</p>
                    </div>
                    <Users className="text-indigo-500" size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Average Level</p>
                      <p className="text-2xl font-bold text-slate-800">{selectedReport.statistics.averageLevel}</p>
                      <p className="text-xs text-slate-500 mt-1">{selectedReport.statistics.averageLevelDescriptor}</p>
                    </div>
                    <TrendingUp className="text-emerald-500" size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Pass Rate</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {selectedReport.statistics.passRate || 
                          Math.round((Object.values(selectedReport.statistics.levelDistribution)
                            .filter((_, i) => i >= 2).reduce((a, b) => a + b, 0) / 
                            selectedReport.statistics.totalStudents) * 100)}%
                      </p>
                    </div>
                    <Target className="text-amber-500" size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Excellence Rate</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {selectedReport.statistics.excellenceRate ||
                          Math.round(((selectedReport.statistics.levelDistribution['Exceeding Expectation'] || 0) / 
                            selectedReport.statistics.totalStudents) * 100)}%
                      </p>
                    </div>
                    <Award className="text-purple-500" size={24} />
                  </div>
                </div>
              </div>

              {/* Level Distribution */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-700 mb-3">Level Distribution</h3>
                <div className="space-y-2">
                  {selectedReport.rubricScale.levels
                    .sort((a, b) => a.level_number - b.level_number)
                    .map(level => {
                      const count = selectedReport.statistics.levelDistribution[level.level_name] || 0;
                      const percentage = (count / selectedReport.statistics.totalStudents) * 100;
                      
                      return (
                        <div key={level.id} className="flex items-center gap-3">
                          <div 
                            className="w-24 text-xs font-medium px-2 py-1 rounded-lg text-center"
                            style={{ 
                              backgroundColor: level.background_color || '#F1F5F9',
                              color: level.color_code || '#334155'
                            }}
                          >
                            {level.level_code || level.level_name}
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full"
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: level.color_code || '#3B82F6'
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-24 text-right">
                            <span className="text-sm font-medium text-slate-700">{count} students</span>
                            <span className="text-xs text-slate-500 ml-1">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Results Table */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Individual Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 text-left text-xs font-semibold text-slate-500">Student</th>
                        <th className="py-3 text-left text-xs font-semibold text-slate-500">Admission</th>
                        <th className="py-3 text-left text-xs font-semibold text-slate-500">Level</th>
                        <th className="py-3 text-left text-xs font-semibold text-slate-500">Teacher Comment</th>
                        <th className="py-3 text-left text-xs font-semibold text-slate-500">Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReport.results.map(result => (
                        <tr key={result.student.id} className="hover:bg-slate-50">
                          <td className="py-3">
                            <p className="font-medium text-slate-800">
                              {result.student.first_name} {result.student.last_name}
                            </p>
                          </td>
                          <td className="py-3 text-sm text-slate-600">{result.student.admission_number}</td>
                          <td className="py-3">
                            <span 
                              className="text-xs font-medium px-2 py-1 rounded-lg"
                              style={{ 
                                backgroundColor: result.level.background_color || '#F1F5F9',
                                color: result.level.color_code || '#334155'
                              }}
                            >
                              {result.level.level_name}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-slate-600 max-w-md truncate">
                            {result.teacherComment || '-'}
                          </td>
                          <td className="py-3">
                            {result.hasEvidence ? (
                              <CheckCircle size={16} className="text-emerald-500" />
                            ) : (
                              <X size={16} className="text-slate-300" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Printer size={18} />
                  Print Report
                </button>
                <button
                  onClick={() => {
                    // Download as PDF - you would implement this with a PDF library
                    toast.success('PDF download feature coming soon');
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
            <span className="font-medium text-slate-700">{editingId ? 'Updating...' : 'Creating...'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RubricManagement;