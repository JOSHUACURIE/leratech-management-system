import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Search, Loader2, BookOpen, GraduationCap, MapPin, CheckCircle2 } from "lucide-react";
import Card from "../../components/common/Card";
import { classAPI, studentAPI, academicAPI, subjectAPI } from "../../services/api"
import api from "../../services/api";
const StudentManagement: React.FC = () => {
  // Data States
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [activeYear, setActiveYear] = useState<any>(null);
  const [activeTerm, setActiveTerm] = useState<any>(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form States
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // 1. Initial Load: Fetch All Contextual Data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [studentRes, classRes, subjectRes, yearRes] = await Promise.all([
          studentAPI.getAll(),
          classAPI.getAll(),
          api.get('/subjects'), // Using generic api call for subjects
          api.get('/academic/years')
        ]);
        
        setStudents(studentRes.data.data);
        setClasses(classRes.data.data);
        setSubjectsList(subjectRes.data.data || []);
        
        // Find Active Year and its Current Term
        const activeY = yearRes.data.data.find((y: any) => y.is_current);
        setActiveYear(activeY);
        setActiveTerm(activeY?.terms?.find((t: any) => t.is_current));

      } catch (err) {
        console.error("Failed to load management data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Dependency Load: Fetch Streams when Class changes
  useEffect(() => {
    if (!selectedClass) {
      setStreams([]);
      return;
    }
    const fetchStreams = async () => {
      try {
        const res = await classAPI.getStreamsByClass(selectedClass);
        setStreams(res.data.data);
        if (res.data.data.length > 0) setSelectedStream(res.data.data[0].id);
      } catch (err) {
        console.error("Failed to load streams", err);
      }
    };
    fetchStreams();
  }, [selectedClass]);

  const handleAddStudent = async () => {
    if (!name || !selectedClass || !activeYear) {
      alert("Please ensure Name, Class, and an Active Academic Year are set.");
      return;
    }

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Student";

    try {
      setSyncing(true);
      const payload = {
        firstName,
        lastName,
        admissionNumber: `ADM-${Date.now().toString().slice(-5)}`,
        classId: selectedClass,
        streamId: selectedStream,
        subjectIds: selectedSubjects, 
        academicYearId: activeYear.id,
        termId: activeTerm?.id
      };

      const res = await studentAPI.create(payload);
      setStudents([res.data.data, ...students]);
      
      // Reset Form
      setName("");
      setSelectedSubjects([]);
      alert("Student enrolled successfully!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Enrollment failed");
    } finally {
      setSyncing(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
        <p className="text-slate-500 font-bold">Syncing Registry...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Student Registry</h1>
          <p className="text-slate-500 font-medium">Manage student enrollment and subject assignments.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full">
             {activeYear?.year_name || "No Active Year"} • {activeTerm?.term_name || "No Active Term"}
           </span>
           <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 px-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{students.length} Total Enrolled</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 bg-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                <UserPlus size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-800">New Enrollment</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Stream</label>
                  <select
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    disabled={!selectedClass}
                    className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  >
                    {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Subject Selection Grid */}
              <div className="pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Assign Subjects</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {subjectsList.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => toggleSubject(sub.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        selectedSubjects.includes(sub.id) 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                      }`}
                    >
                      {selectedSubjects.includes(sub.id) ? <CheckCircle2 size={14} /> : <BookOpen size={14} className="text-slate-300" />}
                      <span className="text-xs font-bold truncate">{sub.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddStudent}
                disabled={syncing}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {syncing ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                Complete Registration
              </button>
            </div>
          </Card>
        </div>

        {/* List Column */}
        <div className="xl:col-span-8">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <h3 className="text-xl font-extrabold text-slate-800">Student Directory</h3>
               <div className="relative w-full md:w-72">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10" 
                  />
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5">Student Info</th>
                    <th className="px-8 py-5">Class & Stream</th>
                    <th className="px-8 py-5">Enrollment Date</th>
                    <th className="px-8 py-5 text-right pr-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100">
                            {s.first_name?.charAt(0)}{s.last_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-700">{s.first_name} {s.last_name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{s.admission_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                             <GraduationCap size={14} className="text-indigo-400"/> {s.class?.class_name || "N/A"}
                           </span>
                           <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-tighter mt-1">
                             <MapPin size={10}/> Stream {s.stream?.name || "N/A"}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(s.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right pr-10">
                        <button 
                          onClick={async () => {
                            if(window.confirm("Permanent delete this record?")) {
                               try {
                                 await studentAPI.delete(s.id);
                                 setStudents(students.filter(st => st.id !== s.id));
                               } catch (err) { alert("Delete failed"); }
                            }
                          }}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStudents.length === 0 && (
                <div className="p-20 text-center">
                   <p className="text-slate-400 font-bold italic">No students found matching your search.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;