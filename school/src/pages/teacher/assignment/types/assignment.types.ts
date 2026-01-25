export type AssignmentType = 'homework' | 'project' | 'assessment' | 'quiz' | 'presentation';

export interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  class_id?: string;
  stream_id?: string;
}

export interface ClassOption {
  id: string;
  class_name: string;
  level: number;
  name?: string;
}

export interface StreamOption {
  id: string;
  name: string;
  class_id: string;
}

export interface SubjectOption {
  id: string;
  name: string;
  subject_code: string;
  code?: string;
  category?: string;
}

export interface TermOption {
  id: string;
  term_name: string;
  is_current: boolean;
  academic_year_id?: string;
  name?: string;
  start_date?: string;
  end_date?: string;
}

export interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface UploadedFile {
  id?: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
  previewUrl?: string;
  uploaded?: boolean;
  error?: string;
}

export interface StudentAssignment {
  student: Student;
  assignment?: string;
  description?: string;
  dueDate?: string;
  subjectId?: string;
  assignmentType?: AssignmentType;
  maxScore?: number;
  weight?: number;
  files?: UploadedFile[];
}

export interface AssignmentSubmission {
  id: string;
  student_id: string;
  assignment_id: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'late' | 'missing';
  grade?: number;
  feedback?: string;
  files?: UploadedFile[];
  student_name?: string;
  admission_number?: string;
  comment?: string;
}

export interface AssignmentDetail {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  subject_name?: string;
  class_id: string;
  stream_id: string;
  term_id: string;
  academic_year_id: string;
  due_date: string;
  assignment_type: AssignmentType;
  max_score: number;
  weight: number;
  is_published: boolean;
  created_at: string;
  total_students: number;
  submissions_count: number;
  graded_count: number;
  average_score?: number;
  submission_stats?: {
    submitted: number;
    graded: number;
    late: number;
    missing: number;
  };
}

// Cache types
export interface CacheData {
  timestamp: number;
  data: any;
  expiry: number;
}

export interface CacheStore {
  classes?: CacheData;
  streams?: Record<string, CacheData>;
  subjects?: Record<string, CacheData>;
  students?: Record<string, CacheData>;
  terms?: CacheData;
  academicYears?: CacheData;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// File categories
export const FILE_CATEGORIES = {
  document: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
  spreadsheet: ['.xls', '.xlsx', '.csv', '.ods'],
  presentation: ['.ppt', '.pptx', '.odp'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
  video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  code: ['.js', '.ts', '.html', '.css', '.py', '.java', '.cpp', '.c'],
  ebook: ['.epub', '.mobi', '.azw']
} as const;

// Constants
export const CACHE_EXPIRY = 5 * 60 * 1000;
export const LOCAL_STORAGE_KEY = 'assignment-manager-cache-v5';
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_TOTAL_FILES = 10;

export const ASSIGNMENT_TYPES: Array<{value: AssignmentType, label: string}> = [
  { value: 'homework', label: 'Homework' },
  { value: 'project', label: 'Project' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'presentation', label: 'Presentation' }
];