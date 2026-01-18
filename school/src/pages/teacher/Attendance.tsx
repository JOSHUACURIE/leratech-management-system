import React, { useState } from "react";
import Card from "../../components/common/Card";
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Calendar as CalendarIcon, 
  Users, 
  Search, 
  Save,
  CheckCircle2,
  Filter
} from "lucide-react";

type Student = {
  id: number;
  name: string;
  status?: "Present" | "Absent" | "Late";
};

const classes = ["Grade 1", "Grade 2", "Class 6"];
const streams = ["East", "West"];

const mockStudents: Student[] = [
  { id: 1, name: "Jane Smith" },
  { id: 2, name: "Mary Jaoko" },
  { id: 3, name: "Mary Johnson" },
  { id: 4, name: "Peter Brown" },
];

const Attendance: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [searchQuery, setSearchQuery] = useState("");

  const handleStatusChange = (id: number, status: Student["status"]) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const handleSubmit = () => {
    alert("Records Synced: " + students.filter(s => s.status).length + " marked.");
  };

  // Stats calculation
  const stats = {
    present: students.filter(s => s.status === "Present").length,
    absent: students.filter(s => s.status === "Absent").length,
    late: students.filter(s => s.status === "Late").length,
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
     
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <UserCheck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Daily Roll Call</h1>
            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
              <CalendarIcon size={14} className="text-indigo-500" />
              <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </div>

        {/* Real-time Counter Chips */}
        <div className="flex items-center gap-3">
          <StatChip label="Present" count={stats.present} color="emerald" icon={<CheckCircle2 size={12} />} />
          <StatChip label="Absent" count={stats.absent} color="rose" icon={<UserX size={12} />} />
          <StatChip label="Late" count={stats.late} color="amber" icon={<Clock size={12} />} />
        </div>
      </div>

      {/* 2. Selection Bar */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex flex-1 gap-4">
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <select
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
              >
                <option value="">Select Stream</option>
                {streams.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="lg:w-1/3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Quick search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
            />
          </div>
        </div>
      </Card>

      {/* 3. Main Attendance Registry */}
      <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] p-0 overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-400" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Student Roster</span>
          </div>
          <button 
            onClick={() => setStudents(students.map(s => ({...s, status: 'Present'})))}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 underline underline-offset-4"
          >
            Mark All Present
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="px-8 py-5 text-left w-16">#</th>
                <th className="px-8 py-5 text-left">Learner Name</th>
                <th className="px-8 py-5 text-right">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((student, index) => (
                <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-black text-slate-300 group-hover:text-indigo-500 transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-700">{student.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">ADM-{1000 + student.id}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <AttendanceButton 
                        active={student.status === "Present"} 
                        color="emerald" 
                        onClick={() => handleStatusChange(student.id, "Present")}
                        label="Present"
                      />
                      <AttendanceButton 
                        active={student.status === "Late"} 
                        color="amber" 
                        onClick={() => handleStatusChange(student.id, "Late")}
                        label="Late"
                      />
                      <AttendanceButton 
                        active={student.status === "Absent"} 
                        color="rose" 
                        onClick={() => handleStatusChange(student.id, "Absent")}
                        label="Absent"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Floating Action Bar */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-400 italic flex items-center gap-2">
             <Clock size={14} /> Auto-saving to cloud registry...
           </p>
           <button
             onClick={handleSubmit}
             className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 hover:-translate-y-1 transition-all active:scale-95"
           >
             <Save size={18} /> Sync Records
           </button>
        </div>
      </Card>
    </div>
  );
};

/* ---------------- SUB-COMPONENTS ---------------- */

const StatChip = ({ label, count, color, icon }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600"
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-100 transition-all ${colors[color]}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
      <span className="text-sm font-black">{count}</span>
    </div>
  );
};

const AttendanceButton = ({ active, color, onClick, label }: any) => {
  const themes: any = {
    emerald: active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white text-slate-400 border-slate-100",
    rose: active ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "bg-white text-slate-400 border-slate-100",
    amber: active ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-white text-slate-400 border-slate-100",
  };
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-90 ${themes[color]}`}
    >
      {label}
    </button>
  );
};

export default Attendance;