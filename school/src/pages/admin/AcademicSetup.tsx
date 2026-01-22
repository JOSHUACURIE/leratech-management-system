import React, { useState, useEffect } from "react";
import { 
  Plus, Settings, BookOpen, Layers, Calendar, GraduationCap, 
  Percent, Trash2, Loader2, X, AlertCircle, Edit3, Save,
  ChevronDown, Clock, Calendar as CalendarIcon
} from "lucide-react";
import Card from "../../components/common/Card";
import api from "../../services/api";

// Type Definitions
interface Class {
  id: string;
  class_name: string;
  class_level: number;
}

interface Stream {
  id: string;
  name: string;
  class_id: string;
  class?: Class;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  subject_code?: string;
  category?: string;
}

interface Term {
  id: string;
  term_name: string;
  academic_year_id: string;
  start_date: string;
  end_date: string;
  fee_deadline?: string;
  is_current: boolean;
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  terms: Term[];
  _count?: {
    terms: number;
  };
}

interface Grade {
  id: string;
  grade: string;
  min_score: number;
  max_score: number;
  points: number;
  description: string;
}

interface GradingSystem {
  id: string;
  name: string;
  grades: Grade[];
}

// Form Data Type
interface FormData {
  // Class
  className: string;
  classLevel: string;
  // Stream
  streamName: string;
  classId: string;
  // Subject
  name: string;
  code: string;
  category: string;
  // Academic Year
  yearName: string;
  yearStart: string;
  yearEnd: string;
  isCurrentYear: boolean;
  // Term
  termName: string;
  academicYearId: string;
  termStart: string;
  termEnd: string;
  feeDeadline: string;
  isCurrentTerm: boolean;
  // Grade
  grade: string;
  minScore: string;
  maxScore: string;
  points: string;
  comment: string;
}

