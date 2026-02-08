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

// ==================== ASSIGNMENT API ====================
export interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  subject_id: string;
  class_id: string;
  stream_id?: string;
  term_id: string;
  academic_year_id: string;
  assignment_type: string;
  format: string;
  publish_date: string;
  due_date: string;
  allow_late_submission: boolean;
  late_submission_deadline?: string;
  is_timed: boolean;
  time_limit_minutes?: number;
  auto_submit: boolean;
  max_score: number;
  pass_score?: number;
  weight: number;
  grading_rubric?: any;
  show_rubric_to_students: boolean;
  group_size?: number;
  allow_student_group_creation: boolean;
  allow_resources: boolean;
  max_file_size_mb: number;
  allowed_file_types: string;
  is_published: boolean;
  is_draft: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  subject?: {
    id: string;
    name: string;
    subject_code: string;
  };
  class?: {
    id: string;
    class_name: string;
  };
  stream?: {
    id: string;
    name: string;
  };
  term?: {
    id: string;
    term_name: string;
  };
  teacher?: {
    id: string;
    user: {
      first_name: string;
      last_name: string;
    };
  };
  submissions?: AssignmentSubmission[];
}
//scheme related types
export interface SchemeParams {
  status?: string;
  subjectId?: string;
  classId?: string;
  termId?: string;
  search?: string;
}

export interface RecordParams {
  status?: string;
  subjectId?: string;
  classId?: string;
  termId?: string;
  week?: number;
  schemeId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CoverageParams {
  termId?: string;
  subjectId?: string;
}

export interface ExportParams {
  format?: 'pdf' | 'excel' | 'json';
  startDate?: string;
  endDate?: string;
}

export interface SchemeTopicParams {
  week?: number;
}

// Define data types for requests
export interface CreateSchemeData {
  title: string;
  subject_id: string;
  class_id: string;
  stream_id?: string;
  term_id: string;
  academic_year_id: string;
  description?: string;
}

export interface UpdateSchemeData {
  title?: string;
  description?: string;
  status?: string;
}

export interface CreateTopicData {
  topic_title: string;
  week_number: number;
  cbc_strand?: string;
  cbc_sub_strand?: string;
  learning_objectives?: string[];
  key_activities?: string[];
  resources_needed?: string[];
  assessment_methods?: string[];
}

export interface UpdateTopicData {
  topic_title?: string;
  week_number?: number;
  cbc_strand?: string;
  cbc_sub_strand?: string;
  learning_objectives?: string[];
  key_activities?: string[];
  resources_needed?: string[];
  assessment_methods?: string[];
}

export interface CreateRecordData {
  week_number: number;
  lesson_date: string;
  topics_covered: string[];
  activities_done?: string[];
  challenges?: string;
  remarks?: string;
  subject_id: string;
  class_id: string;
  term_id: string;
  scheme_of_work_id?: string;
  scheme_topic_id?: string;
}

export interface UpdateRecordData {
  lesson_date?: string;
  topics_covered?: string[];
  activities_done?: string[];
  challenges?: string;
  remarks?: string;
}

export interface DuplicateSchemeData {
  title?: string;
}
export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  group_id?: string;
  submitted_by_id: string;
  submission_type: string;
  submission_text?: string;
  word_count: number;
  started_at?: string;
  submitted_at: string;
  time_taken_minutes?: number;
  status: string;
  is_late: boolean;
  late_minutes?: number;
  score?: number;
  percentage?: number;
  grade?: string;
  feedback?: string;
  rubric_scores?: any;
  graded_by?: string;
  graded_at?: string;
  ip_address?: string;
  user_agent?: string;
  attachments?: AssignmentAttachment[];
  answers?: AssessmentAnswer[];
  student?: {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
  };
  group?: {
    id: string;
    group_name: string;
  };
}

export interface AssignmentAttachment {
  id: string;
  submission_id: string;
  attachment_type: string;
  file_url: string;
  file_name: string;
  display_order: number;
  file_size: number;
}

export interface AssessmentQuestion {
  id: string;
  assignment_id: string;
  question_type: string;
  question_text: string;
  question_order: number;
  points: number;
  is_required: boolean;
  options?: any;
  correct_answer?: any;
  multiple_correct: boolean;
  correct_answers?: any[];
  matching_pairs?: any;
  word_limit?: number;
  expected_keywords?: string[];
  explanation?: string;
  allow_attachments: boolean;
}

export interface AssessmentAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  student_answer?: string;
  selected_options?: any[];
  matching_answers?: any;
  attachment_url?: string;
  attachment_name?: string;
  time_spent_seconds?: number;
  question?: AssessmentQuestion;
}

export interface AssignmentStatistics {
  total_students: number;
  total_submitted: number;
  total_graded: number;
  submission_rate: number;
  grading_completion: number;
  average_score: number;
  late_submissions: number;
  late_percentage: number;
  submissions_by_status: {
    draft: number;
    submitted: number;
    late: number;
    graded: number;
    returned: number;
  };
}

export interface SchoolAssignmentStatistics {
  total_assignments: number;
  published_assignments: number;
  graded_assignments: number;
  publication_rate: number;
  grading_rate: number;
  average_submissions_per_assignment: number;
  assignments_by_type: Record<string, number>;
  submissions_by_status: Record<string, number>;
  top_teachers: Array<{
    teacher_id: string;
    teacher_name: string;
    assignments_count: number;
  }>;
}

export const assignmentAPI = {
  // ========== TEACHER ENDPOINTS ==========
  createAssignment: (data: {
    title: string;
    description?: string;
    instructions?: string;
    subject_id: string;
    class_id: string;
    stream_id?: string;
    term_id: string;
    academic_year_id: string;
    assignment_type?: string;
    format?: string;
    publish_date?: string;
    due_date: string;
    allow_late_submission?: boolean;
    late_submission_deadline?: string;
    is_timed?: boolean;
    time_limit_minutes?: number;
    auto_submit?: boolean;
    max_score?: number;
    pass_score?: number;
    weight?: number;
    grading_rubric?: any;
    show_rubric_to_students?: boolean;
    group_size?: number;
    allow_student_group_creation?: boolean;
    allow_resources?: boolean;
    max_file_size_mb?: number;
    allowed_file_types?: string;
    student_ids?: string[];
  }) => api.post('/assignments/teacher', data),

  getTeacherAssignments: (params?: {
    status?: string;
    assignment_type?: string;
    term_id?: string;
    subject_id?: string;
    page?: number;
    limit?: number;
  }) => api.get('/assignments/teacher', { params }),

  updateAssignment: (assignmentId: string, data: any) =>
    api.put(`/assignments/teacher/${assignmentId}`, data),

  publishAssignment: (assignmentId: string) =>
    api.post(`/assignments/teacher/${assignmentId}/publish`),

  getAssignmentSubmissions: (assignmentId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/assignments/teacher/${assignmentId}/submissions`, { params }),

  gradeSubmission: (submissionId: string, data: {
    score: number;
    feedback?: string;
    rubric_scores?: any;
  }) => api.post(`/assignments/teacher/${submissionId}/grade`, data),

  addAssessmentQuestions: (assignmentId: string, data: {
    questions: Array<{
      question_type: string;
      question_text: string;
      question_order?: number;
      points?: number;
      is_required?: boolean;
      options?: any;
      correct_answer?: any;
      multiple_correct?: boolean;
      correct_answers?: any[];
      matching_pairs?: any;
      word_limit?: number;
      expected_keywords?: string[];
      explanation?: string;
      allow_attachments?: boolean;
    }>;
  }) => api.post(`/assignments/teacher/${assignmentId}/questions`, data),

  getAssignmentStatistics: (assignmentId: string) =>
    api.get(`/assignments/teacher/${assignmentId}/statistics`),

  // ========== STUDENT ENDPOINTS ==========
  getStudentAssignments: (params?: {
    status?: string;
    assignment_type?: string;
    term_id?: string;
    subject_id?: string;
    page?: number;
    limit?: number;
  }) => api.get('/assignments/student', { params }),

  getAssignmentDetails: (assignmentId: string) =>
    api.get(`/assignments/student/${assignmentId}`),

  getStudentSubmission: (assignmentId: string) =>
    api.get(`/assignments/student/${assignmentId}/submission`),

  submitAssignment: (assignmentId: string, data: {
    submission_text?: string;
    attachment_urls?: string[];
    group_id?: string;
    answers?: Array<{
      question_id: string;
      student_answer?: string;
      selected_options?: any[];
      matching_answers?: any;
      attachment_url?: string;
      attachment_name?: string;
      time_spent_seconds?: number;
    }>;
  }) => api.post(`/assignments/student/${assignmentId}/submit`, data),

  startTimedAssessment: (assignmentId: string) =>
    api.post(`/assignments/student/${assignmentId}/start`),

  joinAssignmentGroup: (assignmentId: string, data: {
    group_code: string;
  }) => api.post(`/assignments/student/${assignmentId}/join-group`, data),

  // ========== PARENT ENDPOINTS ==========
  getParentChildren: () =>
    api.get('/assignments/parent/children'),

  getChildAssignments: (childId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/assignments/parent/${childId}/assignments`, { params }),

  getChildAssignmentDetails: (childId: string, assignmentId: string) =>
    api.get(`/assignments/parent/${childId}/assignments/${assignmentId}`),

  // ========== ADMIN ENDPOINTS ==========
  getAllAssignments: (params?: {
    status?: string;
    assignment_type?: string;
    term_id?: string;
    subject_id?: string;
    class_id?: string;
    teacher_id?: string;
    page?: number;
    limit?: number;
  }) => api.get('/assignments/admin', { params }),

  getSchoolAssignmentStatistics: (params?: {
    term_id?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get('/assignments/admin/statistics/school', { params }),

  getClassAssignmentStatistics: (params: {
    class_id: string;
    term_id?: string;
  }) => api.get('/assignments/admin/statistics/class', { params }),

  deleteAssignment: (assignmentId: string) =>
    api.delete(`/assignments/admin/${assignmentId}`),

  archiveAssignment: (assignmentId: string) =>
    api.post(`/assignments/admin/${assignmentId}/archive`),
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

export interface FeeDashboardSummary {
  summary: {
    totalBalance: number;
    totalStudents: number;
    pendingStudents: number;
    clearedStudents: number;
    collectionRate: string;
    recentCollections: number;
    advancePayments: number;
    outstandingInvoices: number;
  };
  academicYear: {
    name: string;
    currentTerm: string;
  } | null;
}

export interface StudentLedgerItem {
  id: string;
  student: string;
  admissionNumber: string;
  class: string;
  stream: string;
  studentType: string;
  totalOutstanding: number;
  creditBalance: number;
  netBalance: number;
  lastPayment: {
    date: string;
    amount: number;
  } | null;
  status: 'pending' | 'cleared' | 'credit';
  invoiceCount: number;
}

export interface StudentLedgerResponse {
  ledger: StudentLedgerItem[];
  summary: {
    totalStudents: number;
    totalOutstanding: number;
    totalNetBalance: number;
    totalCredit: number;
    pendingCount: number;
    clearedCount: number;
    creditCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ClassWiseSummaryItem {
  classId: string;
  className: string;
  classLevel: number;
  studentCount: number;
  pendingStudents: number;
  clearedStudents: number;
  totalOutstanding: number;
  totalInvoiced: number;
  collectionRate: string;
  avgBalance: string;
  status: 'good' | 'fair' | 'needs-attention';
}

export interface ClassWiseSummaryResponse {
  classSummary: ClassWiseSummaryItem[];
  overallSummary: {
    totalClasses: number;
    totalStudents: number;
    totalOutstanding: number;
    totalPendingStudents: number;
    totalClearedStudents: number;
    avgCollectionRate: string;
  };
}

export interface RecentActivityItem {
  id: string;
  type: 'PAYMENT' | 'INVOICE' | 'WAIVER';
  date: string;
  studentName: string;
  admissionNumber: string;
  description: string;
  amount: number;
  reference: string;
  metadata: {
    invoiceNumber?: string;
    transactionId?: string;
    status?: string;
    balance?: number;
    reason?: string;
    approvedBy?: string;
  };
}

export interface RecentActivitiesResponse {
  activities: RecentActivityItem[];
  summary: {
    totalPayments: number;
    totalInvoices: number;
    totalWaivers: number;
    totalAmount: number;
    period: string;
  };
}

export interface TopDebtorItem {
  id: string;
  student: string;
  admissionNumber: string;
  class: string;
  stream: string;
  totalOutstanding: number;
  creditBalance: number;
  netBalance: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  daysSinceLastPayment: number | null;
  invoiceCount: number;
}

export interface TopDebtorsResponse {
  debtors: TopDebtorItem[];
  summary: {
    totalDebtors: number;
    totalOutstanding: number;
    averageDebt: number;
    highestDebt: number;
  };
}

export interface PaymentMethodSummaryItem {
  method: string;
  amount: number;
  transactions: number;
  percentage: string;
  average: number;
}

export interface PaymentMethodsSummaryResponse {
  paymentMethods: PaymentMethodSummaryItem[];
  summary: {
    totalAmount: number;
    totalTransactions: number;
    averageTransaction: number;
  };
  period: {
    startDate?: string;
    endDate?: string;
    generatedAt: string;
  };
}

export interface CollectionTrendItem {
  period: string;
  start: string;
  end: string;
  collected: number;
  invoiced: number;
  transactions: number;
  collectionRate: string;
  growth: number | string;
}

export interface CollectionTrendResponse {
  trend: CollectionTrendItem[];
  summary: {
    totalCollected: number;
    totalInvoiced: number;
    totalTransactions: number;
    averageCollectionRate: string;
    peakCollection: number;
    lowestCollection: number;
  };
  period: {
    type: string;
    months: number;
    startDate: string;
    endDate: string;
  };
}
export interface FeeStructureItem {
  name: string;
  amount: number;
  isCompulsory?: boolean;
  canBePaidInInstallments?: boolean;
}

export interface FeeStructureCreateData {
  structureName: string;
  academicYearId: string;
  classId?: string;
  studentType?: string;
  termId: string;
  description?: string;
  appliesToAllTerms?: boolean;
}

export interface FeeItemsAddData {
  feeStructureId: string;
  termId: string;
  items: FeeStructureItem[];
}

export interface InvoiceGenerationData {
  classId: string;
  termId: string;
  academicYearId: string;
  dueDate: string;
}

export interface PaymentData {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentReference?: string;
  payerName?: string;
}

export interface PaymentWithAdvanceData {
  studentId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}

export interface FeeWaiverData {
  studentId: string;
  invoiceId: string;
  waiverType: string;
  amount: number;
  reason?: string;
  termId?: string;
  academicYearId?: string;
}

export interface ExpenseData {
  date: string;
  category: string;
  description: string;
  amount: number;
  vendorName?: string;
  paymentMethod: string;
  invoiceNumber?: string;
}

export interface InstallmentPlanData {
  invoiceId: string;
  numberOfInstallments: number;
  startDate: string;
}

export interface StaffSalaryData {
  staffId: string;
  basicSalary: number;
  houseAllowance?: number;
  transportAllowance?: number;
  otherAllowances?: number;
}

export interface PayrollData {
  month: number;
  year: number;
  paymentMethod: string;
}

export interface ReconciliationData {
  paymentIds?: string[];
  expenseIds?: string[];
  statementDate: string;
  bankBalance: number;
}

export interface BursaryAllocationItem {
  studentId: string;
  invoiceId: string;
  amount: number;
}

export interface BursaryData {
  sponsorName: string;
  totalBursaryAmount: number;
  chequeNumber?: string;
  allocations: BursaryAllocationItem[];
}

export interface StudentBalanceMigrationItem {
  studentId: string;
  amount: number;
  type: 'ARREARS' | 'CREDIT';
}

export interface BalanceMigrationData {
  academicYearId: string;
  termId: string;
  balances: StudentBalanceMigrationItem[];
}

export interface ClassFeeAssignmentData {
  classId: string;
  streamId?: string;
  feeStructureId: string;
  academicYearId: string;
  termId: string;
  notes?: string;
}

export interface StudentStatement {
  studentProfile: {
    id: string;
    name: string;
    admission: string;
    class: string;
    type: string;
    credit_balance: number;
  };
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalWaivers: number;
    outstandingBalance: number;
    collectionRate: string;
  };
  feeAssignments: any[];
  ledger: Array<{
    date: string;
    description: string;
    reference: string;
    debit: number;
    credit: number;
    type: string;
    balance: number;
    term?: string;
    academic_year?: string;
    verified?: boolean;
    approved_by?: string;
  }>;
  qrCode: string;
  verificationUrl: string;
}

export interface ReceiptData {
  receiptData: {
    schoolName: string;
    schoolAddress: string;
    schoolEmail: string;
    schoolPhone: string;
    logoUrl: string;
    receiptNo: string;
    date: string;
    time: string;
    studentName: string;
    admNo: string;
    className: string;
    paymentMode: string;
    items: any[];
    totalPaid: string;
    amountInWords: string;
    balance: string;
    qrCode: string;
    verifiedBy: string;
    term: string;
    academicYear: string;
    generatedAt: string;
  };
  qrCode: string;
  downloadUrl: string;
}

export interface ClearanceListItem {
  id: string;
  admissionNumber: string;
  fullName: string;
  class: string;
  stream: string;
  studentType: string;
  netBalance: number;
  creditBalance: number;
  totalDebt: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  isClear: boolean;
}

export interface ClearanceListResponse {
  clearanceList: ClearanceListItem[];
  summary: {
    totalStudents: number;
    studentsWithDebt: number;
    totalArrears: number;
    averageDebt: number;
    collectionUrgency: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}


export type RefundRequestStatus = 'pending' | 'approved' | 'completed' | 'rejected';

export type RefundPaymentMethod = 'M-Pesa' | 'Bank Transfer' | 'Credit Note' | 'Cash' | 'Cheque';
export interface CreateRefundRequestData {
  studentId: string;
  invoiceId?: string;
  amount: number;
  reason: string;
  paymentMethod: RefundPaymentMethod;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch?: string;
  };
  mpesaNumber?: string;
  notes?: string;
}

export interface RefundRequest {
  id: string;
  refund_reference: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class?: {
      class_name: string;
    };
  };
  invoice?: {
    id: string;
    invoice_number: string;
    total_amount: number;
  };
  amount: number;
  reason: string;
  payment_method: RefundPaymentMethod;
  bank_details?: any;
  mpesa_number?: string;
  status: RefundRequestStatus;
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  processed_by?: string;
  processed_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RefundSummary {
  totals: {
    all_time: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
  };
  counts: {
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
  };
  payment_methods: Record<string, {
    total_amount: number;
    count: number;
  }>;
  recent_refunds: RefundRequest[];
  monthly_trend: Array<{
    month: string;
    total_amount: number;
    count: number;
    completed_amount: number;
  }>;
}

export interface BulkRefundUpdateData {
  refundIds: string[];
  action: 'approve' | 'reject' | 'process';
  notes?: string;
  transactionReference?: string;
  paymentDate?: string;
}

export interface ProcessRefundData {
  transactionReference?: string;
  paymentDate?: string;
  notes?: string;
  bankReceiptNumber?: string;
  mpesaConfirmationCode?: string;
}

export interface ApproveRefundData {
  notes?: string;
}

export interface RejectRefundData {
  rejectionReason: string;
}

export const financeAPI={

  getDashboardSummary: () => 
    api.get('/admin/finance/dashboard/summary'),


  getStudentLedger: (params?: {
    classId?: string;
    streamId?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: 'all' | 'pending' | 'cleared';
  }) => api.get('/admin/finance/dashboard/ledger', { params }),

  getClassWiseSummary: () => 
    api.get('/admin/finance/dashboard/class-summary'),


  getRecentActivities: (params?: {
    limit?: number;
  }) => api.get('/admin/finance/dashboard/recent-activities', { params }),

  getTopDebtors: (params?: {
    limit?: number;
  }) => api.get('/admin/finance/dashboard/top-debtors', { params }),

 
  getPaymentMethodsSummary: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/admin/finance/dashboard/payment-methods', { params }),

  getCollectionTrend: (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    months?: number;
  }) => api.get('/admin/finance/collection-trend', { params }),

  getStudentFeeDetails: (studentId: string) =>
    api.get(`/admin/finance/students/${studentId}/fees`),

  getInvoiceDetails: (invoiceId: string) =>
    api.get(`/admin/finance/invoices/${invoiceId}`),

  getPaymentDetails: (paymentId: string) =>
    api.get(`/admin/finance/payments/${paymentId}`),


getFeeWaivers: (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}) => api.get('/finance/waivers', { params }),

getWaiverSummary: () => 
  api.get('/finance/waivers/summary'),

createWaiverType: (data: {
  waiver_name: string;
  waiver_type: string;
  category: string;
  waiver_amount?: number;
  percentage?: number;
  description?: string;
  max_applications?: number;
  valid_from: string;
  valid_to: string;
}) => api.post('/finance/waiver-types', data),

  getFeeStructure: (params?: {
    classId?: string;
    academicYearId?: string;
  }) => api.get('/admin/finance/fee-structure', { params }),


  getReconciliationReport: (params?: {
    startDate: string;
    endDate: string;
    paymentMethod?: string;
  }) => api.get('/recon', { params }),


  exportFinanceReport: (params: {
    reportType: 'ledger' | 'summary' | 'debtors' | 'trend';
    format: 'excel' | 'pdf' | 'csv';
    filters?: any;
  }) => api.get('/admin/finance/export', { 
    params,
    responseType: 'blob'
  }),
    createFeeStructure: (data: FeeStructureCreateData) =>
    api.post('/finance/fee-structure', data),
      addFeeItems: (data: FeeItemsAddData) =>
    api.post('/finance/fee-structure/items', data),
        assignFeesToClass: (data: ClassFeeAssignmentData) =>
    api.post('/finance/fee-structure/assign', data),
generateClassInvoices: (data: InvoiceGenerationData) =>
    api.post('/finance/invoices/generate-class', data),
  voidClassInvoices: (data: {
    classId: string;
    termId: string;
    academicYearId: string;
  }) => api.post('/finance/invoices/void-class', data),
    processPayment: (data: PaymentData) =>
    api.post('/finance/payments/process', data),
      processPaymentWithAdvance: (data: PaymentWithAdvanceData) =>
    api.post('/finance/payments/with-advance', data),
        createInstallmentPlan: (data: InstallmentPlanData) =>
    api.post('/finance/payments/installments/plan', data),
          applyFeeWaiver: (data: FeeWaiverData) =>
    api.post('/finance/waivers/apply', data),
            allocateBursary: (data: BursaryData) =>
    api.post('/finance/bursary/allocate', data),
              getSponsorshipReport: (params?: {
    sponsorName?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/finance/bursary/report', { params }),
    recordExpense: (data: ExpenseData) =>
    api.post('/finance/expenses', data),
      setStaffSalary: (data: StaffSalaryData) =>
    api.post('/finance/payroll/config', data),
       processPayroll: (data: PayrollData) =>
    api.post('/finance/payroll/process', data),
        getDebtorsReport: (params?: {
  page?: number;
  limit?: number;
  search?: string;
  minBalance?: number;
  classId?: string;
  riskLevel?: string;
  agingBucket?: string;
}) => api.get('/finance/reports/debtors', { params }),
  getArrearsSummary: () => 
  api.get('/finance/reports/arrears-summary'),
    generateMonthlyReport: (params: {
    month: number;
    year: number;
  }) => api.get('/finance/reports/monthly-summary', { params }),

    getFinancialOverview: (params?: {
    academicYearId?: string;
    termId?: string;
  }) => api.get('/finance/reports/financial-overview', { params }),
    getFeeClearanceList: (params?: {
    classId?: string;
    streamId?: string;
    minBalance?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/finance/reports/clearance-list', { params }),
    getUnreconciledItems: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/finance/reconciliation/pending', { params }),

   reconcileTransactions: (data: ReconciliationData) =>
    api.post('/finance/reconciliation/verify', data),

     getStudentStatement: (studentId: string) =>
    api.get(`/finance/statement/${studentId}`),

       verifyStatementPublicly: (studentId: string) =>
    api.get(`/finance/verify/statement/${studentId}`),

       generateReceipt: (paymentId: string, format?: 'html') =>
    api.get(`/finance/receipt/${paymentId}${format === 'html' ? '?format=html' : ''}`),

  downloadReceiptPDF: (paymentId: string) =>
  api.get(`/finance/receipts/${paymentId}/pdf`, { 
    responseType: 'blob' 
  }),
      getStudentsForMigration: (params?: {
    classId?: string;
    streamId?: string;
    status?: string;
  }) => api.get('/finance/migration/students', { params }),
    migrateStudentBalances: (data: BalanceMigrationData) =>
    api.post('/finance/migration/balances', data),

      updateStudentFeeAssignment: (assignmentId: string, data: {
    feeStructureId?: string;
    applicableStudentType?: string;
    notes?: string;
  }) => api.put(`/finance/assignments/${assignmentId}`, data),

   getPaymentMethods: () =>
    api.get('/finance/config/payment-methods'),

   getExpenseCategories: () =>
    api.get('/finance/config/expense-categories'),

getWaiverTypes: (params?: {
  activeOnly?: boolean;
  category?: string;
}) => api.get('/finance/waiver-types', { params }),


       bulkProcessPayments: (payments: PaymentData[]) =>
    api.post('/finance/payments/bulk', { payments }),

        bulkApplyFeeWaivers: (waivers: FeeWaiverData[]) =>
    api.post('/finance/waivers/bulk', { waivers }),
          bulkGenerateReceipts: (paymentIds: string[]) =>
    api.post('/finance/receipts/bulk', { paymentIds }),
          
exportFinancialReport: (params: {
  reportType: 'payments' | 'ledger' | 'summary' | 'debtors' | 'trend' | 'clearance' | 'sponsorship';
  format: 'excel' | 'pdf' | 'csv';
  filters?: any;
}) => api.get('/finance/reports/export', { 
  params,
  responseType: 'blob'
}),

  getClasses: (params?: {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'level' | 'student_count';
  sortOrder?: 'asc' | 'desc';
}) => api.get('/finance/classes', { params }),

getClassById: (classId: string) => 
  api.get(`/finance/classes/${classId}`),

getClassStudents: (classId: string, params?: {
  includeInactive?: boolean;
  feeStatus?: 'paid' | 'pending' | 'partial' | 'overdue';
  page?: number;
  limit?: number;
}) => api.get(`/finance/classes/${classId}/students`, { params }),

getClassFeeSummary: (classId: string, params?: {
  termId?: string;
  academicYearId?: string;
}) => api.get(`/finance/classes/${classId}/fee-summary`, { params }),

// Stream Management
getStreams: (params?: {
  classId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => api.get('/finance/streams', { params }),

getStreamById: (streamId: string) => 
  api.get(`/finance/streams/${streamId}`),

getStreamStudents: (streamId: string, params?: {
  includeInactive?: boolean;
  feeStatus?: 'paid' | 'pending' | 'partial' | 'overdue';
  minBalance?: number;
  maxBalance?: number;
  page?: number;
  limit?: number;
}) => api.get(`/finance/streams/${streamId}/students`, { params }),

getStreamFeeSummary: (streamId: string, params?: {
  termId?: string;
  academicYearId?: string;
}) => api.get(`/finance/streams/${streamId}/fee-summary`, { params }),

getClassStreams: (classId: string, params?: {
  includeStudentCount?: boolean;
  includeFeeSummary?: boolean;
  includeTeachers?: boolean;
}) => api.get(`/finance/classes/${classId}/streams`, { params }),

// Combined Queries
getStudentsByClassAndStream: (params?: {
  classId?: string;
  streamId?: string;
  search?: string;
  admissionNumber?: string;
  feeStatus?: 'all' | 'cleared' | 'pending' | 'partial' | 'overdue';
  page?: number;
  limit?: number;
}) => api.get('/finance/students/filter', { params }),

// Student Fee Information
getStudentFeeBalance: (studentId: string, params?: {
  termId?: string;
  academicYearId?: string;
  includeHistory?: boolean;
}) => api.get(`/finance/students/${studentId}/balance`, { params }),

getStudentFeeTransactions: (studentId: string, params?: {
  startDate?: string;
  endDate?: string;
  transactionType?: 'all' | 'payment' | 'invoice' | 'waiver' | 'adjustment';
  page?: number;
  limit?: number;
}) => api.get(`/finance/students/${studentId}/transactions`, { params }),

getStudentClassAndStream: (studentId: string) =>
  api.get(`/finance/students/${studentId}/class-stream`),

// Class-Stream Fee Operations
generateClassStreamInvoices: (data: {
  classId: string;
  streamId?: string;
  termId: string;
  academicYearId: string;
  feeStructureId?: string;
  dueDate?: string;
  notes?: string;
}) => api.post('/finance/invoices/generate-class-stream', data),

voidClassStreamInvoices: (data: {
  classId: string;
  streamId?: string;
  termId: string;
  academicYearId: string;
  reason?: string;
}) => api.post('/finance/invoices/void-class-stream', data),

getClassStreamCollectionReport: (params: {
  classId: string;
  streamId?: string;
  termId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}) => api.get('/finance/reports/class-stream-collection', { params }),

// Bulk Operations
bulkUpdateStudentFees: (data: {
  classId?: string;
  streamId?: string;
  studentIds?: string[];
  action: 'applyWaiver' | 'addCharge' | 'adjustBalance' | 'transferClass';
  amount?: number;
  reason?: string;
  effectiveDate?: string;
}) => api.post('/finance/students/bulk-update-fees', data),

exportClassStreamReport: (params: {
  classId: string;
  streamId?: string;
  reportType: 'fee-summary' | 'student-list' | 'collection-report' | 'debtors';
  format: 'excel' | 'pdf' | 'csv';
  termId?: string;
}) => api.get('/finance/reports/export-class-stream', {
  params,
  responseType: 'blob'
}),

// Class-Stream Analytics
getClassStreamAnalytics: (params?: {
  classId?: string;
  streamId?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'termly';
  startDate?: string;
  endDate?: string;
}) => api.get('/finance/analytics/class-stream', { params }),

getFeeComplianceByStream: (params?: {
  classId?: string;
  streamId?: string;
  termId?: string;
  minCompliance?: number;
  maxCompliance?: number;
}) => api.get('/finance/analytics/fee-compliance', { params }),

// Migration between Streams
transferStudentsBetweenStreams: (data: {
  sourceStreamId: string;
  targetStreamId: string;
  studentIds?: string[];
  transferFeeBalances?: boolean;
  effectiveDate?: string;
}) => api.post('/finance/students/transfer-streams', data),

sendFeeReminders: (data: {
  studentIds: string[];
  reminderType: 'overdue' | 'upcoming' | 'partial';
  channel: 'sms' | 'email' | 'both';
  message?: string;
}) => api.post('/finance/communications/send-reminders', data),

applyFeeStructureToStudents: (data: {
  feeStructureId: string;
  classId?: string;
  streamId?: string;
  termId: string;
  academicYearId: string;
  applyTo?: 'all' | 'new_only' | 'existing_only';
  generateInvoices?: boolean;
  invoiceDueDate?: string;
  installmentPlan?: {
    number: number;
    dueDates?: string[];
  };
  notes?: string;
}) => api.post('/fee-application/apply', data),

bulkAssignFeeStructures: (data: {
  assignments: Array<{
    studentId: string;
    feeStructureId: string;
    termId: string;
    academicYearId: string;
  }>;
  generateInvoices?: boolean;
  notes?: string;
}) => api.post('/fee-application/bulk-assign', data),

getStudentFeeAssignments: (studentId: string) =>
  api.get(`/fee-application/student/${studentId}/assignments`),

updateFeeAssignment: (assignmentId: string, data: {
  feeStructureId?: string;
  applicableStudentType?: string;
  notes?: string;
  isActive?: boolean;
}) => api.put(`/fee-application/assignments/${assignmentId}`, data),

generateInvoicesForAssignments: (data: {
  assignmentIds: string[];
  dueDate?: string;
  installmentPlan?: {
    number: number;
    dueDates?: string[];
  };
  notes?: string;
}) => api.post('/fee-application/generate-invoices', data),

//invoices
getInvoices: (params?: {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  status?: string;
}) => api.get('/finance/invoices', { params }),

getInvoiceSummary: () => 
  api.get('/finance/invoices/summary'),

getPaymentHistory: (params?: {
  page?: number;
  limit?: number;
  search?: string;
  method?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => api.get('/finance/payments', { params }),
getPaymentSummary: () => 
  api.get('/finance/payments/summary'),

  // Refund Management APIs
  createRefundRequest: (data: CreateRefundRequestData) =>
    api.post('/finance/refunds', data),
getRefundRequests: (params?: {
  page?: number;
  limit?: number;
  status?: RefundRequestStatus | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: RefundPaymentMethod | 'all';
}) => api.get('/finance/refunds', { params }),
  getRefundRequestById: (refundId: string) =>
    api.get(`/finance/refunds/${refundId}`),

  approveRefundRequest: (refundId: string, data?: ApproveRefundData) =>
    api.put(`/finance/refunds/${refundId}/approve`, data),

  processRefund: (refundId: string, data?: ProcessRefundData) =>
    api.put(`/finance/refunds/${refundId}/process`, data),

  rejectRefundRequest: (refundId: string, data: RejectRefundData) =>
    api.put(`/finance/refunds/${refundId}/reject`, data),

  getRefundSummary: () =>
    api.get('/admin/finance/refunds/summary'),

  getStudentRefunds: (studentId: string) =>
    api.get(`/finance/students/${studentId}/refunds`),

  bulkUpdateRefundStatus: (data: BulkRefundUpdateData) =>
    api.put('/finance/refunds/bulk-update', data),

  generateRefundReport: (params?: {
    format?: 'json' | 'csv';
    startDate?: string;
    endDate?: string;
    status?: RefundRequestStatus | 'all';
  }) => api.get('/finance/refunds/report', { params }),

  // You can also add these convenience methods:
  exportRefundReport: (params: {
    format: 'excel' | 'csv' | 'pdf';
    startDate?: string;
    endDate?: string;
    status?: RefundRequestStatus | 'all';
  }) => api.get('/finance/refunds/export', {
    params,
    responseType: 'blob'
  }),

  // Add these refund-related utilities if needed:
  validateRefundAmount: (studentId: string, invoiceId?: string) =>
    api.get('/finance/refunds/validate', {
      params: { studentId, invoiceId }
    }),

  getRefundableStudents: (params?: {
    search?: string;
    classId?: string;
    minCreditBalance?: number;
    page?: number;
    limit?: number;
  }) => api.get('/finance/refunds/eligible-students', { params }),

  // RECONCILIATION APIS
  // ===================

  /**
   * Get unreconciled transactions with filters
   */
  getUnreconciledTransactions: (params?: {
    source?: 'M-Pesa' | 'Bank' | 'all';
    status?: 'all' | 'unmatched' | 'matched' | 'pending' | 'disputed';
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/recon/pending', { params }),

  /**
   * Get reconciliation statistics
   */
  getReconciliationStats: (params?: {
    start_date?: string;
    end_date?: string;
  }) => api.get('/recon/stats', { params }),

  /**
   * Match transaction to student
   */
  reconcileTransaction: (data: {
    transaction_ids: string[];
    student_id: string;
    notes?: string;
    verified_by?: string;
  }) => api.post('/recon/match', data),

  /**
   * Mark transaction as disputed
   */
  disputeTransaction: (data: {
    transaction_id: string;
    reason: string;
  }) => api.post('/recon/dispute', data),

  /**
   * Get reconciliation audit log
   */
  getReconciliationAudit: (params?: {
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }) => api.get('/recon/audit', { params }),

  /**
   * Export reconciliation report
   */
  exportReconciliationReport: (params: {
    start_date?: string;
    end_date?: string;
    format?: 'csv' | 'excel' | 'pdf';
    status?: 'all' | 'unmatched' | 'matched' | 'disputed';
    source?: 'all' | 'M-Pesa' | 'Bank';
  }) => api.get('/recon/export', { 
    params,
    responseType: 'blob' 
  }),

  /**
   * Sync external transactions from M-Pesa/Bank APIs
   */
  syncExternalTransactions: (data: {
    source: 'M-Pesa' | 'Bank';
    transactions: Array<{
      reference: string;
      amount: number;
      sender_name?: string;
      sender_account?: string;
      transaction_date?: string;
      status?: string;
      raw_data?: any;
    }>;
  }) => api.post('/recon/sync', data),

  /**
   * Get transaction by ID
   */
  getTransactionById: (transactionId: string) =>
    api.get(`/recon/transactions/${transactionId}`),

  /**
   * Update transaction notes
   */
  updateTransactionNotes: (transactionId: string, data: {
    notes: string;
  }) => api.put(`/recon/transactions/${transactionId}/notes`, data),

  /**
   * Get reconciliation dashboard summary
   */
  getReconciliationDashboard: () =>
    api.get('/recon/dashboard'),

  /**
   * Bulk reconcile transactions
   */
  bulkReconcileTransactions: (data: {
    matches: Array<{
      transaction_id: string;
      student_id: string;
      notes?: string;
    }>;
    verified_by?: string;
  }) => api.post('/recon/bulk-match', data),

  /**
   * Get reconciliation suggestions (auto-match)
   */
  getReconciliationSuggestions: (params?: {
    threshold?: number;
    days?: number;
    limit?: number;
  }) => api.get('/recon/suggestions', { params }),

  /**
   * Auto-reconcile based on rules
   */
  autoReconcile: (data?: {
    rules?: Array<{
      field: 'sender_name' | 'sender_account' | 'amount' | 'date';
      operator: 'equals' | 'contains' | 'range';
      value: any;
    }>;
    dry_run?: boolean;
  }) => api.post('/recon/auto', data),

}


export const teacherAPI = {
  // Assignments (Deprecated - use assignmentAPI instead)
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


getMySchemes: async (params: SchemeParams = {}): Promise<any> => {
    try {
      const response = await api.get('/teachers/schemes', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 2. Get scheme details
 getSchemeDetails: async (schemeId: string): Promise<any> => {
    try {
      const response = await api.get(`/teachers/schemes/${schemeId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

createSchemeOfWork: async (data: CreateSchemeData): Promise<any> => {
    try {
      const response = await api.post('/teachers/schemes', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 4. Update scheme
  updateSchemeOfWork: async (schemeId: string, data: UpdateSchemeData): Promise<any> => {
    try {
      const response = await api.put(`/teachers/schemes/${schemeId}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 5. Delete scheme
    deleteSchemeOfWork: async (schemeId: string): Promise<any> => {
    try {
      const response = await api.delete(`/teachers/schemes/${schemeId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 6. Submit scheme for approval
  submitSchemeForApproval: async (schemeId: string): Promise<any> => {
    try {
      const response = await api.post(`/teachers/schemes/${schemeId}/submit`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 7. Get topics for a scheme
  getSchemeTopics: async (schemeId: string, params: SchemeTopicParams = {}): Promise<any> => {
    try {
      const response = await api.get(`/teachers/schemes/${schemeId}/topics`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 8. Create new topic
 createSchemeTopic: async (schemeId: string, data: CreateTopicData): Promise<any> => {
    try {
      const response = await api.post(`/teachers/schemes/${schemeId}/topics`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  // 9. Update topic
   updateSchemeTopic: async (topicId: string, data: UpdateTopicData): Promise<any> => {
    try {
      const response = await api.put(`/teachers/schemes/topics/${topicId}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  // 10. Delete topic
   deleteSchemeTopic: async (topicId: string): Promise<any> => {
    try {
      const response = await api.delete(`/teachers/schemes/topics/${topicId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  // 11. Export scheme
  exportScheme: async (schemeId: string, format: 'pdf' | 'excel' | 'json' = 'pdf'): Promise<any> => {
    try {
      const response = await api.get(`/teachers/schemes/${schemeId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  // 12. Get scheme template (for creating new schemes)
  getSchemeTemplate: async (params = {}) => {
    try {
      const response = await api.get('/teachers/schemes/templates', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 13. Duplicate scheme
duplicateScheme: async (schemeId: string, data: DuplicateSchemeData = {}): Promise<any> => {
    try {
      const response = await api.post(`/teachers/schemes/${schemeId}/duplicate`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /* ==============================
     RECORDS OF WORK API
  ============================== */
  
  // 1. Get all records for the teacher
  getMyRecordsOfWork: async (params = {}) => {
    try {
      const response = await api.get('/teachers/records', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 2. Get record details
  getRecordDetails: async (recordId: string): Promise<any> => {
    try {
      const response = await api.get(`/teachers/records/${recordId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },


  // 3. Create new record
  createRecordOfWork: async (data: CreateRecordData): Promise<any> => {
    try {
      const response = await api.post('/teachers/records', data);
      return response;
    } catch (error) {
      throw error;
    }
  },


  // 4. Update record
    updateRecordOfWork: async (recordId: string, data: UpdateRecordData): Promise<any> => {
    try {
      const response = await api.put(`/teachers/records/${recordId}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 5. Delete record
  deleteRecordOfWork: async (recordId: string): Promise<any> => {
    try {
      const response = await api.delete(`/teachers/records/${recordId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 6. Submit record for verification
 submitRecordOfWork: async (recordId: string): Promise<any> => {
    try {
      const response = await api.post(`/teachers/records/${recordId}/submit`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  // 7. Get coverage report
  getCoverageReport: async (params: CoverageParams = {}): Promise<any> => {
    try {
      const response = await api.get('/teachers/records/coverage', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 8. Export records
  exportRecordsOfWork: async (params: ExportParams = {}): Promise<any> => {
    try {
      const response = await api.get('/teachers/records/export', {
        params: { 
          format: params.format || 'pdf',
          ...params 
        },
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 9. Get records by scheme
 getRecordsByScheme: async (schemeId: string, params: RecordParams = {}): Promise<any> => {
    try {
      const response = await api.get(`/teachers/schemes/${schemeId}/records`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },


  // 10. Upload attachments for record
 uploadRecordAttachment: async (recordId: string, file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/teachers/records/${recordId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 11. Delete attachment
  deleteRecordAttachment: async (recordId: string, attachmentId: string): Promise<any> => {
    try {
      const response = await api.delete(`/teachers/records/${recordId}/attachments/${attachmentId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /* ==============================
     DASHBOARD & STATISTICS API
  ============================== */
  
  // Get teacher dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/teachers/dashboard/stats');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get teaching workload
  getTeachingWorkload: async (params = {}) => {
    try {
      const response = await api.get('/teacher/workload', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get upcoming deadlines
  getUpcomingDeadlines: async (params = {}) => {
    try {
      const response = await api.get('/teacher/deadlines', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /* ==============================
     UTILITY & HELPER API
  ============================== */
  
  // Get available academic years
  getAcademicYears: async () => {
    try {
      const response = await api.get('/teacher/academic-years');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get available terms
  getTerms: async (params = {}) => {
    try {
      const response = await api.get('/teacher/terms', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get teacher's classes
  getTeacherClasses: async () => {
    try {
      const response = await api.get('/teacher/classes');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get teacher's subjects
  getTeacherSubjects: async (params = {}) => {
    try {
      const response = await api.get('/teacher/subjects', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get teacher's streams
  getTeacherStreams: async (params = {}) => {
    try {
      const response = await api.get('/teacher/streams', { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get weeks for term
  getTermWeeks: async (termId) => {
    try {
      const response = await api.get(`/teacher/terms/${termId}/weeks`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// ==================== ACADEMIC API ====================
export const academicAPI = {
  // Academic Years
  getYears: () => api.get('/academic/years'),
  createYear: (data: { year_name: string; start_date: string; end_date: string; is_current: boolean }) => 
    api.post('/academic/years', data),
  getActiveYear: () => api.get('/academic/years'),

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

// Assignment-specific response types
export interface AssignmentResponse {
  success: boolean;
  message?: string;
  data: Assignment | Assignment[] | AssignmentSubmission | AssignmentSubmission[] | AssignmentStatistics | SchoolAssignmentStatistics | any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default api;