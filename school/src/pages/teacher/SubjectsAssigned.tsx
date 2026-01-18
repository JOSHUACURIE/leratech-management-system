import React from "react";
import Card from "../../components/common/Card";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Layers,
  BarChart3,
  Lock,
  ArrowUpRight,
  GraduationCap
} from "lucide-react";
import { useNavigate } from "react-router-dom";



const assignedSubjects = [
  {
    id: "sub-1",
    subject: "Mathematics",
    className: "Grade 4",
    stream: "East",
    students: 38,
    curriculum: "CBC",
    portalOpen: true,
  },
  {
    id: "sub-2",
    subject: "English",
    className: "Grade 5",
    stream: "West",
    students: 41,
    curriculum: "CBC",
    portalOpen: false,
  },
  {
    id: "sub-3",
    subject: "Science",
    className: "Grade 6",
    stream: "North",
    students: 36,
    curriculum: "8-4-4",
    portalOpen: true,
  },
];

const SubjectsAssigned: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
     
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Academic Portfolio</h1>
          <p className="text-slate-500 font-medium mt-1">Manage assessments and tracking for your assigned subjects.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Grading Portal Active</span>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {assignedSubjects.map((item) => (
          <Card key={item.id} className="group border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
            
            
            <div className="absolute -bottom-4 -right-4 text-slate-50 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700">
               <BookOpen size={180} />
            </div>

            <div className="relative z-10 space-y-6">
             
              <div className="flex justify-between items-start">
                <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg group-hover:bg-indigo-600 transition-colors">
                  <BookOpen size={24} />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                  item.curriculum === "CBC" 
                  ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}>
                  {item.curriculum} System
                </span>
              </div>

              {/* Subject Title */}
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                  {item.subject}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <GraduationCap size={16} className="text-slate-400" />
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                    {item.className} • {item.stream}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-6 py-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Enrolled</span>
                  <span className="text-sm font-black text-slate-700 flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-500" /> {item.students} Students
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Status</span>
                  <span className={`text-sm font-black flex items-center gap-1.5 ${item.portalOpen ? 'text-emerald-600' : 'text-rose-500'}`}>
                    <ClipboardCheck size={14} /> {item.portalOpen ? 'Open' : 'Locked'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={() => navigate(`/teacher/performance?subject=${item.subject}&class=${item.className}`)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all group/btn"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 size={16} /> Performance Analytics
                  </span>
                  <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>

                <button
                  disabled={!item.portalOpen}
                  onClick={() => navigate(item.curriculum === "CBC" ? `/teacher/cbc?subject=${item.id}` : `/teacher/scores?subject=${item.id}`)}
                  className={`w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl
                    ${
                      item.portalOpen
                        ? "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    }
                  `}
                >
                  {item.portalOpen ? (
                    item.curriculum === "CBC" ? <><Layers size={16} /> Start CBC Assessment</> : <><ClipboardCheck size={16} /> Enter Marks</>
                  ) : (
                    <><Lock size={16} /> Portal Locked</>
                  )}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubjectsAssigned;