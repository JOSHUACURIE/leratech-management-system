import React, { useState, useEffect } from "react";
import { 
  Plus, Settings, BookOpen, Layers, Calendar, GraduationCap, 
  Percent, Trash2, Loader2, X, AlertCircle, Edit3, Save 
} from "lucide-react";
import Card from "../../components/common/Card";
import api from "../../services/api";

const AcademicSetup: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Data State
  const [classes, setClasses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [gradingSystem, setGradingSystem] = useState<any>(null);

  // Modal & Form State
  const [showModal, setShowModal] = useState<string | null>(null); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    className: "", classLevel: "",
    streamName: "", classId: "",
    // Subject fields updated to match controller
    name: "", code: "", category: "",
    yearName: "", yearStart: "", yearEnd: "",
    termName: "", academicYearId: "", termStart: "", termEnd: "",
    grade: "", minScore: "", maxScore: "", points: "", comment: ""
  });

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      setLoading(true);
      const [classRes, streamRes, subjectRes, yearRes, gradeRes] = await Promise.allSettled([
        api.get('/classes'),
        api.get('/streams'),
        api.get('/subjects'),
        api.get('/academic/years'),
        api.get('/grading/default')
      ]);

      const unwrap = (res: any) => (res.status === 'fulfilled' ? res.value.data?.data || res.value.data : []);

      setClasses(unwrap(classRes));
      setStreams(unwrap(streamRes));
      setSubjects(unwrap(subjectRes));
      setAcademicYears(unwrap(yearRes));
      setGradingSystem(unwrap(gradeRes));

    } catch (err) {
      console.error("Setup Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      setSyncing(true);
      const isEdit = !!editingId;

      if (showModal === 'Class') {
        const payload = { className: formData.className, classLevel: parseInt(formData.classLevel) };
        isEdit ? await api.put(`/classes/${editingId}`, payload) : await api.post('/classes', payload);
      } 
      else if (showModal === 'Stream') {
        const payload = { name: formData.streamName, classId: formData.classId };
        isEdit ? await api.put(`/streams/${editingId}`, payload) : await api.post('/streams', payload);
      }
      else if (showModal === 'Subject') {
        // Updated to match controller field names
        const payload = { 
          name: formData.name, 
          code: formData.code,
          category: formData.category || ""
        };
        
        if (isEdit) {
          await api.put(`/subjects/${editingId}`, payload);
        } else {
          await api.post('/subjects', payload);
        }
      }
      else if (showModal === 'Grade') {
        const payload = { minScore: parseInt(formData.minScore), maxScore: parseInt(formData.maxScore), points: parseInt(formData.points), grade: formData.grade };
        await api.put(`/grading/scale/${editingId}`, payload);
        await api.patch('/grading/scales/remarks', { scaleId: editingId, description: formData.comment });
      }

      await fetchAcademicData();
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.error || "Operation failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (endpoint: string, id: string) => {
    if (!window.confirm("Are you sure? This may affect student records linked to this item.")) return;
    try {
      setSyncing(true);
      await api.delete(`${endpoint}/${id}`);
      await fetchAcademicData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Delete failed.");
    } finally {
      setSyncing(false);
    }
  };

  const openEditModal = (type: string, item: any) => {
    setEditingId(item.id);
    
    if (type === 'Class') {
      setFormData({
        ...formData, 
        className: item.class_name, 
        classLevel: item.class_level?.toString() || ""
      });
    }
    if (type === 'Stream') {
      setFormData({
        ...formData, 
        streamName: item.name, 
        classId: item.class_id
      });
    }
    if (type === 'Subject') {
      // Updated to match controller response
      setFormData({
        ...formData,
        name: item.name || "",
        code: item.code || item.subject_code || "",
        category: item.category || ""
      });
    }
    if (type === 'Grade') {
      setFormData({
        ...formData, 
        grade: item.grade, 
        minScore: item.min_score?.toString() || "", 
        maxScore: item.max_score?.toString() || "", 
        points: item.points?.toString() || "", 
        comment: item.description
      });
    }
    
    setShowModal(type);
  };

  const closeModal = () => {
    setShowModal(null);
    setEditingId(null);
    setFormData({
      className: "", classLevel: "", 
      streamName: "", classId: "",
      name: "", code: "", category: "",
      yearName: "", yearStart: "", yearEnd: "",
      termName: "", academicYearId: "", termStart: "", termEnd: "",
      grade: "", minScore: "", maxScore: "", points: "", comment: ""
    });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Academic Setup</h1>
          <p className="text-slate-500 font-medium italic">Configure the core structural components of the school.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classes Section */}
        <Card className="p-8 bg-white rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-indigo-600" />
              <h3 className="font-black text-slate-800">Classes</h3>
              <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                {classes.length}
              </span>
            </div>
            <button onClick={() => setShowModal('Class')} className="bg-indigo-50 text-indigo-600 p-2 rounded-xl hover:bg-indigo-100 transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {classes.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-indigo-200 hover:bg-slate-100/50">
                <span className="font-bold text-slate-700">{c.class_name} <span className="text-slate-400 font-medium ml-2 text-xs">Level {c.class_level}</span></span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal('Class', c)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                  <button onClick={() => handleDelete('/classes', c.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Streams Section */}
        <Card className="p-8 bg-white rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Layers className="text-emerald-600" />
              <h3 className="font-black text-slate-800">Streams</h3>
              <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                {streams.length}
              </span>
            </div>
            <button onClick={() => setShowModal('Stream')} className="bg-emerald-50 text-emerald-600 p-2 rounded-xl hover:bg-emerald-100 transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {streams.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-emerald-200 hover:bg-slate-100/50">
                <div>
                    <p className="font-bold text-slate-700 leading-none">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-wider">{s.class?.class_name || 'Unassigned'}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal('Stream', s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                  <button onClick={() => handleDelete('/streams', s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Subjects Section */}
        <Card className="p-8 bg-white rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="text-amber-600" />
              <h3 className="font-black text-slate-800">Subjects</h3>
              <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                {subjects.length}
              </span>
            </div>
            <button onClick={() => setShowModal('Subject')} className="bg-amber-50 text-amber-600 p-2 rounded-xl hover:bg-amber-100 transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {subjects.map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-amber-200 hover:bg-slate-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-xs font-black text-amber-600 border border-amber-100">
                    {sub.code || sub.subject_code || sub.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{sub.name}</p>
                    {sub.category && (
                      <p className="text-[10px] text-slate-400 font-medium mt-1">{sub.category}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal('Subject', sub)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                  <button onClick={() => handleDelete('/subjects', sub.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Grading Section - Full width */}
        <Card className="lg:col-span-3 p-8 bg-white rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Percent className="text-indigo-600" />
              <h3 className="font-black text-slate-800 text-xl">Grading System: <span className="text-indigo-600">{gradingSystem?.name || 'Standard'}</span></h3>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4 px-4">Grade</th>
                  <th className="pb-4 px-4">Range (%)</th>
                  <th className="pb-4 px-4">Points</th>
                  <th className="pb-4 px-4">Remark</th>
                  <th className="pb-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gradingSystem?.grades?.map((g: any) => (
                  <tr key={g.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-black text-indigo-600">{g.grade}</td>
                    <td className="py-4 px-4 font-bold text-slate-600">{g.min_score} - {g.max_score}</td>
                    <td className="py-4 px-4 font-bold text-slate-500">{g.points}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
                        {g.description}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => openEditModal('Grade', g)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit3 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Dynamic Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={closeModal} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              {editingId ? <Edit3 className="text-blue-500" /> : <Plus className="text-indigo-600" />} 
              {editingId ? 'Edit' : 'Add'} {showModal}
            </h2>

            <div className="space-y-4">
              {showModal === 'Class' && (
                <>
                  <input 
                    placeholder="Class Name (e.g., Form 1)" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.className} 
                    onChange={e => setFormData({...formData, className: e.target.value})} 
                  />
                  <input 
                    type="number" 
                    placeholder="Class Level (e.g., 9)" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.classLevel} 
                    onChange={e => setFormData({...formData, classLevel: e.target.value})} 
                  />
                </>
              )}

              {showModal === 'Stream' && (
                <>
                  <select 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.classId} 
                    onChange={e => setFormData({...formData, classId: e.target.value})}
                  >
                    <option value="">Select Parent Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                  <input 
                    placeholder="Stream Name (e.g., North)" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.streamName} 
                    onChange={e => setFormData({...formData, streamName: e.target.value})} 
                  />
                </>
              )}

              {showModal === 'Subject' && (
                <>
                  <input 
                    placeholder="Subject Name (e.g., Mathematics)" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <input 
                    placeholder="Subject Code (e.g., MAT)" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold uppercase" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    required
                  />
                  <input 
                    placeholder="Category (optional, e.g., Sciences, Languages)" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                </>
              )}

              {showModal === 'Grade' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <input 
                      placeholder="Grade (A)" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                      value={formData.grade} 
                      onChange={e => setFormData({...formData, grade: e.target.value})} 
                    />
                  </div>
                  <input 
                    type="number" 
                    placeholder="Min %" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.minScore} 
                    onChange={e => setFormData({...formData, minScore: e.target.value})} 
                  />
                  <input 
                    type="number" 
                    placeholder="Max %" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.maxScore} 
                    onChange={e => setFormData({...formData, maxScore: e.target.value})} 
                  />
                  <div className="col-span-2">
                    <input 
                      placeholder="Remark (e.g., Excellent)" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                      value={formData.comment} 
                      onChange={e => setFormData({...formData, comment: e.target.value})} 
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleAction} 
              disabled={syncing} 
              className={`w-full mt-8 py-4 text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 ${
                editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {syncing ? <Loader2 className="animate-spin" /> : editingId ? <Save /> : <Plus />} 
              {editingId ? 'Save Changes' : `Confirm ${showModal}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicSetup;