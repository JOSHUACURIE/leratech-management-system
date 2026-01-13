import React, { useState } from "react";
import Card from "../../components/common/Card";
import { 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  BookOpen, 
  Calendar, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Star, 
  CheckCircle,
  Users,
  Target,
  Zap
} from "lucide-react";

type Child = {
  id: string;
  name: string;
  grade: string;
  age: number;
  avatar: string;
};

type SubjectResult = {
  subject: string;
  score: number;
  maxScore: number;
  grade: string;
  teacherComment: string;
  trend: "up" | "down" | "stable";
};

type TermResult = {
  term: string;
  year: string;
  average: number;
  position: string;
  attendance: string;
  remarks: string;
  subjects: SubjectResult[];
};

type PerformanceTrend = {
  month: string;
  average: number;
  subjects: number;
};


const mockChildren: Child[] = [
  { id: "1", name: "Mary Jaoko", grade: "Grade 4", age: 10, avatar: "JD" },
  { id: "2", name: "Jane Aoko", grade: "Grade 2", age: 8, avatar: "JA" },
];

const mockTermResults: TermResult[] = [
  {
    term: "Term 1",
    year: "2026",
    average: 82.5,
    position: "3rd/45",
    attendance: "95%",
    remarks: "Excellent performance, shows great improvement in Math",
    subjects: [
      { subject: "Mathematics", score: 85, maxScore: 100, grade: "A", teacherComment: "Shows excellent problem-solving skills", trend: "up" },
      { subject: "English", score: 88, maxScore: 100, grade: "A", teacherComment: "Excellent reading comprehension", trend: "stable" },
      { subject: "Science", score: 78, maxScore: 100, grade: "B+", teacherComment: "Good practical skills", trend: "up" },
      { subject: "Kiswahili", score: 75, maxScore: 100, grade: "B", teacherComment: "Improving in oral skills", trend: "up" },
      { subject: "CRE", score: 90, maxScore: 100, grade: "A", teacherComment: "Excellent participation", trend: "stable" },
      { subject: "Social Studies", score: 82, maxScore: 100, grade: "A-", teacherComment: "Good analytical skills", trend: "up" },
    ]
  },
  {
    term: "Term 2",
    year: "2025",
    average: 78.2,
    position: "5th/45",
    attendance: "92%",
    remarks: "Good performance, needs improvement in Mathematics",
    subjects: [
      { subject: "Mathematics", score: 72, maxScore: 100, grade: "B", teacherComment: "Needs more practice", trend: "down" },
      { subject: "English", score: 85, maxScore: 100, grade: "A", teacherComment: "Excellent writing skills", trend: "stable" },
      { subject: "Science", score: 76, maxScore: 100, grade: "B+", teacherComment: "Good understanding", trend: "stable" },
      { subject: "Kiswahili", score: 70, maxScore: 100, grade: "B-", teacherComment: "Average performance", trend: "stable" },
      { subject: "CRE", score: 88, maxScore: 100, grade: "A", teacherComment: "Very attentive", trend: "up" },
      { subject: "Social Studies", score: 78, maxScore: 100, grade: "B+", teacherComment: "Good effort", trend: "stable" },
    ]
  }
];

