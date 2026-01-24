import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;

      let errorMessage = data?.error || data?.message || 'Something went wrong';

      if (data?.errors) {
        errorMessage += `: ${Object.values(data.errors).join(', ')}`;
      }

      const formattedError = {
        message: errorMessage,
        status,
        data,
        isNetworkError: false,
        isAuthError: status === 401 || status === 403,
        isValidationError: status === 400,
        isServerError: status >= 500,
      };

      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        console.warn('Access token expired or invalid → logging out');
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('school');
        
        window.location.href = '/login';
        
        return Promise.reject(formattedError);
      }

      return Promise.reject(formattedError);
    } else if (error.request) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        isNetworkError: true,
        status: null,
      });
    } else {
      return Promise.reject({
        message: error.message || 'Request failed',
        isNetworkError: false,
        status: null,
      });
    }
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  login: (email: string, password: string, slug: string) =>
    api.post('/auth/login', { email, password, slug }),

  logout: () => api.post('/auth/logout'),

  getCurrentUser: () => api.get('/auth/me'),

  forgotPassword: (email: string, slug: string) =>
    api.post('/auth/forgot-password', { email, slug }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),
};

// ==================== SCHOOL API ====================
export const schoolAPI = {
  getSchoolInfo: (slug: string) => api.get(`/schools/${slug}`),
  checkSchoolSlug: (slug: string) => api.get(`/schools/check/${slug}`),
};