const AcademicSetup: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Data State
  const [classes, setClasses] = useState<Class[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [gradingSystem, setGradingSystem] = useState<GradingSystem | null>(null);

  // Modal & Form State
  const [showModal, setShowModal] = useState<string | null>(null); 
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    // Class
    className: "",
    classLevel: "",
    // Stream
    streamName: "",
    classId: "",
    // Subject
    name: "",
    code: "",
    category: "",
    // Academic Year
    yearName: "",
    yearStart: "",
    yearEnd: "",
    isCurrentYear: false,
    // Term
    termName: "",
    academicYearId: "",
    termStart: "",
    termEnd: "",
    feeDeadline: "",
    isCurrentTerm: false,
    // Grade
    grade: "",
    minScore: "",
    maxScore: "",
    points: "",
    comment: ""
  });

  // Term management state
  const [selectedYearForTerms, setSelectedYearForTerms] = useState<string>("");

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
        api.get('/academic/years-with-terms'), 
        api.get('/grading')
      ]);

      const unwrap = <T,>(res: PromiseSettledResult<any>): T[] => {
        return (res.status === 'fulfilled' ? res.value.data?.data || res.value.data : []) as T[];
      };

      setClasses(unwrap<Class>(classRes));
      setStreams(unwrap<Stream>(streamRes));
      setSubjects(unwrap<Subject>(subjectRes));
      
      const yearsData = unwrap<AcademicYear>(yearRes);
      setAcademicYears(yearsData);
      
      // Set default selected year for terms view
      if (yearsData.length > 0 && !selectedYearForTerms) {
        const currentYear = yearsData.find((y: AcademicYear) => y.is_current);
        setSelectedYearForTerms(currentYear?.id || yearsData[0].id);
      }
      
      const gradingData = unwrap<GradingSystem>(gradeRes);
      setGradingSystem(gradingData[0] || null);

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
        const payload = { 
          className: formData.className, 
          classLevel: parseInt(formData.classLevel) 
        };
        isEdit 
          ? await api.put(`/classes/${editingId}`, payload) 
          : await api.post('/classes', payload);
      } 
      else if (showModal === 'Stream') {
        const payload = { 
          name: formData.streamName, 
          classId: formData.classId 
        };
        isEdit 
          ? await api.put(`/streams/${editingId}`, payload) 
          : await api.post('/streams', payload);
      }
      else if (showModal === 'Subject') {
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
      else if (showModal === 'Academic Year') {
        const payload = { 
          year_name: formData.yearName,
          start_date: formData.yearStart,
          end_date: formData.yearEnd,
          is_current: formData.isCurrentYear
        };
        
        if (isEdit) {
          await api.put(`/academic/years/${editingId}`, payload);
        } else {
          await api.post('/academic/years', payload);
        }
      }
      else if (showModal === 'Term') {
        const payload = {
          academic_year_id: formData.academicYearId,
          term_name: formData.termName,
          start_date: formData.termStart,
          end_date: formData.termEnd,
          fee_deadline: formData.feeDeadline || null,
          is_current: formData.isCurrentTerm
        };
        
        if (isEdit) {
          await api.put(`/academic/terms/${editingId}`, payload);
        } else {
          await api.post('/academic/terms', payload);
        }
      }
      else if (showModal === 'Grade') {
        const payload = { 
          minScore: parseInt(formData.minScore), 
          maxScore: parseInt(formData.maxScore), 
          points: parseInt(formData.points), 
          grade: formData.grade 
        };
        await api.put(`/grading/scale/${editingId}`, payload);
        await api.patch('/grading/scales/remarks', { 
          scaleId: editingId, 
          description: formData.comment 
        });
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
    else if (type === 'Stream') {
      setFormData({
        ...formData, 
        streamName: item.name, 
        classId: item.class_id
      });
    }
    else if (type === 'Subject') {
      setFormData({
        ...formData,
        name: item.name || "",
        code: item.code || item.subject_code || "",
        category: item.category || ""
      });
    }
    else if (type === 'Academic Year') {
      setFormData({
        ...formData,
        yearName: item.year_name || "",
        yearStart: item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : "",
        yearEnd: item.end_date ? new Date(item.end_date).toISOString().split('T')[0] : "",
        isCurrentYear: item.is_current || false
      });
    }
    else if (type === 'Term') {
      setFormData({
        ...formData,
        termName: item.term_name || "",
        academicYearId: item.academic_year_id || "",
        termStart: item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : "",
        termEnd: item.end_date ? new Date(item.end_date).toISOString().split('T')[0] : "",
        feeDeadline: item.fee_deadline ? new Date(item.fee_deadline).toISOString().split('T')[0] : "",
        isCurrentTerm: item.is_current || false
      });
    }
    else if (type === 'Grade') {
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
      className: "",
      classLevel: "",
      streamName: "",
      classId: "",
      name: "",
      code: "",
      category: "",
      yearName: "",
      yearStart: "",
      yearEnd: "",
      isCurrentYear: false,
      termName: "",
      academicYearId: "",
      termStart: "",
      termEnd: "",
      feeDeadline: "",
      isCurrentTerm: false,
      grade: "",
      minScore: "",
      maxScore: "",
      points: "",
      comment: ""
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCurrentYear = (): AcademicYear | undefined => {
    return academicYears.find(y => y.is_current);
  };

  const getSelectedYearTerms = (): Term[] => {
    if (!selectedYearForTerms) return [];
    const year = academicYears.find((y: AcademicYear) => y.id === selectedYearForTerms);
    return year?.terms || [];
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
            {classes.map((c: Class) => (
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
            {streams.map((s: Stream) => (
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
            {subjects.map((sub: Subject) => (
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

        {/* Academic Years Section */}
        <Card className="p-8 bg-white rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="text-violet-600" />
              <h3 className="font-black text-slate-800">Academic Years</h3>
              <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                {academicYears.length}
              </span>
            </div>
            <button onClick={() => setShowModal('Academic Year')} className="bg-violet-50 text-violet-600 p-2 rounded-xl hover:bg-violet-100 transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {academicYears.map((year: AcademicYear) => (
              <div key={year.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-violet-200 hover:bg-slate-100/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 truncate">
                      {year.year_name}
                      {year.is_current && (
                        <span className="ml-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          CURRENT
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(year.start_date)} - {formatDate(year.end_date)}
                    </span>
                    <span className="text-[10px] font-bold">
                      {year._count?.terms || year.terms?.length || 0} terms
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal('Academic Year', year)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                  <button onClick={() => handleDelete('/academic/years', year.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Terms Section */}
        <Card className="p-8 bg-white rounded-[2rem] border-none shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Clock className="text-rose-600" />
              <h3 className="font-black text-slate-800">Terms</h3>
              <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                {getSelectedYearTerms().length}
              </span>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedYearForTerms}
                onChange={(e) => setSelectedYearForTerms(e.target.value)}
                className="text-xs font-bold bg-slate-50 border-none rounded-xl px-3 py-1.5 outline-none"
              >
                {academicYears.map((year: AcademicYear) => (
                  <option key={year.id} value={year.id}>
                    {year.year_name} {year.is_current ? "(Current)" : ""}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => {
                  if (!selectedYearForTerms) {
                    alert("Please select an academic year first");
                    return;
                  }
                  setFormData({...formData, academicYearId: selectedYearForTerms});
                  setShowModal('Term');
                }} 
                className="bg-rose-50 text-rose-600 p-2 rounded-xl hover:bg-rose-100 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {getSelectedYearTerms().map((term: Term) => (
              <div key={term.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-rose-200 hover:bg-slate-100/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 truncate">
                      {term.term_name}
                      {term.is_current && (
                        <span className="ml-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {formatDate(term.start_date)} → {formatDate(term.end_date)}
                    </span>
                    {term.fee_deadline && (
                      <span className="text-[10px] text-rose-500 font-bold">
                        Fees due: {formatDate(term.fee_deadline)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal('Term', term)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16}/></button>
                  <button onClick={() => handleDelete('/academic/terms', term.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {getSelectedYearTerms().length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <CalendarIcon className="mx-auto mb-2" size={24} />
                <p className="text-sm font-medium">No terms for selected year</p>
              </div>
            )}
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
                {gradingSystem?.grades?.map((g: Grade) => (
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
              {/* Class Form */}
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

              {/* Stream Form */}
              {showModal === 'Stream' && (
                <>
                  <select 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.classId} 
                    onChange={e => setFormData({...formData, classId: e.target.value})}
                  >
                    <option value="">Select Parent Class</option>
                    {classes.map((c: Class) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                  <input 
                    placeholder="Stream Name (e.g., North)" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.streamName} 
                    onChange={e => setFormData({...formData, streamName: e.target.value})} 
                  />
                </>
              )}

              {/* Subject Form */}
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

              {/* Academic Year Form */}
              {showModal === 'Academic Year' && (
                <>
                  <input 
                    placeholder="Year Name (e.g., 2024-2025)" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.yearName} 
                    onChange={e => setFormData({...formData, yearName: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full mt-2 p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                        value={formData.yearStart} 
                        onChange={e => setFormData({...formData, yearStart: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">End Date</label>
                      <input 
                        type="date" 
                        className="w-full mt-2 p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                        value={formData.yearEnd} 
                        onChange={e => setFormData({...formData, yearEnd: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isCurrentYear}
                      onChange={e => setFormData({...formData, isCurrentYear: e.target.checked})}
                      className="w-5 h-5 rounded"
                    />
                    <span className="font-bold text-slate-700">Set as current academic year</span>
                  </label>
                </>
              )}

              {/* Term Form */}
              {showModal === 'Term' && (
                <>
                  <div className="mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Academic Year</label>
                    <select 
                      className="w-full mt-2 p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                      value={formData.academicYearId} 
                      onChange={e => setFormData({...formData, academicYearId: e.target.value})}
                      disabled={!!editingId}
                      required
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.map((year: AcademicYear) => (
                        <option key={year.id} value={year.id}>
                          {year.year_name} {year.is_current ? "(Current)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input 
                    placeholder="Term Name (e.g., Term 1)" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                    value={formData.termName} 
                    onChange={e => setFormData({...formData, termName: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full mt-2 p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                        value={formData.termStart} 
                        onChange={e => setFormData({...formData, termStart: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">End Date</label>
                      <input 
                        type="date" 
                        className="w-full mt-2 p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                        value={formData.termEnd} 
                        onChange={e => setFormData({...formData, termEnd: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fee Deadline (Optional)</label>
                    <input 
                      type="date" 
                      className="w-full mt-2 p-4 bg-slate-50 rounded-2xl border-none font-bold" 
                      value={formData.feeDeadline} 
                      onChange={e => setFormData({...formData, feeDeadline: e.target.value})}
                    />
                  </div>
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isCurrentTerm}
                      onChange={e => setFormData({...formData, isCurrentTerm: e.target.checked})}
                      className="w-5 h-5 rounded"
                    />
                    <span className="font-bold text-slate-700">Set as current term</span>
                  </label>
                </>
              )}

              {/* Grade Form */}
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