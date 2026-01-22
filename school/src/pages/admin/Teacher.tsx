import React, { useState, useEffect } from "react";
import {
  Trash2, Search, Loader2, UserCheck, X, Edit3, Save,
  GraduationCap, Mail, Phone, Shield, BookOpen, CheckCircle2,
  Filter, AlertCircle, Users, Home, Plus
} from "lucide-react";
import Card from "../../components/common/Card";
import api from "../../services/api";

interface Teacher {
  id: string;
  user_id: string;
  teacher_code: string;
  tsc_number: string;
  qualification: string;
  specialization: string;
  employment_type: string;
  date_of_employment: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assignments?: any[];
  subjects?: any[];
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

interface Subject {
  id: string;
  name: string;
  subject_code: string;
  category?: string;
}

interface ClassItem {
  id: string;
  class_name: string;
  class_level: number;
  is_active: boolean;
}
interface Stream {
  id: string;
  name: string;
  class_id: string;
  class?: {
    class_name: string;
    class_level: number;
  };
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface Term {
  id: string;
  term_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  academic_year_id: string;
}

interface TeacherAssignment {
  id: string;
  teacher_id: string;
  stream_id: string;
  academic_year_id: string;
  term_id: string;
  is_active: boolean;
  teacher: {
    id: string;
    teacher_code: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  stream: {
    id: string;
    name: string;
    class: {
      class_name: string;
      class_level: number;
    };
  };
  academic_year: {
    year_name: string;
    is_current: boolean;
  };
  term: {
    term_name: string;
    is_current: boolean;
  };
  subjects: {
    subject: {
      id: string;
      name: string;
      subject_code: string;
      category?: string;
    };
  }[];
}

const Teachers: React.FC = () => {
  // Data States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal States
  const [showModal, setShowModal] = useState<'edit' | 'assign' | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  // Form States
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    teacherCode: "",
    tscNumber: "",
    qualification: "",
    specialization: "",
    employmentType: "",
    dateOfEmployment: new Date().toISOString().split('T')[0],
    status: "active"
  });
const fetchData = async () => {
  try {
    setLoading(true);
    console.log("Starting data fetch...");
    
    // Use the new endpoint that includes everything
    const [teachersRes, subjectsRes, classesRes, academicYearsRes] = await Promise.allSettled([
      api.get('/auth/teachers?includeAssignments=true&includeSubjects=true'),
      api.get('/subjects'),
      api.get('/classes'),
      api.get('/academic/years')
    ]);

    // Helper function to extract data
    const extractData = (result: PromiseSettledResult<any>) => {
      if (result.status === 'fulfilled') {
        const data = result.value.data;
        if (data?.data) {
          return Array.isArray(data.data) ? data.data : [data.data];
        }
        if (Array.isArray(data)) {
          return data;
        }
        return [];
      }
      console.error("API call failed:", result.reason);
      return [];
    };

    const teachersData = extractData(teachersRes);
    const subjectsData = extractData(subjectsRes);
    const classesData = extractData(classesRes);
    const yearsData = extractData(academicYearsRes);

    console.log("Teachers data received:", teachersData);
    
    // The data structure is now exactly what we need
    setTeachers(teachersData);
    setSubjects(subjectsData);
    setClasses(classesData);
    setAcademicYears(yearsData);
    
    // Extract all assignments from teachers
    const allAssignments = teachersData.flatMap((teacher: any) => 
      (teacher.assignments || []).map((assignment: any) => ({
        ...assignment,
        teacher_id: teacher.id
      }))
    );
    setTeacherAssignments(allAssignments);

    // Get current academic year to fetch terms
    if (yearsData.length > 0) {
      const currentAcademicYear = yearsData.find((year: AcademicYear) => year.is_current);
      if (currentAcademicYear) {
        try {
          const termsResponse = await api.get(`/academic/years/${currentAcademicYear.id}/terms`);
          let termsData = [];
          if (termsResponse.data?.data?.terms) {
            termsData = termsResponse.data.data.terms;
          } else if (termsResponse.data?.data) {
            termsData = Array.isArray(termsResponse.data.data) ? termsResponse.data.data : [termsResponse.data.data];
          } else if (termsResponse.data) {
            termsData = Array.isArray(termsResponse.data) ? termsResponse.data : [termsResponse.data];
          }
          setTerms(termsData);
        } catch (err) {
          console.error("Failed to fetch terms", err);
          setTerms([]);
        }
      } else {
        setTerms([]);
      }
    } else {
      setTerms([]);
    }
  } catch (err) {
    console.error("Failed to load data", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, []);

  const fetchStreams = async (classId: string) => {
  try {
    let streamsData: Stream[] = [];
    
    // Try multiple API endpoints or methods
    try {
      // First try with class_id parameter
      const res = await api.get(`/streams?class_id=${classId}`);
      
      // Handle different response formats
      if (res.data?.data) {
        streamsData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
      } else if (Array.isArray(res.data)) {
        streamsData = res.data;
      }
      
      console.log(`Streams for class ${classId}:`, streamsData);
    } catch (err1) {
      console.log("First API call failed, trying alternative...", err1);
      
      try {
        // If that fails, get all streams and filter client-side
        const res = await api.get('/streams');
        const allStreams = res.data?.data || res.data || [];
        
        // Ensure it's an array and properly typed
        const allStreamsArray: Stream[] = Array.isArray(allStreams) ? allStreams : [allStreams];
        
        // Filter streams by class_id
        streamsData = allStreamsArray.filter((stream: Stream) => stream.class_id === classId);
        
        console.log(`Filtered streams for class ${classId}:`, streamsData);
      } catch (err2) {
        console.error("Both API calls failed", err2);
        throw err2;
      }
    }
    
    // Update the streams state
    setStreams(streamsData);
    
    // Reset selected stream if no streams or if current selection is invalid
    if (streamsData.length === 0 || !streamsData.find(s => s.id === selectedStreamId)) {
      setSelectedStreamId("");
    }
  } catch (err) {
    console.error("Failed to fetch streams", err);
    setStreams([]);
    setSelectedStreamId("");
  }
};
  // Fetch terms for selected academic year
  const fetchTermsByAcademicYear = async (academicYearId: string) => {
    try {
      const termsResponse = await api.get(`/academic/years/${academicYearId}/terms`);
      let termsData = [];
      if (termsResponse.data?.data?.terms) {
        termsData = termsResponse.data.data.terms;
      } else if (termsResponse.data?.data) {
        termsData = Array.isArray(termsResponse.data.data) ? termsResponse.data.data : [termsResponse.data.data];
      } else if (termsResponse.data) {
        termsData = Array.isArray(termsResponse.data) ? termsResponse.data : [termsResponse.data];
      }
      setTerms(termsData);
      setSelectedTermId("");
    } catch (err) {
      console.error("Failed to fetch terms", err);
      setTerms([]);
    }
  };

  // Handle class change for stream dropdown
  useEffect(() => {
    if (selectedClassId) {
      fetchStreams(selectedClassId);
    } else {
      setStreams([]);
      setSelectedStreamId("");
    }
  }, [selectedClassId]);

  // Handle academic year change for terms dropdown
  useEffect(() => {
    if (selectedAcademicYearId) {
      fetchTermsByAcademicYear(selectedAcademicYearId);
    } else {
      setTerms([]);
      setSelectedTermId("");
    }
  }, [selectedAcademicYearId]);

  // Get current academic year
  const getCurrentAcademicYear = () => {
    return academicYears.find(year => year.is_current);
  };

  // Open assign modal
  const handleOpenAssignModal = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClassId("");
    setSelectedStreamId("");
    setSelectedSubjectIds([]);
    
    // Set default academic year to current one
    const currentAcademicYear = getCurrentAcademicYear();
    setSelectedAcademicYearId(currentAcademicYear?.id || "");
    
    // Fetch terms for the selected academic year
    if (currentAcademicYear?.id) {
      await fetchTermsByAcademicYear(currentAcademicYear.id);
    }
    
    setShowModal('assign');
  };

  // Handle assign teacher with subjects
  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !selectedStreamId || !selectedAcademicYearId || !selectedTermId) {
      alert("Please select a class, stream, academic year, and term");
      return;
    }

