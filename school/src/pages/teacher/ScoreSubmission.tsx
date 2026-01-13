import React, { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import { 
  Save, 
  Search, 
  Users, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Loader2
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type Student = {
  id: string;
  admissionNo: string;
  name: string;
  score: number | "";
};

const classes = ["Grade 4", "Grade 5", "Grade 6"];
const streams = ["East", "West", "North"];

const mockStudents: Record<string, Student[]> = {
  "Grade 4-East": [
    { id: "1", admissionNo: "G4-001", name: "Alice Achieng", score: "" },
    { id: "2", admissionNo: "G4-002", name: "Brian Otieno", score: "" },
    { id: "5", admissionNo: "G4-003", name: "Faith Mutua", score: "" },
  ],
  "Grade 5-West": [
    { id: "3", admissionNo: "G5-010", name: "Clara Wanjiku", score: "" },
    { id: "4", admissionNo: "G5-011", name: "Daniel Kiptoo", score: "" },
  ],
};

const ScoreSubmission: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!selectedClass || !selectedStream) {
      setStudents([]);
      return;
    }
    const key = `${selectedClass}-${selectedStream}`;
    setStudents(mockStudents[key] || []);
  }, [selectedClass, selectedStream]);

  const handleScoreChange = (id: string, value: string) => {
    const score = value === "" ? "" : Number(value);
    if (score !== "" && (score < 0 || score > 100)) return;
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, score } : s)));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Scores synced to LeraTech Cloud");
    }, 1500);
  };

  // Calculate stats for the summary bar
  const entriesCount = students.filter(s => s.score !== "").length;
  const averageScore = entriesCount > 0 
    ? (students.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / entriesCount).toFixed(1)
    : "0";

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest mb-2 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bulk Score Entry</h1>
          <p className="text-slate-500 font-medium mt-1">Record student performance for Term 1 Assessments.</p>
        </div>

        {students.length > 0 && (
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 border-r border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Entries</p>
              <p className="text-sm font-black text-slate-800">{entriesCount} / {students.length}</p>
            </div>
            <div className="px-4 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Class Avg</p>
              <p className="text-sm font-black text-indigo-600">{averageScore}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Selectors & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={18} className="text-indigo-500" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Selection</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              >
                <option value="">Choose Class...</option>
                {classes.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stream / Group</label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              >
                <option value="">Choose Stream...</option>
                {streams.map((str) => <option key={str} value={str}>{str}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <div className="lg:col-span-8">
          {students.length > 0 ? (
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 overflow-hidden bg-white">
              {/* Table Search Header */}
              <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
                 <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Search name or adm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
                    />
                 </div>
                 <div className="hidden sm:flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Cloud Sync Ready</span>
                 </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Adm No</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Student</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Raw Score</th>
                      <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-slate-400 group-hover:text-slate-900 transition-colors">
                            {student.admissionNo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">{student.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              value={student.score}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              className={`w-20 px-3 py-2 rounded-xl text-center font-black text-sm outline-none transition-all focus:ring-4
                                ${student.score === "" 
                                  ? "bg-slate-100 text-slate-400 focus:ring-indigo-500/10" 
                                  : Number(student.score) < 40 
                                    ? "bg-rose-50 text-rose-600 focus:ring-rose-500/10" 
                                    : "bg-emerald-50 text-emerald-600 focus:ring-emerald-500/10"
                                }
                              `}
                              placeholder="0"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex justify-center">
                              {student.score !== "" ? (
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                                   <CheckCircle2 size={14} />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">
                                   <AlertCircle size={14} />
                                </div>
                              )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sticky Footer for Table */}
              <div className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 italic">
                  Tip: Use <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm not-italic">TAB</kbd> to move quickly between students.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={saving || entriesCount === 0}
                  className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95
                    ${saving 
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                      : "bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-200"
                    }
                  `}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Syncing Scores..." : "Submit to Registry"}
                </button>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Users size={40} className="text-slate-300" />
               </div>
               <h3 className="text-lg font-black text-slate-800 tracking-tight">No Active Session</h3>
               <p className="text-sm text-slate-500 max-w-[280px] mt-2">
                 Please select a <b>Class</b> and <b>Stream</b> on the left to load the student registry for score entry.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreSubmission;