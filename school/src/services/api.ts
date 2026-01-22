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

  // Students
  getClassStudents: (classId: string, streamId: string) => 
    api.get(`/teachers/classes/${classId}/streams/${streamId}/students`),

  getClassRegistry: (classId: string) => api.get(`/classes/${classId}/registry`),

  // Score Management
  submitScore: (data: ScoreSubmissionData) => 
    api.post('/scores/submit', data),

  getStudentsForScoreEntry: (params: StudentsForScoreEntryParams) => 
    api.get('/teachers/scores/students', { params }),

  getAssessmentsForSubject: (subjectId: string) => 
    api.get(`/teachers/subjects/${subjectId}/assessments`),

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
  level: number;
}

export interface StreamOption {
  id: string;
  name: string;
  class_id: string;
}

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export interface TermOption {
  id: string;
  name: string;
  is_current: boolean;
  start_date?: string;
  end_date?: string;
}

export default api;