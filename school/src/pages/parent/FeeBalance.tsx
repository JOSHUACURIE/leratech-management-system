import React, { useState } from "react";
import Card from "../../components/common/Card";
import { 
  Wallet, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  Download, 
  Receipt, 
  TrendingDown,
  CheckCircle,
  FileText,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

const mockChildren = [
  { id: "1", name: "Mary Jaoko", grade: "Grade 4", avatar: "JD" },
  { id: "2", name: "Jane Jaoko", grade: "Grade 2", avatar: "JA" },
];

const mockFeeData = [
  { term: "Term 1 2026", total: 50000, paid: 50000, balance: 0, status: "Paid", dueDate: "2026-01-15" },
  { term: "Term 2 2026", total: 55000, paid: 30000, balance: 25000, status: "Partial", dueDate: "2026-04-15" },
  { term: "Term 3 2025", total: 48000, paid: 0, balance: 48000, status: "Overdue", dueDate: "2025-11-30" },
];

const FeeBalance: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState(mockChildren[0]);

  const getStatusStyles = (status: string) => {
    switch(status) {
      case "Paid": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Partial": return "bg-amber-50 text-amber-600 border-amber-100";
      case "Overdue": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const totalBalance = mockFeeData.reduce((sum, fee) => sum + fee.balance, 0);
  const totalPaid = mockFeeData.reduce((sum, fee) => sum + fee.paid, 0);
  const totalFees = mockFeeData.reduce((sum, fee) => sum + fee.total, 0);
  const paymentProgress = (totalPaid / totalFees) * 100;

  return (
    <div className="p-6 bg-[#FBFDFF] min-h-screen space-y-10">
      
      {/* 1. Header with Global Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Secure Billing Portal</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial <span className="text-slate-400">Ledger</span></h1>
        </div>
        <div className="flex items-center gap-3">
           <button className="hidden lg:flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-[10px] uppercase tracking-widest px-4">
              View Tax Invoices
           </button>
           <button className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100">
             <CreditCard size={18} /> Instant Pay
           </button>
        </div>
      </div>

      {/* 2. Unified Child Selection */}
      <div className="flex flex-wrap gap-4">
        {mockChildren.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelectedChild(child)}
            className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] transition-all duration-300 border-2 ${
              selectedChild.id === child.id
                ? "bg-white border-indigo-500 shadow-xl shadow-indigo-50"
                : "bg-transparent border-slate-100 text-slate-400 hover:border-slate-200"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${selectedChild.id === child.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
               {child.avatar}
            </div>
            <div className="text-left">
              <p className={`font-black tracking-tight text-sm ${selectedChild.id === child.id ? "text-slate-900" : "text-slate-400"}`}>{child.name}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest">{child.grade}</p>
            </div>
          </button>
        ))}
      </div>

      {/* 3. High-Impact Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle size={80} className="text-rose-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Balance</p>
          <h2 className="text-3xl font-black text-rose-600 mt-2 tracking-tighter">KES {totalBalance.toLocaleString()}</h2>
          <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 w-fit px-3 py-1 rounded-full">
            <Clock size={12} /> Immediate Action Required
          </div>
        </Card>

        <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Fees Paid</p>
          <h2 className="text-3xl font-black text-emerald-600 mt-2 tracking-tighter">KES {totalPaid.toLocaleString()}</h2>
          <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 w-fit px-3 py-1 rounded-full">
            <CheckCircle size={12} /> Verified Payments
          </div>
        </Card>

        <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-900 text-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquidity Progress</p>
          <div className="mt-4 space-y-3">
             <div className="flex justify-between items-end">
                <h2 className="text-4xl font-black">{paymentProgress.toFixed(0)}%</h2>
                <TrendingDown className="text-indigo-400 mb-1" size={24} />
             </div>
             <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all duration-1000" 
                  style={{ width: `${paymentProgress}%` }} 
                />
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1">Target: 100% Clearance</p>
          </div>
        </Card>
      </div>

      {/* 4. Refined Fee Table */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] p-0 bg-white overflow-hidden">
        <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Fee Breakdown</h2>
          <span className="px-4 py-1.5 bg-white rounded-full border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Cycle 2025/26</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-white">
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Term Period</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Base Fee</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Amount Settled</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Current Debt</th>
                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Status</th>
                <th className="text-right p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockFeeData.map((fee, index) => (
                <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-slate-800 tracking-tight">{fee.term}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                       <Clock size={10} className="text-slate-300" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Due {fee.dueDate}</span>
                    </div>
                  </td>
                  <td className="p-6 font-mono text-sm text-slate-600">KES {fee.total.toLocaleString()}</td>
                  <td className="p-6 font-mono text-sm font-bold text-emerald-600">KES {fee.paid.toLocaleString()}</td>
                  <td className="p-6">
                    <p className={`font-mono text-sm font-bold ${fee.balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      KES {fee.balance.toLocaleString()}
                    </p>
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(fee.status)}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    {fee.balance > 0 ? (
                      <button className="px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100">
                        Pay Now
                      </button>
                    ) : (
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                        <Receipt size={20} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Footer Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm group">
          <Download size={18} className="text-slate-300 group-hover:text-indigo-500" /> Download Full Statement
        </button>
        <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm group">
          <FileText size={18} className="text-slate-300 group-hover:text-indigo-500" /> Audit History
        </button>
      </div>
    </div>
  );
};

export default FeeBalance;