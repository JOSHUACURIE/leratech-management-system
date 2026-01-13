import React from "react";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import { 
  Users, 
  Wallet, 
  FileText, 
  Bell, 
  ArrowUpRight, 
  Calendar, 
  CreditCard,
  ChevronRight,
  TrendingUp,
  Download 
} from "lucide-react";

/* ---------------- TYPES & MOCKS ---------------- */

// Define types for our data structures
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
  type: "result" | "finance" | "academic";
};

type ActivityItem = {
  activity: string;
  date: string;
  status: string;
};

type TableColumn<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: any) => JSX.Element | string;
};

const mockSummary: SummaryItem[] = [
  { title: "Enrolled Children", value: "2", icon: <Users size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Fee Balance", value: "KES 120k", icon: <Wallet size={20} />, color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Active Tasks", value: "5", icon: <FileText size={20} />, color: "text-amber-600", bg: "bg-amber-50" },
  { title: "Unread Alerts", value: "3", icon: <Bell size={20} />, color: "text-rose-600", bg: "bg-rose-50" },
];

const mockNotifications: NotificationItem[] = [
  { message: "Grade 4 Term 1 results uploaded", time: "2h ago", type: "result" },
  { message: "Payment reminder: KES 50,000", time: "5h ago", type: "finance" },
  { message: "New assignment posted by Teacher Jane", time: "1d ago", type: "academic" },
];

const mockRecentActivities: ActivityItem[] = [
  { activity: "Paid KES 30,000 for Term 1", date: "2026-01-10", status: "Completed" },
  { activity: "Viewed Term 1 results for John", date: "2026-01-09", status: "Viewed" },
  { activity: "Acknowledged fee reminder", date: "2026-01-08", status: "Actioned" },
];

const ParentDashboard: React.FC = () => {
  const user = { name: "Jane Parent" };

  // Define columns with proper typing
  const columns: TableColumn<ActivityItem>[] = [
    { 
      header: "Activity Description", 
      accessor: "activity",
      render: (val: string) => <span className="text-sm font-bold text-slate-700">{val}</span>
    },
    { 
      header: "Date", 
      accessor: "date",
      render: (val: string) => <span className="text-xs font-black text-slate-400 font-mono tracking-tighter">{val}</span>
    },
    { 
      header: "Status", 
      accessor: "status",
      render: (val: string) => (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
          {val}
        </span>
      )
    },
  ];

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Welcoming Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            Here is what's happening with your children today.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95">
          <CreditCard size={18} /> Make Payment
        </button>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockSummary.map((item, index) => (
          <Card key={index} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6 hover:-translate-y-1 transition-transform cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className={`${item.bg} ${item.color} p-3 rounded-2xl`}>
                {item.icon}
              </div>
              <ArrowUpRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{item.title}</p>
              <h2 className={`text-2xl font-black mt-1 ${item.color}`}>{item.value}</h2>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 3. Notifications & Feed (Left) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
            
            <div className="flex items-center justify-between mb-8 relative">
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Recent Updates <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              </h2>
              <button className="text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:underline">Clear All</button>
            </div>

            <div className="space-y-4 relative">
              {mockNotifications.map((notif, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-indigo-100">
                    <Bell size={16} className="text-slate-400 group-hover:text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 leading-snug">{notif.message}</p>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar size={10} /> {notif.time}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-slate-200 self-center" />
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              View All Notifications
            </button>
          </Card>
        </div>

      {/* 4. Financial/Activity Table (Right) */}
<div className="lg:col-span-7 space-y-6">
  <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[3rem] p-0 bg-white overflow-hidden group">
    
    {/* Header Section */}
    <div className="p-8 pb-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-b from-slate-50/50 to-white">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Financial Ledger
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
            <TrendingUp size={12} className="text-emerald-500" /> 
            Live Transaction Sync
          </p>
          <span className="text-[10px] text-slate-200">|</span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
            ID: 8829-001
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
          FY 2026
        </div>
        <span className="text-[9px] font-bold text-slate-300 uppercase mr-1">Updated 2m ago</span>
      </div>
    </div>

    {/* Table Section */}
    <div className="overflow-x-auto px-4">
      <Table
        className="w-full border-separate border-spacing-y-3"
        columns={[
          { 
            header: "Activity & Reference", 
            accessor: "activity",
            render: (val: string, item: any) => (
              <div className="flex items-center gap-4 py-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                  <CreditCard size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-800 tracking-tight">{val}</span>
                  <span className="text-[9px] font-black text-indigo-400/70 uppercase tracking-widest leading-none mt-1">
                    Receipt: {item.ref || 'REF-N/A'}
                  </span>
                </div>
              </div>
            )
          },
          { 
            header: "Date", 
            accessor: "date",
            render: (val: string) => (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 font-mono tracking-tighter">{val}</span>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Processed</span>
              </div>
            )
          },
          { 
            header: "Status", 
            accessor: "status",
            render: (val: string) => {
              const isCompleted = val.toLowerCase() === 'completed';
              return (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                  isCompleted 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' 
                  : 'bg-amber-50 text-amber-600 border-amber-100/50'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${isCompleted ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`} />
                  {val}
                </div>
              );
            }
          },
        ]}
        data={mockRecentActivities}
      />
    </div>

    {/* Footer Section */}
    <div className="p-8 bg-gradient-to-t from-slate-50/80 to-white/0 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-50">
       <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black">
                {i}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked to 2 Children</span>
       </div>
       <button className="w-full md:w-auto px-6 py-3.5 bg-white border border-slate-100 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group/btn">
         Download Statement 
         <Download size={14} className="group-hover/btn:translate-y-0.5 transition-transform" />
       </button>
    </div>
  </Card>
</div>
        </div>

      </div>
   
  );
};

export default ParentDashboard;