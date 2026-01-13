import React, { useState } from "react";
import { Plus, Settings, BookOpen, Layers, Calendar, GraduationCap, Percent, Trash2 } from "lucide-react";
import Card from "../../components/common/Card";

const mockClasses = ["Grade 1", "Grade 2", "Grade 3"];
const mockStreams = ["A", "B", "C"];
const mockSubjects = ["Math", "English", "Science"];
const mockTerms = ["Term 1", "Term 2", "Term 3"];
const mockCurricula = ["CBC", "8-4-4"];
const mockGrades = [
  { grade: "A", min: 80, max: 100 },
  { grade: "B", min: 65, max: 79 },
  { grade: "C", min: 50, max: 64 },
  { grade: "D", min: 35, max: 49 },
  { grade: "E", min: 0, max: 34 },
];
const AcademicSetup: React.FC = () => {
  const [classes, setClasses] = useState(mockClasses);
  const [streams, setStreams] = useState(mockStreams);
  const [subjects, setSubjects] = useState(mockSubjects);
  const [terms, setTerms] = useState(mockTerms);
  const [curriculum, setCurriculum] = useState(mockCurricula[0]);
  const [grades, setGrades] = useState(mockGrades);

  // Reusable Component for Setup Sections
  const SetupSection = ({ title, items, onAdd, icon: Icon, colorClass }: any) => (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-8 bg-white transition-all hover:shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
            <Icon size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
        </div>
        <button 
          onClick={onAdd}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${colorClass.bg} ${colorClass.text} hover:opacity-80`}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {items.map((item: string) => (
          <div
            key={item}
            className="group flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 transition-all hover:border-indigo-200 hover:bg-white"
          >
            {item}
            <button className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all">
                <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Academic Setup</h1>
          <p className="text-slate-500 font-medium">Configure the core structure of your learning environment.</p>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 pr-4">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                <Settings size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Curriculum</p>
                <select
                    value={curriculum}
                    onChange={(e) => setCurriculum(e.target.value)}
                    className="text-sm font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
                >
                    {mockCurricula.map((c) => <option key={c} value={c}>{c} System</option>)}
                </select>
            </div>
        </div>
      </div>

      {/* Main Grid Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <SetupSection 
            title="Classes" 
            items={classes} 
            onAdd={() => {}} 
            icon={GraduationCap} 
            colorClass={{bg: 'bg-indigo-50', text: 'text-indigo-600'}} 
        />

        <SetupSection 
            title="Streams" 
            items={streams} 
            onAdd={() => {}} 
            icon={Layers} 
            colorClass={{bg: 'bg-emerald-50', text: 'text-emerald-600'}} 
        />

        <SetupSection 
            title="Subjects" 
            items={subjects} 
            onAdd={() => {}} 
            icon={BookOpen} 
            colorClass={{bg: 'bg-amber-50', text: 'text-amber-600'}} 
        />

        <SetupSection 
            title="Academic Terms" 
            items={terms} 
            onAdd={() => {}} 
            icon={Calendar} 
            colorClass={{bg: 'bg-rose-50', text: 'text-rose-600'}} 
        />

      </div>

      {/* Modern Grading System Card */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50 flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl">
            <Percent size={20} />
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Grading Configuration</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Grade Label</th>
                <th className="px-10 py-6">Minimum Range</th>
                <th className="px-10 py-6">Maximum Range</th>
                <th className="px-10 py-6">Status Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {grades.map((g) => (
                <tr key={g.grade} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-5">
                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg shadow-sm border ${
                        g.grade === 'A' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                        {g.grade}
                    </span>
                  </td>
                  <td className="px-10 py-5">
                    <input type="number" defaultValue={g.min} className="w-20 px-3 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </td>
                  <td className="px-10 py-5 text-sm font-black text-slate-800">
                    {g.max}%
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-2">
                        <div className={`h-1.5 flex-1 rounded-full ${g.min >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: '60px' }}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase italic">Valid Range</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-slate-50/50 flex justify-end">
            <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all">
                Save Scale Changes
            </button>
        </div>
      </Card>
    </div>
  );
};

export default AcademicSetup;