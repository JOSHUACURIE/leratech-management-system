import React, { useState } from "react";
import { 
  AlertCircle, 
  MessageSquare, 
  Phone, 
  ChevronRight, 
  Search, 
  Filter,
  TrendingDown,
  UserX,
  FileWarning
} from "lucide-react";
import Card from "../../components/common/Card";

/* ---------------- TYPES ---------------- */
type ArrearRecord = {
  id: string;
  studentName: string;
  admissionNo: string;
  parentContact: string;
  amountDue: number;
  daysOverdue: number;
  lastReminder: string;
  riskLevel: "critical" | "high" | "moderate";
};

const FeeArrears: React.FC = () => {
  // Mock Data
  const arrears: ArrearRecord[] = [
    { 
      id: "arr-1", 
      studentName: "Alice Wamae", 
      admissionNo: "1105", 
      parentContact: "+254 712 345 678", 
      amountDue: 40000, 
      daysOverdue: 45, 
      lastReminder: "2026-01-10",
      riskLevel: "critical"
    },
    { 
      id: "arr-2", 
      studentName: "Kevin Omondi", 
      admissionNo: "1056", 
      parentContact: "+254 722 000 111", 
      amountDue: 12500, 
      daysOverdue: 12, 
      lastReminder: "2026-01-20",
      riskLevel: "moderate"
    }
  ];

  const getRiskStyles = (level: string) => {
    switch (level) {
      case "critical": return "text-rose-600 bg-rose-50 border-rose-100";
      case "high": return "text-amber-600 bg-amber-50 border-amber-100";
      default: return "text-blue-600 bg-blue-50 border-blue-100";
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Recovery Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Debt Recovery <FileWarning className="text-rose-500" />
          </h1>
          <p className="text-slate-500 font-medium">Tracking aged balances and collection risks.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-rose-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-100">
            <MessageSquare size={16} /> SMS Bulk Reminder
          </button>
        </div>
      </div>

      {/* 2. Debt Aging Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Arrears", value: "KES 1.8M", icon: <TrendingDown />, color: "text-rose-600" },
          { label: "Critical (>30 Days)", value: "KES 450k", icon: <AlertCircle />, color: "text-rose-500" },
          { label: "Defaulting Students", value: "24", icon: <UserX />, color: "text-slate-700" },
          { label: "Collection Rate", value: "78%", icon: <ChevronRight />, color: "text-emerald-600" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm p-6 rounded-[2rem] bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <h3 className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</h3>
          </Card>
        ))}
      </div>

      {/* 3. Search & Risk Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search student or admission number..."
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select className="bg-white border-none shadow-sm rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500">
          <option>All Risk Levels</option>
          <option>Critical Only</option>
          <option>High Risk</option>
        </select>
      </div>

      {/* 4. Arrears Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student & Contact</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Due</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Aging</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Action</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {arrears.map((record) => (
                <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{record.studentName}</span>
                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                        <Phone size={10} /> {record.parentContact}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-rose-600">KES {record.amountDue.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{record.daysOverdue} Days</span>
                      <span className="text-[9px] font-black uppercase text-slate-300">Overdue</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getRiskStyles(record.riskLevel)}`}>
                      {record.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-medium text-slate-500">
                    Reminder: {record.lastReminder}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <ChevronRight size={18} />
                    </button>
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

export default FeeArrears;