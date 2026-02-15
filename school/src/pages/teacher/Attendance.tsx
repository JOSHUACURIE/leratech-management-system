// pages/teacher/Attendance.tsx
import React, {
  useCallback, useEffect, useMemo, useReducer, useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, ArrowLeft, BookmarkCheck, BookOpen, Calendar, CalendarClock,
  CalendarDays, Check, CheckCircle2, ChevronDown, Clock3, Clock4, ClipboardList,
  Download, Eye, FileSpreadsheet, FileText, Filter, GraduationCap, Hash, History,
  Loader2, RefreshCw, Save, Search, Shield, Stethoscope, TrendingUp, UserCheck,
  UserCheck as UserCheckIcon, UserMinus, Users, X, XCircle, AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  teacherAPI, attendanceAPI,
  type MarkAttendancePayload,
  type AttendanceEntry,
  type AttendanceStatus,
  type GetAttendanceByDateParams,
} from "../../services/api";
import Card from "../../components/common/Card";

// ─── Domain types ─────────────────────────────────────────────────────────────

interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  status?: AttendanceStatus;
  reason: string;
}

interface ClassOption   { id: string; name: string; class_level: number }
interface StreamOption  { id: string; name: string; class_id: string }
interface SubjectOption { id: string; name: string; subject_code: string; category?: string }

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  reason: string | null;
  attendance_date: string;
  created_at: string;
  student?: { first_name: string; last_name: string; admission_number: string };
  subject?: { name: string; subject_code: string };
  teacher?: { teacher_code: string; user: { first_name: string; last_name: string } };
}

// ─── State / Reducer ──────────────────────────────────────────────────────────

type ViewMode = "marking" | "view";

interface State {
  loading:           boolean;
  fetchingSubjects:  boolean;
  fetchingStudents:  boolean;
  fetchingHistory:   boolean;
  submitting:        boolean;
  error:             string | null;
  successMessage:    string | null;
  selectedClass:     string;
  selectedStream:    string;
  selectedSubject:   string;
  selectedDate:      string;
  classes:           ClassOption[];
  streams:           StreamOption[];
  subjects:          SubjectOption[];
  students:          Student[];
  history:           AttendanceRecord[];
  searchQuery:       string;
  viewMode:          ViewMode;
  showSummary:       boolean;
}

type Action =
  | { type: "SET_LOADING";            payload: boolean }
  | { type: "SET_FETCHING_SUBJECTS";  payload: boolean }
  | { type: "SET_FETCHING_STUDENTS";  payload: boolean }
  | { type: "SET_FETCHING_HISTORY";   payload: boolean }
  | { type: "SET_SUBMITTING";         payload: boolean }
  | { type: "SET_ERROR";              payload: string | null }
  | { type: "SET_SUCCESS";            payload: string | null }
  | { type: "SET_CLASSES";            payload: ClassOption[] }
  | { type: "SET_STREAMS";            payload: StreamOption[] }
  | { type: "SET_SUBJECTS";           payload: SubjectOption[] }
  | { type: "SET_STUDENTS";           payload: Student[] }
  | { type: "SET_HISTORY";            payload: AttendanceRecord[] }
  | { type: "SET_SEARCH";             payload: string }
  | { type: "SET_VIEW_MODE";          payload: ViewMode }
  | { type: "SET_SHOW_SUMMARY";       payload: boolean }
  | { type: "SELECT_CLASS";           payload: string }
  | { type: "SELECT_STREAM";          payload: string }
  | { type: "SELECT_SUBJECT";         payload: string }
  | { type: "SELECT_DATE";            payload: string }
  | { type: "UPDATE_STUDENT_STATUS";  payload: { id: string; status: AttendanceStatus | undefined; reason: string } }
  | { type: "RESET_FORM" };

const TODAY = new Date().toISOString().split("T")[0];

