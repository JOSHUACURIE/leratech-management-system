import React, { useState } from "react";
import { 
  Award, 
  Percent, 
  Plus, 
  Search, 
  UserCheck, 
  Trash2, 
  ShieldCheck,
  Zap,
  Tag
} from "lucide-react";
import Card from "../../components/common/Card";

/* ---------------- TYPES ---------------- */
type DiscountType = {
  id: string;
  name: string;
  value: string; // e.g., "50%" or "KES 5,000"
  category: "Academic" | "Sports" | "Staff Child" | "Need-Based";
};

type Beneficiary = {
  id: string;
  studentName: string;
  admissionNo: string;
  scholarshipName: string;
  amountSaved: string;
  expiry: string;
};

const ScholarshipsAndDiscounts: React.FC = () => {
  // Mock Data
  const discountCatalog: DiscountType[] = [
    { id: "d1", name: "Top Performer", value: "100%", category: "Academic" },
    { id: "d2", name: "Sibling Discount", value: "10%", category: "Need-Based" },
    { id: "d3", name: "Staff Benefit", value: "KES 15,000", category: "Staff Child" },
  ];

  const beneficiaries: Beneficiary[] = [
    { id: "b1", studentName: "Mary Jaoko", admissionNo: "1001", scholarshipName: "Top Performer", amountSaved: "KES 45,000", expiry: "Dec 2026" },
  ];

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Grants & Waivers <Award className="text-amber-500" />
          </h1>
          <p className="text-slate-500 font-medium">Manage tuition discounts and scholarship allocations.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
          <Plus size={16} /> New Discount Type
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. Catalog (Left Sidebar style) */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Available Programs</h2>
          {discountCatalog.map((item) => (
            <Card key={item.id} className="border-none shadow-sm p-5 rounded-[2rem] bg-white group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    {item.value.includes("%") ? <Percent size={18} /> : <Tag size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-indigo-600">{item.value}</span>
                </div>
              </div>
            </Card>
          ))}
          <button className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 rounded-[2rem] font-bold text-xs hover:bg-slate-50 transition-all">
            + Define New Program
          </button>
        </div>

        {/* 3. Beneficiaries List (Main View) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Beneficiaries</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter by student..."
                  className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Scholarship</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Current Value</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Expiry</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {beneficiaries.map((b) => (
                    <tr key={b.id} className="group hover:bg-slate-50/30">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{b.studentName}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{b.admissionNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <ShieldCheck size={14} className="text-indigo-500" /> {b.scholarshipName}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-black text-emerald-600 text-sm">
                        -{b.amountSaved}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">
                          {b.expiry}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-slate-50/50 flex justify-center">
               <button className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all">
                 <UserCheck size={16} /> Assign Student to Scholarship
               </button>
            </div>
          </Card>

          {/* Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[2.5rem] text-white shadow-lg shadow-amber-100 relative overflow-hidden">
               <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
               <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">Revenue Foregone</p>
               <h3 className="text-4xl font-black mt-1">KES 320k</h3>
               <p className="text-[11px] font-medium text-amber-50 mt-4 leading-relaxed">
                 Total waivers applied this term across all programs.
               </p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Beneficiaries</p>
               <h3 className="text-4xl font-black mt-1 text-slate-800">42 Students</h3>
               <div className="mt-4 flex -space-x-2">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                 ))}
                 <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">+38</div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ScholarshipsAndDiscounts;