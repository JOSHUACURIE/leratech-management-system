import React, { useState } from "react";
import Card from "../../components/common/Card";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Target,
  Search,
  Zap,
  Filter,
  ArrowRight
} from "lucide-react";

/* ---------------- TYPES ---------------- */
type SubjectPerformance = {
  subject: string;
  class: string;
  stream: string;
  averageScore?: number; 
  cbcDistribution?: {
    exceeding: number;
    meeting: number;
    approaching: number;
    below: number;
  };
};

const classes = ["Grade 1", "Grade 2", "Class 6"];
const streams = ["East", "West"];
const subjects = ["Mathematics", "English", "Science"];

const mockPerformance: SubjectPerformance[] = [
  { subject: "Mathematics", class: "Class 6", stream: "East", averageScore: 64 },
  { subject: "English", class: "Class 6", stream: "East", averageScore: 71 },
  {
    subject: "Mathematics",
    class: "Grade 2",
    stream: "West",
    cbcDistribution: { exceeding: 6, meeting: 12, approaching: 4, below: 2 },
  },
];

const PerformanceAnalysis: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");

  const filtered = mockPerformance.filter(
    (p) =>
      (!selectedClass || p.class === selectedClass) &&
      (!selectedStream || p.stream === selectedStream)
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Academic Insights</h1>
          <p className="text-slate-500 font-medium mt-1">Advanced performance tracking and predictive trends.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
             <Search size={14} /> Export Report
           </button>
        </div>
      </div>

      {/* 2. Top-Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          icon={<BarChart3 size={24} />} 
          label="Active Curriculum" 
          value="Integrated" 
          subValue="CBC & 8-4-4" 
          color="indigo" 
        />
        <MetricCard 
          icon={<TrendingUp size={24} />} 
          label="Top Performing Subject" 
          value="English" 
          subValue="Avg. 71% Efficiency" 
          color="emerald" 
        />
        <MetricCard 
          icon={<TrendingDown size={24} />} 
          label="Critical Attention" 
          value="Mathematics" 
          subValue="Grade 2 West Below Exp." 
          color="rose" 
        />
      </div>

      {/* 3. Refined Filters */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6 bg-white/70 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="p-2 bg-slate-900 rounded-lg text-white">
            <Filter size={18} />
          </div>
          <select
            className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Filter by Class Level</option>
            {classes.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
          >
            <option value="">All Streams</option>
            {streams.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      {/* 4. Subject Performance Board */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Target className="text-indigo-600" size={20} /> Subject Performance Board
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((p, i) => (
              <Card key={i} className="border-none shadow-lg shadow-slate-200/40 rounded-[2rem] p-6 bg-white hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {p.subject.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 tracking-tight">{p.subject}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.class} • {p.stream}</p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md w-full">
                    {p.averageScore !== undefined ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mean Score</span>
                           <span className={`text-lg font-black ${p.averageScore >= 70 ? 'text-emerald-600' : 'text-amber-500'}`}>{p.averageScore}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                            className={`h-full transition-all duration-1000 ${p.averageScore >= 70 ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                            style={{ width: `${p.averageScore}%` }}
                           />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        <CBCMiniBar label="EE" value={p.cbcDistribution?.exceeding} total={24} color="emerald" />
                        <CBCMiniBar label="ME" value={p.cbcDistribution?.meeting} total={24} color="blue" />
                        <CBCMiniBar label="AE" value={p.cbcDistribution?.approaching} total={24} color="amber" />
                        <CBCMiniBar label="BE" value={p.cbcDistribution?.below} total={24} color="rose" />
                      </div>
                    )}
                  </div>

                  <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 5. AI Insights Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Zap className="text-amber-500" size={20} /> Smart Insights
          </h2>
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-900 text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={80} />
            </div>
            <ul className="space-y-6 relative z-10">
              <InsightItem text="Learner distribution in Grade 2 is skewed towards 'Meeting Expectations'." />
              <InsightItem text="Mathematics mean score in Class 6 East is 12% lower than the school average." />
              <InsightItem text="English shows a positive trajectory, up 4.5% from Term 2." />
            </ul>
            <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 transition-all rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
              View Detailed Trends <ArrowRight size={14} />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ---------------- SUB-COMPONENTS ---------------- */

const MetricCard = ({ icon, label, value, subValue, color }: any) => {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600"
  };
  return (
    <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] p-6 bg-white flex items-center gap-5 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-800 tracking-tight">{value}</p>
        <p className="text-[11px] font-bold text-slate-400 italic">{subValue}</p>
      </div>
    </Card>
  );
};

const CBCMiniBar = ({ label, value, total, color }: any) => {
  const colors: any = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500"
  };
  const percentage = ((value || 0) / total) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-black text-slate-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

const InsightItem = ({ text }: { text: string }) => (
  <li className="flex gap-3">
    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
    <p className="text-xs font-medium text-slate-300 leading-relaxed">{text}</p>
  </li>
);

export default PerformanceAnalysis;