import React, { useState } from "react";
import { 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Download, 
  Search, 
  Calendar,
  MoreHorizontal,
  FileText,
  Calculator
} from "lucide-react";
import Card from "../../components/common/Card";

/* ---------------- TYPES ---------------- */
type LedgerEntry = {
  id: string;
  date: string;
  description: string;
  reference: string;
  type: "debit" | "credit"; // Debit = Invoice/Charge, Credit = Payment/Refund
  amount: number;
  runningBalance: number;
  category: "Tuition" | "Transport" | "Uniform" | "Extracurricular";
};

const TreasuryLedger: React.FC = () => {
  // Mock Data: Following the General Ledger principle
  const ledgerEntries: LedgerEntry[] = [
    { id: "1", date: "2026-01-26", description: "Term 1 Tuition Invoice - Grade 4", reference: "INV-2026-001", type: "debit", amount: 45000, runningBalance: -45000, category: "Tuition" },
    { id: "2", date: "2026-01-26", description: "M-Pesa Payment: Mary Jaoko", reference: "RQL7X9P2J", type: "credit", amount: 15000, runningBalance: -30000, category: "Tuition" },
    { id: "3", date: "2026-01-25", description: "Bus Fee Allocation - Q1", reference: "INV-2026-088", type: "debit", amount: 5000, runningBalance: -35000, category: "Transport" },
    { id: "4", date: "2026-01-25", description: "Bank Transfer: John Doe", reference: "KCB-99021", type: "credit", amount: 45000, runningBalance: 10000, category: "Tuition" },
  ];

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Treasury Ledger <BookOpen className="text-indigo-600" size={28} />
          </h1>
          <p className="text-slate-500 font-medium">Master record of all financial movements and running balances.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Calculator size={16} /> Reconcile Balances
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            <Download size={16} /> Export Ledger
          </button>
        </div>
      </div>

      {/* 2. Ledger Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search descriptions or references..."
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-bold text-slate-700 appearance-none">
            <option>Current Term</option>
            <option>Last 30 Days</option>
            <option>Full Academic Year</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-bold text-slate-700 appearance-none">
            <option>All Categories</option>
            <option>Tuition Only</option>
            <option>Transport</option>
          </select>
        </div>
      </div>

      {/* 3. The Ledger Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Description / Reference</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Debit (+)</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Credit (-)</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Running Balance</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ledgerEntries.map((entry) => (
                <tr key={entry.id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-600">{entry.date}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 leading-tight">{entry.description}</span>
                      <span className="text-[10px] font-mono font-black text-indigo-500 uppercase mt-1">{entry.reference}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    {entry.type === "debit" ? (
                      <span className="text-sm font-black text-rose-600 flex items-center justify-end gap-1">
                        <ArrowUpRight size={14} /> {entry.amount.toLocaleString()}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-6 text-right">
                    {entry.type === "credit" ? (
                      <span className="text-sm font-black text-emerald-600 flex items-center justify-end gap-1">
                        <ArrowDownLeft size={14} /> {entry.amount.toLocaleString()}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <span className={`font-black text-sm ${entry.runningBalance >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                      KES {entry.runningBalance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Ledger Summary Bottom Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Billed (Debits)</p>
           <h3 className="text-2xl font-black text-slate-800 mt-1">KES 14,250,000</h3>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Collected (Credits)</p>
           <h3 className="text-2xl font-black text-emerald-600 mt-1">KES 12,450,000</h3>
        </div>
        <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Current Portfolio Balance</p>
           <h3 className="text-2xl font-black mt-1">KES -1,800,000</h3>
        </div>
      </div>
    </div>
  );
};

export default TreasuryLedger;