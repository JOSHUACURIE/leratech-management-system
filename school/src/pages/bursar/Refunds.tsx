import React, { useState } from "react";
import { 
  Undo2, 
  Search, 
  AlertCircle, 
  Wallet, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock,
  Banknote,
  FileText,
  User
} from "lucide-react";
import Card from "../../components/common/Card";

/* ---------------- TYPES ---------------- */
type RefundRequest = {
  id: string;
  studentName: string;
  admissionNo: string;
  amount: number;
  reason: string;
  requestDate: string;
  status: "pending" | "approved" | "completed" | "rejected";
  method: "M-Pesa" | "Bank Transfer" | "Credit Note";
};

const Refunds: React.FC = () => {
  const [filter, setFilter] = useState("all");

  // Mock Data
  const refundRequests: RefundRequest[] = [
    { 
      id: "ref-1", 
      studentName: "Kevin Omondi", 
      admissionNo: "1056", 
      amount: 5500, 
      reason: "Overpayment on Transport", 
      requestDate: "2026-01-24", 
      status: "pending",
      method: "M-Pesa"
    },
    { 
      id: "ref-2", 
      studentName: "Alice Wamae", 
      admissionNo: "1105", 
      amount: 12000, 
      reason: "Withdrawal from School", 
      requestDate: "2026-01-20", 
      status: "completed",
      method: "Bank Transfer"
    }
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
      case "rejected": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Refund Management <Undo2 className="text-rose-500" size={28} />
          </h1>
          <p className="text-slate-500 font-medium">Process overpayments and credit adjustments.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <FileText size={16} /> Refund Policy
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-slate-200">
            <Banknote size={16} /> Create Refund
          </button>
        </div>
      </div>

      {/* 2. Visual Workflow Info */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-xl font-black mb-2">Refund Processing Workflow</h2>
          <p className="text-indigo-100 text-sm max-w-md">
            All refunds require Bursar approval and must be reconciled with the bank statement before being marked as completed.
          </p>
        </div>
        <div className="flex items-center gap-4 z-10">
          <div className="flex flex-col items-center">
             <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black">1</div>
             <span className="text-[10px] uppercase font-bold mt-2">Request</span>
          </div>
          <div className="h-px w-8 bg-white/20" />
          <div className="flex flex-col items-center">
             <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black">2</div>
             <span className="text-[10px] uppercase font-bold mt-2">Approve</span>
          </div>
          <div className="h-px w-8 bg-white/20" />
          <div className="flex flex-col items-center">
             <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center font-black">3</div>
             <span className="text-[10px] uppercase font-bold mt-2 text-emerald-300">Payout</span>
          </div>
        </div>
        <ArrowRightLeft className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12" />
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active Requests */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Requests</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Pending</button>
                <button className="px-4 py-2 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">History</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Recipient</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Method</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {refundRequests.map((req) => (
                    <tr key={req.id} className="group hover:bg-slate-50/30">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{req.studentName}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID: {req.admissionNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-900">KES {req.amount.toLocaleString()}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <Wallet size={14} className="text-slate-400" /> {req.method}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusStyle(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 4. Quick Actions / Warning */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white border-l-4 border-amber-400">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="font-black uppercase text-sm tracking-widest">Notice</h3>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Refunds to **Credit Note** will automatically reduce the student's balance for the next billing cycle. No actual cash will leave the school accounts.
            </p>
          </Card>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pending Refunds</p>
             <h3 className="text-4xl font-black mt-1 text-slate-800">KES 18,400</h3>
             <div className="mt-6 space-y-3">
               <div className="flex justify-between text-xs font-bold">
                 <span className="text-slate-400">Cash/Bank</span>
                 <span className="text-slate-700 font-black">KES 12,900</span>
               </div>
               <div className="flex justify-between text-xs font-bold">
                 <span className="text-slate-400">Credit Notes</span>
                 <span className="text-slate-700 font-black">KES 5,500</span>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Refunds;