import React, { useState } from "react";
import Card from "../../components/common/Card";
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  PlusCircle, 
  Send, 
  Users, 
  Search, 
  CheckCircle,
  FileText,
  Copy
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type Student = {
  id: number;
  name: string;
  assignment?: string;
  dueDate?: string;
};

const classes = ["Grade 1", "Grade 2", "Class 6"];
const streams = ["East", "West"];

const mockStudents: Student[] = [
  { id: 1, name: "Jane Smith" },
  { id: 2, name: "John Owino" },
  { id: 3, name: "Mary Johnson" },
  { id: 4, name: "Peter Brown" },
];

const Assignments: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [students, setStudents] = useState<Student[]>(mockStudents);
  
  // Bulk Assign States
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkDate, setBulkDate] = useState("");

  const handleApplyBulk = () => {
    setStudents(prev => prev.map(s => ({
      ...s,
      assignment: bulkTitle,
      dueDate: bulkDate
    })));
  };

  const handleAssignmentChange = (id: number, value: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, assignment: value } : s)));
  };

  const handleDueDateChange = (id: number, value: string) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, dueDate: value } : s)));
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-violet-100">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Assignment Manager</h1>
            <p className="text-slate-500 font-medium">Distribute learning tasks and track deadlines.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 2. Left Column: Filters & Bulk Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Class Filters */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Target Audience
            </h3>
            <div className="space-y-3">
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
              >
                <option value="">Select Stream</option>
                {streams.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </Card>

          {/* Bulk Assign Tools */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6 bg-violet-600 text-white space-y-4">
            <div className="flex items-center gap-2">
              <PlusCircle size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest text-violet-100">Quick Bulk Assign</h3>
            </div>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Homework Title"
                value={bulkTitle}
                onChange={(e) => setBulkTitle(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm placeholder:text-violet-200 focus:bg-white/20 outline-none transition-all"
              />
              <input 
                type="date" 
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:bg-white/20 outline-none transition-all"
              />
              <button 
                onClick={handleApplyBulk}
                className="w-full py-3 bg-white text-violet-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-violet-50 transition-all flex items-center justify-center gap-2"
              >
                <Copy size={14} /> Apply to Class
              </button>
            </div>
          </Card>
        </div>

        {/* 3. Right Column: Student Table */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 overflow-hidden bg-white min-h-[500px]">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
               <div className="relative w-1/2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search students..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500/10" 
                  />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {students.length} Total Learners
               </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    <th className="px-6 py-4 text-left">Student</th>
                    <th className="px-6 py-4 text-left">Task Description</th>
                    <th className="px-6 py-4 text-left">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition-all">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="relative flex items-center">
                          <FileText size={14} className="absolute left-3 text-slate-300" />
                          <input
                            type="text"
                            placeholder="Set individual task..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-violet-500/10 transition-all"
                            value={student.assignment || ""}
                            onChange={(e) => handleAssignmentChange(student.id, e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={14} className="text-slate-300" />
                          <input
                            type="date"
                            className="bg-transparent border-none text-xs font-bold text-slate-500 outline-none"
                            value={student.dueDate || ""}
                            onChange={(e) => handleDueDateChange(student.id, e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
               <div className="flex items-center gap-2 text-emerald-600">
                 <CheckCircle size={16} />
                 <span className="text-xs font-black uppercase tracking-widest">Saved locally</span>
               </div>
               <button
                 onClick={() => alert("Assignments sent to Parent-Teacher Portal")}
                 className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-violet-600 hover:-translate-y-1 transition-all active:scale-95"
               >
                 <Send size={18} /> Publish to Portal
               </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Assignments;