import React, { useState } from "react";
import Card from "../../../../../components/common/Card";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Paperclip, 
  Download,
  Loader2,
  Send,
  FileText,
  UserCheck,
  ChevronDown
} from "lucide-react";
import { type AssignmentDetail, type AssignmentSubmission } from "../../types/assignment.types";
import {  formatFileSize } from "../../utils/fileUtils";
import FileIcon from "../common/FileIcon";

interface SubmissionGraderProps {
  assignment: AssignmentDetail;
  submissions: AssignmentSubmission[];
  loading: boolean;
  onGradeUpdate: (submissionId: string, grade: number, feedback: string) => Promise<void>;
  onBulkGrade: (grade: number, feedback: string, studentIds: string[]) => Promise<void>;
}

const SubmissionGrader: React.FC<SubmissionGraderProps> = ({
  assignment,
  submissions,
  loading,
  onGradeUpdate,
  onBulkGrade
}) => {
  const [bulkGrade, setBulkGrade] = useState<string>('');
  const [bulkFeedback, setBulkFeedback] = useState<string>('');
  const [showGradingPanel, setShowGradingPanel] = useState<boolean>(false);
  const [gradingData, setGradingData] = useState<Record<string, {grade: string, feedback: string}>>({});

  const handleGradeSubmit = async (submissionId: string) => {
    const data = gradingData[submissionId];
    if (data && data.grade) {
      await onGradeUpdate(submissionId, parseFloat(data.grade), data.feedback || '');
    }
  };

  const handleBulkGrade = async () => {
    if (!bulkGrade) return;

    const studentIds = submissions
      .filter(sub => sub.status === 'submitted' || sub.status === 'late')
      .map(sub => sub.student_id);

    if (studentIds.length > 0) {
      await onBulkGrade(parseFloat(bulkGrade), bulkFeedback, studentIds);
      setBulkGrade('');
      setBulkFeedback('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded': return 'bg-emerald-500';
      case 'submitted': return 'bg-blue-500';
      case 'late': return 'bg-amber-500';
      case 'missing': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded': return <CheckCircle2 size={12} className="text-emerald-500" />;
      case 'submitted': return <Clock size={12} className="text-blue-500" />;
      case 'late': return <AlertTriangle size={12} className="text-amber-500" />;
      case 'missing': return <AlertTriangle size={12} className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <>
      {/* Bulk Grading Panel */}
      <Card className="border-none shadow-lg rounded-[2rem] p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-800">Quick Grading</h4>
          <button
            onClick={() => setShowGradingPanel(!showGradingPanel)}
            className="text-slate-500 hover:text-slate-700"
          >
            {showGradingPanel ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showGradingPanel && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Grade</label>
                <input
                  type="number"
                  min="0"
                  max={assignment.max_score}
                  className="w-full bg-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={bulkGrade}
                  onChange={(e) => setBulkGrade(e.target.value)}
                  placeholder={`0-${assignment.max_score}`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Feedback</label>
                <input
                  type="text"
                  className="w-full bg-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={bulkFeedback}
                  onChange={(e) => setBulkFeedback(e.target.value)}
                  placeholder="General feedback..."
                />
              </div>
            </div>
            <button
              onClick={handleBulkGrade}
              disabled={!bulkGrade}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply to All Ungraded Submissions
            </button>
          </div>
        )}
      </Card>

      {/* Submissions List */}
      <Card className="border-none shadow-lg rounded-[2rem] p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h4 className="font-bold text-slate-800">Student Submissions</h4>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-emerald-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600">No submissions yet</p>
            <p className="text-sm text-slate-400 mt-1">Submissions will appear here as students submit</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {submissions.map(submission => (
              <div key={submission.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(submission.status)}`} />
                      <h5 className="font-bold text-slate-800">
                        {submission.student_name}
                      </h5>
                      <span className="text-sm text-slate-500">
                        {submission.admission_number}
                      </span>
                      {getStatusIcon(submission.status)}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(submission.submitted_at).toLocaleString()}
                      </span>
                      {submission.status === 'late' && (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle size={12} /> Late Submission
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-800 mb-1">
                      {submission.grade !== undefined ? submission.grade : '--'}/{assignment.max_score}
                    </div>
                    <div className="text-xs text-slate-500">
                      {submission.status === 'graded' ? 'Graded' : 'Pending'}
                    </div>
                  </div>
                </div>
                
                {/* Submission Content */}
                {submission.files && submission.files.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-slate-600 mb-2">Attachments:</div>
                    <div className="flex flex-wrap gap-2">
                      {submission.files.map((file, index) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <FileIcon fileType={file.type} size={16} className="text-slate-400" />
                          <span className="text-sm">{file.name}</span>
                          <Download size={12} className="text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {submission.comment && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Student Comment:</div>
                    <p className="text-sm text-slate-700">{submission.comment}</p>
                  </div>
                )}
                
                {submission.feedback && (
                  <div className="mb-4 p-3 bg-emerald-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Your Feedback:</div>
                    <p className="text-sm text-slate-700">{submission.feedback}</p>
                  </div>
                )}
                
                {/* Grading Section */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Feedback</label>
                    <textarea
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                      rows={2}
                      defaultValue={submission.feedback || ''}
                      onChange={(e) => setGradingData({
                        ...gradingData,
                        [submission.id]: {
                          ...gradingData[submission.id],
                          feedback: e.target.value
                        }
                      })}
                      placeholder="Provide feedback to student..."
                    />
                  </div>
                  
                  <div className="w-32">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Grade</label>
                    <input
                      type="number"
                      min="0"
                      max={assignment.max_score}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-center font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      defaultValue={submission.grade || ''}
                      onChange={(e) => setGradingData({
                        ...gradingData,
                        [submission.id]: {
                          ...gradingData[submission.id],
                          grade: e.target.value
                        }
                      })}
                      placeholder="0-100"
                    />
                  </div>
                  
                  <button
                    onClick={() => handleGradeSubmit(submission.id)}
                    className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap"
                  >
                    Save Grade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
};

export default SubmissionGrader;