// ==================== SUBJECT API ====================
export const subjectAPI = {
  getAll: () => api.get('/subjects'),
  getByCategory: (category: string) => api.get(`/subjects/category/${category}`),
  create: (data: { code: string; name: string; category: string }) => 
    api.post('/subjects', data),
  update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`)
};

// ==================== CBC ASSESSMENT API ====================
export const cbcAPI = {
  // Data fetching routes
  getClasses: () => api.get('/cbc/classes'),
  getStreams: (classId: string) => api.get('/cbc/streams', { params: { classId } }),
  getSubjects: (classId?: string, streamId?: string) => 
    api.get('/cbc/subjects', { params: { classId, streamId } }),
  getTerms: () => api.get('/cbc/terms'),
  
  // Assessments
  getAssessmentsBySubject: (subjectId: string, params = {}) => 
    api.get(`/cbc/subjects/${subjectId}/assessments`, { params }),
  
  getSchemeTopicsBySubject: (subjectId: string) => 
    api.get(`/cbc/subjects/${subjectId}/scheme-topics`),
  
  // Students & Marking
  getStudentsForMarking: (params: { assessmentId: string; streamId: string }) => 
    api.get('/cbc/students', { params }),
  
  getMarkingSheet: (params: { assessmentId: string; classId: string; streamId: string }) => 
    api.get('/cbc/marking-sheet', { params }),
  
  // Score Submission
  submitScore: (data: {
    studentId: string;
    assessmentId: string;
    score: number;
    teacherNotes?: string;
    termId?: string;
    classId?: string;
    streamId?: string;
  }) => api.post('/cbc/submit-score', data),
  
  submitScoresBatch: (scores: Array<{
    studentId: string;
    assessmentId: string;
    score: number;
    teacherNotes?: string;
    termId?: string;
    classId?: string;
    streamId?: string;
  }>) => api.post('/cbc/submit-batch', { scores }),
  
  // Assessment Creation
  createAssessment: (data: {
    schemeTopicId: string;
    termId: string;
    classId: string;
    streamId: string;
    title: string;
    type: string;
    dueDate: string;
  }) => api.post('/cbc/assessment', data),
  
  // Reports
  getCurriculumCoverageReport: (params: { classId: string; termId: string }) => 
    api.get('/cbc/reports/coverage', { params }),
  
  getStrandMasteryReport: (params: { subjectId: string; classId: string; termId: string }) => 
    api.get('/cbc/reports/strand-mastery', { params }),
  
  // Scheme of Work
  submitSchemeForApproval: (data: { schemeId: string }) => 
    api.post('/cbc/scheme/submit', data),
  
  reviewSchemeOfWork: (data: { schemeId: string; status: string; notes?: string; deadline?: string }) => 
    api.put('/cbc/scheme/review', data),
  
  createRecordOfWork: (data: {
    schemeTopicId: string;
    lessonDate: string;
    challenges?: string;
    remarks?: string;
    topicsCovered?: string[];
  }) => api.post('/cbc/record', data),
};

// ==================== ATTENDANCE API ====================
export interface AttendanceParams {
  classId?: string;
  streamId?: string;
  subjectId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  termId?: string;
  studentId?: string;
}

export interface AttendanceData {
  classId: string;
  streamId: string;
  subjectId: string;
  attendanceDate: string;
  attendanceData: Array<{
    studentId: string;
    status: "present" | "absent" | "late" | "excused" | "sick";
    reason?: string;
  }>;
}

export interface AttendanceUpdateData {
  status: "present" | "absent" | "late" | "excused" | "sick";
  reason?: string;
}

export interface BulkAttendanceUpdateData {
  updates: Array<{
    attendanceId: string;
    status: "present" | "absent" | "late" | "excused" | "sick";
    reason?: string;
  }>;
}

export const attendanceAPI = {
  // Mark attendance
  markAttendance: (data: AttendanceData) => 
    api.post('/attendance/mark', data),

  // Get attendance by date
  getAttendanceByDate: (params: AttendanceParams) => 
    api.get('/attendance/by-date', { params }),

  // Update single attendance record
  updateAttendance: (attendanceId: string, data: AttendanceUpdateData) => 
    api.put(`/attendance/${attendanceId}`, data),

  // Get student attendance
  getStudentAttendance: (studentId: string, params?: Omit<AttendanceParams, 'studentId'>) => 
    api.get(`/attendance/student/${studentId}`, { params }),

  // Get class attendance
  getClassAttendance: (classId: string, params?: Omit<AttendanceParams, 'classId'>) => 
    api.get(`/attendance/class/${classId}`, { params }),

  // Get stream attendance
  getStreamAttendance: (streamId: string, params?: Omit<AttendanceParams, 'streamId'>) => 
    api.get(`/attendance/stream/${streamId}`, { params }),

  // Get attendance summary
  getAttendanceSummary: (params: AttendanceParams) => 
    api.get('/attendance/summary', { params }),

  // Bulk update attendance
  bulkUpdateAttendance: (data: BulkAttendanceUpdateData) => 
    api.put('/attendance/bulk/update', data),

  // Delete attendance record
  deleteAttendance: (attendanceId: string) => 
    api.delete(`/attendance/${attendanceId}`),

  // Reports
  getDailyReport: (params?: { date?: string }) => 
    api.get('/attendance/reports/daily', { params }),

  getMonthlyReport: (params?: { year?: string; month?: string; classId?: string }) => 
    api.get('/attendance/reports/monthly', { params }),

  getStudentAttendanceSummary: (studentId: string, params?: { month?: string; year?: string }) => 
    api.get(`/attendance/student/${studentId}/summary`, { params }),
};

// ==================== TEACHER API ====================
interface ScoreSubmissionData {
  studentId: string;
  subjectId: string;
  termId: string;
  assessmentId: string;
  score: string | number;
  teacherNotes?: string;
}

interface StudentsForScoreEntryParams {
  classId: string;
  streamId?: string;
  subjectId: string;
  assessmentId: string;
  termId?: string;
}

export const teacherAPI = {
  // Assignments
  getMyAssignments: (params?: {
    academic_year_id?: string;
    term_id?: string;
    status?: 'active' | 'all';
    include_subjects?: 'true' | 'false';
  }) => api.get('/teachers/me/assignments', { params }),

  // Subjects
  getMySubjects: () => api.get('/teachers/me/subjects'),

  // Workload
  getMyWorkload: () => api.get('/teachers/me/workload'),
  getMyLessonPlans: (params?: any) => 
    api.get('/lesson-plans', { params }),
    
  getLessonPlanDetails: (planId: string) => 
    api.get(`/lesson-plans/${planId}`),
  
  createLessonPlan: (data: any) => 
    api.post('/lesson-plans', data),
  
  updateLessonPlan: (planId: string, data: any) => 
    api.put(`/lesson-plans/${planId}`, data),
  
  deleteLessonPlan: (planId: string, data?: any) => 
    api.delete(`/lesson-plans/${planId}`, { data }),
  
  getLessonPlanTemplates: (params?: any) => 
    api.get('/lesson-plans/templates', { params }),
  
  createFromTemplate: (templateId: string, data: any) => 
    api.post(`/lesson-plans/templates/${templateId}`, data),
  
  duplicateLessonPlan: (planId: string, data?: any) => 
    api.post(`/lesson-plans/${planId}/duplicate`, data),
  
  exportLessonPlans: (params: any) => 
    api.get('/lesson-plans/export', { 
      params,
      responseType: 'blob' // Important for file downloads
    }),
  // Students
  getClassStudents: (classId: string, streamId?: string) => 
    api.get(`/teachers/classes/${classId}/streams/${streamId}/students`, { params: { streamId } }),

  getClassRegistry: (classId: string) => api.get(`/classes/${classId}/registry`),

  // Streams
  getClassStreams: (classId: string) => 
    api.get(`/classes/${classId}/streams`),

  // Teacher subjects for a stream
  getTeacherSubjects: (streamId: string) => 
    api.get(`/teachers/me/streams/${streamId}/subjects`),

  // Score Management
  submitScore: (data: ScoreSubmissionData) => 
    api.post('/scores/submit', data),

  getStudentsForScoreEntry: (params: StudentsForScoreEntryParams) => 
    api.get('/teachers/scores/students', { params }),

  getAssessmentsForSubject: (subjectId: string) => 
    api.get(`/teachers/subjects/${subjectId}/assessments`),

  // Attendance (Teacher-specific endpoints)
  getAttendanceByDate: (params: AttendanceParams) => 
    api.get('/attendance/by-date', { params }),

  markAttendance: (data: AttendanceData) => 
    api.post('/attendance/mark', data),

  // Pending & Activity
  getPendingSubmissions: () => api.get('/teachers/me/pending-submissions'),

  getRecentActivity: (limit = 5) => 
    api.get('/teachers/me/activity', { params: { limit } }),

  // CBC Assessment Methods (kept for backward compatibility)
  getCbcClasses: () => api.get('/cbc/classes'),
  getCbcStreams: (classId: string) => api.get('/cbc/streams', { params: { classId } }),
  getCbcSubjects: (classId?: string, streamId?: string) => 
    api.get('/cbc/subjects', { params: { classId, streamId } }),
  getCbcTerms: () => api.get('/cbc/terms'),
  getStudentsForCbcMarking: (params: { assessmentId: string; streamId: string }) => 
    api.get('/cbc/students', { params }),
  submitCbcScore: (data: {
    studentId: string;
    assessmentId: string;
    score: number;
    teacherNotes?: string;
    termId?: string;
    classId?: string;
    streamId?: string;
  }) => api.post('/cbc/submit-score', data),
  submitCbcScoresBatch: (scores: Array<{
    studentId: string;
    assessmentId: string;
    score: number;
    teacherNotes?: string;
    termId?: string;
    classId?: string;
    streamId?: string;
  }>) => api.post('/cbc/submit-batch', { scores }),
  
  getCbcStrandMasteryReport: (params: { subjectId: string; classId: string; termId: string }) => 
    api.get('/cbc/reports/strand-mastery', { params }),
};

// ==================== ACADEMIC API ====================
export const academicAPI = {
  // Academic Years
  getYears: () => api.get('/academic/years'),
  createYear: (data: { year_name: string; start_date: string; end_date: string; is_current: boolean }) => 
    api.post('/academic/years', data),
  getActiveYear: () => api.get('/academic/years/active'),

  // Academic Terms
  getTerms: (yearId: string) => api.get(`/academic/years/${yearId}/terms`),
  createTerm: (data: { academic_year_id: string; term_name: string; start_date: string; end_date: string; is_current: boolean }) => 
    api.post('/academic/terms', data),
  updateTerm: (id: string, data: any) => api.put(`/academic/terms/${id}`, data),
  getCurrentTerm: () => api.get('/academic/current-term'),

  // Grading Scale
  getGradingSystem: () => api.get('/grading/default'),
  updateGradeScale: (id: string, data: { minScore: number; maxScore: number; points: number; grade: string }) => 
    api.put(`/grading/scale/${id}`, data),
  updateRemark: (scaleId: string, description: string) => 
    api.patch('/grading/scales/remarks', { scaleId, description })
};

// ==================== USER API ====================
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/users/change-password', { currentPassword, newPassword }),
};

// ==================== CLASS API ====================
export const classAPI = {
  getAll: () => api.get('/classes'),
  getStreamsByClass: (classId: string) => api.get(`/streams?classId=${classId}`),
  getSubjects: () => api.get('/subjects'),
};

// ==================== STUDENT API ====================
export const studentAPI = {
  getAll: (search = "") => api.get(`/students?search=${search}`),
  create: (data: any) => api.post('/students', data),
  delete: (id: string) => api.delete(`/students/${id}`),
  
  // Student attendance (for parents/students)
  getStudentAttendance: (studentId: string, params?: AttendanceParams) => 
    api.get(`/students/${studentId}/attendance`, { params }),
  
  getStudentAttendanceSummary: (studentId: string, params?: { month?: string; year?: string }) => 
    api.get(`/students/${studentId}/attendance/summary`, { params }),
};

// ==================== COMMON TYPES ====================
export interface ScoreSubmissionResponse {
  success: boolean;
  message: string;
  data: {
    studentId: string;
    score: number;
    grade: string;
    points: number;
    remarks: string;
  };
}

export interface StudentsForScoreEntryResponse {
  success: boolean;
  count: number;
  data: Array<{
    studentId: string;
    admissionNumber: string;
    fullName: string;
    existingScore: string | number;
    existingNotes: string;
  }>;
}

// Attendance Response Types
export interface AttendanceResponse {
  success: boolean;
  message: string;
  data: {
    summary?: Record<string, number>;
    total_students?: number;
    marked_count?: number;
    date?: string;
    class?: string;
    stream?: string;
    subject?: string;
    attendance?: Array<any>;
    attendance_by_stream?: Record<string, any[]>;
    statistics?: any;
    report_date?: string;
    daily_report?: any[];
    report_by_date?: Record<string, any>;
    monthly_totals?: Record<string, number>;
  };
}

// CBC-specific types
export interface CBCAssessment {
  id: string;
  title: string;
  type: string;
  max_score: number;
  created_at: string;
}

export interface SchemeTopic {
  id: string;
  topic_title: string;
  cbc_strand: string;
  cbc_sub_strand: string;
  week_number: number;
}

export interface CBCStudent {
  id: string;
  name: string;
  admissionNo: string;
  level: '' | 'Exceeding Expectation' | 'Meeting Expectation' | 'Approaching Expectation' | 'Below Expectation';
  comment: string;
  existingScore?: number | null;
  existingComment?: string;
}

export interface ClassOption {
  id: string;
  name: string;
  class_name: string;
  class_level: number;
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
  code?: string; // For backward compatibility
}

export interface TermOption {
  id: string;
  term_name: string;
  name?: string; // For backward compatibility
  is_current: boolean;
  start_date?: string;
  end_date?: string;
}

// Attendance-specific types
export interface StudentAttendance {
  id: string;
  studentId: string;
  admissionNumber: string;
  fullName: string;
  status: "present" | "absent" | "late" | "excused" | "sick";
  reason?: string;
  attendance_date: string;
  subject?: {
    name: string;
    subject_code: string;
  };
  teacher?: {
    teacher_code: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  sick: number;
  unmarked: number;
  total_students: number;
  attendance_rate: number;
}

export interface DailyAttendanceReport {
  class_id: string;
  class_name: string;
  total_records: number;
  breakdown: Record<string, number>;
}

export interface MonthlyAttendanceReport {
  month: number;
  year: number;
  report_by_date: Record<string, Record<string, number>>;
  monthly_totals: Record<string, number>;
  total_records: number;
}

export default api;