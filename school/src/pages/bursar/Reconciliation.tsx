import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  Smartphone, 
  Building2, 
  Search, 
  ArrowRightLeft,
  Link,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import Card from "../../components/common/Card";

/* ---------------- TYPES ---------------- */
type Transaction = {
  id: string;
  ref: string;
  amount: number;
  date: string;
  sender: string;
  status: "unmatched" | "matched";
};

const Reconciliation: React.FC = () => {
  const [source, setSource] = useState<"M-Pesa" | "Bank">("M-Pesa");

  // Mock External Statement (e.g., direct from Safaricom G2 API)
  const statementData: Transaction[] = [
    { id: "e1", ref: "RQL7X9P2J", amount: 15000, date: "2026-01-26", sender: "MARY JAOKO", status: "unmatched" },
    { id: "e2", ref: "RQY2M4N9K", amount: 5000, date: "2026-01-26", sender: "JOHN DOE", status: "matched" },
  ];

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Header & Source Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Statement Reconciliation <ArrowRightLeft className="text-indigo-600" />
          </h1>
          <p className="text-slate-500 font-medium">Matching external statements with internal student ledgers.</p>
        </div>
        
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          <button 
            onClick={() => setSource("M-Pesa")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${source === "M-Pesa" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400"}`}
          >
            <Smartphone size={16} /> M-Pesa
          </button>
          <button 
            onClick={() => setSource("Bank")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${source === "Bank" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400"}`}
          >
            <Building2 size={16} /> Bank (KCB)
          </button>
        </div>
      </div>

      {/* 2. Sync Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connection Status</p>
              <h2 className="text-2xl font-black mt-1 flex items-center gap-3">
                Live {source} Feed <ShieldCheck className="text-emerald-400" />
              </h2>
              <p className="text-slate-400 text-xs mt-4 max-w-sm">
                Your {source} business account is synced. Showing transactions from the last 24 hours.
              </p>
            </div>
            <button className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all">
              <RefreshCcw size={24} className="text-white" />
            </button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            {source === "M-Pesa" ? <Smartphone size={200} /> : <Building2 size={200} />}
          </div>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unreconciled</p>
          <h3 className="text-4xl font-black text-rose-500 mt-1">12</h3>
          <p className="text-xs font-medium text-slate-400 mt-2">Transactions need your attention.</p>
        </Card>
      </div>

      {/* 3. Reconciliation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: External Statement */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Smartphone size={14} /> {source} Statement
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Source: API-LIVE</span>
          </div>
          
          <div className="space-y-4">
            {statementData.map((item) => (
              <Card key={item.id} className={`border-none shadow-sm rounded-3xl p-6 transition-all ${item.status === "unmatched" ? "bg-white border-l-4 border-rose-500" : "bg-slate-50 opacity-60"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{item.ref}</span>
                    <h4 className="font-black text-slate-800 mt-3">{item.sender}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">KES {item.amount.toLocaleString()}</p>
                    {item.status === "unmatched" ? (
                      <button className="mt-3 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                        <Link size={12} /> Match Now
                      </button>
                    ) : (
                      <span className="mt-3 flex items-center justify-end gap-1 text-emerald-500 font-black text-[10px] uppercase">
                        <CheckCircle2 size={12} /> Reconciled
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Manual Entry / Matching Tool */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">System Ledger Search</h3>
          </div>
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white p-8 sticky top-6">
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-xs font-bold text-slate-400">Select a transaction on the left to find its match in the system.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search student or receipt number..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 font-bold text-slate-700"
                />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 ml-1">Suggested Matches</p>
                {/* Mock Search Result */}
                <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-indigo-500 cursor-pointer transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">MJ</div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Mary Jaoko (1001)</p>
                      <p className="text-[10px] font-bold text-slate-400">Ref: UNREC-992</p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-slate-900">KES 15,000</p>
                </div>
              </div>

              <button className="w-full bg-slate-100 text-slate-400 p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all cursor-not-allowed">
                Confirm Reconciliation
              </button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Reconciliation;