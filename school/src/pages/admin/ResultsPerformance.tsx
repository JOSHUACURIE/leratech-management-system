import React from "react";
import { TrendingUp, Award, Target, BarChart2, Star, Download, Filter } from "lucide-react";
import Card from "../../components/common/Card";

const mockResults = [
  { id: 1, student: "Jane Smith", class: "Grade 4", stream: "A", term: "Term 1", average: 85, rank: 2 },
  { id: 2, student: "John Doe", class: "Grade 5", stream: "B", term: "Term 1", average: 92, rank: 1 },
  { id: 3, student: "Mary Johnson", class: "Grade 6", stream: "C", term: "Term 1", average: 78, rank: 4 },
  { id: 4, student: "Peter Okoth", class: "Grade 4", stream: "A", term: "Term 1", average: 60, rank: 5 },
  { id: 5, student: "Lucy Wambui", class: "Grade 5", stream: "B", term: "Term 1", average: 98, rank: 1 },
];

const getGradeColor = (score: number) => {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100";
  return "text-rose-600 bg-rose-50 border-rose-100";
};

const getGrade = (score: number) => {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
};

const ResultsPerformance: React.FC = () => {
  const avgScore = Math.round(mockResults.reduce((acc, r) => acc + r.average, 0) / mockResults.length);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header with Glassmorphism Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Academic Insights</h1>
          <p className="text-slate-500 font-medium">Visualizing student performance and grading trends.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:shadow-lg transition-all">
            <Filter size={20} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Class Average", val: `${avgScore}%`, icon: <Target />, color: "from-blue-600 to-indigo-700" },
          { label: "Top Performer", val: "98%", icon: <Award />, color: "from-purple-600 to-fuchsia-600" },
          { label: "Pass Rate", val: "84%", icon: <TrendingUp />, color: "from-emerald-500 to-teal-600" },
          { label: "Merit Awards", val: "12", icon: <Star />, color: "from-amber-400 to-orange-500" },
        ].map((stat, i) => (
          <div key={i} className={`p-1 rounded-[2.5rem] bg-gradient-to-br ${stat.color} shadow-2xl shadow-slate-200 transition-transform hover:scale-105`}>
            <div className="bg-white/10 backdrop-blur-sm rounded-[2.4rem] p-6 text-white h-full border border-white/20">
                <div className="flex justify-between items-start">
                    <span className="p-2 bg-white/20 rounded-xl">{stat.icon}</span>
                    <BarChart2 size={16} className="opacity-40" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-widest opacity-70">{stat.label}</p>
                <p className="text-3xl font-black">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Results Display */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-extrabold text-slate-800">Student Rankings</h3>
            <div className="flex gap-2 text-xs font-bold text-slate-400 uppercase">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> High</span>
                <span className="flex items-center gap-1 ml-4"><div className="w-2 h-2 rounded-full bg-amber-500" /> Average</span>
            </div>
        </div>
        
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                <th className="px-6 py-6">Student & Rank</th>
                <th className="px-6 py-6">Class/Stream</th>
                <th className="px-6 py-6 text-center">Average Score</th>
                <th className="px-6 py-6 text-center">Grade</th>
                <th className="px-6 py-6 text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockResults.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-all rounded-3xl">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                            #{item.rank}
                        </span>
                        <div>
                            <p className="font-bold text-slate-800">{item.student}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.term}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-600">{item.class}</span>
                        <span className="text-xs text-slate-400 font-medium">Stream {item.stream}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-full max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${item.average >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                style={{ width: `${item.average}%` }}
                            />
                        </div>
                        <span className="font-black text-slate-700">{item.average}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-xl border text-xs font-black shadow-sm ${getGradeColor(item.average)}`}>
                        {getGrade(item.average)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className={`inline-flex items-center gap-1 font-bold text-xs ${item.average > 75 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {item.average > 75 ? <TrendingUp size={14} /> : null}
                        {item.average > 75 ? '+2.4%' : '0.0%'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ResultsPerformance;