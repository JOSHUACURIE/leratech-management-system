import React from "react";
import Card from "../../components/common/Card";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  ChevronRight,
  Lock,
  ArrowUpRight,
  Hash
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ---------------- MOCK DATA ---------------- */

const myClasses = [
  {
    id: "cls-1",
    className: "Grade 4",
    stream: "East",
    students: 38,
    subjects: ["Mathematics", "English", "Science"],
    portalOpen: true,
    lastActivity: "2 hours ago"
  },
  {
    id: "cls-2",
    className: "Grade 5",
    stream: "West",
    students: 41,
    subjects: ["Mathematics", "English"],
    portalOpen: false,
    lastActivity: "Yesterday"
  },
  {
    id: "cls-3",
    className: "Grade 6",
    stream: "North",
    students: 36,
    subjects: ["Science"],
    portalOpen: true,
    lastActivity: "3 days ago"
  },
];

const MyClasses: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Academic Workload</h1>
          <p className="text-slate-500 font-medium mt-1">Manage marks and student profiles for your assigned classes.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm">
          <Hash size={18} className="font-bold" />
          <span className="text-sm font-black uppercase tracking-widest">{myClasses.length} Total Classes</span>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {myClasses.map((cls) => (
          <Card key={cls.id} className="group border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            
            {/* Status Ribbon */}
            <div className={`absolute top-6 right-6 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
              cls.portalOpen ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${cls.portalOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {cls.portalOpen ? "Portal Open" : "Portal Locked"}
            </div>

            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:bg-indigo-600 transition-colors">
                  {cls.className.split(' ')[1]}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                    {cls.className} {cls.stream}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">
                      <Users size={12} /> {cls.students} Students
                    </span>
                  </div>
                </div>
              </div>

              {/* Subjects Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Assigned Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {cls.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center gap-2 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-default"
                    >
                      <BookOpen size={14} className="opacity-50" />
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activity Info */}
              <div className="pt-2">
                 <p className="text-[10px] font-medium text-slate-400 italic">Last Activity: {cls.lastActivity}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  View Registry
                </button>

                <button
                  disabled={!cls.portalOpen}
                  onClick={() => navigate(`/teacher/scores?classId=${cls.id}`)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl
                    ${
                      cls.portalOpen
                        ? "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    }
                  `}
                >
                  {cls.portalOpen ? <ClipboardCheck size={14} /> : <Lock size={14} />}
                  Submit Marks
                </button>
              </div>
            </div>

            {/* Subtle Decorative Background Element */}
            <div className="absolute -bottom-6 -left-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
               <GraduationCap size={150} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Internal icon for the background decoration
const GraduationCap = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
);

export default MyClasses;