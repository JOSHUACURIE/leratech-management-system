import { FILE_CATEGORIES, MAX_FILE_SIZE, type UploadedFile } from "../types/assignment.types";
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

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileType: string) => {
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

export const getFileCategory = (fileType: string): string => {
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

export const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `File size too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
  }
  
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allExtensions = Object.values(FILE_CATEGORIES).flat();
  
  if (!allExtensions.some(ext => extension === ext)) {
    return 'File type not supported';
  }
  
  return null;
};