import React, { useState } from "react";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  Download, 
  Share2, 
  Calendar, 
  Filter, 
  FileText, 
  Table as TableIcon,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import Card from "../../components/common/Card";

const FinancialReports: React.FC = () => {
  const [timeframe, setTimeframe] = useState("This Term");

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Financial Intelligence <BarChart3 className="text-indigo-600" size={28} />
          </h1>
          <p className="text-slate-500 font-medium">Consolidated fiscal performance and audit-ready reporting.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            {["PDF", "Excel", "CSV"].map((ext) => (
              <button key={ext} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all">
                {ext}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            <Download size={16} /> Generate Master Report
          </button>
        </div>
      </div>

      {/* 2. Executive Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Gross Revenue", value: "KES 12.4M", trend: "+12.5%", up: true },
          { label: "Collection Rate", value: "84.2%", trend: "+2.1%", up: true },
          { label: "Outstanding Debt", value: "KES 1.8M", trend: "-4.3%", up: false },
          { label: "Net Cash Flow", value: "KES 4.2M", trend: "+8.9%", up: true },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm p-6 bg-white rounded-[2rem]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-black text-slate-800">{kpi.value}</h3>
              <div className={`flex items-center gap-1 text-[10px] font-black ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.trend}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 3. Data Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Revenue vs Projection Line Chart Area */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Revenue Trajectory</h2>
                <p className="text-xs font-medium text-slate-400">Monthly collection vs Budgeted targets</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="text-[9px] font-black uppercase text-indigo-600">Actual</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="text-[9px] font-black uppercase text-slate-400">Budget</span>
                </div>
              </div>
            </div>
            
            {/* Chart Placeholder - Integrating a visual concept of a Line Chart */}
            <div className="h-64 w-full bg-slate-50 rounded-[2rem] flex items-end justify-around px-8 pb-4 relative overflow-hidden">
               {/* Decorative Grid Lines */}
               <div className="absolute inset-0 flex flex-col justify-between p-6 opacity-40">
                 {[1,2,3,4].map(i => <div key={i} className="border-b border-slate-200 w-full h-px" />)}
               </div>
               {/* Visualizing Bar/Line Trend */}
               {[40, 60, 45, 90, 75, 95].map((h, i) => (
                 <div key={i} className="w-12 bg-indigo-600/10 rounded-t-xl relative group" style={{ height: `${h}%` }}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}k
                    </div>
                 </div>
               ))}
            </div>
          </Card>
        </div>

        {/* Expense Distribution Pie Chart Area */}
        <div className="lg:col-span-4">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white p-8 h-full">
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-6">Expense Allocation</h2>
            
            <div className="relative flex justify-center py-6">
              {/* Simple CSS-based Donut Chart Concept */}
              <div className="w-40 h-40 rounded-full border-[16px] border-slate-100 flex items-center justify-center relative">
                 <div className="absolute inset-0 rounded-full border-[16px] border-indigo-600 border-t-transparent border-l-transparent -rotate-45" />
                 <div className="text-center">
                   <p className="text-[10px] font-black uppercase text-slate-400">Total</p>
                   <p className="text-xl font-black text-slate-800">100%</p>
                 </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {[
                { label: "Academics", val: "45%", color: "bg-indigo-600" },
                { label: "Infrastructure", val: "30%", color: "bg-emerald-500" },
                { label: "Operations", val: "25%", color: "bg-amber-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-xs font-black text-slate-800">{item.val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      {/* 4. Tabular Data Presentation (Audit Ready) */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Termly Revenue Breakdown</h2>
            <p className="text-xs font-medium text-slate-400">Detailed line items for the 2026 academic cycle.</p>
          </div>
          <button className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:text-indigo-600 transition-all">
            <Filter size={20} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Revenue Stream</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Projected</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Collected</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Variance</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { stream: "Tuition Fees", projected: 8500000, actual: 7200000, status: "on-track" },
                { stream: "Transport", projected: 1200000, actual: 1150000, status: "good" },
                { stream: "School Uniforms", projected: 450000, actual: 480000, status: "surplus" },
              ].map((row, i) => {
                const variance = ((row.actual / row.projected) * 100).toFixed(1);
                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-slate-700">{row.stream}</td>
                    <td className="px-6 py-6 font-medium text-slate-500">KES {row.projected.toLocaleString()}</td>
                    <td className="px-6 py-6 font-black text-slate-900">KES {row.actual.toLocaleString()}</td>
                    <td className="px-6 py-6">
                      <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${variance}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 block">{variance}% achieved</span>
                    </td>
                    <td className="px-6 py-6">
                       <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase">
                         {row.status}
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default FinancialReports;