import React, { useState } from "react";
import { Save, Building2, BookOpen, GraduationCap, MapPin, Phone, Camera, ShieldCheck } from "lucide-react";
import Card from "../../components/common/Card";

const SchoolSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    name: "Sunrise Academy",
    logo: "https://via.placeholder.com/150",
    address: "123 Main Street, Nairobi",
    contact: "0700 123 456",
    curriculum: "CBC",
    gradingSystem: "A-F",
    defaultTerm: "Term 1",
    classes: ["Grade 4", "Grade 5", "Grade 6"],
    streams: ["A", "B", "C"],
    subjects: ["Math", "English", "Science"]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header with Save Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">School Configuration</h1>
          <p className="text-slate-500 font-medium mt-1">Global system preferences and branding.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 active:scale-95">
          <Save size={20} />
          Deploy Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Branding & Core Info */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <img src={settings.logo} alt="School Logo" className="w-full h-full object-cover rounded-[2rem] border-4 border-slate-50 shadow-inner" />
              <button className="absolute -bottom-2 -right-2 p-3 bg-white shadow-lg rounded-2xl text-indigo-600 border border-slate-100 hover:scale-110 transition-transform">
                <Camera size={18} />
              </button>
            </div>
            <h3 className="text-xl font-black text-slate-800">{settings.name}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institution ID: #SA-2026</p>
          </Card>

          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <Building2 className="text-indigo-500" size={20} />
                <h4 className="font-black text-slate-800">Contact Details</h4>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input name="address" value={settings.address} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10" />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Phone</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input name="contact" value={settings.contact} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10" />
                  </div>
               </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Academic & Lists */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Academic Logic Card */}
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white">
            <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="text-emerald-500" size={24} />
                <h3 className="text-xl font-extrabold text-slate-800">System Logic</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Curriculum", name: "curriculum", icon: <BookOpen />, options: ["CBC", "8-4-4", "IGCSE"] },
                { label: "Grading", name: "gradingSystem", icon: <GraduationCap />, options: ["A-F", "1-12", "Percentage"] },
                { label: "Current Term", name: "defaultTerm", icon: <Building2 />, options: ["Term 1", "Term 2", "Term 3"] }
              ].map((item) => (
                <div key={item.name} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{item.label}</label>
                  <select 
                    name={item.name} 
                    value={(settings as any)[item.name]} 
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    {item.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Card>

          {/* List Management Card */}
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] p-10 bg-white">
            <h3 className="text-xl font-extrabold text-slate-800 mb-8">Organizational Structure</h3>
            <div className="space-y-8">
              {[
                { label: "Classes Available", key: "classes", color: "bg-indigo-50 text-indigo-600" },
                { label: "Streams / Wings", key: "streams", color: "bg-emerald-50 text-emerald-600" },
                { label: "Official Subjects", key: "subjects", color: "bg-amber-50 text-amber-600" }
              ].map((section) => (
                <div key={section.key}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{section.label}</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100">
                    {(settings as any)[section.key].map((item: string, idx: number) => (
                      <span key={idx} className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight shadow-sm border border-white ${section.color}`}>
                        {item}
                      </span>
                    ))}
                    <button className="px-4 py-1.5 rounded-xl text-xs font-black bg-white text-slate-400 border border-slate-200 hover:text-slate-800 transition-all">+ Add</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default SchoolSettings;