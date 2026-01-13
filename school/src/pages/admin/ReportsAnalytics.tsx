import React from "react";
import Card from "../../components/common/Card";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from "recharts";
import { Download, Calendar, Filter, PieChart as PieIcon, BarChart3, TrendingUp, ArrowUpRight } from "lucide-react";

const studentPerformanceData = [
  { class: "Grade 4", average: 78 },
  { class: "Grade 5", average: 85 },
  { class: "Grade 6", average: 90 },
  { class: "Grade 7", average: 65 },
  { class: "Grade 8", average: 80 }
];

const feeCollectionData = [
  { status: "Paid", value: 120 },
  { status: "Pending", value: 35 },
  { status: "Partial", value: 15 }
];

// Re-tuned Palette for Charts
const CHART_COLORS = ["#6366f1", "#fbbf24", "#f87171"]; // Indigo, Amber, Rose

const ReportsAnalytics: React.FC = () => {
  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">System Intelligence</h1>
          <p className="text-slate-500 font-medium">Real-time school performance and financial metrics.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase text-slate-400 hover:text-indigo-600 transition-all">
            <Calendar size={14} /> This Term
          </button>
          <button className="flex items-center gap-2 px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase shadow-lg shadow-slate-200">
            <Download size={14} /> Export BI Report
          </button>
        </div>
      </div>

      {/* Analytics Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Revenue Collected", val: "KES 500k", trend: "+12%", color: "text-emerald-600" },
          { label: "Active Students", val: "170", trend: "+5", color: "text-indigo-600" },
          { label: "Faculty Members", val: "15", trend: "0%", color: "text-slate-400" },
          { label: "Outstanding Fees", val: "45k", trend: "-8%", color: "text-rose-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.color}`}>
                    {stat.trend} <ArrowUpRight size={12} />
                </div>
            </div>
            <p className="text-3xl font-black text-slate-800">{stat.val}</p>
            <div className="w-full h-1 bg-slate-50 rounded-full mt-4 overflow-hidden">
                <div className={`h-full bg-indigo-500 w-2/3 group-hover:w-full transition-all duration-700`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Performance Bar Chart - Takes 2 columns */}
        <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] p-8 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><BarChart3 size={20}/></div>
              <h3 className="text-xl font-extrabold text-slate-800">Academic Progress</h3>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors"><Filter size={18}/></button>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="class" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                    dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px'}}
                />
                <Bar 
                    dataKey="average" 
                    fill="#6366f1" 
                    radius={[10, 10, 10, 10]} 
                    barSize={40} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Fee Collection Pie Chart - Takes 1 column */}
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] p-8 bg-white">
          <div className="flex items-center gap-3 mb-8">
             <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><PieIcon size={20}/></div>
             <h3 className="text-xl font-extrabold text-slate-800">Fee Distribution</h3>
          </div>

          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeCollectionData}
                  dataKey="value"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                >
                  {feeCollectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text for Donut */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase">Total Items</p>
                <p className="text-2xl font-black text-slate-800">170</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {feeCollectionData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: CHART_COLORS[i]}} />
                        <span className="text-xs font-bold text-slate-600">{item.status}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{item.value}</span>
                </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default ReportsAnalytics;