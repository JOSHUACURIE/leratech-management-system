import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit3, Trash2, Loader2, X, Eye, EyeOff,
  ChevronDown, Search, Filter, Download, Lock,
  RefreshCw, Save, BarChart, BookMarked, Grid,
  Table, List, Award, Star, Target, TrendingUp,
  Users, FileText, Printer, GitBranch, BookOpen,
  ChevronRight, CheckCircle,
} from "lucide-react";
import Card from "../../components/common/Card";
import { cbcAPIS } from "../../services/api";
import api from "../../services/api";
import { toast } from "react-hot-toast";

// ─────────────────────────────────────────────────────────────
// TYPES  (mirrors AcademicSetup's type definitions exactly)
// ─────────────────────────────────────────────────────────────

interface Class {
  id: string;
  class_name: string;
  class_level: number;
  is_active: boolean;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  subject_code?: string;
  category?: string;
  curriculum_id?: string;
}

/** Terms are embedded inside AcademicYear – no separate fetch needed */
interface Term {
  id: string;
  term_name: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  terms: Term[]; // ← embedded from /academic/years-with-terms
  _count?: { terms: number };
}

interface Curriculum {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

// ── Rubric types ────────────────────────────────────────────

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
}

interface RubricScale {
  id: string;
  scale_name: string;
  scale_code?: string;
  description?: string;
  scale_type: "competency" | "feedback" | "effort" | "behavior" | "custom";
  target_audience: "all" | "teachers" | "students" | "parents";
  min_levels: number;
  max_levels: number;
  use_for_assessment: boolean;
  use_for_reports: boolean;
  use_for_feedback: boolean;
  default_color_scheme?: string;
  is_active: boolean;
  is_system_default: boolean;
  usage_count?: number;
  levels: RubricLevel[];
  _count?: { cbc_assessments: number };
}

interface CBCAssessmentItem {
  id: string;
  title: string;
  assessment_type: string;
  subject: { id: string; name: string; subject_code?: string };
  class: { id: string; class_name: string; class_level: number };
  stream?: { id: string; name: string };
  strand: { id: string; name: string; code: string };
  sub_strand?: { id: string; name: string; code: string };
  teacher?: { user: { first_name: string; last_name: string } };
  total_students: number;
  is_locked: boolean;
  created_at: string;
}

interface AssessmentReport {
  assessment: { id: string; title: string; type: string; isLocked: boolean; createdAt: string };
  context: {
    strand: any; subStrand?: any; subject: any; class: any; stream?: any;
    teacher?: { first_name: string; last_name: string };
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
    student: { id: string; first_name: string; last_name: string; admission_number: string };
    level: RubricLevel;
    teacherComment?: string;
    hasEvidence: boolean;
  }>;
}

// ── Form types ──────────────────────────────────────────────

interface LevelFormItem {
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
}

interface RubricFormData {
  scaleName: string;
  scaleCode: string;
  description: string;
  scaleType: "competency" | "feedback" | "effort" | "behavior" | "custom";
  targetAudience: "all" | "teachers" | "students" | "parents";
  minLevels: number;
  maxLevels: number;
  useForAssessment: boolean;
  useForReports: boolean;
  useForFeedback: boolean;
  defaultColorScheme: string;
  levels: LevelFormItem[];
}

interface ReportFilters {
  academicYearId: string;
  termId: string;
  classId: string;
  subjectId: string;
}

// ─────────────────────────────────────────────────────────────
// UNWRAP helper — identical logic to AcademicSetup
// ─────────────────────────────────────────────────────────────

function unwrap<T>(res: PromiseSettledResult<any>, index: number): T[] {
  if (res.status === "rejected") {
    console.error(`Error fetching data for index ${index}:`, res.reason);
    return [];
  }
  const responseData = res.value?.data;
  if (!responseData) return [];

  if (Array.isArray(responseData)) return responseData as T[];
  if (responseData.data && Array.isArray(responseData.data)) return responseData.data as T[];
  if (typeof responseData === "object") {
    for (const key in responseData) {
      if (Array.isArray(responseData[key])) return responseData[key] as T[];
    }
  }
  console.warn(`Unexpected data structure at index ${index}:`, responseData);
  return [];
}

// ─────────────────────────────────────────────────────────────
// DEFAULT FORM STATE
// ─────────────────────────────────────────────────────────────

