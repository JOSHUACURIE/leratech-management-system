import React, { useState, useEffect, useCallback } from "react";
import Card from "../../../components/common/Card";
import { 
  ClipboardCheck, 
  DownloadCloud, 
  FileBarChart, 
  AlertTriangle, 
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  CalendarDays,
  BookOpen,
  Users2,
  Clock,
  Loader2,
  FileQuestion,
  FileUp,
  CheckCircle2,
  X,
  Paperclip,
  Send,
  Eye,
  FileText,
  ChevronLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { assignmentAPI } from "../../../services/api";
import { 
  AssignmentDetail, 
  AssignmentSubmission, 
  AssignmentType,
  ASSIGNMENT_TYPES 
} from "../../types/assignment.types";
import SubmissionGrader from "./SubmissionGrader";

interface AssignmentViewerProps {
  selectedClass: string;
  selectedStream: string;
  selectedTerm: string;
  selectedAcademicYear: string;
}

const AssignmentViewer: React.FC<AssignmentViewerProps> = ({
  selectedClass,
  selectedStream,
  selectedTerm,
  selectedAcademicYear
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDetail | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentDetail[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    type: 'all',
    date: 'all'
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });

  const fetchAssignments = useCallback(async () => {
    try {
      setLoadingAssignments(true);
      const response = await assignmentAPI.getTeacherAssignments();
      
      if (response.data?.success) {
        const assignmentsData = response.data.data || response.data.assignments || [];
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async (assignmentId: string) => {
    try {
      setLoadingSubmissions(true);
      const response = await assignmentAPI.getAssignmentSubmissions(assignmentId);
      
      if (response.data?.success) {
        const submissionsData = response.data.data || response.data.submissions || [];
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  const handleSelectAssignment = async (assignment: AssignmentDetail) => {
    setSelectedAssignment(assignment);
    setViewMode('detail');
    await fetchSubmissions(assignment.id);
  };

  const downloadAllSubmissions = async () => {
    if (!selectedAssignment) return;

    try {
      const response = await assignmentAPI.downloadSubmissions(selectedAssignment.id);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `submissions-${selectedAssignment.title}-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading submissions:", error);
      toast.error("Failed to download submissions");
    }
  };

  const exportGrades = async () => {
    if (!selectedAssignment) return;

    try {
      const csvContent = [
        ['Student ID', 'Name', 'Admission Number', 'Grade', 'Feedback', 'Status', 'Submitted At'],
        ...submissions.map(sub => [
          sub.student_id,
          sub.student_name || '',
          sub.admission_number || '',
          sub.grade || '',
          sub.feedback || '',
          sub.status,
          new Date(sub.submitted_at).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `grades-${selectedAssignment.title}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Grades exported successfully");
    } catch (error) {
      console.error("Error exporting grades:", error);
      toast.error("Failed to export grades");
    }
  };

  const sendReminder = async () => {
    if (!selectedAssignment) return;

    const missingSubmissions = submissions.filter(sub => sub.status === 'missing');
    
    try {
      const response = await assignmentAPI.sendReminders(selectedAssignment.id, {
        student_ids: missingSubmissions.map(sub => sub.student_id),
        message: `Reminder: Assignment "${selectedAssignment.title}" is due on ${new Date(selectedAssignment.due_date).toLocaleDateString()}. Please submit your work.`
      });

      if (response.data?.success) {
        toast.success(`Reminders sent to ${missingSubmissions.length} students`);
      }
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Failed to send reminders");
    }
  };

  useEffect(() => {
    let filtered = [...assignments];

    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeFilters.type !== 'all') {
      filtered = filtered.filter(assignment => assignment.assignment_type === activeFilters.type);
    }

    if (selectedDateRange.start && selectedDateRange.end) {
      filtered = filtered.filter(assignment => {
        const dueDate = new Date(assignment.due_date);
        const start = new Date(selectedDateRange.start);
        const end = new Date(selectedDateRange.end);
        return dueDate >= start && dueDate <= end;
      });
    }

    if (activeFilters.status !== 'all') {
      filtered = filtered.filter(assignment => {
        if (!assignment.submission_stats) return false;
        
        switch (activeFilters.status) {
          case 'graded':
            return assignment.submission_stats.graded === assignment.total_students;
          case 'partial':
            return assignment.submission_stats.graded > 0 && 
                   assignment.submission_stats.graded < assignment.total_students;
          case 'ungraded':
            return assignment.submission_stats.graded === 0;
          case 'late':
            return assignment.submission_stats.late > 0;
          default:
            return true;
        }
      });
    }

    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, activeFilters, selectedDateRange]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Assignment Submissions</h2>
            <p className="text-slate-500">View, grade, and manage student submissions</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAssignments}
            disabled={loadingAssignments}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loadingAssignments ? "animate-spin" : ""} />
            {loadingAssignments ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Filters */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-lg rounded-[2rem] p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Filter size={16} /> Filters
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={activeFilters.status}
                  onChange={(e) => setActiveFilters({...activeFilters, status: e.target.value})}
                >
                  <option value="all">All Statuses</option>
                  <option value="graded">Fully Graded</option>
                  <option value="partial">Partially Graded</option>
                  <option value="ungraded">Not Graded</option>
                  <option value="late">With Late Submissions</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Assignment Type</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={activeFilters.type}
                  onChange={(e) => setActiveFilters({...activeFilters, type: e.target.value})}
                >
                  <option value="all">All Types</option>
                  {ASSIGNMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Date Range</label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={selectedDateRange.start}
                  onChange={(e) => setSelectedDateRange({...selectedDateRange, start: e.target.value})}
                />
                <input
                  type="date"
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={selectedDateRange.end}
                  onChange={(e) => setSelectedDateRange({...selectedDateRange, end: e.target.value})}
                />
              </div>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilters({status: 'all', type: 'all', date: 'all'});
                  setSelectedDateRange({start: '', end: ''});
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
              ></button>