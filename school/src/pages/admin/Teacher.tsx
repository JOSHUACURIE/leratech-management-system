import React, { useState, useEffect } from "react";
import {
  Trash2, Search, Loader2, UserCheck, X, Edit3, Save,
  GraduationCap, Mail, Phone, Shield, BookOpen, CheckCircle2,
  Filter, AlertCircle, Users
} from "lucide-react";
import Card from "../../components/common/Card";
import api from "../../services/api";

interface Teacher {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
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
}

interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
}

interface TeacherAssignment {
  id: string;
  class: { class_name: string };
  stream: { name: string };
}

const Teachers: React.FC = () => {
  // Data States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableAssignments, setAvailableAssignments] = useState<TeacherAssignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal States
  const [showModal, setShowModal] = useState<'edit' | 'assign' | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");

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
    isClassTeacher: false,
    status: "active"
  });

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Note: Teachers endpoint is now /auth/teachers instead of /teachers
        const [teachersRes, subjectsRes, classesRes] = await Promise.all([
          api.get('/auth/teachers'), // Updated endpoint
          api.get('/subjects'),
          api.get('/classes')
        ]);

        setTeachers(teachersRes.data?.data || []);
        setSubjects(subjectsRes.data?.data || []);
        setClasses(classesRes.data?.data || []);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch streams when class changes (for assignment)
  const fetchStreams = async (classId: string) => {
    try {
      const res = await api.get(`/streams?classId=${classId}`);
      setStreams(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch streams", err);
    }
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

      // Note: Teachers endpoint is now under /auth prefix
      const res = await api.put(`/auth/teachers/${selectedTeacher.id}`, payload);
      setTeachers(teachers.map(t => t.id === selectedTeacher.id ? res.data.data : t));
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
    if (!window.confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) return;
    
    try {
      setSyncing(true);
      // Note: Teachers endpoint is now under /auth prefix
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
    
    if (!window.confirm(`Are you sure you want to ${action} ${teacher.first_name} ${teacher.last_name}?`)) return;
    
    try {
      setSyncing(true);
      // Note: Using the user status update endpoint since we don't have a specific teacher status endpoint
      const res = await api.patch(`/auth/users/${teacher.user_id}/status`, { 
        status: newStatus ? 'active' : 'inactive' 
      });
      
      // Update local state
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

  // Prepare for assignment modal
  const handleOpenAssignModal = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    
    // Fetch teacher's current assignments
    try {
      // Note: This endpoint might need to be created if it doesn't exist
      const res = await api.get(`/teachers/${teacher.id}/assignments`);
      setAvailableAssignments(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
      setAvailableAssignments([]);
    }
    
    setSelectedSubjectIds([]);
    setSelectedAssignment("");
    setShowModal('assign');
  };

  // Handle subject assignment
  const handleAssignSubject = async () => {
    if (!selectedTeacher || !selectedAssignment || selectedSubjectIds.length === 0) {
      alert("Please select a teacher assignment and at least one subject");
      return;
    }

    try {
      setSyncing(true);
      
      // Assign each selected subject
      // Note: This endpoint might need to be created if it doesn't exist
      const promises = selectedSubjectIds.map(subjectId =>
        api.post('/teachers/assign-subject', {
          subjectId,
          teacherAssignmentId: selectedAssignment
        })
      );

      await Promise.all(promises);
      
      // Refresh teacher data
      const updatedRes = await api.get('/auth/teachers'); // Updated endpoint
      setTeachers(updatedRes.data?.data || []);
      
      setShowModal(null);
      setSelectedSubjectIds([]);
      setSelectedAssignment("");
      alert("Subjects assigned successfully!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to assign subjects");
    } finally {
      setSyncing(false);
    }
  };

  // Prepare for edit modal
  const handleOpenEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      email: teacher.email,
      phone: teacher.phone || "",
      teacherCode: teacher.teacher_code,
      tscNumber: teacher.tsc_number || "",
      qualification: teacher.qualification || "",
      specialization: teacher.specialization || "",
      employmentType: teacher.employment_type || "",
      dateOfEmployment: teacher.date_of_employment ? new Date(teacher.date_of_employment).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      isClassTeacher: false, // This field doesn't exist in the new model
      status: teacher.is_active ? "active" : "inactive"
    });
    setShowModal('edit');
  };

  // Reset form
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
      isClassTeacher: false,
      status: "active"
    });
    setSelectedTeacher(null);
    setSelectedSubjectIds([]);
    setSelectedAssignment("");
  };

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                <th className="px-8 py-5">Subjects Assigned</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100">
                        {teacher.first_name?.charAt(0)}{teacher.last_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-700">
                          {teacher.first_name} {teacher.last_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400">
                            {teacher.qualification || "No qualification"}
                          </span>
                          {teacher.specialization && (
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              {teacher.specialization}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{teacher.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{teacher.phone || "N/A"}</span>
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
                      {teacher.subjects?.slice(0, 3).map((subject: any) => (
                        <span
                          key={subject.id}
                          className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full"
                        >
                          {subject.name}
                        </span>
                      ))}
                      {teacher.subjects && teacher.subjects.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          +{teacher.subjects.length - 3} more
                        </span>
                      )}
                      {(!teacher.subjects || teacher.subjects.length === 0) && (
                        <span className="text-[10px] font-medium text-slate-300 italic">No subjects</span>
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
                        title="Assign Subjects"
                      >
                        <BookOpen size={16} />
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
              ))}
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

      {/* Assign Subjects Modal */}
      {showModal === 'assign' && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => { setShowModal(null); resetForm(); }} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <BookOpen className="text-indigo-600" />
              Assign Subjects to {selectedTeacher.first_name} {selectedTeacher.last_name}
            </h2>

            <div className="space-y-6">
              {/* Step 1: Select Assignment */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <GraduationCap size={16} className="text-indigo-500" />
                  Step 1: Select Teacher Assignment
                </h3>
                {availableAssignments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {availableAssignments.map((assignment) => (
                      <button
                        key={assignment.id}
                        onClick={() => setSelectedAssignment(assignment.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          selectedAssignment === assignment.id
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-200'
                        }`}
                      >
                        <p className="font-bold">{assignment.class.class_name}</p>
                        <p className="text-sm text-slate-500 mt-1">{assignment.stream?.name || 'All Streams'}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <AlertCircle className="mx-auto mb-2 text-slate-400" size={24} />
                    <p className="text-slate-500 font-medium">No assignments found for this teacher.</p>
                    <p className="text-sm text-slate-400 mt-1">First assign the teacher to a class/stream combination.</p>
                  </div>
                )}
              </div>

              {/* Step 2: Select Subjects */}
              {selectedAssignment && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-500" />
                    Step 2: Select Subjects to Assign
                  </h3>
                  <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2">
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
                          <p className="text-[10px] text-slate-400 font-medium">{subject.code}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 mt-3">
                    Selected: {selectedSubjectIds.length} subject{selectedSubjectIds.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Current Assignments Preview */}
              {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Currently Assigned Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.subjects.map((subject: any) => (
                      <span
                        key={subject.id}
                        className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full"
                      >
                        {subject.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleAssignSubject}
              disabled={syncing || !selectedAssignment || selectedSubjectIds.length === 0}
              className="w-full mt-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {syncing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Assign Selected Subjects
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;