    try {
      setSyncing(true);
      
      const payload = {
        teacherId: selectedTeacher.id,
        streamId: selectedStreamId,
        academicYearId: selectedAcademicYearId,
        termId: selectedTermId,
        subjectIds: selectedSubjectIds
      };

      console.log("Assigning teacher with payload:", payload);
      const res = await api.post('/subjects/assign-teacher', payload);
      console.log("Assignment response:", res.data);
      
      // Refresh data
      await fetchData();
      
      setShowModal(null);
      resetAssignForm();
      alert("Teacher assigned successfully!");
    } catch (err: any) {
      console.error("Assignment error:", err);
      console.error("Error response:", err.response?.data);
      alert(err.response?.data?.error || err.response?.data?.message || "Failed to assign teacher");
    } finally {
      setSyncing(false);
    }
  };

  // Remove teacher assignment
  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!window.confirm("Are you sure you want to remove this assignment?")) return;
    
    try {
      setSyncing(true);
      await api.delete(`/subjects/teacher-assignments/${assignmentId}`);
      
      // Refresh data
      await fetchData();
      
      alert("Assignment removed successfully!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to remove assignment");
    } finally {
      setSyncing(false);
    }
  };

  // Prepare for edit modal
  const handleOpenEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      firstName: teacher.user.first_name,
      lastName: teacher.user.last_name,
      email: teacher.user.email,
      phone: teacher.user.phone || "",
      teacherCode: teacher.teacher_code,
      tscNumber: teacher.tsc_number || "",
      qualification: teacher.qualification || "",
      specialization: teacher.specialization || "",
      employmentType: teacher.employment_type || "",
      dateOfEmployment: teacher.date_of_employment ? new Date(teacher.date_of_employment).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: teacher.is_active ? "active" : "inactive"
    });
    setShowModal('edit');
  };

  // Handle update teacher
  const handleUpdateTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      setSyncing(true);
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        teacher_code: formData.teacherCode,
        tsc_number: formData.tscNumber,
        qualification: formData.qualification,
        specialization: formData.specialization,
        employment_type: formData.employmentType,
        date_of_employment: formData.dateOfEmployment,
        is_active: formData.status === "active"
      };

      const res = await api.put(`/auth/teachers/${selectedTeacher.id}`, payload);
      
      const updatedTeacher = res.data?.data || res.data;
      // Ensure updated teacher has user object
      const formattedTeacher = {
        ...updatedTeacher,
        user: updatedTeacher.user || {
          first_name: updatedTeacher.first_name || formData.firstName,
          last_name: updatedTeacher.last_name || formData.lastName,
          email: updatedTeacher.email || formData.email,
          phone: updatedTeacher.phone || formData.phone
        }
      };
      
      setTeachers(teachers.map(t => t.id === selectedTeacher.id ? formattedTeacher : t));
      
      setShowModal(null);
      resetForm();
      alert("Teacher updated successfully!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update teacher");
    } finally {
      setSyncing(false);
    }
  };

  // Handle delete teacher
  const handleDeleteTeacher = async (teacherId: string) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    
    try {
      setSyncing(true);
      await api.delete(`/auth/teachers/${teacherId}`);
      setTeachers(teachers.filter(t => t.id !== teacherId));
      alert("Teacher deleted successfully!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete teacher");
    } finally {
      setSyncing(false);
    }
  };

  // Handle deactivate/reactivate teacher
  const handleToggleStatus = async (teacher: Teacher) => {
    const newStatus = !teacher.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!window.confirm(`Are you sure you want to ${action} ${teacher.user.first_name} ${teacher.user.last_name}?`)) return;
    
    try {
      setSyncing(true);
      const res = await api.patch(`/auth/users/${teacher.user_id}/status`, { 
        status: newStatus ? 'active' : 'inactive' 
      });
      
      setTeachers(teachers.map(t => 
        t.id === teacher.id ? { ...t, is_active: newStatus } : t
      ));
      
      alert(`Teacher ${action}d successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.error || `Failed to ${action} teacher`);
    } finally {
      setSyncing(false);
    }
  };

  // Reset forms
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      teacherCode: "",
      tscNumber: "",
      qualification: "",
      specialization: "",
      employmentType: "",
      dateOfEmployment: new Date().toISOString().split('T')[0],
      status: "active"
    });
    setSelectedTeacher(null);
  };

  const resetAssignForm = () => {
    setSelectedClassId("");
    setSelectedStreamId("");
    setSelectedAcademicYearId("");
    setSelectedTermId("");
    setSelectedSubjectIds([]);
  };

  // Get assignments for a specific teacher
  const getTeacherAssignments = (teacherId: string) => {
    const assignments = teacherAssignments.filter(assignment => {
      // Check multiple possible id fields
      return assignment.teacher_id === teacherId || 
             assignment.teacher?.id === teacherId ||
             (assignment.teacher && assignment.teacher.id === teacherId);
    });
    
    console.log(`Teacher ${teacherId} assignments found:`, assignments);
    return assignments;
  };

  // Get assigned subjects for a specific teacher
  const getTeacherSubjects = (teacherId: string) => {
    const assignments = getTeacherAssignments(teacherId);
    const subjectsList: Subject[] = [];
    
    assignments.forEach(assignment => {
      // Handle different data structures
      const subjects = assignment.subjects || [];
      
      subjects.forEach((item: any) => {
        // Handle nested structure
        const subject = item.subject || item;
        if (subject && subject.id) {
          // Check if subject already exists in the list
          const existingSubject = subjectsList.find(s => s.id === subject.id);
          if (!existingSubject) {
            subjectsList.push({
              id: subject.id,
              name: subject.name || '',
              subject_code: subject.subject_code || '',
              category: subject.category
            });
          }
        }
      });
    });
    
    console.log(`Teacher ${teacherId} subjects:`, subjectsList);
    return subjectsList;
  };

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const fullName = `${teacher.user.first_name} ${teacher.user.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      teacher.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacher_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && teacher.is_active) ||
      (statusFilter === "inactive" && !teacher.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'active' : 'inactive';
  };

  // Count active teachers
  const activeTeachersCount = teachers.filter(t => t.is_active).length;

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
        <p className="text-slate-500 font-bold">Loading Faculty Directory...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Faculty Directory</h1>
          <p className="text-slate-500 font-medium">Manage teaching staff, assignments, and subject allocations.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 px-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {activeTeachersCount} Active Teachers
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teachers by name, email, or teacher code..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Teachers Table */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-extrabold text-slate-800">Teaching Staff</h3>
            <span className="text-sm font-bold text-slate-400">
              Showing {filteredTeachers.length} of {teachers.length} teachers
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Teacher Details</th>
                <th className="px-8 py-5">Contact & ID</th>
                <th className="px-8 py-5">Subjects</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTeachers.map((teacher) => {
                const teacherSubjects = getTeacherSubjects(teacher.id);
                const assignments = getTeacherAssignments(teacher.id);
                
                console.log(`Rendering teacher ${teacher.id}:`, {
                  name: `${teacher.user.first_name} ${teacher.user.last_name}`,
                  subjectsCount: teacherSubjects.length,
                  assignmentsCount: assignments.length
                });
                
                return (
                  <tr key={teacher.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100">
                          {teacher.user.first_name?.charAt(0)}{teacher.user.last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-700">
                            {teacher.user.first_name} {teacher.user.last_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                           
                            {teacher.specialization && (
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                {teacher.specialization}
                              </span>
                            )}
                          </div>
                          {/* Show stream assignments inline if needed */}
                          {assignments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {assignments.slice(0, 1).map((assignment) => (
                                <div key={assignment.id} className="flex items-center gap-1">
                                  <Home size={10} className="text-slate-400" />
                                  <span className="text-[10px] font-medium text-slate-500">
                                    {assignment.stream.class.class_name}
                                    {assignment.stream.name && ` • ${assignment.stream.name}`}
                                    <span className="text-[8px] text-slate-400 ml-1">
                                      ({assignment.academic_year.year_name})
                                    </span>
                                  </span>
                                </div>
                              ))}
                              {assignments.length > 1 && (
                                <span className="text-[8px] font-bold text-slate-400">
                                  +{assignments.length - 1} more stream assignments
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail size={12} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-600">{teacher.user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-600">{teacher.user.phone || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield size={12} className="text-slate-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {teacher.teacher_code}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-1">
                        {teacherSubjects.slice(0, 4).map((subject) => (
                          <span
                            key={subject.id}
                            className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full"
                          >
                            {subject.name}
                          </span>
                        ))}
                        {teacherSubjects.length > 4 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            +{teacherSubjects.length - 4} more
                          </span>
                        )}
                        {teacherSubjects.length === 0 && (
                          <span className="text-[10px] font-medium text-slate-300 italic">No subjects assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${getStatusColor(teacher.is_active)}`}>
                        {getStatusText(teacher.is_active)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right pr-10">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenAssignModal(teacher)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Assign to Stream/Subjects"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(teacher)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Teacher"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(teacher)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title={teacher.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {teacher.is_active ? <X size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Teacher"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTeachers.length === 0 && (
            <div className="p-20 text-center">
              <Users className="mx-auto mb-4 text-slate-300" size={48} />
              <p className="text-slate-400 font-bold italic">
                {searchTerm ? "No teachers found matching your search." : "No teachers registered yet."}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Teacher Modal */}
      {showModal === 'edit' && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => { setShowModal(null); resetForm(); }} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Edit3 className="text-blue-500" />
              Edit Teacher
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Teacher Code</label>
                <input
                  type="text"
                  value={formData.teacherCode}
                  onChange={(e) => setFormData({...formData, teacherCode: e.target.value})}
                  className="w-full mt-2 px-4 py-3.5 bg-slate-100 border-none rounded-2xl font-bold text-slate-500"
                  readOnly
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">TSC Number</label>
                <input
                  type="text"
                  value={formData.tscNumber}
                  onChange={(e) => setFormData({...formData, tscNumber: e.target.value})}
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  placeholder="e.g., B.Ed, M.Sc"
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  placeholder="e.g., Mathematics, Physics"
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Employment Type</label>
                <input
                  type="text"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                  placeholder="e.g., Permanent, Contract"
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Employment Date</label>
                <input
                  type="date"
                  value={formData.dateOfEmployment}
                  onChange={(e) => setFormData({...formData, dateOfEmployment: e.target.value})}
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full mt-2 px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleUpdateTeacher}
              disabled={syncing || !formData.firstName || !formData.lastName || !formData.email}
              className={`w-full mt-8 py-4 text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {syncing ? <Loader2 className="animate-spin" /> : <Save />}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showModal === 'assign' && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => { setShowModal(null); resetAssignForm(); }} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Home className="text-indigo-600" />
              Assign {selectedTeacher.user.first_name} {selectedTeacher.user.last_name}
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column: Class/Stream/Year/Term Selection */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Home size={16} className="text-indigo-500" />
                  Class & Term Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Class *</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    >
                      <option value="">Select a class</option>
                      {classes
                        .filter(c => c.is_active !== false)
                        .map((classItem) => (
                          <option key={classItem.id} value={classItem.id}>
                            {classItem.class_name} (Level {classItem.class_level})
                          </option>
                        ))}
                    </select>
                  </div>
<div>
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Stream *</label>
  <select
    value={selectedStreamId}
    onChange={(e) => setSelectedStreamId(e.target.value)}
    disabled={!selectedClassId}
    className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
    required
  >
    <option value="">{selectedClassId ? "Select a stream" : "Select class first"}</option>
    {streams.map((stream) => (
      <option key={stream.id} value={stream.id}>
        {stream.name} 
        {/* Add class info if available */}
        {stream.class && ` (${stream.class.class_name})`}
      </option>
    ))}
  </select>
  {streams.length === 0 && selectedClassId && (
    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
      <AlertCircle size={12} />
      No streams found for this class
    </p>
  )}
</div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Academic Year *</label>
                    <select
                      value={selectedAcademicYearId}
                      onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    >
                      <option value="">Select academic year</option>
                      {academicYears.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.year_name} {year.is_current && '(Current)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Term *</label>
                    <select
                      value={selectedTermId}
                      onChange={(e) => setSelectedTermId(e.target.value)}
                      disabled={!selectedAcademicYearId}
                      className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                      required
                    >
                      <option value="">{selectedAcademicYearId ? "Select term" : "Select academic year first"}</option>
                      {terms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.term_name} {term.is_current && '(Current)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedClassId && selectedStreamId && selectedAcademicYearId && selectedTermId && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="font-bold text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Ready to Assign
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-600">
                        <span className="font-bold">Class:</span> {classes.find(c => c.id === selectedClassId)?.class_name}
                      </div>
                      <div className="text-slate-600">
                        <span className="font-bold">Stream:</span> {streams.find(s => s.id === selectedStreamId)?.name}
                      </div>
                      <div className="text-slate-600">
                        <span className="font-bold">Academic Year:</span> {academicYears.find(y => y.id === selectedAcademicYearId)?.year_name}
                      </div>
                      <div className="text-slate-600">
                        <span className="font-bold">Term:</span> {terms.find(t => t.id === selectedTermId)?.term_name}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Subject Selection */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-emerald-500" />
                  Select Subjects (Optional)
                </h3>
                
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto p-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubjectIds(prev =>
                          prev.includes(subject.id)
                            ? prev.filter(id => id !== subject.id)
                            : [...prev, subject.id]
                        );
                      }}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        selectedSubjectIds.includes(subject.id)
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {selectedSubjectIds.includes(subject.id) ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <BookOpen size={14} className="text-slate-300" />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-bold truncate">{subject.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{subject.subject_code}</p>
                        {subject.category && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{subject.category}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  Selected: <span className="font-bold">{selectedSubjectIds.length}</span> subject{selectedSubjectIds.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={handleAssignTeacher}
              disabled={syncing || !selectedClassId || !selectedStreamId || !selectedAcademicYearId || !selectedTermId}
              className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {syncing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Assign Teacher
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;