import React, { useState } from "react";
import Card from "../../components/common/Card";
import { 
  Receipt, 
  Download, 
  Filter, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  CreditCard,
  Smartphone,
  Banknote,
  History,
  ChevronRight,
  ArrowDownLeft
} from "lucide-react";


const mockChildren = [

  { id: "1", name: "Mary Jaoko", grade: "Grade 4" },

  { id: "2", name: "Jane Juma", grade: "Grade 2" },

];



const mockPayments = [

  { id: "PAY001", date: "2026-01-10", amount: 15000, term: "Term 1 2026", method: "M-Pesa", status: "Completed", ref: "RXB456" },

  { id: "PAY002", date: "2026-01-05", amount: 10000, term: "Term 1 2026", method: "M-Pesa", status: "Completed", ref: "MPSA789" },

  { id: "PAY003", date: "2025-12-15", amount: 25000, term: "Term 3 2025", method: "Bank Transfer", status: "Completed", ref: "BT12345" },

  { id: "PAY004", date: "2025-11-20", amount: 20000, term: "Term 2 2025", method: "Cash", status: "Completed", ref: "CASH001" },

  { id: "PAY005", date: "2025-10-10", amount: 5000, term: "Term 2 2025", method: "M-Pesa", status: "Failed", ref: "FAIL123" },

];


const PaymentsHistory: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState(mockChildren[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = payment.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.term.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const completedPayments = filteredPayments.filter(p => p.status === "Completed").length;

  const getMethodStyles = (method: string) => {
    switch(method) {
      case "M-Pesa": return { icon: <Smartphone size={14} />, color: "text-emerald-600", bg: "bg-emerald-50" };
      case "Bank Transfer": return { icon: <Banknote size={14} />, color: "text-blue-600", bg: "bg-blue-50" };
      case "Cash": return { icon: <CreditCard size={14} />, color: "text-purple-600", bg: "bg-purple-50" };
      default: return { icon: <CreditCard size={14} />, color: "text-slate-600", bg: "bg-slate-50" };
    }
  };

  return (
    <div className="p-6 bg-[#FBFDFF] min-h-screen space-y-10">
      
      {/* 1. Audit Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              Financial Audit Log
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Transaction <span className="text-slate-400">Vault</span>
          </h1>
        </div>
        <button className="flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <Download size={16} className="text-indigo-500" /> Generate Statement
        </button>
      </header>

      {/* 2. Selection & Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Child Selectors */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Account Holder</h3>
          {mockChildren.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child)}
              className={`flex items-center justify-between p-5 rounded-[1.5rem] transition-all duration-300 ${
                selectedChild.id === child.id
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                  : "bg-white text-slate-500 border border-slate-100 hover:border-indigo-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedChild.id === child.id ? 'bg-indigo-500' : 'bg-slate-100'}`}>
                  {child.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-black text-sm tracking-tight">{child.name}</p>
                  <p className="text-[10px] font-bold opacity-60 uppercase">{child.grade}</p>
                </div>
              </div>
              {selectedChild.id === child.id && <ChevronRight size={18} className="text-indigo-400" />}
            </button>
          ))}
        </div>

        {/* Dynamic Stats */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <ArrowDownLeft className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Lifecycle Value</p>
            <h2 className="text-4xl font-black mt-2 tracking-tighter">KES {totalAmount.toLocaleString()}</h2>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-3 py-1 rounded-lg">
              <History size={12} /> {filteredPayments.length} records in this view
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle size={24} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settled Status</span>
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{completedPayments}</h2>
              <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mt-1">Successful Inflow</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Transaction Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 relative w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search Reference, Term, or Amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all text-sm font-medium"
          />
        </div>
        <div className="flex p-1.5 bg-slate-100 rounded-[2rem] w-full lg:w-auto">
          {["All", "Completed", "Failed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 lg:flex-none px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                filterStatus === status ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* 4. The Ledger Table */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] p-0 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Trace ID</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Context</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Inflow Amount</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Channel</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Status</th>
                <th className="text-right p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.map((payment) => {
                const methodStyles = getMethodStyles(payment.method);
                return (
                  <tr key={payment.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <span className="text-xs font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-lg">
                        {payment.id}
                      </span>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-slate-800 tracking-tight">{payment.term}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{payment.date}</p>
                    </td>
                    <td className="p-6">
                      <p className="font-mono text-sm font-black text-slate-800">KES {payment.amount.toLocaleString()}</p>
                    </td>
                    <td className="p-6">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit border ${methodStyles.bg} ${methodStyles.color}`}>
                        {methodStyles.icon}
                        <span className="text-[10px] font-black uppercase tracking-widest">{payment.method}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        {payment.status === "Completed" ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${payment.status === "Completed" ? "text-emerald-600" : "text-rose-600"}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <p className="font-mono text-xs font-bold text-slate-400 tracking-wider group-hover:text-indigo-600 transition-colors cursor-pointer">
                        {payment.ref}
                      </p>
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

export default PaymentsHistory;