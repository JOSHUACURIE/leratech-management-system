import React, { useState } from "react";
import { 
  Search, 
  Calendar, 
  Download, 
  Filter, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Receipt,
  ArrowUpRight,
  History
} from "lucide-react";
import Card from "../../components/common/Card";

/* ---------------- TYPES ---------------- */
type PaymentRecord = {
  id: string;
  receiptNo: string;
  studentName: string;
  admissionNo: string;
  amount: number;
  method: "M-Pesa" | "Bank" | "Cash";
  reference: string;
  timestamp: string;
  category: "Tuition" | "Transport" | "Activity";
};

const PaymentHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");

  // Mock Data
  const history: PaymentRecord[] = [
    { 
      id: "pay-1", 
      receiptNo: "RCP-8821", 
      studentName: "Mary Jaoko", 
      admissionNo: "1001", 
      amount: 15000, 
      method: "M-Pesa", 
      reference: "RQL7X9P2J", 
      timestamp: "2026-01-26 09:15 AM",
      category: "Tuition"
    },
    { 
      id: "pay-2", 
      receiptNo: "RCP-8820", 
      studentName: "John Doe", 
      admissionNo: "1024", 
      amount: 45000, 
      method: "Bank", 
      reference: "FT26012001", 
      timestamp: "2026-01-25 02:30 PM",
      category: "Tuition"
    }
  ];

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "M-Pesa": return <Smartphone className="text-emerald-500" size={16} />;
      case "Bank": return <Building2 className="text-blue-500" size={16} />;
      default: return <CreditCard className="text-slate-500" size={16} />;
    }
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Payment Ledger <History className="text-indigo-500" />
          </h1>
          <p className="text-slate-500 font-medium">Historical record of all verified school revenue.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <Download size={16} /> Export Detailed Report
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl w-full lg:w-auto">
          {['all', 'M-Pesa', 'Bank', 'Cash'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by student, receipt, or transaction reference..."
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Receipt</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Details</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Method & Ref</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((record) => (
                <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">{record.receiptNo}</span>
                      <span className="text-[10px] font-medium text-slate-400 mt-1">{record.timestamp}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{record.studentName}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Adm: {record.admissionNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg">{getMethodIcon(record.method)}</div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{record.method}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{record.reference}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      {record.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-slate-900">
                    KES {record.amount.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                      <Receipt size={18} />
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

export default PaymentHistory;