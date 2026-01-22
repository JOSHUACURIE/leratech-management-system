import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Search, Loader2, BookOpen, GraduationCap, MapPin, CheckCircle2, ChevronDown, Home, Sun, AlertCircle } from "lucide-react";
import Card from "../../components/common/Card";
import api from "../../services/api";

const StudentManagement: React.FC = () => {
  // Data States
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form States
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [studentType, setStudentType] = useState<string>("day_scholar");

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [studentRes, classRes, subjectRes, yearRes] = await Promise.all([
          api.get('/students'),
          api.get('/classes'),
          api.get('/subjects'),
          api.get('/academic/years')
        ]);
        
        setStudents(studentRes.data?.data || []);
        setClasses(classRes.data?.data || []);
        setSubjectsList(subjectRes.data?.data || []);
        
        const yearsData = yearRes.data?.data || [];
        setAcademicYears(Array.isArray(yearsData) ? yearsData : [yearsData]);
        
        const yearsArray = Array.isArray(yearsData) ? yearsData : [yearsData];
        const currentYear = yearsArray.find((y: any) => y.is_current);
        if (currentYear) {
          setSelectedAcademicYear(currentYear.id);
          await fetchTerms(currentYear.id);
        }

      } catch (err) {
        console.error("Failed to load management data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch streams when class changes - IMPROVED VERSION
  useEffect(() => {
    if (!selectedClass) {
      setStreams([]);
      setSelectedStream("");
      return;
    }
    
    const fetchStreams = async () => {
      try {
        console.log(`Fetching streams for class ID: ${selectedClass}`);
        
        // Try multiple API parameter formats
        let streamsData: any[] = [];
        
        try {
          // First try with classId parameter
          const res = await api.get(`/streams?classId=${selectedClass}`);
          console.log("Streams API response:", res.data);
          
          if (res.data?.data) {
            streamsData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
          } else if (Array.isArray(res.data)) {
            streamsData = res.data;
          }
        } catch (err1) {
          console.log("First API call failed, trying with class_id parameter...", err1);
          
          try {
            // Try with class_id parameter
            const res = await api.get(`/streams?class_id=${selectedClass}`);
            if (res.data?.data) {
              streamsData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
            } else if (Array.isArray(res.data)) {
              streamsData = res.data;
            }
          } catch (err2) {
            console.log("Second API call failed, trying to get all streams...", err2);
            
            try {
              // Get all streams and filter client-side
              const res = await api.get('/streams');
              const allStreams = res.data?.data || res.data || [];
              const allStreamsArray = Array.isArray(allStreams) ? allStreams : [allStreams];
              
              // Filter by class_id
              streamsData = allStreamsArray.filter((stream: any) => 
                stream.class_id === selectedClass || 
                stream.class?.id === selectedClass
              );
            } catch (err3) {
              console.error("All stream fetch attempts failed", err3);
            }
          }
        }
        
        console.log(`Found ${streamsData.length} streams for class ${selectedClass}:`, streamsData);
        setStreams(streamsData);
        
        // Clear selected stream when class changes
        setSelectedStream("");
        
      } catch (err: any) {
        console.error("Failed to load streams:", err.response?.data || err.message);
        setStreams([]);
        setSelectedStream("");
      }
    };
    
    fetchStreams();
  }, [selectedClass]);

  const generateAdmissionNumber = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `ADM-${timestamp}-${randomSuffix}`;
  };

  const fetchTerms = async (academicYearId: string) => {
    try {
      const res = await api.get(`/academic/years/${academicYearId}/terms`);
      
      let termsData = [];
      if (res.data?.data?.terms) {
        termsData = res.data.data.terms;
      } else if (res.data?.data) {
        termsData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
      } else if (Array.isArray(res.data)) {
        termsData = res.data;
      }
      
      setTerms(termsData);
      
      if (termsData.length > 0 && !selectedTerm) {
        const currentTerm = termsData.find((t: any) => t.is_current);
        setSelectedTerm(currentTerm ? currentTerm.id : termsData[0].id);
      }
    } catch (err) {
      console.error("Failed to load terms", err);
      setTerms([]);
    }
  };

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchTerms(selectedAcademicYear);
    } else {
      setTerms([]);
      setSelectedTerm("");
    }
  }, [selectedAcademicYear]);

  const handleAddStudent = async () => {
    if (!name || !selectedClass || !selectedAcademicYear || !selectedTerm) {
      alert("Please fill all required fields: Name, Class, Academic Year, and Term");
      return;
    }

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Student";

    let finalAdmissionNumber = admissionNumber.trim();
    if (!finalAdmissionNumber) {
      finalAdmissionNumber = generateAdmissionNumber();
    }

    try {
      setSyncing(true);
      const payload = {
        firstName,
        lastName,
        admissionNumber: finalAdmissionNumber,
        classId: selectedClass,
        streamId: selectedStream || null,
        subjectIds: selectedSubjects.length > 0 ? selectedSubjects : undefined,
        academicYearId: selectedAcademicYear,
        termId: selectedTerm,
        dateOfBirth: null,
        gender: "OTHER",
        studentType: studentType, // Using state variable
        bloodGroup: null,
        allergies: null,
        medicalConditions: null
      };

      console.log("Enrollment payload:", payload);
      const res = await api.post('/students', payload);
      
      // Refresh student list
      const updatedRes = await api.get('/students');
      setStudents(updatedRes.data?.data || []);
      
      // Reset Form
      setName("");
      setAdmissionNumber("");
      setSelectedClass("");
      setSelectedStream("");
      setSelectedAcademicYear("");
      setSelectedTerm("");
      setStudentType("day_scholar");
      setSelectedSubjects([]);
      
      alert("Student enrolled successfully!");
    } catch (err: any) {
      console.error("Enrollment error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Enrollment failed: " + err.message);
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
    `${s.firstName || s.first_name} ${s.lastName || s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedYearName = () => {
    const year = academicYears.find(y => y.id === selectedAcademicYear);
    return year?.year_name || "No Year Selected";
  };

  const getSelectedTermName = () => {
    if (!terms || !Array.isArray(terms)) return "No Term Selected";
    const term = terms.find(t => t.id === selectedTerm);
    return term?.term_name || "No Term Selected";
  };

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
            {getSelectedYearName()} • {getSelectedTermName()}
          </span>
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 px-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {students.length} Total Enrolled
            </span>
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
              {/* Admission Number */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Admission Number
                  <span className="text-slate-300 ml-1">(Auto-generated if empty)</span>
                </label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="e.g. ADM-2024-001"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    className="flex-1 px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setAdmissionNumber(generateAdmissionNumber())}
                    className="px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-sm transition-colors whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-2 px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              {/* Student Type */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Student Type</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStudentType("day_scholar")}
                    className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold border transition-all ${
                      studentType === "day_scholar"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <Sun size={16} className={studentType === "day_scholar" ? "text-emerald-600" : "text-slate-400"} />
                    Day Scholar
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentType("boarder")}
                    className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold border transition-all ${
                      studentType === "boarder"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <Home size={16} className={studentType === "boarder" ? "text-indigo-600" : "text-slate-400"} />
                    Boarder
                  </button>
                </div>
              </div>

              {/* Class and Stream */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Class *</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.class_name} {c.class_level ? `(Level ${c.class_level})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Stream</label>
                  <select
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    disabled={!selectedClass || streams.length === 0}
                    className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  >
                    <option value="">
                      {!selectedClass ? "Select class first" : 
                       streams.length === 0 ? "No streams available" : 
                       "Select Stream"}
                    </option>
                    {streams.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {selectedClass && streams.length === 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                      <AlertCircle size={12} />
                      <span>No streams found for this class</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Year and Term Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Academic Year *</label>
                  <div className="relative mt-2">
                    <select
                      value={selectedAcademicYear}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                      required
                    >
                      <option value="">Select Year</option>
                      {academicYears.map(year => (
                        <option key={year.id} value={year.id}>
                          {year.year_name} {year.is_current ? "(Current)" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Term *</label>
                  <div className="relative mt-2">
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      disabled={!selectedAcademicYear || terms.length === 0}
                      className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none disabled:opacity-50"
                      required
                    >
                      <option value="">
                        {!selectedAcademicYear ? "Select year first" : 
                         terms.length === 0 ? "No terms available" : 
                         "Select Term"}
                      </option>
                      {terms.map(term => (
                        <option key={term.id} value={term.id}>
                          {term.term_name} {term.is_current ? "(Current)" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
              </div>

              {/* Subject Selection Grid */}
              <div className="pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
                  Assign Subjects (Optional)
                  <span className="text-slate-300 ml-2">Selected: {selectedSubjects.length}</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {subjectsList.map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        selectedSubjects.includes(sub.id) 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                      }`}
                    >
                      {selectedSubjects.includes(sub.id) ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <BookOpen size={14} className="text-slate-300" />
                      )}
                      <span className="text-xs font-bold truncate">{sub.name}</span>
                      <span className="text-[10px] font-black text-slate-400 ml-auto">
                        {sub.code || sub.subject_code || ""}
                      </span>
                    </button>
                  ))}
                  {subjectsList.length === 0 && (
                    <div className="col-span-2 text-center py-4 text-slate-400 text-sm">
                      <BookOpen className="mx-auto mb-2" size={20} />
                      No subjects found. Add subjects first.
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddStudent}
                disabled={syncing || !name || !selectedClass || !selectedAcademicYear || !selectedTerm}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Student Directory</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Showing {filteredStudents.length} of {students.length} students
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or admission..." 
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
                    <th className="px-8 py-5">Admission Details</th>
                    <th className="px-8 py-5 text-right pr-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100">
                            {(s.firstName || s.first_name)?.charAt(0)}{(s.lastName || s.last_name)?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-700">
                              {s.firstName || s.first_name} {s.lastName || s.last_name}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              {s.studentType === "boarder" || s.student_type === "boarder" ? (
                                <>
                                  <Home size={10} className="text-indigo-500" />
                                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                    Boarder
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Sun size={10} className="text-amber-500" />
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                    Day Scholar
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                            <GraduationCap size={14} className="text-indigo-400"/> 
                            {s.className || s.class?.class_name || "N/A"}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-tighter mt-1">
                            <MapPin size={10}/> 
                            {s.streamName || s.stream?.name || "No Stream"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-600">
                            {s.admissionNumber || s.admission_number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-1">
                            Enrolled: {new Date(s.enrollmentDate || s.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right pr-10">
                        <button 
                          onClick={async () => {
                            if(window.confirm("Permanently delete this student record?")) {
                              try {
                                await api.delete(`/students/${s.id}`);
                                setStudents(students.filter(st => st.id !== s.id));
                              } catch (err: any) { 
                                alert("Delete failed: " + (err.response?.data?.error || err.message)); 
                              }
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
                  <p className="text-slate-400 font-bold italic">
                    {searchTerm ? "No students found matching your search." : "No students enrolled yet."}
                  </p>
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