import React, { useState } from "react";
import { 
  FileText, 
  Send, 
  Printer, 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Zap
} from "lucide-react";
import Card from "../../components/common/Card";

/* ---------------- TYPES ---------------- */
type Invoice = {
  id: string;
  invoiceNo: string;
  studentName: string;
  class: string;
  amount: number;
  date: string;
  status: "paid" | "partial" | "unpaid";
};

const Invoices: React.FC = () => {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  // Mock Data
  const invoices: Invoice[] = [
    { id: "inv-1", invoiceNo: "INV-2026-001", studentName: "Mary Jaoko", class: "G4 East", amount: 45000, date: "2026-01-15", status: "partial" },
    { id: "inv-2", invoiceNo: "INV-2026-002", studentName: "John Doe", class: "G5 West", amount: 45000, date: "2026-01-15", status: "paid" },
    { id: "inv-3", invoiceNo: "INV-2026-003", studentName: "Alice Wamae", class: "G4 East", amount: 45000, date: "2026-01-16", status: "unpaid" },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: "bg-emerald-50 text-emerald-600 border-emerald-100",
      partial: "bg-amber-50 text-amber-600 border-amber-100",
      unpaid: "bg-rose-50 text-rose-600 border-rose-100",
    };
    return styles[status as keyof typeof styles];
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Top Navigation & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Invoicing Engine</h1>
          <p className="text-slate-500 font-medium">Generate and manage student fee statements.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">
            <Zap size={16} /> Bulk Generate
          </button>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            <FileText size={16} /> Individual Invoice
          </button>
        </div>
      </div>

      {/* 2. Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Invoiced</p>
            <h3 className="text-2xl font-black text-slate-800">KES 5.4M</h3>
          </div>
        </Card>
        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Payment</p>
            <h3 className="text-2xl font-black text-slate-800">KES 1.8M</h3>
          </div>
        </Card>
        <Card className="bg-white border-none shadow-sm p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid In Full</p>
            <h3 className="text-2xl font-black text-slate-800">84 Students</h3>
          </div>
        </Card>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search invoice # or student name..."
            className="w-full bg-white border-none shadow-sm rounded-2xl p-4 pl-12 font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">
          <Filter size={18} /> Filter by Class
        </button>
      </div>

      {/* 4. Invoices Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 bg-white overflow-hidden">
        {selectedInvoices.length > 0 && (
          <div className="bg-indigo-600 p-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <p className="text-white text-xs font-bold">{selectedInvoices.length} Invoices selected</p>
            <div className="flex gap-2">
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Print All</button>
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Email All</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map((inv) => (
                <tr key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600" />
                  </td>
                  <td className="px-6 py-5 font-black text-xs text-slate-800 uppercase tracking-tighter">{inv.invoiceNo}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700">{inv.studentName}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{inv.class}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-slate-900">KES {inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-5 font-medium text-slate-500">{inv.date}</td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusBadge(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Print" className="p-2 text-slate-400 hover:text-indigo-600"><Printer size={16} /></button>
                      <button title="Email" className="p-2 text-slate-400 hover:text-indigo-600"><Send size={16} /></button>
                      <button title="More" className="p-2 text-slate-400 hover:text-slate-600"><MoreHorizontal size={16} /></button>
                    </div>
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

export default Invoices;