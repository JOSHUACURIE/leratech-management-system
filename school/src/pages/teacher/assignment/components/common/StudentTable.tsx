import React, { useState, useRef } from "react";
import Card from "../../../../../components/common/Card";
import { 
  Search, 
  Download, 
  Calendar as CalendarIcon, 
  FileText, 
  Paperclip, 
  X, 
  Send, 
  Loader2, 
  CheckCircle,
  Users,
  AlertCircle,
  ChevronDown,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";

import { useFileHandler } from "../../hooks/useFileHandler";
import { formatFileSize, getFileCategory } from "../../utils/fileUtils";
import FileIcon from "./FileIcon";
import { 
  type StudentAssignment, 
  type SubjectOption, 
 type  AssignmentType,
  ASSIGNMENT_TYPES 
} from "../../types/assignment.types";

interface StudentTableProps {
  selectedStream: string;
  filteredStudents: StudentAssignment[];
  subjects: SubjectOption[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onStudentUpdate: (studentId: string, updates: Partial<StudentAssignment>) => void;
  onPublish: (saving: boolean, setSaving: (saving: boolean) => void) => Promise<void>;
}

const StudentTable: React.FC<StudentTableProps> = ({
  selectedStream,
  filteredStudents,
  subjects,
  searchQuery,
  onSearchChange,
  onStudentUpdate,
  onPublish
}) => {
  const [saving, setSaving] = useState<boolean>(false);
  const { handleFileUpload, removeFile } = useFileHandler();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAssignmentChange = (studentId: string, value: string) => {
    onStudentUpdate(studentId, { assignment: value });
  };

  const handleDescriptionChange = (studentId: string, value: string) => {
    onStudentUpdate(studentId, { description: value });
  };

  const handleDueDateChange = (studentId: string, value: string) => {
    onStudentUpdate(studentId, { dueDate: value });
  };

  const handleSubjectChange = (studentId: string, value: string) => {
    onStudentUpdate(studentId, { subjectId: value });
  };

  const handleTypeChange = (studentId: string, value: string) => {
    onStudentUpdate(studentId, { assignmentType: value as AssignmentType });
  };

  const handleStudentFilesUpload = async (studentId: string, files: FileList) => {
    const validFiles = await handleFileUpload(files, false);
    
    if (validFiles.length > 0) {
      onStudentUpdate(studentId, { 
        files: [...(filteredStudents.find(s => s.student.id === studentId)?.files || []), ...validFiles]
      });
    }
  };

  const removeStudentFile = (studentId: string, fileIndex: number) => {
    const student = filteredStudents.find(s => s.student.id === studentId);
    if (student) {
      const updatedFiles = student.files?.filter((_, i) => i !== fileIndex) || [];
      onStudentUpdate(studentId, { files: updatedFiles });
    }
  };

  const handlePublishAssignments = async () => {
    await onPublish(saving, setSaving);
  };

  const handleExportAssignments = () => {
    const assignmentsToExport = filteredStudents
      .filter(s => s.assignment && s.dueDate && s.subjectId)
      .map(s => ({
        student: `${s.student.first_name} ${s.student.last_name}`,
        admission_number: s.student.admission_number,
        assignment: s.assignment,
        description: s.description || '',
        subject: subjects.find(sub => sub.id === s.subjectId)?.name || '',
        type: s.assignmentType || 'homework',
        due_date: s.dueDate,
        max_score: s.maxScore || 100,
        weight: s.weight || 10,
        files_count: s.files?.length || 0
      }));

    if (assignmentsToExport.length === 0) {
      toast.error("No assignments to export");
      return;
    }

    const csvContent = [
      ['Student', 'Admission Number', 'Assignment', 'Description', 'Subject', 'Type', 'Due Date', 'Max Score', 'Weight', 'Files'],
      ...assignmentsToExport.map(a => [
        a.student,
        a.admission_number,
        a.assignment,
        a.description,
        a.subject,
        a.type,
        a.due_date,
        a.max_score,
        a.weight,
        a.files_count
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `assignments-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success("Assignments exported successfully");
  };

  const totalAssignments = filteredStudents.filter(s => s.assignment).length;
  const totalFiles = filteredStudents.reduce((acc, s) => acc + (s.files?.length || 0), 0);

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-0 overflow-hidden bg-white min-h-[500px]">
      <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div className="relative w-1/2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Search students by name or admission number..." 
            className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500/10" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAssignments}
            disabled={filteredStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <Download size={14} /> Export
          </button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {filteredStudents.length} Learners
          </span>
        </div>
      </div>

      {!selectedStream ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Users size={48} className="mb-4" />
          <p className="text-lg font-medium mb-2">Select a Class and Stream</p>
          <p className="text-sm text-slate-500">Choose a class and stream to view students</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <AlertCircle size={48} className="mb-4" />
          <p className="text-lg font-medium mb-2">No Students Found</p>
          <p className="text-sm text-slate-500">No students match your search criteria</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                <th className="px-6 py-4 text-left">Student</th>
                <th className="px-6 py-4 text-left">Assignment Details</th>
                <th className="px-6 py-4 text-left">Subject</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Due Date</th>
                <th className="px-6 py-4 text-left">Files</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((studentAssignment) => (
                <tr key={studentAssignment.student.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition-all">
                        {studentAssignment.student.first_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-700">
                          {studentAssignment.student.first_name} {studentAssignment.student.last_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {studentAssignment.student.admission_number}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <div className="relative flex items-center">
                        <FileText size={14} className="absolute left-3 text-slate-300" />
                        <input
                          type="text"
                          placeholder="Assignment title..."
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-violet-500/10 transition-all"
                          value={studentAssignment.assignment || ""}
                          onChange={(e) => handleAssignmentChange(studentAssignment.student.id, e.target.value)}
                        />
                      </div>
                      <textarea
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl text-xs text-slate-600 focus:bg-white focus:ring-2 focus:ring-violet-500/10 transition-all resize-none"
                        rows={1}
                        value={studentAssignment.description || ""}
                        onChange={(e) => handleDescriptionChange(studentAssignment.student.id, e.target.value)}
                      />
                    </div>
                  </td>
                  
                  <td className="px-6 py-5">
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                      value={studentAssignment.subjectId || ""}
                      onChange={(e) => handleSubjectChange(studentAssignment.student.id, e.target.value)}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </td>
                  
                  <td className="px-6 py-5">
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                      value={studentAssignment.assignmentType || ""}
                      onChange={(e) => handleTypeChange(studentAssignment.student.id, e.target.value)}
                    >
                      <option value="">Select Type</option>
                      {ASSIGNMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </td>
                  
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-slate-300" />
                      <input
                        type="date"
                        className="bg-transparent border-none text-xs font-bold text-slate-500 outline-none"
                        value={studentAssignment.dueDate || ""}
                        onChange={(e) => handleDueDateChange(studentAssignment.student.id, e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </td>
                  
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => e.target.files && handleStudentFilesUpload(studentAssignment.student.id, e.target.files)}
                        className="hidden"
                        ref={el => fileInputRefs.current[studentAssignment.student.id] = el}
                        id={`file-upload-${studentAssignment.student.id}`}
                      />
                      <label
                        htmlFor={`file-upload-${studentAssignment.student.id}`}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 cursor-pointer"
                      >
                        <Paperclip size={12} />
                        <span>Add files</span>
                      </label>
                      
                      {/* File List */}
                      {studentAssignment.files && studentAssignment.files.length > 0 && (
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {studentAssignment.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-1.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <div className="text-slate-400">
                                  <FileIcon fileType={file.type} size={16} className="text-slate-400" />
                                </div>
                                <div className="truncate">
                                  <p className="text-[10px] truncate">{file.name}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {formatFileSize(file.size)} • {getFileCategory(file.type)}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeStudentFile(studentAssignment.student.id, index)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sticky Action Footer */}
      <div className="p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-100 sticky bottom-0 z-10">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle size={16} />
          <span className="text-xs font-black uppercase tracking-widest">
            {totalAssignments} assignments • {totalFiles} files
          </span>
        </div>
        
        <button
          onClick={handlePublishAssignments}
          disabled={saving || totalAssignments === 0}
          className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all ${
            saving || totalAssignments === 0
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-violet-600 hover:-translate-y-1 active:scale-95'
          }`}
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Publishing...
            </>
          ) : (
            <>
              <Send size={18} /> Publish to Portal
            </>
          )}
        </button>
      </div>
    </Card>
  );
};

export default StudentTable;