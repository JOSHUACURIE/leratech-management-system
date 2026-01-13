import React from "react";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import { 
  Users, 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  ArrowUpRight, 
  PlusCircle, 
  FileSpreadsheet, 
  Activity,
  ChevronRight
} from "lucide-react";

/* ---------------- TYPES & MOCKS ---------------- */

type SummaryItem = {
  title: string;
  value: string;
  icon: JSX.Element;
  color: string;
  bg: string;
};

type NotificationItem = {
  message: string;
  time: string;
  priority: "high" | "medium" | "low";
};

type ActivityItem = {
  activity: string;
  date: string;
  method: string;
  amount: string;
};

const mockSummary: SummaryItem[] = [
  { title: "Total Students", value: "120", icon: <Users size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Pending Collection", value: "KES 150k", icon: <TrendingDown size={20} />, color: "text-rose-600", bg: "bg-rose-50" },
  { title: "Collected (MTD)", value: "KES 500k", icon: <TrendingUp size={20} />, color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Generated Audits", value: "05", icon: <BarChart3 size={20} />, color: "text-amber-600", bg: "bg-amber-50" },
];

const mockNotifications: NotificationItem[] = [
  { message: "Fee collection for Grade 4 completed", time: "2h ago", priority: "high" },
  { message: "New payment plan submitted by Parent Jane", time: "5h ago", priority: "medium" },
  { message: "Term 1 financial report generated", time: "1d ago", priority: "low" },
];

const mockRecentActivities: ActivityItem[] = [
  { activity: "Recorded payment for Mary Jaoko", date: "2026-01-12", method: "M-Pesa", amount: "KES 15,000" },
  { activity: "Generated fee report for Grade 4", date: "2026-01-10", method: "System", amount: "-" },
  { activity: "Reviewed pending payments", date: "2026-01-09", method: "Manual", amount: "-" },
];

const BursarDashboard: React.FC = () => {
  const user = { name: "Bob Bursar" };

  // Transform data for the Table component if needed
  const formatActivities = mockRecentActivities.map(item => ({
    ...item,
    // You can pre-format the data here if needed
  }));

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Treasury Overview <Activity className="text-emerald-500" size={24} />
          </h1>
          <p className="text-slate-500 font-medium">Monitoring school liquidity and collection cycles.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            <PlusCircle size={16} /> New Receipt
          </button>
        </div>
      </div>

      {/* 2. Fiscal Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockSummary.map((item, index) => (
          <Card key={index} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-7 group hover:bg-slate-900 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className={`${item.bg} ${item.color} p-4 rounded-2xl group-hover:bg-white/10 group-hover:text-white transition-colors`}>
                {item.icon}
              </div>
              <ArrowUpRight size={18} className="text-slate-300 group-hover:text-white" />
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-slate-400">{item.title}</p>
              <h2 className={`text-3xl font-black mt-1 tracking-tight ${item.color} group-hover:text-white`}>{item.value}</h2>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 3. Transaction Log (Left/Center) */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Ledger Entries</h2>
              <div className="text-[10px] font-black uppercase text-slate-400 flex gap-4">
                <button className="text-indigo-600 border-b-2 border-indigo-600 pb-1">All Records</button>
                <button className="pb-1 hover:text-slate-600 transition-colors">Only Receipts</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table
                columns={[
                  { header: "Action / Description", accessor: "activity" },
                  { header: "Method", accessor: "method" },
                  { header: "Timestamp", accessor: "date" },
                  { header: "Amount", accessor: "amount" },
                ]}
                data={formatActivities}
              />
            </div>
            <div className="p-6 bg-slate-50/50 flex justify-center border-t border-slate-50">
               <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-all">
                 View Full Treasury Ledger <ChevronRight size={14} />
               </button>
            </div>
          </Card>
        </div>

        {/* 4. Alerts & Reminders (Right) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white overflow-hidden">
            <h2 className="text-xl font-black text-slate-800 tracking-tight mb-8">System Alerts</h2>
            
            <div className="space-y-6 relative">
              {/* Vertical line connector */}
              <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-100" />

              {mockNotifications.map((notif, index) => (
                <div key={index} className="relative flex gap-5 group">
                  <div className="z-10 w-10 h-10 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-all duration-300">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-700 leading-snug group-hover:text-slate-900">{notif.message}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300 mt-1 block">
                      {notif.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 py-4 border border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
              Manage Reminders
            </button>
          </Card>

          {/* Quick Stats Bonus Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
             <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Collection Rate</p>
             <h3 className="text-4xl font-black mt-1">78.4%</h3>
             <p className="text-[11px] font-medium text-indigo-100 mt-4 leading-relaxed">
               Collection is up 12% compared to last term. Good job, Bob!
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BursarDashboard;