const INITIAL: State = {
  loading:          true,
  fetchingSubjects: false,
  fetchingStudents: false,
  fetchingHistory:  false,
  submitting:       false,
  error:            null,
  successMessage:   null,
  selectedClass:    "",
  selectedStream:   "",
  selectedSubject:  "",
  selectedDate:     TODAY,
  classes:          [],
  streams:          [],
  subjects:         [],
  students:         [],
  history:          [],
  searchQuery:      "",
  viewMode:         "marking",
  showSummary:      true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":           return { ...state, loading:          action.payload };
    case "SET_FETCHING_SUBJECTS": return { ...state, fetchingSubjects: action.payload };
    case "SET_FETCHING_STUDENTS": return { ...state, fetchingStudents: action.payload };
    case "SET_FETCHING_HISTORY":  return { ...state, fetchingHistory:  action.payload };
    case "SET_SUBMITTING":        return { ...state, submitting:       action.payload };
    case "SET_ERROR":             return { ...state, error: action.payload, successMessage: null };
    case "SET_SUCCESS":           return { ...state, successMessage: action.payload, error: null };
    case "SET_CLASSES":           return { ...state, classes:  action.payload };
    case "SET_STREAMS":           return { ...state, streams:  action.payload };
    case "SET_SUBJECTS":          return { ...state, subjects: action.payload };
    case "SET_STUDENTS":          return { ...state, students: action.payload };
    case "SET_HISTORY":           return { ...state, history:  action.payload };
    case "SET_SEARCH":            return { ...state, searchQuery: action.payload };
    case "SET_VIEW_MODE":         return { ...state, viewMode: action.payload, searchQuery: "" };
    case "SET_SHOW_SUMMARY":      return { ...state, showSummary: action.payload };
    case "SELECT_DATE":           return { ...state, selectedDate: action.payload };
    case "SELECT_SUBJECT":        return { ...state, selectedSubject: action.payload };
    // Cascade: picking a new class wipes everything downstream
    case "SELECT_CLASS":
      return {
        ...state,
        selectedClass:   action.payload,
        selectedStream:  "",
        selectedSubject: "",
        streams:         [],
        students:        [],
        history:         [],
        error:           null,
      };
    // Cascade: picking a new stream wipes subject + data
    case "SELECT_STREAM":
      return {
        ...state,
        selectedStream:  action.payload,
        selectedSubject: "",
        students:        [],
        history:         [],
        error:           null,
      };
    case "UPDATE_STUDENT_STATUS":
      return {
        ...state,
        students: state.students.map(s =>
          s.id === action.payload.id
            ? { ...s, status: action.payload.status, reason: action.payload.reason }
            : s
        ),
      };
    case "RESET_FORM":
      return { ...INITIAL, loading: false, classes: state.classes };
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REASON_REQUIRED: ReadonlySet<string> = new Set(["absent", "late", "sick"]);
const STATUS_ORDER: AttendanceStatus[] = ["present", "late", "absent", "sick", "excused"];

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

// Colour maps — defined outside component so they're module-level constants
const S_ACTIVE: Record<string, string> = {
  present: "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200",
  absent:  "bg-rose-500    border-rose-500    text-white shadow-lg shadow-rose-200",
  late:    "bg-amber-500   border-amber-500   text-white shadow-lg shadow-amber-200",
  sick:    "bg-violet-500  border-violet-500  text-white shadow-lg shadow-violet-200",
  excused: "bg-blue-500    border-blue-500    text-white shadow-lg shadow-blue-200",
};
const S_IDLE: Record<string, string> = {
  present: "bg-white border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600",
  absent:  "bg-white border-slate-200 text-slate-400 hover:border-rose-300    hover:text-rose-600",
  late:    "bg-white border-slate-200 text-slate-400 hover:border-amber-300   hover:text-amber-600",
  sick:    "bg-white border-slate-200 text-slate-400 hover:border-violet-300  hover:text-violet-600",
  excused: "bg-white border-slate-200 text-slate-400 hover:border-blue-300    hover:text-blue-600",
};
const S_BADGE: Record<string, string> = {
  present: "bg-emerald-50 text-emerald-700 border-emerald-100",
  absent:  "bg-rose-50    text-rose-700    border-rose-100",
  late:    "bg-amber-50   text-amber-700   border-amber-100",
  sick:    "bg-violet-50  text-violet-700  border-violet-100",
  excused: "bg-blue-50    text-blue-700    border-blue-100",
};
const S_ICONS: Record<string, React.ReactNode> = {
  present: <Check size={12} />,
  absent:  <XCircle size={12} />,
  late:    <Clock4 size={12} />,
  sick:    <Stethoscope size={12} />,
  excused: <BookmarkCheck size={12} />,
};

// ─── Main component ───────────────────────────────────────────────────────────

const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const { school } = useAuth();
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // ── Stable ref so async callbacks always see current state ─────────────────
  const stateRef = useRef(state);
  stateRef.current = state;

  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuccess = useCallback((msg: string) => {
    if (successTimer.current) clearTimeout(successTimer.current);
    dispatch({ type: "SET_SUCCESS", payload: msg });
    successTimer.current = setTimeout(
      () => dispatch({ type: "SET_SUCCESS", payload: null }),
      4000
    );
  }, []);

  // ── Data fetching (like ScoreSubmission) ───────────────────────────────────

  const fetchInitialData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR",   payload: null });
    
    try {
      // Fetch teacher's assignments to get classes, streams, and subjects
      const res = await teacherAPI.getMyAssignments({ 
        status: "active", 
        include_subjects: "true" 
      });
      
      if (!res.data.success) throw new Error(res.data.error ?? "Failed to load assignments");

      const assignments = res.data.data.assignments;
      
      // Extract unique classes, streams, and subjects
      const classMap = new Map<string, ClassOption>();
      const streamMap = new Map<string, StreamOption>();
      const subjectMap = new Map<string, SubjectOption>();
      
      for (const year of assignments ?? []) {
        for (const term of year.terms ?? []) {
          for (const a of term.assignments ?? []) {
            // Add class
            const cls = a.stream?.class;
            if (cls && !classMap.has(cls.id)) {
              classMap.set(cls.id, {
                id: cls.id,
                name: cls.class_name,
                class_level: cls.class_level ?? 0,
              });
            }
            
            // Add stream
            if (a.stream && !streamMap.has(a.stream.id)) {
              streamMap.set(a.stream.id, {
                id: a.stream.id,
                name: a.stream.name,
                class_id: a.stream.class?.id || "",
              });
            }
            
            // Add subjects (like ScoreSubmission)
            if (a.subjects) {
              a.subjects.forEach((subject: any) => {
                if (subject && !subjectMap.has(subject.id)) {
                  subjectMap.set(subject.id, {
                    id: subject.id,
                    name: subject.name,
                    subject_code: subject.subject_code || subject.name.substring(0, 3).toUpperCase(),
                    category: subject.category || "General",
                  });
                }
              });
            }
          }
        }
      }

      dispatch({ type: "SET_CLASSES", payload: Array.from(classMap.values()) });
      dispatch({ type: "SET_STREAMS", payload: Array.from(streamMap.values()) });
      dispatch({ type: "SET_SUBJECTS", payload: Array.from(subjectMap.values()) });
      
      console.log(`📚 Loaded ${classMap.size} classes, ${streamMap.size} streams, ${subjectMap.size} subjects`);

    } catch (err: any) {
      dispatch({ type: "SET_ERROR", payload: err.message ?? "Failed to load teaching assignments" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // Fetch streams for a class (like ScoreSubmission's getDefaultStreamForClass)
  const fetchStreamsForClass = useCallback(async (classId: string) => {
    try {
      const res = await teacherAPI.getClassStreams(classId);
      if (!res.data.success) throw new Error(res.data.error ?? "Failed to load streams");

      const streams: StreamOption[] = (res.data.data.streams ?? []).map((s: any) => ({
        id: s.id, 
        name: s.name, 
        class_id: s.class_id,
      }));
      
      dispatch({ type: "SET_STREAMS", payload: streams });
      
      // Auto-select if only one option (like ScoreSubmission)
      if (streams.length === 1) {
        dispatch({ type: "SELECT_STREAM", payload: streams[0].id });
      }
    } catch (err: any) {
      dispatch({ type: "SET_ERROR", payload: "Failed to load streams for this class" });
    }
  }, []);

  /**
   * Fetch attendance for the current criteria.
   */
  const fetchAttendance = useCallback(async (modeOverride?: ViewMode) => {
    const s = stateRef.current;
    const mode = modeOverride ?? s.viewMode;

    if (!s.selectedClass || !s.selectedStream || !s.selectedDate) {
      dispatch({ type: "SET_ERROR", payload: "Select Class, Stream and Date first" });
      return;
    }

    const params: GetAttendanceByDateParams = {
      classId:  s.selectedClass,
      streamId: s.selectedStream,
      date:     s.selectedDate,
      ...(s.selectedSubject && s.selectedSubject !== "all"
        ? { subjectId: s.selectedSubject }
        : {}),
    };

    dispatch({ type: "SET_FETCHING_HISTORY", payload: true });
    dispatch({ type: "SET_ERROR",            payload: null });

    try {
      const res = await attendanceAPI.getAttendanceByDate(params);
      if (!res.data.success) throw new Error(res.data.error ?? "Failed to load attendance");

      const data = res.data.data;

      if (mode === "marking") {
        const marked: Student[] = (data.attendance ?? []).map((r: AttendanceRecord) => ({
          id:              r.student_id,
          admissionNumber: r.student?.admission_number ?? `ADM-${r.student_id.slice(-4)}`,
          fullName:        `${r.student?.first_name ?? ""} ${r.student?.last_name ?? ""}`.trim(),
          status:          r.status as AttendanceStatus,
          reason:          r.reason ?? "",
        }));
        const unmarked: Student[] = (data.unmarked_students ?? []).map((r: any) => ({
          id:              r.student.id,
          admissionNumber: r.student.admission_number ?? `ADM-${r.student.id.slice(-4)}`,
          fullName:        `${r.student.first_name ?? ""} ${r.student.last_name ?? ""}`.trim(),
          status:          undefined,
          reason:          "",
        }));
        dispatch({ type: "SET_STUDENTS", payload: [...marked, ...unmarked] });
      } else {
        dispatch({ type: "SET_HISTORY", payload: data.attendance ?? [] });
      }

      showSuccess(`Loaded attendance for ${fmtDate(s.selectedDate)}`);
    } catch (err: any) {
      if (err.response?.status === 404) {
        dispatch({ type: "SET_HISTORY", payload: [] });
        showSuccess("No records found for the selected criteria");
      } else {
        dispatch({
          type:    "SET_ERROR",
          payload: err.response?.data?.error ?? err.message ?? "Failed to load attendance",
        });
      }
    } finally {
      dispatch({ type: "SET_FETCHING_HISTORY", payload: false });
    }
  }, [showSuccess]);

  const fetchStudentsForMarking = useCallback(async () => {
    const s = stateRef.current;

    if (!s.selectedClass || !s.selectedStream || !s.selectedSubject) {
      dispatch({ type: "SET_ERROR", payload: "Select Class, Stream and Subject first" });
      return;
    }

    dispatch({ type: "SET_FETCHING_STUDENTS", payload: true });
    dispatch({ type: "SET_ERROR",             payload: null });

    try {
      const res = await teacherAPI.getClassStudents(s.selectedClass, s.selectedStream);
      if (!res.data.success) throw new Error(res.data.error ?? "Failed to load students");

      const baseline: Student[] = (res.data.data.students ?? []).map((st: any) => ({
        id:              st.id,
        admissionNumber: st.admission_number ?? `ADM-${st.id.slice(-4)}`,
        fullName:        `${st.first_name ?? ""} ${st.last_name ?? ""}`.trim(),
        status:          undefined,
        reason:          "",
      }));

      dispatch({ type: "SET_STUDENTS", payload: baseline });
      showSuccess(`${baseline.length} students loaded`);

      await fetchAttendance("marking");
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        status === 403 ? "You don't have permission to view this class" :
        status === 404 ? "No students found for the selected criteria"  :
        err.message   ?? "Failed to load students";
      dispatch({ type: "SET_ERROR", payload: msg });
    } finally {
      dispatch({ type: "SET_FETCHING_STUDENTS", payload: false });
    }
  }, [fetchAttendance, showSuccess]);

  // ── Submit attendance ──────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const s = stateRef.current;

    if (!s.selectedClass || !s.selectedStream || !s.selectedSubject || !s.selectedDate) {
      dispatch({ type: "SET_ERROR", payload: "Complete all selection criteria before submitting" });
      return;
    }

    const entries: AttendanceEntry[] = s.students
      .filter(st => st.status)
      .map(st => ({ studentId: st.id, status: st.status!, reason: st.reason || undefined }));

    if (entries.length === 0) {
      dispatch({ type: "SET_ERROR", payload: "No attendance marked — mark at least one student" });
      return;
    }

    const missingReason = entries.filter(
      e => REASON_REQUIRED.has(e.status) && !e.reason?.trim()
    );
    if (missingReason.length > 0) {
      dispatch({
        type:    "SET_ERROR",
        payload: `Reason required for ${missingReason.length} student${missingReason.length > 1 ? "s" : ""} marked absent, late, or sick`,
      });
      return;
    }

    const payload: MarkAttendancePayload = {
      classId:        s.selectedClass,
      streamId:       s.selectedStream,
      subjectId:      s.selectedSubject,
      attendanceDate: s.selectedDate,
      attendanceData: entries,
    };

    dispatch({ type: "SET_SUBMITTING", payload: true });
    dispatch({ type: "SET_ERROR",      payload: null });

    try {
      const res = await attendanceAPI.markAttendance(payload);
      if (!res.data.success) throw new Error(res.data.error ?? "Failed to mark attendance");

      showSuccess(`✓ Attendance submitted for ${res.data.data.marked_count} students`);
      await fetchAttendance("marking");
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        status === 403 ? "No permission to mark attendance for this class" :
        status === 409 ? "Attendance already recorded. Refresh to see existing records." :
        err.response?.data?.error ?? err.message ?? "Failed to submit attendance";
      dispatch({ type: "SET_ERROR", payload: msg });
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  }, [fetchAttendance, showSuccess]);

  // ── Status change handlers ─────────────────────────────────────────────────

  const handleStatusChange = useCallback(
    (id: string, status: AttendanceStatus | undefined, reason = "") =>
      dispatch({ type: "UPDATE_STUDENT_STATUS", payload: { id, status, reason } }),
    []
  );

  const handleMarkAll = useCallback((status: AttendanceStatus) => {
    stateRef.current.students.forEach(s =>
      dispatch({
        type:    "UPDATE_STUDENT_STATUS",
        payload: { id: s.id, status, reason: status === "present" ? "" : s.reason },
      })
    );
  }, []);

  const handleClearAll = useCallback(() => {
    stateRef.current.students.forEach(s =>
      dispatch({
        type:    "UPDATE_STUDENT_STATUS",
        payload: { id: s.id, status: undefined, reason: "" },
      })
    );
  }, []);

  // ── Effects ─────────────────────────────────────────────────────────────────

  // Initial load - like ScoreSubmission's fetchInitialData
  useEffect(() => { 
    fetchInitialData(); 
  }, [fetchInitialData]);

  // When class changes, fetch its streams
  useEffect(() => {
    if (state.selectedClass) {
      fetchStreamsForClass(state.selectedClass);
    }
  }, [state.selectedClass, fetchStreamsForClass]);

  // Auto-fetch attendance when in view mode and all criteria are set
  useEffect(() => {
    if (
      state.viewMode === "view" &&
      state.selectedClass &&
      state.selectedStream &&
      state.selectedDate
    ) {
      fetchAttendance("view");
    }
  }, [state.selectedClass, state.selectedStream, state.selectedDate, state.viewMode, fetchAttendance]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const markingStats = useMemo(() => {
    const arr = state.students;
    const present = arr.filter(x => x.status === "present").length;
    const absent  = arr.filter(x => x.status === "absent").length;
    const late    = arr.filter(x => x.status === "late").length;
    const sick    = arr.filter(x => x.status === "sick").length;
    const excused = arr.filter(x => x.status === "excused").length;
    const marked  = arr.filter(x => x.status).length;
    return { present, absent, late, sick, excused, marked, total: arr.length,
             rate: arr.length > 0 ? (present / arr.length) * 100 : 0 };
  }, [state.students]);

  const historyStats = useMemo(() => {
    const arr = state.history;
    const present = arr.filter(x => x.status === "present").length;
    const absent  = arr.filter(x => x.status === "absent").length;
    const late    = arr.filter(x => x.status === "late").length;
    const sick    = arr.filter(x => x.status === "sick").length;
    const excused = arr.filter(x => x.status === "excused").length;
    return { present, absent, late, sick, excused, total: arr.length,
             rate: arr.length > 0 ? (present / arr.length) * 100 : 0 };
  }, [state.history]);

  const filteredStudents = useMemo(() => {
    const q = state.searchQuery.toLowerCase();
    if (!q) return state.students;
    return state.students.filter(
      s => s.fullName.toLowerCase().includes(q) || s.admissionNumber.toLowerCase().includes(q)
    );
  }, [state.students, state.searchQuery]);

  const filteredHistory = useMemo(() => {
    const q = state.searchQuery.toLowerCase();
    if (!q) return state.history;
    return state.history.filter(r => {
      const name = `${r.student?.first_name ?? ""} ${r.student?.last_name ?? ""}`.toLowerCase();
      const adm  = r.student?.admission_number?.toLowerCase() ?? "";
      return name.includes(q) || adm.includes(q);
    });
  }, [state.history, state.searchQuery]);

  const selectedClassName   = state.classes.find(c => c.id === state.selectedClass)?.name  ?? "";
  const selectedStreamName  = state.streams.find(s => s.id === state.selectedStream)?.name  ?? "";
  const selectedSubjectName = state.subjects.find(s => s.id === state.selectedSubject)?.name ?? "";
  const displayDate         = state.selectedDate ? fmtDate(state.selectedDate) : "";
  const vm                  = state.viewMode;

  // ── Loading screen ─────────────────────────────────────────────────────────

  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mx-auto" />
          <p className="text-xl font-bold text-slate-700">Loading Attendance Portal</p>
          <p className="text-slate-500">Fetching your teaching assignments…</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <button
            onClick={() => navigate("/teacher")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors group mb-3"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl ${
              vm === "marking"
                ? "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-200"
                : "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-200"
            }`}>
              {vm === "marking" ? <UserCheck size={28} /> : <Eye size={28} />}
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                {vm === "marking" ? "Daily Roll Call" : "Attendance Records"}
              </h1>
              <p className="text-slate-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                <Calendar size={14} className="text-indigo-500" />
                <span>{displayDate || "Select a date"}</span>
                <span className="mx-1">•</span>
                <GraduationCap size={14} className="text-indigo-500" />
                <span>{school?.name}</span>
              </p>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { label: "Students", value: vm === "marking" ? markingStats.total   : historyStats.total,   icon: <Users size={14} className="text-slate-500" /> },
              { label: "Present",  value: vm === "marking" ? markingStats.present : historyStats.present, icon: <CheckCircle2 size={14} className="text-emerald-600" /> },
              { label: "Absent",   value: vm === "marking" ? markingStats.absent  : historyStats.absent,  icon: <UserMinus size={14}    className="text-rose-600"    /> },
              { label: "Late",     value: vm === "marking" ? markingStats.late    : historyStats.late,    icon: <Clock3 size={14}        className="text-amber-600"   /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">{icon}</div>
                <div>
                  <p className="text-[10px] text-slate-500">{label}</p>
                  <p className="text-lg font-bold text-slate-800">{value}</p>
                </div>
              </div>
            ))}

            {vm === "marking" && markingStats.marked > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 shadow-sm">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                  <ClipboardList size={14} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] text-indigo-500">Marked</p>
                  <p className="text-lg font-bold text-indigo-800">{markingStats.marked} / {markingStats.total}</p>
                </div>
              </div>
            )}

            {vm === "view" && state.history.length > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 shadow-sm">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                  <TrendingUp size={14} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500">Rate</p>
                  <p className="text-lg font-bold text-emerald-800">{historyStats.rate.toFixed(1)}%</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: vm === "marking" ? "view" : "marking" })}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 border shadow-sm transition-all ${
              vm === "marking"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-indigo-50  text-indigo-700  border-indigo-200  hover:bg-indigo-100"
            }`}
          >
            {vm === "marking"
              ? <><Eye size={16} /> View Records</>
              : <><UserCheckIcon size={16} /> Mark Attendance</>}
          </button>
          <button
            onClick={() => { dispatch({ type: "RESET_FORM" }); fetchInitialData(); }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Status Banners ── */}
      {vm === "marking" && markingStats.marked > 0 && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-indigo-100">
              <FileSpreadsheet size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-indigo-800">Ready to Submit</p>
              <p className="text-sm text-indigo-600">
                {markingStats.marked} of {markingStats.total} marked • {markingStats.present} present
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-700">
            <Shield size={16} /><span>Auto-validated</span>
          </div>
        </div>
      )}
      {vm === "view" && state.history.length > 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-emerald-100">
              <CalendarDays size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-800">Records Loaded</p>
              <p className="text-sm text-emerald-600">
                {state.history.length} records • {historyStats.present} present ({historyStats.rate.toFixed(1)}%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CalendarClock size={16} /><span>{displayDate}</span>
          </div>
        </div>
      )}

      {/* ── Feedback ── */}
      {state.error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <span className="text-red-700 font-medium">{state.error}</span>
          </div>
          <button onClick={() => dispatch({ type: "SET_ERROR", payload: null })} className="p-1 hover:bg-red-100 rounded">
            <X size={16} className="text-red-500" />
          </button>
        </div>
      )}
      {state.successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={20} />
            <span className="text-emerald-700 font-medium">{state.successMessage}</span>
          </div>
          <button onClick={() => dispatch({ type: "SET_SUCCESS", payload: null })} className="p-1 hover:bg-emerald-100 rounded">
            <X size={16} className="text-emerald-500" />
          </button>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─ Selection Panel ─ */}
        <Card className="lg:col-span-4 border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-white relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 opacity-[0.03] pointer-events-none">
            {vm === "marking" ? <UserCheck size={180} /> : <Eye size={180} />}
          </div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${vm === "marking" ? "bg-indigo-50" : "bg-emerald-50"}`}>
                <Filter size={16} className={vm === "marking" ? "text-indigo-600" : "text-emerald-600"} />
              </div>
              <h2 className="text-sm font-bold text-slate-800">
                {vm === "marking" ? "Selection Criteria" : "Viewing Criteria"}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {vm === "marking"
                ? "Select the criteria then load students to begin marking."
                : "Select the criteria to fetch existing attendance records."}
            </p>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Calendar size={12} className="text-indigo-500" /> Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={state.selectedDate}
                  max={TODAY}
                  onChange={e => dispatch({ type: "SELECT_DATE", payload: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-all"
                />
                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Class */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <BookOpen size={12} className="text-indigo-500" /> Academic Class
              </label>
              <div className="relative">
                <select
                  value={state.selectedClass}
                  onChange={e => dispatch({ type: "SELECT_CLASS", payload: e.target.value })}
                  disabled={state.classes.length === 0}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">{state.classes.length === 0 ? "No classes available" : "Select Class…"}</option>
                  {state.classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Level {c.class_level})</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Stream */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Hash size={12} className="text-indigo-500" /> Stream / Group
              </label>
              <div className="relative">
                <select
                  value={state.selectedStream}
                  onChange={e => dispatch({ type: "SELECT_STREAM", payload: e.target.value })}
                  disabled={!state.selectedClass || state.streams.length === 0}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">{!state.selectedClass ? "Select a class first" : state.streams.length === 0 ? "No streams available" : "Select Stream…"}</option>
                  {state.streams.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <FileText size={12} className="text-indigo-500" />
                Subject
                {vm === "view" && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
              </label>
              <div className="relative">
                <select
                  value={state.selectedSubject}
                  onChange={e => dispatch({ type: "SELECT_SUBJECT", payload: e.target.value })}
                  disabled={!state.selectedStream || state.subjects.length === 0}
                  className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                    state.selectedSubject && state.selectedSubject !== "all"
                      ? "border-indigo-300 bg-indigo-50/50"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {vm === "view" && <option value="all">All Subjects</option>}
                  <option value="">
                    {state.subjects.length === 0 ? "No subjects available" : "Select Subject…"}
                  </option>
                  {state.subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.subject_code})</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {/* Subject count hint */}
              {state.selectedStream && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {state.subjects.length > 0
                    ? <><CheckCircle2 size={10} className="text-emerald-500" />{state.subjects.length} subject{state.subjects.length !== 1 ? "s" : ""} available</>
                    : <><AlertCircle size={10} className="text-amber-500" /> No subjects assigned to this stream</>}
                </p>
              )}
            </div>

            {/* CTA */}
            {vm === "marking" && state.selectedClass && state.selectedStream && state.selectedSubject && (
              <button
                onClick={fetchStudentsForMarking}
                disabled={state.fetchingStudents}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all"
              >
                {state.fetchingStudents
                  ? <><Loader2 size={16} className="animate-spin" />Loading Students…</>
                  : <><Users size={16} />Load Students for Attendance</>}
              </button>
            )}
            {vm === "view" && state.selectedClass && state.selectedStream && (
              <button
                onClick={() => fetchAttendance("view")}
                disabled={state.fetchingHistory}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all"
              >
                {state.fetchingHistory
                  ? <><Loader2 size={16} className="animate-spin" />Loading Records…</>
                  : <><History size={16} />Fetch Attendance Records</>}
              </button>
            )}

            {/* Current selection summary */}
            {(selectedClassName || selectedSubjectName) && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => dispatch({ type: "SET_SHOW_SUMMARY", payload: !state.showSummary })}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 mb-3 hover:text-slate-800"
                >
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-indigo-500" /> Current Selection
                  </span>
                  <ChevronDown size={12} className={`transition-transform ${state.showSummary ? "rotate-180" : ""}`} />
                </button>
                {state.showSummary && (
                  <div className="space-y-2">
                    {[
                      { icon: <Calendar size={13} className="text-indigo-500" />, label: "Date",    value: displayDate },
                      { icon: <BookOpen size={13}  className="text-indigo-500" />, label: "Class",   value: selectedClassName },
                      { icon: <Hash size={13}      className="text-indigo-500" />, label: "Stream",  value: selectedStreamName },
                      { icon: <FileText size={13}  className="text-indigo-500" />, label: "Subject", value: selectedSubjectName },
                    ].filter(r => r.value).map(({ icon, label, value }) => (
                      <div key={label} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <div className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500">{label}</p>
                          <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
                        </div>
                      </div>
                    ))}
                    {vm === "view" && state.selectedSubject === "all" && (
                      <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-700">Viewing all subjects</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* ─ Main Content ─ */}
        <div className="lg:col-span-8">
          {vm === "marking" ? (
            state.students.length > 0 ? (
              <MarkingPanel
                students={state.students}
                filtered={filteredStudents}
                search={state.searchQuery}
                setSearch={q => dispatch({ type: "SET_SEARCH", payload: q })}
                stats={markingStats}
                submitting={state.submitting}
                onStatusChange={handleStatusChange}
                onMarkAll={handleMarkAll}
                onClearAll={handleClearAll}
                onSubmit={handleSubmit}
              />
            ) : (
              <EmptyState
                icon={<Users size={32} className="text-slate-400" />}
                title="No Students Loaded"
                body="Select a class, stream, and subject then click Load Students to begin marking attendance."
                hint={!state.selectedClass || !state.selectedStream || !state.selectedSubject
                  ? "Complete all selection criteria to proceed" : undefined}
              />
            )
          ) : (
            state.fetchingHistory ? (
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 text-center bg-white">
                <div className="py-16">
                  <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Loading attendance records…</p>
                </div>
              </Card>
            ) : state.history.length > 0 ? (
              <HistoryPanel
                records={filteredHistory}
                allRecords={state.history}
                search={state.searchQuery}
                setSearch={q => dispatch({ type: "SET_SEARCH", payload: q })}
                stats={historyStats}
                displayDate={displayDate}
              />
            ) : (
              <EmptyState
                icon={<History size={32} className="text-slate-400" />}
                title="No Attendance Records"
                body="Select class, stream, and date then click Fetch Records to view attendance."
                hint={
                  state.selectedClass && state.selectedStream && state.selectedDate
                    ? "No records found for this selection"
                    : "Select all required criteria to load records"
                }
                hintVariant={state.selectedClass && state.selectedStream && state.selectedDate ? "info" : "warn"}
              />
            )
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-6 border-t border-slate-200 text-sm text-slate-500">
        {vm === "marking" && state.students.length > 0 ? (
          <span>
            <b>{markingStats.marked}</b> of <b>{markingStats.total}</b> marked
            {markingStats.present > 0 && <span className="text-emerald-600 ml-2">{markingStats.present} present</span>}
            {markingStats.absent  > 0 && <span className="text-rose-600   ml-2">{markingStats.absent}  absent</span>}
            {markingStats.late    > 0 && <span className="text-amber-600  ml-2">{markingStats.late}    late</span>}
          </span>
        ) : vm === "view" && state.history.length > 0 ? (
          <span>
            <b>{state.history.length}</b> records •{" "}
            <span className="text-emerald-600">{historyStats.present} present ({historyStats.rate.toFixed(1)}%)</span>
            {historyStats.absent > 0 && <span className="text-rose-600 ml-2">{historyStats.absent} absent</span>}
          </span>
        ) : (
          "Select criteria to load data"
        )}
        <p className="text-xs text-slate-400 mt-1">
          Attendance data is automatically saved and synchronised with the school registry
        </p>
      </div>
    </div>
  );
};

// ─── Sub-components (keep as they are) ────────────────────────────────────────

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
  hint?: string;
  hintVariant?: "warn" | "info";
}> = ({ icon, title, body, hint, hintVariant = "warn" }) => (
  <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-8 text-center bg-white">
    <div className="max-w-md mx-auto py-10">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">{icon}</div>
      <h3 className="text-xl font-bold text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6">{body}</p>
      {hint && (
        <div className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
          hintVariant === "info"
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-amber-50   text-amber-700   border-amber-100"
        }`}>
          {hintVariant === "info" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {hint}
        </div>
      )}
    </div>
  </Card>
);

