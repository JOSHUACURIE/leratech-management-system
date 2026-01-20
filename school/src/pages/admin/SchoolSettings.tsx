import React, { useState, useEffect } from "react";
import { Save, Building2, MapPin, Phone, Camera, ShieldCheck, Loader2, Globe } from "lucide-react";
import Card from "../../components/common/Card";
import axios from "axios";

// Interface for API responses to ensure type safety
interface AcademicItem {
  id: string;
  class_name?: string;
  name?: string;
}

const SchoolSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Main School Settings State
  const [settings, setSettings] = useState({
    id: "", // To store school ID for updates
    name: "",
    logo: "",
    address: "",
    contact: "",
    curriculum: "CBC",
    gradingSystemId: "",
    activeTermId: "",
  });

  // Structural Data State
  const [academicData, setAcademicData] = useState({
    classes: [] as AcademicItem[],
    subjects: [] as AcademicItem[],
    gradingSystems: [] as any[],
    terms: [] as any[]
  });

  // 1. Fetch all required data on component mount
  useEffect(() => {
    const fetchConfigurationData = async () => {
      try {
        setLoading(true);
        // Parallel requests for better performance
        const [schoolRes, classRes, subjectRes, termRes] = await Promise.all([
          axios.get("/api/v1/school/profile"),
          axios.get("/api/v1/classes"),
          axios.get("/api/v1/subjects"),
          axios.get("/api/v1/academic/current/terms") // Update this to your terms endpoint
        ]);

        const school = schoolRes.data.data;

        setSettings({
          id: school.id,
          name: school.name || "",
          logo: school.logo || "https://via.placeholder.com/150",
          address: school.address || "",
          contact: school.phone || "",
          curriculum: school.curriculum || "CBC",
          gradingSystemId: school.defaultGradingSystemId || "",
          activeTermId: school.activeTermId || ""
        });

        setAcademicData((prev) => ({
          ...prev,
          classes: classRes.data.data || [],
          subjects: subjectRes.data.data || [],
          terms: termRes.data.data || []
        }));

      } catch (err) {
        console.error("Critical error loading system configuration:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigurationData();
  }, []);

  // 2. Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file); // Change 'file' to match your Multer config

    try {
      setUploading(true);
      const res = await axios.post("/api/v1/upload/school-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSettings(prev => ({ ...prev, logo: res.data.url }));
    } catch (err) {
      alert("Logo upload failed. Please use PNG/JPG.");
    } finally {
      setUploading(false);
    }
  };

  // 3. Deploy Changes to Backend
  const handleDeployChanges = async () => {
    try {
      setSaving(true);
      await axios.put(`/api/v1/school/update`, {
        name: settings.name,
        address: settings.address,
        phone: settings.contact,
        curriculum: settings.curriculum,
        defaultGradingSystemId: settings.gradingSystemId,
        activeTermId: settings.activeTermId,
        logo: settings.logo
      });
      
      // Bonus: Add a visual feedback toast here if you have one
      alert("System configuration synchronized successfully!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Network error. Configuration not saved.";
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} />
        <p className="mt-4 font-black text-slate-400 uppercase tracking-widest text-xs">Synchronizing System...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">System Configuration</h1>
          <p className="text-slate-500 font-medium mt-1">Manage global institutional logic and branding.</p>
        </div>
        <button 
          onClick={handleDeployChanges}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 active:scale-95"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? "Deploying..." : "Sync Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Branding & Contact */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white text-center">
            <div className="relative w-36 h-36 mx-auto mb-6">
              <div className={`w-full h-full rounded-[2.5rem] border-4 border-slate-50 shadow-inner overflow-hidden bg-slate-100 flex items-center justify-center ${uploading ? 'opacity-50' : ''}`}>
                <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <label className="absolute -bottom-2 -right-2 p-3 bg-white shadow-lg rounded-2xl text-indigo-600 border border-slate-100 hover:scale-110 transition-transform cursor-pointer">
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
              </label>
            </div>
            <input 
              name="name" 
              value={settings.name} 
              onChange={handleInputChange}
              placeholder="School Name"
              className="text-xl font-black text-slate-800 text-center w-full bg-transparent border-none focus:ring-2 focus:ring-indigo-500/5 rounded-xl py-1" 
            />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic">Institutional Node Verified</p>
          </Card>

          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <Building2 className="text-indigo-500" size={20} />
                <h4 className="font-black text-slate-800">Connection Points</h4>
            </div>
            <div className="space-y-4 text-left">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Location</label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input name="address" value={settings.address} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-sm" />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Hotline</label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input name="contact" value={settings.contact} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-sm" />
                  </div>
               </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Logic & Structure */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white">
            <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="text-emerald-500" size={24} />
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Academic Core Logic</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Current Curriculum</label>
                <select name="curriculum" value={settings.curriculum} onChange={handleInputChange} className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer">
                   <option value="CBC">CBC (Competency Based)</option>
                   <option value="8-4-4">8-4-4 Standard</option>
                   <option value="IGCSE">International (IGCSE)</option>
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Active Academic Term</label>
                <select name="activeTermId" value={settings.activeTermId} onChange={handleInputChange} className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer">
                   <option value="">Select Active Term</option>
                   {academicData.terms.map(term => (
                     <option key={term.id} value={term.id}>{term.term_name} - {term.academic_year?.year}</option>
                   ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Grading Logic</label>
                <select name="gradingSystemId" value={settings.gradingSystemId} onChange={handleInputChange} className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer">
                   <option value="primary">Primary System (A-E)</option>
                   <option value="secondary">Secondary System (1-12)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Snapshot of Organizational Structure */}
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] p-10 bg-white">
            <div className="flex items-center gap-3 mb-8">
              <Globe className="text-indigo-500" size={24} />
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Institutional Blueprint</h3>
            </div>
            
            <div className="space-y-8">
              {[
                { label: "Operational Classes", list: academicData.classes, color: "bg-indigo-50 text-indigo-600", field: 'class_name', addLink: '/academic/classes' },
                { label: "Approved Curriculum Subjects", list: academicData.subjects, color: "bg-amber-50 text-amber-600", field: 'name', addLink: '/academic/subjects' }
              ].map((section) => (
                <div key={section.label} className="animate-in slide-in-from-bottom-2 duration-700">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.label}</label>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{section.list.length} Records</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5 p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                    {section.list.length > 0 ? (
                      section.list.map((item: any) => (
                        <span key={item.id} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight shadow-sm border border-white ${section.color}`}>
                          {item[section.field]}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 font-bold py-2 px-2">No structural data found.</p>
                    )}
                    <a href={section.addLink} className="px-5 py-2 rounded-xl text-[11px] font-black bg-white text-slate-400 border border-slate-200 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all">
                      + Configure
                    </a>
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