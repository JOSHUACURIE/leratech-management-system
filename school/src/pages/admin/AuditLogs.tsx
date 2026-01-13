import React, { useState } from "react";
import { 
  ShieldCheck, Search, Filter, Download, Calendar, 
  Clock, HardDrive, User, Terminal, AlertCircle 
} from "lucide-react";
import Card from "../../components/common/Card";

// Expanded Mock Data with Security Context
const mockAuditLogs = [
  {
    id: 1,
    user: "Alice Admin",
    role: "ADMIN",
    action: "Created teacher account",
    details: "Teacher account for Tom Teacher (ID: T-902) successfully provisioned.",
    ip: "192.168.1.45",
    type: "SUCCESS",
    date: "2026-01-12 09:45"
  },
  {
    id: 2,
    user: "Bob Bursar",
    role: "BURSAR",
    action: "Recorded fee payment",
    details: "Payment of KES 25,000 for John Doe (Grade 5). Receipt #8829.",
    ip: "192.168.1.12",
    type: "INFO",
    date: "2026-01-12 08:30"
  },
  {
    id: 3,
    user: "Carol Teacher",
    role: "TEACHER",
    action: "Submitted scores",
    details: "Grade 4 Mathematics scores uploaded for 32 students.",
    ip: "41.212.45.10",
    type: "INFO",
    date: "2026-01-11 14:15"
  },
  {
    id: 4,
    user: "System",
    role: "SYSTEM",
    action: "Unauthorized Login Attempt",
    details: "Failed login attempt detected from unknown IP on user 'Alice Admin'.",
    ip: "102.34.12.8",
    type: "CRITICAL",
    date: "2026-01-10 23:12"
  }
];

const AuditLogs: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "CRITICAL": return "bg-rose-50 text-rose-600 border-rose-100";
      case "SUCCESS": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Security Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-200">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Security Audit</h1>
            <p className="text-slate-500 font-medium">Immutable record of all system events and operations.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:shadow-lg transition-all">
                <Download size={18} /> Export Logs
            </button>
        </div>
      </div>

      {/* Quick Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Today's Events", val: "128", icon: <Clock />, color: "text-indigo-600" },
          { label: "Security Alerts", val: "1", icon: <AlertCircle />, color: "text-rose-500" },
          { label: "Storage Used", val: "1.2 GB", icon: <HardDrive />, color: "text-emerald-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl bg-slate-50 ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Log Content */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-center gap-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
            {["All", "Admin", "Bursar", "Teacher", "System"].map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Filter by action, IP or user..." 
                className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Event Source</th>
                <th className="px-10 py-6">Operation</th>
                <th className="px-10 py-6">Metadata (IP/Context)</th>
                <th className="px-10 py-6">Timestamp</th>
                <th className="px-10 py-6 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockAuditLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-slate-50/80 transition-all">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{log.user}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{log.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{log.action}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{log.details}</p>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">
                        <Terminal size={12} /> {log.ip}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium italic">Browser: Chrome/macOS</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} />
                      <span className="text-xs font-bold">{log.date}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <span className={`px-3 py-1 rounded-lg border text-[10px] font-black tracking-widest ${getTypeStyle(log.type)}`}>
                      {log.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-slate-50/30 border-t border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck size={16} />
                <span className="text-xs font-bold italic">Audit logs are cryptographically signed and immutable.</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End of Daily Registry</p>
        </div>
      </Card>
    </div>
  );
};

export default AuditLogs;