const mockPerformanceTrend: PerformanceTrend[] = [
  { month: "Jan", average: 75, subjects: 6 },
  { month: "Feb", average: 78, subjects: 6 },
  { month: "Mar", average: 82, subjects: 6 },
  { month: "Apr", average: 80, subjects: 6 },
  { month: "May", average: 83, subjects: 6 },
  { month: "Jun", average: 85, subjects: 6 },
];
const Results: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState<Child>(mockChildren[0]);
  const [selectedTerm, setSelectedTerm] = useState<TermResult>(mockTermResults[0]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const getGradeStyles = (grade: string) => {
    const firstChar = grade.charAt(0);
    if (firstChar === 'A') return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (firstChar === 'B') return "bg-blue-50 text-blue-600 border-blue-100";
    if (firstChar === 'C') return "bg-amber-50 text-amber-600 border-amber-100";
    return "bg-rose-50 text-rose-600 border-rose-100";
  };

  return (
    <div className="p-6 bg-[#FBFDFF] min-h-screen space-y-10">
      
      {/* 1. Dynamic Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              Academic Intelligence
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Performance <span className="text-slate-400">Hub</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
            <Download size={16} /> Export Transcript
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 2. Left Column: Student & Term Selection */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Child Switcher */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Select Student</h3>
            <div className="grid grid-cols-1 gap-3">
              {mockChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`group relative p-5 rounded-[2rem] transition-all duration-300 border-2 ${
                    selectedChild.id === child.id
                      ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-200"
                      : "bg-white border-slate-100 hover:border-indigo-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-transform group-hover:scale-110 ${
                       selectedChild.id === child.id ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      {child.avatar}
                    </div>
                    <div className="text-left">
                      <p className={`font-black tracking-tight ${selectedChild.id === child.id ? "text-white" : "text-slate-800"}`}>
                        {child.name}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedChild.id === child.id ? "text-indigo-300" : "text-slate-400"}`}>
                        {child.grade} • {child.age} Yrs
                      </p>
                    </div>
                    {selectedChild.id === child.id && (
                      <ChevronRight size={18} className="ml-auto text-indigo-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Performance Trends */}
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-black text-slate-800 tracking-tight">Growth Map</h3>
               <TrendingUp size={20} className="text-indigo-500" />
            </div>
            
            <div className="space-y-6">
              {mockPerformanceTrend.map((month, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>{month.month}</span>
                    <span className="text-slate-800">{month.average}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${month.average}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        {/* 3. Right Column: Detailed Insights */}
        <main className="lg:col-span-8 space-y-8">
          
          {/* Top Score Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Overall Average", val: `${selectedTerm.average}%`, icon: <LineChart />, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Class Position", val: selectedTerm.position, icon: <Target />, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Attendance", val: selectedTerm.attendance, icon: <Calendar />, color: "text-amber-600", bg: "bg-amber-50" }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
                  {stat.icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <h4 className="text-2xl font-black text-slate-800 mt-1">{stat.val}</h4>
              </div>
            ))}
          </div>

          {/* Subject Performance Breakdown */}
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">Subject Mastery</h3>
               <div className="flex gap-2">
                  {mockTermResults.map((t, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedTerm(t)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedTerm.term === t.term ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-white text-slate-400 border border-slate-100"
                      }`}
                    >
                      {t.term}
                    </button>
                  ))}
               </div>
            </div>

            <div className="divide-y divide-slate-50">
              {selectedTerm.subjects.map((subject, index) => {
                const styles = getGradeStyles(subject.grade);
                const isExpanded = expandedSubject === subject.subject;

                return (
                  <div key={index} className="group">
                    <div 
                      onClick={() => setExpandedSubject(isExpanded ? null : subject.subject)}
                      className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${styles} border shadow-sm`}>
                          {subject.grade}
                        </div>
                        <div>
                          <h5 className="font-black text-slate-800 tracking-tight">{subject.subject}</h5>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subject.score}/{subject.maxScore} Score</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="hidden md:block w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-slate-800 rounded-full" style={{ width: `${subject.score}%` }} />
                        </div>
                        <div className="flex items-center gap-2 min-w-[100px] justify-end">
                           {subject.trend === 'up' ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{subject.trend === 'up' ? 'Gain' : 'Loss'}</span>
                        </div>
                        <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isExpanded ? "rotate-180 text-indigo-500" : ""}`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                        <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-4">
                           <div className="flex gap-4">
                              <div className="bg-white p-2 rounded-lg h-fit shadow-sm"><Zap size={16} className="text-amber-500" /></div>
                              <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                "{subject.teacherComment}"
                              </p>
                           </div>
                           <div className="flex gap-3 justify-end">
                              <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white px-4 py-2 rounded-lg border border-indigo-50">Review Materials</button>
                              <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800">Dismiss</button>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
          
          {/* Awards Section */}
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-100">
             <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                   <Star size={32} fill="currentColor" />
                </div>
                <div>
                   <h4 className="text-xl font-black tracking-tight">Merit Achievement</h4>
                   <p className="text-amber-100 text-sm font-medium">Awarded for consistency in Term 1 Academic Cycle</p>
                </div>
             </div>
             <button className="px-6 py-3 bg-white text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-colors">
                View Awards
             </button>
          </div>
        </main>
      </div>
    </div>
  );
};
export default Results;