import React, { useState } from "react";
import Card from "../../components/common/Card";
import { 
  BookOpen, 
  Plus, 
  Target, 
  Lightbulb, 
  Calendar, 
  GraduationCap, 
  ArrowRight,
  Search,
  MoreHorizontal,
  Bookmark
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type LessonPlanType = {
  id: number;
  title: string;
  subject: string;
  className: string;
  stream: string;
  objectives: string;
  notes: string;
  date: string;
};

const classes = ["Grade 1", "Grade 2", "Class 6"];
const streams = ["East", "West"];
const subjects = ["Mathematics", "English", "Science", "History"];

const mockPlans: LessonPlanType[] = [
  {
    id: 1,
    title: "Algebra Basics",
    subject: "Mathematics",
    className: "Class 6",
    stream: "East",
    objectives: "Understand variables and expressions",
    notes: "Introduce using examples from daily life",
    date: "2026-01-10",
  },
  {
    id: 2,
    title: "Introduction to Ecosystems",
    subject: "Science",
    className: "Grade 2",
    stream: "West",
    objectives: "Identify components of ecosystems",
    notes: "Use pictures and videos for engagement",
    date: "2026-01-09",
  },
];

const subjectColors: Record<string, string> = {
  Mathematics: "bg-blue-600",
  English: "bg-orange-500",
  Science: "bg-emerald-600",
  History: "bg-amber-600",
  Default: "bg-slate-600"
};

const LessonPlan: React.FC = () => {
  const [plans, setPlans] = useState<LessonPlanType[]>(mockPlans);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [stream, setStream] = useState("");
  const [objectives, setObjectives] = useState("");
  const [notes, setNotes] = useState("");

  const handleAddPlan = () => {
    if (!title || !subject || !className || !stream || !objectives) return;
    const newPlan: LessonPlanType = {
      id: Date.now(),
      title,
      subject,
      className,
      stream,
      objectives,
      notes,
      date: new Date().toLocaleDateString('en-CA'),
    };
    setPlans([newPlan, ...plans]);
    setTitle(""); setSubject(""); setClassName(""); setStream(""); setObjectives(""); setNotes("");
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pedagogical Planning</h1>
          <p className="text-slate-500 font-medium italic">Architecting the future, one lesson at a time.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <Search size={18} className="text-slate-400 ml-2" />
          <input type="text" placeholder="Search plans..." className="bg-transparent outline-none text-sm font-bold p-2 w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* 2. Composition Side (Left) */}
        <div className="xl:col-span-4">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-6 sticky top-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Plus size={24} />
              </div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">New Schema</h2>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Lesson Title"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-black uppercase outline-none"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="">Subject</option>
                  {subjects.map((s) => <option key={s}>{s}</option>)}
                </select>
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-black uppercase outline-none"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                >
                  <option value="">Class</option>
                  {classes.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <textarea
                placeholder="Learning Objectives (What will they master?)"
                rows={3}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
              />

              <textarea
                placeholder="Teaching Aids / Notes..."
                rows={3}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none shadow-inner"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button
                onClick={handleAddPlan}
                className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                Save Lesson Plan <ArrowRight size={16} />
              </button>
            </div>
          </Card>
        </div>

        {/* 3. The Repository (Right) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Bookmark className="text-indigo-600" size={20} /> Repository
            </h2>
            <div className="flex gap-2">
              <button className="text-[10px] font-black uppercase text-slate-400 border-b-2 border-indigo-600 text-indigo-600 pb-1">All Plans</button>
              <button className="text-[10px] font-black uppercase text-slate-400 pb-1 hover:text-slate-600 transition-colors">Drafts</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-none shadow-lg shadow-slate-200/40 rounded-[2.5rem] p-0 bg-white group overflow-hidden flex flex-col">
                <div className={`h-2 ${subjectColors[plan.subject] || subjectColors.Default}`} />
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${subjectColors[plan.subject] || subjectColors.Default}`} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plan.subject}</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{plan.title}</h3>
                    </div>
                    <button className="text-slate-300 hover:text-slate-600">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Badge icon={<GraduationCap size={10} />} text={plan.className} />
                    <Badge icon={<Calendar size={10} />} text={plan.date} />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex gap-3">
                      <div className="mt-1"><Target size={14} className="text-indigo-500" /></div>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed line-clamp-2">{plan.objectives}</p>
                    </div>
                    {plan.notes && (
                      <div className="flex gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                        <div className="mt-0.5"><Lightbulb size={14} className="text-amber-500" /></div>
                        <p className="text-[11px] font-medium text-slate-500 italic line-clamp-2">{plan.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <button className="w-full py-4 border-t border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all">
                  Open Detailed Syllabus
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};



const Badge = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tighter">
    {icon}
    {text}
  </div>
);

export default LessonPlan;