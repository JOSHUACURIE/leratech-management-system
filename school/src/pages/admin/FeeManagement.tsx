import React from "react";
import { Wallet, Users, CheckCircle, AlertCircle, Receipt, Send } from "lucide-react";
import Card from "../../components/common/Card";

const mockFeeBalances = [
  { id: 1, student: "Jane Smith", class: "Grade 4", stream: "A", balance: 5000, lastPayment: "2026-01-05" },
  { id: 2, student: "John Doe", class: "Grade 5", stream: "B", balance: 0, lastPayment: "2025-12-20" },
  { id: 3, student: "Mary Johnson", class: "Grade 6", stream: "C", balance: 1200, lastPayment: "2026-01-10" },
  { id: 4, student: "Peter Okoth", class: "Grade 4", stream: "A", balance: 3000, lastPayment: "2025-11-28" },
  { id: 5, student: "Lucy Wambui", class: "Grade 5", stream: "B", balance: 0, lastPayment: "2026-01-02" },
];

const FeeManagement: React.FC = () => {
  const totalBalance = mockFeeBalances.reduce((acc, b) => acc + b.balance, 0);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Fee Management</h1>
          <p className="text-slate-500 font-medium">Monitor revenue and manage student accounts.</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                <Receipt size={18} />
                Bulk Receipt
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                <Send size={18} />
                Send Reminders
            </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Balance", val: `KES ${totalBalance.toLocaleString()}`, icon: <Wallet />, color: "from-rose-500 to-orange-500" },
          { label: "Total Students", val: mockFeeBalances.length, icon: <Users />, color: "from-blue-500 to-indigo-600" },
          { label: "Pending", val: mockFeeBalances.filter(b => b.balance > 0).length, icon: <AlertCircle />, color: "from-amber-400 to-orange-500" },
          { label: "Cleared", val: mockFeeBalances.filter(b => b.balance === 0).length, icon: <CheckCircle />, color: "from-emerald-400 to-teal-500" },
        ].map((stat, i) => (
          <div key={i} className={`relative overflow-hidden p-6 rounded-[2rem] bg-gradient-to-br ${stat.color} text-white shadow-xl`}>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/30">
                {stat.icon}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">{stat.label}</p>
              <p className="text-2xl font-black mt-1">{stat.val}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
          </div>
        ))}
      </div>

      {/* Detailed Table Section */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50">
           <h3 className="text-xl font-extrabold text-slate-800">Student Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-black uppercase tracking-[0.15em]">
                <th className="px-8 py-5">Student Details</th>
                <th className="px-8 py-5">Class/Stream</th>
                <th className="px-8 py-5">Last Payment</th>
                <th className="px-8 py-5">Balance Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockFeeBalances.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5 font-bold text-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-400 transition-colors"></div>
                        {item.student}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-semibold text-slate-500">{item.class}</span>
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-400">{item.stream}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                    {item.lastPayment}
                  </td>
                  <td className="px-8 py-5">
                    {item.balance > 0 ? (
                      <div className="inline-flex flex-col">
                        <span className="text-rose-600 font-black text-lg">KES {item.balance.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-rose-300 uppercase italic">Arrears</span>
                      </div>
                    ) : (
                      <span className="px-4 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-tighter border border-emerald-100">
                        Fully Paid
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="px-4 py-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold text-xs">
                      View Statement
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

export default FeeManagement;