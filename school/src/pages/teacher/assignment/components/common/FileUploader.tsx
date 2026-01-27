import React, { forwardRef, useState } from "react";
import { Upload } from "lucide-react";

interface FileUploaderProps {
  onFilesSelected: (files: FileList) => void;
  dragOverText?: string;
  maxFiles?: number;
  maxSizeText?: string;
  accept?: string;
}

const FileUploader = forwardRef<HTMLInputElement, FileUploaderProps>(({
  onFilesSelected,
  dragOverText = "Drag & drop files or browse",
  maxFiles = 10,
  maxSizeText = "Max 50MB per file",
  accept = "*"
}, ref) => {
  const [dragOver, setDragOver] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-4 transition-all ${dragOver ? 'border-violet-500 bg-violet-50' : 'border-slate-200'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={ref}
        multiple
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="text-center">
        <Upload size={24} className="mx-auto mb-2 text-slate-400" />
        <p className="text-sm text-slate-600 mb-2">
          {dragOverText}
        </p>
        <button
          type="button"
          onClick={() => (ref as React.MutableRefObject<HTMLInputElement>)?.current?.click()}
          className="text-violet-600 hover:text-violet-700 font-medium"
        >
          browse
        </button>
        <p className="text-xs text-slate-500 mt-2">
          {maxSizeText} • Max {maxFiles} files
        </p>
      </div>
    </div>
  );
});

FileUploader.displayName = 'FileUploader';

export default FileUploader;