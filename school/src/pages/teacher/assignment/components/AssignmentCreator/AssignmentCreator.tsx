import React, { useState, useRef } from "react";
import Card from "../../../../../components/common/Card";
import { PlusCircle, Copy, Loader2, Paperclip, Upload, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import FileUploader from "../common/FileUploader";
import FileIcon from "../common/FileIcon";
import { useFileHandler } from "../../hooks/useFileHandler";
import { type AssignmentType, type SubjectOption, type StudentAssignment,type UploadedFile } from "../../types/assignment.types";
import { ASSIGNMENT_TYPES, MAX_TOTAL_FILES } from "../../types/assignment.types";

interface AssignmentCreatorProps {
  selectedStream: string;
  students: StudentAssignment[];
  subjects: SubjectOption[];
  onBulkApply: (updates: Partial<StudentAssignment>) => void;
}

const AssignmentCreator: React.FC<AssignmentCreatorProps> = ({
  selectedStream,
  students,
  subjects,
  onBulkApply
}) => {
  const [bulkTitle, setBulkTitle] = useState<string>("");
  const [bulkDescription, setBulkDescription] = useState<string>("");
  const [bulkDate, setBulkDate] = useState<string>("");
  const [bulkSubject, setBulkSubject] = useState<string>("");
  const [bulkType, setBulkType] = useState<AssignmentType>("homework");
  const [bulkMaxScore, setBulkMaxScore] = useState<number>(100);
  const [bulkWeight, setBulkWeight] = useState<number>(10);
  const [bulkFiles, setBulkFiles] = useState<UploadedFile[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const { handleFileUpload, removeFile, formatFileSize } = useFileHandler();

  const handleApplyBulk = async () => {
    if (!bulkTitle.trim()) {
      toast.error("Please enter a title for the assignment");
      return;
    }

    if (!bulkDate) {
      toast.error("Please select a due date");
      return;
    }

    if (!bulkSubject) {
      toast.error("Please select a subject");
      return;
    }

    // Upload files first if any
    let uploadedFiles: UploadedFile[] = [];
    if (bulkFiles.length > 0) {
      setUploading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        uploadedFiles = bulkFiles.map(file => ({
          ...file,
          url: `https://example.com/uploads/${file.name}`,
          uploaded: true
        }));
        setBulkFiles(uploadedFiles);
      } catch (error) {
        toast.error("Failed to upload files");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onBulkApply({
      assignment: bulkTitle,
      description: bulkDescription,
      dueDate: bulkDate,
      subjectId: bulkSubject,
      assignmentType: bulkType,
      maxScore: bulkMaxScore,
      weight: bulkWeight,
      files: uploadedFiles
    });

    toast.success(`Bulk assignment applied to ${students.length} students`);
    setBulkFiles([]);
  };

  const handleBulkFileSelect = () => {
    bulkFileInputRef.current?.click();
  };

  const handleBulkFiles = async (files: FileList) => {
    const newFiles = await handleFileUpload(files, true);
    setBulkFiles(prev => {
      const updated = [...prev, ...newFiles];
      if (updated.length > MAX_TOTAL_FILES) {
        toast.error(`Maximum ${MAX_TOTAL_FILES} files allowed`);
        return updated.slice(0, MAX_TOTAL_FILES);
      }
      return updated;
    });
  };

  const removeBulkFile = (index: number) => {
    removeFile(bulkFiles, setBulkFiles, index);
  };

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6 bg-violet-600 text-white space-y-4">
      <div className="flex items-center gap-2">
        <PlusCircle size={18} />
        <h3 className="text-xs font-black uppercase tracking-widest text-violet-100">Quick Bulk Assign</h3>
      </div>
      
      <div className="space-y-3">
        <input 
          type="text" 
          placeholder="Assignment Title *"
          value={bulkTitle}
          onChange={(e) => setBulkTitle(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm placeholder:text-violet-200 focus:bg-white/20 outline-none transition-all"
        />
        
        <textarea 
          placeholder="Description (optional)"
          value={bulkDescription}
          onChange={(e) => setBulkDescription(e.target.value)}
          rows={2}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm placeholder:text-violet-200 focus:bg-white/20 outline-none transition-all resize-none"
        />
        
        <select
          value={bulkSubject}
          onChange={(e) => setBulkSubject(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm placeholder:text-violet-200 focus:bg-white/20 outline-none transition-all"
        >
          <option value="">Select Subject *</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
        
        <select
          value={bulkType}
          onChange={(e) => setBulkType(e.target.value as AssignmentType)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm placeholder:text-violet-200 focus:bg-white/20 outline-none transition-all"
        >
          {ASSIGNMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-violet-200 block mb-1">
              Max Score
            </label>
            <input 
              type="number" 
              min="1"
              max="1000"
              value={bulkMaxScore}
              onChange={(e) => setBulkMaxScore(parseInt(e.target.value) || 100)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm focus:bg-white/20 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-violet-200 block mb-1">
              Weight (%)
            </label>
            <input 
              type="number" 
              min="1"
              max="100"
              value={bulkWeight}
              onChange={(e) => setBulkWeight(parseInt(e.target.value) || 10)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm focus:bg-white/20 outline-none"
            />
          </div>
        </div>
        
        <input 
          type="date" 
          value={bulkDate}
          onChange={(e) => setBulkDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:bg-white/20 outline-none transition-all"
        />
        
        {/* File Upload Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-violet-200">
              Attachments ({bulkFiles.length}/{MAX_TOTAL_FILES})
            </label>
            <button
              type="button"
              onClick={() => setShowBulkUpload(!showBulkUpload)}
              className="text-xs text-violet-200 hover:text-white flex items-center gap-1"
            >
              {showBulkUpload ? 'Hide' : 'Add Files'}
              <Paperclip size={12} />
            </button>
          </div>
          
          {showBulkUpload && (
            <FileUploader
              onFilesSelected={handleBulkFiles}
              dragOverText="Drag & drop files or browse"
              maxFiles={MAX_TOTAL_FILES}
              maxSizeText={`Max ${formatFileSize(MAX_FILE_SIZE)} per file`}
              ref={bulkFileInputRef}
            />
          )}
          
          {/* File List */}
          {bulkFiles.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {bulkFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-2">
                  <div className="flex items-center gap-2 truncate">
                    <div className="text-violet-200">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs truncate">{file.name}</p>
                      <p className="text-[10px] text-violet-300">
                        {formatFileSize(file.size)} • {getFileCategory(file.type)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBulkFile(index)}
                    className="text-violet-300 hover:text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          onClick={handleApplyBulk}
          disabled={!selectedStream || !bulkTitle || !bulkDate || !bulkSubject || uploading}
          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            !selectedStream || !bulkTitle || !bulkDate || !bulkSubject || uploading
              ? 'bg-white/20 text-white/50 cursor-not-allowed'
              : 'bg-white text-violet-600 hover:bg-violet-50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Copy size={14} /> Apply to {students.length} Students
            </>
          )}
        </button>
      </div>
    </Card>
  );
};

// Helper functions (move these to utils)
import { FILE_CATEGORIES, MAX_FILE_SIZE } from "../../types/assignment.types";
import { 
  FileTextIcon, 
  FileSpreadsheet, 
  Image, 
  Video, 
  Music, 
  FileArchive, 
  FileCode, 
  Book, 
  FilePieChart, 
  File 
} from "lucide-react";

const getFileIcon = (fileType: string) => {
  const extension = fileType.toLowerCase();
  
  if (FILE_CATEGORIES.document.some(ext => extension.endsWith(ext))) return <FileTextIcon size={16} />;
  if (FILE_CATEGORIES.spreadsheet.some(ext => extension.endsWith(ext))) return <FileSpreadsheet size={16} />;
  if (FILE_CATEGORIES.image.some(ext => extension.endsWith(ext))) return <Image size={16} />;
  if (FILE_CATEGORIES.video.some(ext => extension.endsWith(ext))) return <Video size={16} />;
  if (FILE_CATEGORIES.audio.some(ext => extension.endsWith(ext))) return <Music size={16} />;
  if (FILE_CATEGORIES.archive.some(ext => extension.endsWith(ext))) return <FileArchive size={16} />;
  if (FILE_CATEGORIES.code.some(ext => extension.endsWith(ext))) return <FileCode size={16} />;
  if (FILE_CATEGORIES.ebook.some(ext => extension.endsWith(ext))) return <Book size={16} />;
  if (FILE_CATEGORIES.presentation.some(ext => extension.endsWith(ext))) return <FilePieChart size={16} />;
  return <File size={16} />;
};

const getFileCategory = (fileType: string) => {
  const extension = fileType.toLowerCase();
  
  if (FILE_CATEGORIES.document.some(ext => extension.endsWith(ext))) return 'Document';
  if (FILE_CATEGORIES.spreadsheet.some(ext => extension.endsWith(ext))) return 'Spreadsheet';
  if (FILE_CATEGORIES.image.some(ext => extension.endsWith(ext))) return 'Image';
  if (FILE_CATEGORIES.video.some(ext => extension.endsWith(ext))) return 'Video';
  if (FILE_CATEGORIES.audio.some(ext => extension.endsWith(ext))) return 'Audio';
  if (FILE_CATEGORIES.archive.some(ext => extension.endsWith(ext))) return 'Archive';
  if (FILE_CATEGORIES.code.some(ext => extension.endsWith(ext))) return 'Code';
  if (FILE_CATEGORIES.ebook.some(ext => extension.endsWith(ext))) return 'E-book';
  if (FILE_CATEGORIES.presentation.some(ext => extension.endsWith(ext))) return 'Presentation';
  return 'Other';
};

export default AssignmentCreator;