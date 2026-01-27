import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  MoreVertical,
  Mail
} from "lucide-react";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";

/* ---------------- TYPES ---------------- */
type StudentBalance = {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  totalBilled: string;
  paid: string;
  balance: string;
  status: "cleared" | "pending" | "overdue";
};

const StudentBalances: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock Data - In a real app, fetch this from api.ts
  const balances: StudentBalance[] = [
    { id: "1", name: "Mary Jaoko", admissionNo: "1001", class: "G4 East", totalBilled: "KES 45,000", paid: "KES 30,000", balance: "KES 15,000", status: "pending" },
    { id: "2", name: "John Doe", admissionNo: "1024", class: "G5 West", totalBilled: "KES 45,000", paid: "KES 45,000", balance: "KES 0", status: "cleared" },
    { id: "3", name: "Alice Wamae", admissionNo: "1105", class: "G4 East", totalBilled: "KES 45,000", paid: "KES 5,000", balance: "KES 40,000", status: "overdue" },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "cleared": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "overdue": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student Ledgers</h1>
          <p className="text-slate-500 font-medium">Detailed breakdown of fee balances per student.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Mail size={16} /> Send Reminders
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            <Download size={16} /> Export Statement
          </button>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or admission number..."
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="cleared">Cleared</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-2 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase text-indigo-400">Total Outstanding</span>
          <span className="text-xl font-black text-indigo-700 font-mono">KES 1.2M</span>
        </div>
      </div>

      {/* 3. Balances Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Class</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Billed</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Paid</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Balance</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {balances.map((student) => (
                <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{student.name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{student.admissionNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-medium text-slate-600">{student.class}</td>
                  <td className="px-6 py-5 font-medium text-slate-600">{student.totalBilled}</td>
                  <td className="px-6 py-5 font-bold text-emerald-600">{student.paid}</td>
                  <td className="px-6 py-5 font-black text-slate-900">{student.balance}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(student.status)}`}>
                        {student.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 hover:bg-white rounded-xl transition-all text-slate-300 hover:text-indigo-600 shadow-sm border border-transparent hover:border-slate-100">
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex justify-between items-center">
          <p className="text-[10px] font-black uppercase text-slate-400">Showing 1-10 of 120 students</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black disabled:opacity-50">Prev</button>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StudentBalances;