const StatusBtn: React.FC<{
  status: AttendanceStatus;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}> = React.memo(({ status, active, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
      active ? S_ACTIVE[status] : S_IDLE[status]
    }`}
  >
    {S_ICONS[status]}{status}
  </button>
));

const MarkingRow: React.FC<{
  student: Student;
  index: number;
  submitting: boolean;
  onChange: (id: string, status: AttendanceStatus | undefined, reason?: string) => void;
}> = React.memo(({ student, index, submitting, onChange }) => (
  <tr className="hover:bg-slate-50/50 transition-colors group/row">
    <td className="px-6 py-4">
      <span className="text-sm font-mono text-slate-400 group-hover/row:text-indigo-500 transition-colors">
        {String(index + 1).padStart(2, "0")}
      </span>
    </td>
    <td className="px-6 py-4">
      <span className="text-sm font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-md">
        {student.admissionNumber}
      </span>
    </td>
    <td className="px-6 py-4">
      <p className="text-sm font-medium text-slate-900">{student.fullName}</p>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_ORDER.map(s => (
          <StatusBtn
            key={s}
            status={s}
            active={student.status === s}
            disabled={submitting}
            onClick={() => onChange(student.id, s)}
          />
        ))}
      </div>
    </td>
    <td className="px-6 py-4 min-w-[160px]">
      {REASON_REQUIRED.has(student.status ?? "") && (
        <input
          type="text"
          value={student.reason}
          onChange={e => onChange(student.id, student.status, e.target.value)}
          placeholder="Enter reason…"
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
          disabled={submitting}
        />
      )}
    </td>
  </tr>
));

const MarkingPanel: React.FC<{
  students:       Student[];
  filtered:       Student[];
  search:         string;
  setSearch:      (q: string) => void;
  stats:          { marked: number; total: number; present: number };
  submitting:     boolean;
  onStatusChange: (id: string, s: AttendanceStatus | undefined, r?: string) => void;
  onMarkAll:      (s: AttendanceStatus) => void;
  onClearAll:     () => void;
  onSubmit:       () => void;
}> = ({ students, filtered, search, setSearch, stats, submitting, onStatusChange, onMarkAll, onClearAll, onSubmit }) => (
  <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-0 overflow-hidden bg-white">
    {/* Toolbar */}
    <div className="p-5 border-b border-slate-100 bg-white/80 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search name or admission number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
          disabled={submitting}
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500">Quick:</span>
        <button
          onClick={() => onMarkAll("present")}
          disabled={submitting}
          className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1 disabled:opacity-50"
        >
          <Check size={12} /> All Present
        </button>
        <div className="w-px h-5 bg-slate-200" />
        <button
          onClick={onClearAll}
          disabled={submitting || stats.marked === 0}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 disabled:opacity-50"
        >
          <X size={12} /> Clear All
        </button>
      </div>
    </div>

    {/* Table */}
    <div className="overflow-x-auto max-h-[calc(100vh-440px)] overflow-y-auto">
      <table className="w-full">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            {["#", "Adm No", "Student Name", "Attendance Status", "Reason"].map(h => (
              <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.length > 0 ? (
            filtered.map((s, i) => (
              <MarkingRow key={s.id} student={s} index={i} submitting={submitting} onChange={onStatusChange} />
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-16 text-center">
                <Search size={36} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No students match your search</p>
                <button onClick={() => setSearch("")} className="mt-3 text-xs text-indigo-600 hover:underline">
                  Clear Search
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Footer */}
    <div className="p-5 border-t border-slate-100 bg-white/80 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p className="text-sm text-slate-600">
        Showing <b>{filtered.length}</b> of <b>{students.length}</b> students
        {search && <span> · Filtered by "<b>{search}</b>"</span>}
      </p>
      <button
        onClick={onSubmit}
        disabled={submitting || stats.marked === 0}
        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all min-w-[200px] justify-center"
      >
        {submitting
          ? <><Loader2 size={16} className="animate-spin" />Submitting…</>
          : <><Save size={16} />Submit Attendance <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{stats.marked}</span></>}
      </button>
    </div>
  </Card>
);

const HistoryPanel: React.FC<{
  records:     AttendanceRecord[];
  allRecords:  AttendanceRecord[];
  search:      string;
  setSearch:   (q: string) => void;
  stats:       { present: number; absent: number; late: number; sick: number; excused: number; total: number; rate: number };
  displayDate: string;
}> = ({ records, allRecords, search, setSearch, stats, displayDate }) => (
  <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-0 overflow-hidden bg-white">
    {/* Summary cards */}
    <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { label: "Present",  value: stats.present, cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { label: "Absent",   value: stats.absent,  cls: "bg-rose-50    text-rose-700    border-rose-100"    },
          { label: "Late",     value: stats.late,    cls: "bg-amber-50   text-amber-700   border-amber-100"   },
          { label: "Sick",     value: stats.sick,    cls: "bg-violet-50  text-violet-700  border-violet-100"  },
          { label: "Excused",  value: stats.excused, cls: "bg-blue-50    text-blue-700    border-blue-100"    },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cls}`}>
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-lg font-black">{value}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
          <TrendingUp size={14} className="text-emerald-600" />
          <span className="text-sm font-bold text-slate-800">{stats.rate.toFixed(1)}% attendance rate</span>
        </div>
      </div>

      {/* Attendance rate bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
          style={{ width: `${stats.rate}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>0%</span>
        <span>{stats.total} total students</span>
        <span>100%</span>
      </div>
    </div>

    {/* Toolbar */}
    <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search by name or admission number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-300 transition-all"
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">{displayDate}</span>
        <button className="text-xs text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200">
          <Download size={12} /> Export CSV
        </button>
      </div>
    </div>

    {/* Table */}
    <div className="overflow-x-auto max-h-[calc(100vh-520px)] overflow-y-auto">
      <table className="w-full">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            {["#", "Adm No", "Student Name", "Status", "Subject", "Reason", "Marked By", "Time"].map(h => (
              <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.length > 0 ? (
            records.map((r, i) => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4">
                  <span className="text-sm font-mono text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-md">
                    {r.student?.admission_number ?? "N/A"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-900">
                    {r.student?.first_name} {r.student?.last_name}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide ${S_BADGE[r.status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                    {S_ICONS[r.status] ?? null}
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {r.subject?.name ?? "—"}
                  {r.subject?.subject_code && (
                    <span className="text-xs text-slate-500 ml-1">({r.subject.subject_code})</span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600 max-w-[140px]">
                  <span className="truncate block" title={r.reason ?? ""}>{r.reason ?? "—"}</span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700 whitespace-nowrap">
                  {r.teacher
                    ? <>{r.teacher.user.first_name} {r.teacher.user.last_name} <span className="text-xs text-slate-500">({r.teacher.teacher_code})</span></>
                    : "System"}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="px-6 py-16 text-center">
                <Search size={36} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No records match your search</p>
                <button onClick={() => setSearch("")} className="mt-3 text-xs text-indigo-600 hover:underline">
                  Clear Search
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Footer */}
    <div className="p-5 border-t border-slate-100 bg-white/80 backdrop-blur-sm">
      <p className="text-sm text-slate-600">
        Showing <b>{records.length}</b> of <b>{allRecords.length}</b> records · {displayDate}
        {search && <span> · Filtered by "<b>{search}</b>"</span>}
      </p>
    </div>
  </Card>
);

export default Attendance;