const DEFAULT_LEVELS: LevelFormItem[] = [
  {
    levelNumber: 1, levelName: "Beginning",  levelCode: "B",
    cbcDescriptor: "Below Expectations",      description: "Learner requires significant support",
    minScore: "0",   maxScore: "1.4", points: "1",
    colorCode: "#EF4444", backgroundColor: "#FEE2E2", icon: "🔴",
    isPassLevel: false, isTargetLevel: false, displayOrder: 1,
  },
  {
    levelNumber: 2, levelName: "Developing", levelCode: "D",
    cbcDescriptor: "Approaching Expectations", description: "Learner demonstrates with guidance",
    minScore: "1.5", maxScore: "2.4", points: "2",
    colorCode: "#F59E0B", backgroundColor: "#FEF3C7", icon: "🟡",
    isPassLevel: true, isTargetLevel: false, displayOrder: 2,
  },
  {
    levelNumber: 3, levelName: "Proficient", levelCode: "P",
    cbcDescriptor: "Meeting Expectations",     description: "Learner independently demonstrates",
    minScore: "2.5", maxScore: "3.4", points: "3",
    colorCode: "#3B82F6", backgroundColor: "#DBEAFE", icon: "🔵",
    isPassLevel: true, isTargetLevel: true, displayOrder: 3,
  },
  {
    levelNumber: 4, levelName: "Advanced",   levelCode: "A",
    cbcDescriptor: "Exceeding Expectations",   description: "Learner demonstrates deeper understanding",
    minScore: "3.5", maxScore: "4.0", points: "4",
    colorCode: "#10B981", backgroundColor: "#D1FAE5", icon: "🟢",
    isPassLevel: true, isTargetLevel: false, displayOrder: 4,
  },
];

const BLANK_FORM: RubricFormData = {
  scaleName: "", scaleCode: "", description: "",
  scaleType: "competency", targetAudience: "all",
  minLevels: 1, maxLevels: 4,
  useForAssessment: true, useForReports: true, useForFeedback: true,
  defaultColorScheme: "default",
  levels: DEFAULT_LEVELS,
};

