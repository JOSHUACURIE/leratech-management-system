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
  Info
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type CBCLevel = "Exceeding Expectation" | "Meeting Expectation" | "Approaching Expectation" | "Below Expectation";

type Student = {
  id: string;
  admissionNo: string;
  name: string;
  level: CBCLevel | "";
  comment: string;
};

const classes = ["Grade 1", "Grade 2", "Grade 3"];
const streams = ["East", "West"];
const learningAreas = ["Mathematics", "English", "Environmental Activities"];
const strands = ["Numbers", "Measurement", "Reading"];
const subStrands = ["Whole Numbers", "Length", "Comprehension"];

const levelConfig: Record<CBCLevel, { color: string; bg: string; border: string }> = {
  "Exceeding Expectation": { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Meeting Expectation": { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  "Approaching Expectation": { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  "Below Expectation": { color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
};

const CBCAssessment: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [learningArea, setLearningArea] = useState("");
  const [strand, setStrand] = useState("");
  const [subStrand, setSubStrand] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedClass && selectedStream) {
      setStudents([
        { id: "1", admissionNo: "G1-001", name: "Amani Otieno", level: "", comment: "" },
        { id: "2", admissionNo: "G1-002", name: "Faith Wanjiru", level: "", comment: "" },
      ]);
    }
  }, [selectedClass, selectedStream]);

  const updateLevel = (id: string, level: CBCLevel) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, level } : s));
  };

  const updateComment = (id: string, comment: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, comment } : s));
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Layers size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">CBC Assessment</h1>
            <p className="text-slate-500 font-medium">Competency-based performance tracking</p>
          </div>
        </div>
        
        {learningArea && subStrand && (
          <div className="hidden lg:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <Info size={16} className="text-emerald-500" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest italic">
              {learningArea} / {subStrand}
            </span>
          </div>
        )}
      </div>

      {/* 2. Hierarchical Filter Selection */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Class", val: selectedClass, set: setSelectedClass, opts: classes },
            { label: "Stream", val: selectedStream, set: setSelectedStream, opts: streams },
            { label: "Learning Area", val: learningArea, set: setLearningArea, opts: learningAreas },
            { label: "Strand", val: strand, set: setStrand, opts: strands },
            { label: "Sub-Strand", val: subStrand, set: setSubStrand, opts: subStrands }
          ].map((filter, i) => (
            <div key={i} className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{filter.label}</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
                value={filter.val}
                onChange={e => filter.set(e.target.value)}
              >
                <option value="">Select...</option>
                {filter.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Assessment Table */}
      {students.length > 0 && (
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[3rem] p-0 overflow-hidden bg-white">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-emerald-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Learner Registry</h2>
            </div>
            <div className="text-xs font-bold text-slate-400">
              Total Learners: <span className="text-slate-900">{students.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Learner Details</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Performance Level</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Teacher's Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map((s) => (
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
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border
                                ${active 
                                  ? `${config.bg} ${config.color} ${config.border} shadow-sm ring-2 ring-emerald-500/10` 
                                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600'
                                }
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
                      <p className={`mt-2 text-[11px] font-bold h-4 ${s.level ? levelConfig[s.level as CBCLevel].color : 'text-slate-300 italic'}`}>
                        {s.level || "Pending Assessment"}
                      </p>
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
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-300 transition-all"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Actions */}
          <div className="p-8 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                ))}
              </div>
              <p className="text-xs font-bold text-slate-500">Learners awaiting rubric scores</p>
            </div>
            
            <button
              onClick={() => setSaving(true)}
              disabled={saving}
              className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
              {saving ? "Processing Records..." : "Finalize CBC Records"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

const Users = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export default CBCAssessment;