const BLANK_FILTERS: ReportFilters = {
  academicYearId: "", termId: "", classId: "", subjectId: "",
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

const RubricManagement: React.FC = () => {

  // ── Loading ──────────────────────────────────────────────
  const [loading, setLoading]                 = useState(true);
  const [submitting, setSubmitting]           = useState(false);
  const [fetchingReports, setFetchingReports] = useState(false);

  // ── Core data (same sources as AcademicSetup) ────────────
  const [rubricScales, setRubricScales]   = useState<RubricScale[]>([]);
  const [classes, setClasses]             = useState<Class[]>([]);
  const [subjects, setSubjects]           = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [curricula, setCurricula]         = useState<Curriculum[]>([]);

  // ── Report data ──────────────────────────────────────────
  const [assessments, setAssessments]         = useState<CBCAssessmentItem[]>([]);
  const [selectedReport, setSelectedReport]   = useState<AssessmentReport | null>(null);

  // ── UI state ─────────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState<"rubrics" | "reports">("rubrics");
  const [showModal, setShowModal]     = useState<"rubric" | "report" | null>(null);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedView, setSelectedView] = useState<"grid" | "table" | "compact">("grid");

  // ── Form ─────────────────────────────────────────────────
  const [formData, setFormData]       = useState<RubricFormData>(BLANK_FORM);
  const [filters, setFilters]         = useState<ReportFilters>(BLANK_FILTERS);

  // ─────────────────────────────────────────────────────────
  // INITIAL DATA FETCH — mirrors fetchAcademicData() exactly
  // ─────────────────────────────────────────────────────────

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      /**
       * Exact same 5 routes AcademicSetup uses for these entities.
       * /academic/years-with-terms → each year has .terms[] embedded (no separate term call).
       * /academic               → curricula
       * /classes                → classes
       * /subjects               → subjects
       */
      const responses = await Promise.allSettled([
        api.get("/classes"),                   // [0] — same as AcademicSetup
        api.get("/subjects"),                  // [1] — same as AcademicSetup
        api.get("/academic/years-with-terms"), // [2] — terms EMBEDDED in year.terms[]
        api.get("/academic"),                  // [3] — curricula, same as AcademicSetup
        cbcAPIS.getRubricScales({ includeSystemDefault: true, isActive: true }), // [4]
      ]);

      // ── classes ──────────────────────────────────────────
      setClasses(unwrap<Class>(responses[0], 0));

      // ── subjects ─────────────────────────────────────────
      setSubjects(unwrap<Subject>(responses[1], 1));

      // ── academic years WITH embedded terms ───────────────
      // AcademicSetup reads year.terms directly — no separate /terms endpoint
      const yearsData = unwrap<AcademicYear>(responses[2], 2);
      setAcademicYears(yearsData);

      // Pre-select current year in the report filters
      if (yearsData.length > 0) {
        const current = yearsData.find((y) => y.is_current) ?? yearsData[0];
        setFilters((prev) => ({ ...prev, academicYearId: current.id }));
      }

      // ── curricula ────────────────────────────────────────
      setCurricula(unwrap<Curriculum>(responses[3], 3));

      // ── rubric scales ────────────────────────────────────
      // cbcAPIS may wrap differently; handle all shapes
      const rubricRes = responses[4];
      let rubrics: RubricScale[] = [];
      if (rubricRes.status === "fulfilled") {
        const d = rubricRes.value?.data;
        if (Array.isArray(d))                          rubrics = d;
        else if (d?.data && Array.isArray(d.data))     rubrics = d.data;
        else if (d?.rubricScales)                      rubrics = d.rubricScales;
        else if (typeof d === "object") {
          for (const k in d) { if (Array.isArray(d[k])) { rubrics = d[k]; break; } }
        }
      } else {
        console.error("Failed to load rubric scales:", rubricRes.reason);
      }
      setRubricScales(rubrics);

    } catch (err) {
      console.error("RubricManagement load error:", err);
      toast.error("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // TERMS — derived from embedded year.terms[]
  // No API call needed. AcademicSetup does exactly the same via
  // getSelectedYearTerms() which reads academicYears[].terms
  // ─────────────────────────────────────────────────────────

  const termsForSelectedYear = useMemo<Term[]>(() => {
    if (!filters.academicYearId) return [];
    const yr = academicYears.find((y) => y.id === filters.academicYearId);
    return yr?.terms ?? [];
  }, [academicYears, filters.academicYearId]);

  // ─────────────────────────────────────────────────────────
  // ASSESSMENTS (reports tab)
  // ─────────────────────────────────────────────────────────

  const fetchAssessments = async () => {
    try {
      setFetchingReports(true);
      const params: Record<string, string> = {};
      if (filters.classId)        params.classId   = filters.classId;
      if (filters.termId)         params.termId    = filters.termId;
      if (filters.subjectId)      params.subjectId = filters.subjectId;
      if (filters.academicYearId) params.academicYearId = filters.academicYearId;

      const res  = await cbcAPIS.getAllCbcAssessments(params);
      const d    = res?.data;
      let data: CBCAssessmentItem[] = [];

      if (Array.isArray(d))                       data = d;
      else if (d?.data && Array.isArray(d.data))  data = d.data;
      else if (d?.assessments)                    data = d.assessments;

      setAssessments(data);
      if (data.length === 0) toast("No assessments found for the selected filters.");
    } catch (err) {
      console.error("Error fetching assessments:", err);
      toast.error("Failed to load assessments");
    } finally {
      setFetchingReports(false);
    }
  };

  const fetchReport = async (assessmentId: string) => {
    try {
      setFetchingReports(true);
      const res    = await cbcAPIS.getCbcAssessmentReport(assessmentId);
      const d      = res?.data;
      const report = d?.success && d.data ? d.data : d ?? null;
      if (report) { setSelectedReport(report); setShowModal("report"); }
      else toast.error("Failed to load assessment report");
    } catch (err) {
      console.error("Error fetching report:", err);
      toast.error("Failed to load assessment report");
    } finally {
      setFetchingReports(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // RUBRIC CRUD
  // ─────────────────────────────────────────────────────────

  const handleSaveRubric = async () => {
    if (!formData.scaleName.trim()) { toast.error("Scale name is required"); return; }
    try {
      setSubmitting(true);
      const payload = {
        scaleName:          formData.scaleName,
        scaleCode:          formData.scaleCode      || undefined,
        description:        formData.description    || undefined,
        scaleType:          formData.scaleType,
        targetAudience:     formData.targetAudience,
        minLevels:          formData.minLevels,
        maxLevels:          formData.maxLevels,
        useForAssessment:   formData.useForAssessment,
        useForReports:      formData.useForReports,
        useForFeedback:     formData.useForFeedback,
        defaultColorScheme: formData.defaultColorScheme,
        levels: formData.levels.map((l) => ({
          levelNumber:     l.levelNumber,
          levelName:       l.levelName,
          levelCode:       l.levelCode       || undefined,
          cbcDescriptor:   l.cbcDescriptor   || undefined,
          description:     l.description     || undefined,
          minScore:        l.minScore  !== "" ? parseFloat(l.minScore)  : undefined,
          maxScore:        l.maxScore  !== "" ? parseFloat(l.maxScore)  : undefined,
          points:          l.points    !== "" ? parseFloat(l.points)    : undefined,
          colorCode:       l.colorCode        || undefined,
          backgroundColor: l.backgroundColor || undefined,
          icon:            l.icon             || undefined,
          isPassLevel:     l.isPassLevel,
          isTargetLevel:   l.isTargetLevel,
          displayOrder:    l.displayOrder,
        })),
      };

      if (editingId) {
        await cbcAPIS.updateRubricScale(editingId, payload);
        toast.success("Rubric scale updated successfully");
      } else {
        await cbcAPIS.createRubricScale(payload);
        toast.success("Rubric scale created successfully");
      }

      await fetchAllData();
      closeModal();
    } catch (err: any) {
      console.error("Error saving rubric:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Failed to save rubric scale");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRubric = async (scaleId: string, scaleName: string) => {
    if (!window.confirm(`Delete "${scaleName}"? This cannot be undone.`)) return;
    try {
      setSubmitting(true);
      await cbcAPIS.deleteRubricScale(scaleId);
      toast.success("Rubric scale deleted");
      await fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete rubric scale");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (scaleId: string, currentlyActive: boolean) => {
    try {
      await cbcAPIS.updateRubricScale(scaleId, { isActive: !currentlyActive } as any);
      toast.success(`Rubric ${!currentlyActive ? "activated" : "deactivated"}`);
      await fetchAllData();
    } catch {
      toast.error("Failed to update rubric status");
    }
  };

  // ─────────────────────────────────────────────────────────
  // FORM HELPERS
  // ─────────────────────────────────────────────────────────

  const openEditModal = (rubric: RubricScale) => {
    setEditingId(rubric.id);
    setFormData({
      scaleName:          rubric.scale_name,
      scaleCode:          rubric.scale_code           ?? "",
      description:        rubric.description          ?? "",
      scaleType:          rubric.scale_type,
      targetAudience:     rubric.target_audience,
      minLevels:          rubric.min_levels,
      maxLevels:          rubric.max_levels,
      useForAssessment:   rubric.use_for_assessment,
      useForReports:      rubric.use_for_reports,
      useForFeedback:     rubric.use_for_feedback,
      defaultColorScheme: rubric.default_color_scheme ?? "default",
      levels: rubric.levels
        .slice()
        .sort((a, b) => a.level_number - b.level_number)
        .map((l) => ({
          levelNumber:     l.level_number,
          levelName:       l.level_name,
          levelCode:       l.level_code       ?? "",
          cbcDescriptor:   l.cbc_descriptor   ?? "",
          description:     l.description      ?? "",
          minScore:        l.min_score?.toString() ?? "",
          maxScore:        l.max_score?.toString() ?? "",
          points:          l.points?.toString()    ?? "",
          colorCode:       l.color_code        ?? "#3B82F6",
          backgroundColor: l.background_color  ?? "#EFF6FF",
          icon:            l.icon              ?? "",
          isPassLevel:     l.is_pass_level,
          isTargetLevel:   l.is_target_level,
          displayOrder:    l.display_order,
        })),
    });
    setShowModal("rubric");
  };

  const closeModal = () => {
    setShowModal(null);
    setEditingId(null);
    setFormData(BLANK_FORM);
  };

  const addLevel = () => {
    const next = formData.levels.length + 1;
    setFormData((p) => ({
      ...p,
      levels: [
        ...p.levels,
        {
          levelNumber: next, levelName: "", levelCode: "", cbcDescriptor: "",
          description: "", minScore: "", maxScore: "", points: "",
          colorCode: "#3B82F6", backgroundColor: "#EFF6FF", icon: "",
          isPassLevel: true, isTargetLevel: false, displayOrder: next,
        },
      ],
    }));
  };

  const removeLevel = (index: number) => {
    if (formData.levels.length <= 2) { toast.error("Minimum 2 levels required"); return; }
    setFormData((p) => ({
      ...p,
      levels: p.levels
        .filter((_, i) => i !== index)
        .map((l, i) => ({ ...l, levelNumber: i + 1, displayOrder: i + 1 })),
    }));
  };

  const updateLevel = (index: number, field: keyof LevelFormItem, value: any) =>
    setFormData((p) => ({
      ...p,
      levels: p.levels.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));

  // ─────────────────────────────────────────────────────────
  // DERIVED
  // ─────────────────────────────────────────────────────────

  const filteredRubrics = useMemo(() =>
    rubricScales.filter((r) =>
      r.scale_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.scale_code ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    ), [rubricScales, searchQuery]);

  // ─────────────────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl animate-pulse" />
          <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        </div>
        <p className="text-lg font-semibold text-slate-700 mt-4">Loading Rubric Management...</p>
        <p className="text-sm text-slate-500">Fetching assessment tools</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">

      {/* ── Sticky Header ───────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Rubric Management</h1>
              <p className="text-sm text-slate-600 mt-1">Create and manage assessment rubrics · generate reports</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search rubrics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={fetchAllData}
                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} className="text-slate-600" />
              </button>
              <button
                onClick={() => { setEditingId(null); setFormData(BLANK_FORM); setShowModal("rubric"); }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={18} /> New Rubric
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 lg:p-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["rubrics", "reports"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab === "rubrics" ? <BookMarked size={18} /> : <BarChart size={18} />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>

        {/* ══════════════ RUBRICS TAB ══════════════════════════ */}
        {activeTab === "rubrics" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BookMarked className="text-indigo-600" size={20} />
                Rubric Scales
                <span className="text-sm font-normal text-slate-500">
                  ({filteredRubrics.length}/{rubricScales.length})
                </span>
              </h2>
            </div>

            {filteredRubrics.length === 0 ? (
              <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookMarked className="text-slate-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Rubrics Found</h3>
                <p className="text-sm text-slate-500 mb-6">
                  {searchQuery ? "No rubrics match your search." : "Create your first rubric scale to get started."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowModal("rubric")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 inline-flex items-center gap-2"
                  >
                    <Plus size={16} /> Create Rubric
                  </button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredRubrics.map((rubric) => (
                  <Card
                    key={rubric.id}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all"
                  >
                    {/* Card Header */}
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-800">{rubric.scale_name}</h3>
                            {rubric.scale_code && (
                              <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full text-slate-600 border border-slate-200">
                                {rubric.scale_code}
                              </span>
                            )}
                            {rubric.is_system_default && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                                <Star size={10} /> Default
                              </span>
                            )}
                            {!rubric.is_active && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-medium rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{rubric.description}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleActive(rubric.id, rubric.is_active)}
                            title={rubric.is_active ? "Deactivate" : "Activate"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              rubric.is_active
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            {rubric.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => openEditModal(rubric)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          {!rubric.is_system_default && (
                            <button
                              onClick={() => handleDeleteRubric(rubric.id, rubric.scale_name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Levels */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Levels ({rubric.levels.length})
                        </span>
                        <span className="text-xs text-slate-500 capitalize">
                          {rubric.scale_type.replace("_", " ")}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {rubric.levels
                          .slice()
                          .sort((a, b) => a.level_number - b.level_number)
                          .map((level) => (
                            <div
                              key={level.id}
                              className="flex items-center justify-between p-2 rounded-lg"
                              style={{ backgroundColor: level.background_color ?? "#F8FAFC" }}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                  style={{ backgroundColor: level.color_code ?? "#3B82F6" }}
                                >
                                  {level.level_code ?? level.level_number}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{level.level_name}</p>
                                  <p className="text-xs text-slate-500">{level.cbc_descriptor}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-700">
                                  {level.min_score ?? 0} – {level.max_score ?? 0}
                                </p>
                                <p className="text-xs text-slate-500">{level.points ?? 0} pts</p>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Footer stats */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="text-slate-500">Usage</p>
                          <p className="font-semibold text-slate-800">{rubric._count?.cbc_assessments ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Min Levels</p>
                          <p className="font-semibold text-slate-800">{rubric.min_levels}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Max Levels</p>
                          <p className="font-semibold text-slate-800">{rubric.max_levels}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {rubric.use_for_assessment && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Assessment</span>
                        )}
                        {rubric.use_for_reports && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Reports</span>
                        )}
                        {rubric.use_for_feedback && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Feedback</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ REPORTS TAB ══════════════════════════ */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart className="text-indigo-600" size={20} /> Assessment Reports
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Filter size={16} /> Filters
                  <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </button>
                <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                  {(["grid", "table", "compact"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedView(v)}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedView === v ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {v === "grid"    && <Grid    size={16} />}
                      {v === "table"   && <Table   size={16} />}
                      {v === "compact" && <List    size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                  {/* Academic Year — from /academic/years-with-terms */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Academic Year</label>
                    <select
                      value={filters.academicYearId}
                      onChange={(e) => {
                        // When year changes, clear term (same pattern as AcademicSetup's selectedYearForTerms)
                        setFilters((p) => ({ ...p, academicYearId: e.target.value, termId: "" }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">All Years</option>
                      {academicYears.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.year_name}{y.is_current ? " (Current)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Term — derived from year.terms[] (NO separate API call, mirrors AcademicSetup) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Term</label>
                    <select
                      value={filters.termId}
                      onChange={(e) => setFilters((p) => ({ ...p, termId: e.target.value }))}
                      disabled={!filters.academicYearId}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                    >
                      <option value="">All Terms</option>
                      {termsForSelectedYear.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.term_name}{t.is_current ? " (Current)" : ""}
                        </option>
                      ))}
                    </select>
                    {!filters.academicYearId && (
                      <p className="text-xs text-slate-400 mt-1">Select a year first</p>
                    )}
                  </div>

                  {/* Class — from /classes (same as AcademicSetup) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Class</label>
                    <select
                      value={filters.classId}
                      onChange={(e) => setFilters((p) => ({ ...p, classId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">All Classes</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.class_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject — from /subjects (same as AcademicSetup) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                    <select
                      value={filters.subjectId}
                      onChange={(e) => setFilters((p) => ({ ...p, subjectId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={fetchAssessments}
                    disabled={fetchingReports}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {fetchingReports
                      ? <><Loader2 size={16} className="animate-spin" /> Loading...</>
                      : <><Filter size={16} /> Apply Filters</>
                    }
                  </button>
                </div>
              </Card>
            )}

            {/* Assessments list */}
            {fetchingReports ? (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
              </div>
            ) : assessments.length === 0 ? (
              <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart className="text-slate-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Assessments Found</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Use the filters above and click "Apply Filters" to load assessments.
                </p>
                <button
                  onClick={() => setShowFilters(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 inline-flex items-center gap-2"
                >
                  <Filter size={16} /> Open Filters
                </button>
              </Card>
            ) : (
              <div
                className={
                  selectedView === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-3"
                }
              >
                {assessments.map((a) => (
                  <Card
                    key={a.id}
                    className={`bg-white rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer ${
                      selectedView === "compact" ? "p-3" : "p-4"
                    }`}
                    onClick={() => fetchReport(a.id)}
                  >
                    {selectedView === "grid" && (
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 truncate">{a.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {a.class.class_name}{a.stream ? ` · ${a.stream.name}` : ""}
                            </p>
                          </div>
                          {a.is_locked && <Lock size={14} className="text-slate-400 ml-2 flex-shrink-0" />}
                        </div>
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-xs">
                            <BookOpen size={12} className="text-indigo-500 flex-shrink-0" />
                            <span className="text-slate-600 truncate">{a.strand.name}</span>
                          </div>
                          {a.sub_strand && (
                            <div className="flex items-center gap-2 text-xs">
                              <GitBranch size={12} className="text-emerald-500 flex-shrink-0" />
                              <span className="text-slate-600 truncate">{a.sub_strand.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{new Date(a.created_at).toLocaleDateString()}</span>
                          <span>{a.total_students} students</span>
                        </div>
                      </div>
                    )}
                    {selectedView === "table" && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800 truncate">{a.title}</h4>
                            {a.is_locked && <Lock size={12} className="text-slate-400" />}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {a.class.class_name}{a.stream ? ` · ${a.stream.name}` : ""} · {a.subject.name} · {a.strand.name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-slate-700 text-sm">{a.total_students} students</p>
                          <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {selectedView === "compact" && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg flex-shrink-0">
                          {a.assessment_type}
                        </span>
                        <p className="text-sm font-medium text-slate-800 truncate flex-1">{a.title}</p>
                        <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════ RUBRIC MODAL ══════════════════════════ */}
      {showModal === "rubric" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl my-8">

            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? "Edit Rubric Scale" : "Create New Rubric Scale"}
                </h2>
                <p className="text-sm text-slate-600">Define competency levels and scoring criteria</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[calc(100vh-220px)] overflow-y-auto space-y-6">

              {/* Basic Info */}
              <section>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Scale Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.scaleName}
                      onChange={(e) => setFormData((p) => ({ ...p, scaleName: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="e.g., CBC 4-Level Scale"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Scale Code</label>
                    <input
                      type="text"
                      value={formData.scaleCode}
                      onChange={(e) => setFormData((p) => ({ ...p, scaleCode: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="e.g., CBC4"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none min-h-[72px]"
                    placeholder="Purpose and usage of this rubric scale..."
                  />
                </div>
              </section>

              {/* Configuration */}
              <section>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Scale Type</label>
                    <select
                      value={formData.scaleType}
                      onChange={(e) => setFormData((p) => ({ ...p, scaleType: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    >
                      <option value="competency">Competency</option>
                      <option value="feedback">Feedback</option>
                      <option value="effort">Effort</option>
                      <option value="behavior">Behavior</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData((p) => ({ ...p, targetAudience: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    >
                      <option value="all">All</option>
                      <option value="teachers">Teachers</option>
                      <option value="students">Students</option>
                      <option value="parents">Parents</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Color Scheme</label>
                    <select
                      value={formData.defaultColorScheme}
                      onChange={(e) => setFormData((p) => ({ ...p, defaultColorScheme: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                    >
                      <option value="default">Default</option>
                      <option value="traffic_light">Traffic Light</option>
                      <option value="green_scale">Green Scale</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Usage */}
              <section>
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Usage Settings</h3>
                <div className="flex flex-wrap gap-6">
                  {([
                    ["useForAssessment", "Use for Assessments"],
                    ["useForReports",    "Use for Reports"],
                    ["useForFeedback",   "Use for Feedback"],
                  ] as [keyof RubricFormData, string][]).map(([field, label]) => (
                    <label key={field} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[field] as boolean}
                        onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.checked }))}
                        className="w-5 h-5 rounded accent-indigo-600"
                      />
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Levels */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-700">
                    Rubric Levels ({formData.levels.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addLevel}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} /> Add Level
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.levels.map((level, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: level.colorCode || "#3B82F6" }}
                          >
                            {idx + 1}
                          </div>
                          <h4 className="font-semibold text-slate-700">Level {idx + 1}</h4>
                        </div>
                        {formData.levels.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLevel(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { field: "levelName",     label: "Level Name",     placeholder: "Beginning",             type: "text" },
                          { field: "levelCode",     label: "Level Code",     placeholder: "B",                     type: "text" },
                          { field: "cbcDescriptor", label: "CBC Descriptor", placeholder: "Below Expectations",    type: "text" },
                        ].map(({ field, label, placeholder, type }) => (
                          <div key={field}>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                            <input
                              type={type}
                              value={level[field as keyof LevelFormItem] as string}
                              onChange={(e) => updateLevel(idx, field as keyof LevelFormItem, e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                              placeholder={placeholder}
                            />
                          </div>
                        ))}

                        <div className="col-span-full">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                          <textarea
                            value={level.description}
                            onChange={(e) => updateLevel(idx, "description", e.target.value)}
                            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm min-h-[52px]"
                            placeholder="What this level represents..."
                          />
                        </div>

                        {[
                          { field: "minScore", label: "Min Score", placeholder: "0"   },
                          { field: "maxScore", label: "Max Score", placeholder: "1.4" },
                          { field: "points",   label: "Points",    placeholder: "1"   },
                        ].map(({ field, label, placeholder }) => (
                          <div key={field}>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                            <input
                              type="number"
                              step="0.1"
                              value={level[field as keyof LevelFormItem] as string}
                              onChange={(e) => updateLevel(idx, field as keyof LevelFormItem, e.target.value)}
                              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                              placeholder={placeholder}
                            />
                          </div>
                        ))}

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={level.colorCode}
                              onChange={(e) => updateLevel(idx, "colorCode", e.target.value)}
                              className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={level.colorCode}
                              onChange={(e) => updateLevel(idx, "colorCode", e.target.value)}
                              className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                              placeholder="#EF4444"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-5 pt-5">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={level.isPassLevel}
                              onChange={(e) => updateLevel(idx, "isPassLevel", e.target.checked)}
                              className="w-4 h-4 accent-emerald-500"
                            />
                            <span className="text-xs font-medium text-slate-600">Pass Level</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={level.isTargetLevel}
                              onChange={(e) => updateLevel(idx, "isTargetLevel", e.target.checked)}
                              className="w-4 h-4 accent-indigo-500"
                            />
                            <span className="text-xs font-medium text-slate-600">Target</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRubric}
                disabled={submitting || !formData.scaleName.trim()}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              >
                {submitting
                  ? <><Loader2 className="animate-spin" size={18} />{editingId ? "Updating..." : "Creating..."}</>
                  : <><Save size={18} />{editingId ? "Update Rubric" : "Create Rubric"}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ REPORT MODAL ══════════════════════════ */}
      {showModal === "report" && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl my-8">

            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Assessment Report</h2>
                <p className="text-sm text-slate-600">{selectedReport.assessment.title}</p>
              </div>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto space-y-6">

              {/* Context Banner */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ["Class",   `${selectedReport.context.class?.class_name}${selectedReport.context.stream ? ` · ${selectedReport.context.stream.name}` : ""}`],
                    ["Subject", selectedReport.context.subject?.name],
                    ["Teacher", selectedReport.context.teacher ? `${selectedReport.context.teacher.first_name} ${selectedReport.context.teacher.last_name}` : "—"],
                    ["Date",    new Date(selectedReport.assessment.createdAt).toLocaleDateString()],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{label}</p>
                      <p className="font-medium text-slate-800">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Students", value: selectedReport.statistics.totalStudents,               icon: <Users    className="text-indigo-500" size={24} /> },
                  { label: "Avg Level",       value: selectedReport.statistics.averageLevel,                icon: <TrendingUp className="text-emerald-500" size={24} />, sub: selectedReport.statistics.averageLevelDescriptor },
                  { label: "Pass Rate",        value: `${selectedReport.statistics.passRate ?? 0}%`,        icon: <Target   className="text-amber-500" size={24} /> },
                  { label: "Excellence",       value: `${selectedReport.statistics.excellenceRate ?? 0}%`,  icon: <Award    className="text-purple-500" size={24} /> },
                ].map(({ label, value, sub, icon }) => (
                  <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{label}</p>
                      <p className="text-2xl font-bold text-slate-800">{value}</p>
                      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
                    </div>
                    {icon}
                  </div>
                ))}
              </div>

              {/* Level Distribution */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Level Distribution</h3>
                <div className="space-y-2">
                  {selectedReport.rubricScale.levels
                    .slice()
                    .sort((a, b) => a.level_number - b.level_number)
                    .map((level) => {
                      const count = selectedReport.statistics.levelDistribution[level.level_name] ?? 0;
                      const pct   = selectedReport.statistics.totalStudents > 0
                        ? (count / selectedReport.statistics.totalStudents) * 100 : 0;
                      return (
                        <div key={level.id} className="flex items-center gap-3">
                          <div
                            className="w-24 text-xs font-medium px-2 py-1 rounded-lg text-center flex-shrink-0"
                            style={{
                              backgroundColor: level.background_color ?? "#F1F5F9",
                              color:           level.color_code       ?? "#334155",
                            }}
                          >
                            {level.level_code ?? level.level_name}
                          </div>
                          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: level.color_code ?? "#3B82F6" }}
                            />
                          </div>
                          <div className="w-32 text-right flex-shrink-0">
                            <span className="text-sm font-medium text-slate-700">{count} students</span>
                            <span className="text-xs text-slate-500 ml-1">({pct.toFixed(1)}%)</span>
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
                        {["Student", "Admission No.", "Level", "Teacher Comment", "Evidence"].map((h) => (
                          <th key={h} className="py-3 px-2 text-left text-xs font-semibold text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReport.results.map((r) => (
                        <tr key={r.student.id} className="hover:bg-slate-50">
                          <td className="py-3 px-2 font-medium text-slate-800">
                            {r.student.first_name} {r.student.last_name}
                          </td>
                          <td className="py-3 px-2 text-sm text-slate-600">{r.student.admission_number}</td>
                          <td className="py-3 px-2">
                            <span
                              className="text-xs font-medium px-2 py-1 rounded-lg"
                              style={{
                                backgroundColor: r.level.background_color ?? "#F1F5F9",
                                color:           r.level.color_code       ?? "#334155",
                              }}
                            >
                              {r.level.level_name}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-slate-600 max-w-xs truncate">
                            {r.teacherComment ?? "—"}
                          </td>
                          <td className="py-3 px-2">
                            {r.hasEvidence
                              ? <CheckCircle size={16} className="text-emerald-500" />
                              : <X          size={16} className="text-slate-300" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 flex items-center gap-2"
              >
                <Printer size={18} /> Print
              </button>
              <button
                onClick={() => toast("PDF download coming soon")}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Download size={18} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saving indicator */}
      {submitting && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <Loader2 className="animate-spin" size={18} />
          <span className="font-medium">Saving changes...</span>
        </div>
      )}
    </div>
  );
};

export default RubricManagement;