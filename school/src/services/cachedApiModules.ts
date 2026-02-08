// cachedApiModules.ts
import { cachedApi } from './cachedApi';
import {
  type Assignment,
  type AssignmentStatistics,
  type SchemeParams,
  type RecordParams,
  type CoverageParams,
  type ExportParams,
  type CreateSchemeData,
  type UpdateSchemeData,
  type CreateTopicData,
  type  UpdateTopicData,
  type CreateRecordData,
  type UpdateRecordData,
  type DuplicateSchemeData,
  type AttendanceParams,
 type AttendanceData,
  type AttendanceUpdateData,
 type BulkAttendanceUpdateData,
 type ScoreSubmissionData,
 type StudentsForScoreEntryParams
} from './api'; // Import your types from the original api file

// ==================== CACHED AUTH API ====================
export const cachedAuthAPI = {
  login: (email: string, password: string, slug: string) =>
    cachedApi.post('/auth/login', { email, password, slug }, {
      cache: { forceRefresh: true }
    }),

  logout: () => {
    cachedApi.clearAllCache();
    return cachedApi.post('/auth/logout', null, {
      cache: { forceRefresh: true }
    });
  },

  getCurrentUser: () =>
    cachedApi.get('/auth/me', {
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    }),

  forgotPassword: (email: string, slug: string) =>
    cachedApi.post('/auth/forgot-password', { email, slug }, {
      cache: { forceRefresh: true }
    }),

  resetPassword: (token: string, newPassword: string) =>
    cachedApi.post('/auth/reset-password', { token, newPassword }, {
      cache: { forceRefresh: true }
    }),

  verifyEmail: (token: string) =>
    cachedApi.post('/auth/verify-email', { token }, {
      cache: { forceRefresh: true }
    }),
};

// ==================== CACHED SCHOOL API ====================
export const cachedSchoolAPI = {
  getSchoolInfo: (slug: string) =>
    cachedApi.get(`/schools/${slug}`, {
      cache: { ttl: 30 * 60 * 1000 } // 30 minutes
    }),

  checkSchoolSlug: (slug: string) =>
    cachedApi.get(`/schools/check/${slug}`, {
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    }),
};

// ==================== CACHED SUBJECT API ====================
export const cachedSubjectAPI = {
  getAll: () =>
    cachedApi.get('/subjects', {
      cache: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
    }),

  getByCategory: (category: string) =>
    cachedApi.get(`/subjects/category/${category}`, {
      cache: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
    }),

  create: (data: { code: string; name: string; category: string }) =>
    cachedApi.post('/subjects', data),

  update: (id: string, data: any) =>
    cachedApi.put(`/subjects/${id}`, data),

  delete: (id: string) =>
    cachedApi.delete(`/subjects/${id}`)
};

// ==================== CACHED TEACHER API ====================
export const cachedTeacherAPI = {
  // Schemes of Work
  getMySchemes: async (params: SchemeParams = {}) => {
    return cachedApi.get('/teachers/schemes', {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    });
  },

  getSchemeDetails: async (schemeId: string) => {
    return cachedApi.get(`/teachers/schemes/${schemeId}`, {
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    });
  },

  createSchemeOfWork: async (data: CreateSchemeData) => {
    return cachedApi.post('/teachers/schemes', data);
  },

  updateSchemeOfWork: async (schemeId: string, data: UpdateSchemeData) => {
    return cachedApi.put(`/teachers/schemes/${schemeId}`, data);
  },

  deleteSchemeOfWork: async (schemeId: string) => {
    return cachedApi.delete(`/teachers/schemes/${schemeId}`);
  },

  submitSchemeForApproval: async (schemeId: string) => {
    return cachedApi.post(`/teachers/schemes/${schemeId}/submit`);
  },

  getSchemeTopics: async (schemeId: string, params: any = {}) => {
    return cachedApi.get(`/teachers/schemes/${schemeId}/topics`, {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    });
  },

  createSchemeTopic: async (schemeId: string, data: CreateTopicData) => {
    return cachedApi.post(`/teachers/schemes/${schemeId}/topics`, data);
  },

  updateSchemeTopic: async (topicId: string, data: UpdateTopicData) => {
    return cachedApi.put(`/teachers/schemes/topics/${topicId}`, data);
  },

  deleteSchemeTopic: async (topicId: string) => {
    return cachedApi.delete(`/teachers/schemes/topics/${topicId}`);
  },

  // Records of Work
  getMyRecordsOfWork: async (params: RecordParams = {}) => {
    return cachedApi.get('/teachers/records', {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    });
  },

  getRecordDetails: async (recordId: string) => {
    return cachedApi.get(`/teachers/records/${recordId}`, {
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    });
  },

  createRecordOfWork: async (data: CreateRecordData) => {
    return cachedApi.post('/teachers/records', data);
  },

  updateRecordOfWork: async (recordId: string, data: UpdateRecordData) => {
    return cachedApi.put(`/teachers/records/${recordId}`, data);
  },

  deleteRecordOfWork: async (recordId: string) => {
    return cachedApi.delete(`/teachers/records/${recordId}`);
  },

  submitRecordOfWork: async (recordId: string) => {
    return cachedApi.post(`/teachers/records/${recordId}/submit`);
  },

  getCoverageReport: async (params: CoverageParams = {}) => {
    return cachedApi.get('/teachers/records/coverage', {
      params,
      cache: { ttl: 10 * 60 * 1000 } // 10 minutes
    });
  },

  getRecordsByScheme: async (schemeId: string, params: RecordParams = {}) => {
    return cachedApi.get(`/teachers/schemes/${schemeId}/records`, {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    });
  },

  // Teacher-specific methods with caching
  getMySubjects: () =>
    cachedApi.get('/teachers/me/subjects', {
      cache: { ttl: 30 * 60 * 1000 } // 30 minutes
    }),

  getMyWorkload: () =>
    cachedApi.get('/teachers/me/workload', {
      cache: { ttl: 30 * 60 * 1000 } // 30 minutes
    }),

  getClassStudents: (classId: string, streamId?: string) =>
    cachedApi.get(`/teachers/classes/${classId}/streams/${streamId}/students`, {
      params: { streamId },
      cache: { ttl: 15 * 60 * 1000 } // 15 minutes
    }),

  getStudentsForScoreEntry: (params: StudentsForScoreEntryParams) =>
    cachedApi.get('/teachers/scores/students', {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    }),

  // Score submission (no cache for writes)
  submitScore: (data: ScoreSubmissionData) =>
    cachedApi.post('/scores/submit', data),

  // Invalidate cache helper
  invalidateSchemesCache: () => {
    cachedApi.clearCache('/teachers/schemes');
  },

  invalidateRecordsCache: () => {
    cachedApi.clearCache('/teachers/records');
  },
};

// ==================== CACHED ASSIGNMENT API ====================
export const cachedAssignmentAPI = {
  // Teacher endpoints
  getTeacherAssignments: (params?: {
    status?: string;
    assignment_type?: string;
    term_id?: string;
    subject_id?: string;
    page?: number;
    limit?: number;
  }) => cachedApi.get('/assignments/teacher', {
    params,
    cache: { ttl: 2 * 60 * 1000 } // 2 minutes
  }),

  getAssignmentDetails: (assignmentId: string) =>
    cachedApi.get(`/assignments/student/${assignmentId}`, {
      cache: { ttl: 2 * 60 * 1000 } // 2 minutes
    }),

  getAssignmentSubmissions: (assignmentId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => cachedApi.get(`/assignments/teacher/${assignmentId}/submissions`, {
    params,
    cache: { ttl: 2 * 60 * 1000 } // 2 minutes
  }),

  getAssignmentStatistics: (assignmentId: string) =>
    cachedApi.get(`/assignments/teacher/${assignmentId}/statistics`, {
      cache: { ttl: 1 * 60 * 1000 } // 1 minute
    }),

  // Student endpoints
  getStudentAssignments: (params?: {
    status?: string;
    assignment_type?: string;
    term_id?: string;
    subject_id?: string;
    page?: number;
    limit?: number;
  }) => cachedApi.get('/assignments/student', {
    params,
    cache: { ttl: 2 * 60 * 1000 } // 2 minutes
  }),

  getStudentSubmission: (assignmentId: string) =>
    cachedApi.get(`/assignments/student/${assignmentId}/submission`, {
      cache: { ttl: 1 * 60 * 1000 } // 1 minute
    }),

  // Write operations (invalidate cache)
  createAssignment: (data: any) =>
    cachedApi.post('/assignments/teacher', data),

  updateAssignment: (assignmentId: string, data: any) =>
    cachedApi.put(`/assignments/teacher/${assignmentId}`, data),

  publishAssignment: (assignmentId: string) =>
    cachedApi.post(`/assignments/teacher/${assignmentId}/publish`),

  gradeSubmission: (submissionId: string, data: {
    score: number;
    feedback?: string;
    rubric_scores?: any;
  }) => cachedApi.post(`/assignments/teacher/${submissionId}/grade`, data),

  submitAssignment: (assignmentId: string, data: any) =>
    cachedApi.post(`/assignments/student/${assignmentId}/submit`, data),

  // Admin endpoints
  getAllAssignments: (params?: {
    status?: string;
    assignment_type?: string;
    term_id?: string;
    subject_id?: string;
    class_id?: string;
    teacher_id?: string;
    page?: number;
    limit?: number;
  }) => cachedApi.get('/assignments/admin', {
    params,
    cache: { ttl: 2 * 60 * 1000 } // 2 minutes
  }),

  getSchoolAssignmentStatistics: (params?: {
    term_id?: string;
    start_date?: string;
    end_date?: string;
  }) => cachedApi.get('/assignments/admin/statistics/school', {
    params,
    cache: { ttl: 5 * 60 * 1000 } // 5 minutes
  }),
};

// ==================== CACHED ATTENDANCE API ====================
export const cachedAttendanceAPI = {
  // Read operations with cache
  getAttendanceByDate: (params: AttendanceParams) =>
    cachedApi.get('/attendance/by-date', {
      params,
      cache: { ttl: 2 * 60 * 1000 } // 2 minutes
    }),

  getStudentAttendance: (studentId: string, params?: Omit<AttendanceParams, 'studentId'>) =>
    cachedApi.get(`/attendance/student/${studentId}`, {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    }),

  getClassAttendance: (classId: string, params?: Omit<AttendanceParams, 'classId'>) =>
    cachedApi.get(`/attendance/class/${classId}`, {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    }),

  getAttendanceSummary: (params: AttendanceParams) =>
    cachedApi.get('/attendance/summary', {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    }),

  // Write operations (invalidate cache)
  markAttendance: (data: AttendanceData) =>
    cachedApi.post('/attendance/mark', data),

  updateAttendance: (attendanceId: string, data: AttendanceUpdateData) =>
    cachedApi.put(`/attendance/${attendanceId}`, data),

  bulkUpdateAttendance: (data: BulkAttendanceUpdateData) =>
    cachedApi.put('/attendance/bulk/update', data),

  // Reports
  getDailyReport: (params?: { date?: string }) =>
    cachedApi.get('/attendance/reports/daily', {
      params,
      cache: { ttl: 10 * 60 * 1000 } // 10 minutes
    }),

  getMonthlyReport: (params?: { year?: string; month?: string; classId?: string }) =>
    cachedApi.get('/attendance/reports/monthly', {
      params,
      cache: { ttl: 30 * 60 * 1000 } // 30 minutes
    }),
};

// ==================== CACHED FINANCE API ====================
export const cachedFinanceAPI = {
  // Dashboard summaries (cache for short time due to sensitivity)
  getDashboardSummary: () =>
    cachedApi.get('/admin/finance/dashboard/summary', {
      cache: { ttl: 1 * 60 * 1000 } // 1 minute
    }),

  getStudentLedger: (params?: {
    classId?: string;
    streamId?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: 'all' | 'pending' | 'cleared';
  }) => cachedApi.get('/admin/finance/dashboard/ledger', {
    params,
    cache: { ttl: 2 * 60 * 1000 } // 2 minutes
  }),

  getClassWiseSummary: () =>
    cachedApi.get('/admin/finance/dashboard/class-summary', {
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    }),

  getRecentActivities: (params?: { limit?: number }) =>
    cachedApi.get('/admin/finance/dashboard/recent-activities', {
      params,
      cache: { ttl: 2 * 60 * 1000 } // 2 minutes
    }),

  getTopDebtors: (params?: { limit?: number }) =>
    cachedApi.get('/admin/finance/dashboard/top-debtors', {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    }),

  // Static data (cache longer)
  getPaymentMethods: () =>
    cachedApi.get('/finance/config/payment-methods', {
      cache: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
    }),

  getExpenseCategories: () =>
    cachedApi.get('/finance/config/expense-categories', {
      cache: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
    }),

  getWaiverTypes: (params?: { activeOnly?: boolean; category?: string }) =>
    cachedApi.get('/finance/waiver-types', {
      params,
      cache: { ttl: 30 * 60 * 1000 } // 30 minutes
    }),

  // Write operations
  processPayment: (data: any) =>
    cachedApi.post('/finance/payments/process', data),

  applyFeeWaiver: (data: any) =>
    cachedApi.post('/finance/waivers/apply', data),

  createFeeStructure: (data: any) =>
    cachedApi.post('/finance/fee-structure', data),

  // Reports
  getCollectionTrend: (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    months?: number;
  }) => cachedApi.get('/admin/finance/collection-trend', {
    params,
    cache: { ttl: 10 * 60 * 1000 } // 10 minutes
  }),
};

// ==================== CACHED ACADEMIC API ====================
export const cachedAcademicAPI = {
  // Academic Years (cache for long time)
  getYears: () =>
    cachedApi.get('/academic/years', {
      cache: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
    }),

  getActiveYear: () =>
    cachedApi.get('/academic/years', {
      cache: { ttl: 30 * 60 * 1000 } // 30 minutes
    }),

  // Academic Terms
  getTerms: (yearId: string) =>
    cachedApi.get(`/academic/years/${yearId}/terms`, {
      cache: { ttl: 12 * 60 * 60 * 1000 } // 12 hours
    }),

  getCurrentTerm: () =>
    cachedApi.get('/academic/current-term', {
      cache: { ttl: 30 * 60 * 1000 } // 30 minutes
    }),

  // Grading Scale (cache for long time)
  getGradingSystem: () =>
    cachedApi.get('/grading/default', {
      cache: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
    }),
};

// ==================== CACHED USER API ====================
export const cachedUserAPI = {
  getProfile: () =>
    cachedApi.get('/users/profile', {
      cache: { ttl: 15 * 60 * 1000 } // 15 minutes
    }),

  updateProfile: (data: any) =>
    cachedApi.put('/users/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    cachedApi.post('/users/change-password', { currentPassword, newPassword }),
};

// ==================== CACHED CLASS API ====================
export const cachedClassAPI = {
  getAll: () =>
    cachedApi.get('/classes', {
      cache: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
    }),

  getStreamsByClass: (classId: string) =>
    cachedApi.get(`/streams?classId=${classId}`, {
      cache: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
    }),

  getSubjects: () =>
    cachedApi.get('/subjects', {
      cache: { ttl: 24 * 60 * 60 * 1000 } // 24 hours
    }),
};

// ==================== CACHED STUDENT API ====================
export const cachedStudentAPI = {
  getAll: (search = "") =>
    cachedApi.get(`/students?search=${search}`, {
      cache: { ttl: 15 * 60 * 1000 } // 15 minutes
    }),

  getStudentAttendance: (studentId: string, params?: AttendanceParams) =>
    cachedApi.get(`/students/${studentId}/attendance`, {
      params,
      cache: { ttl: 5 * 60 * 1000 } // 5 minutes
    }),

  getStudentAttendanceSummary: (studentId: string, params?: { month?: string; year?: string }) =>
    cachedApi.get(`/students/${studentId}/attendance/summary`, {
      params,
      cache: { ttl: 10 * 60 * 1000 } // 10 minutes
    }),

  // Write operations
  create: (data: any) =>
    cachedApi.post('/students', data),

  delete: (id: string) =>
    cachedApi.delete(`/students/${id}`),
};

// Export cache manager for advanced usage
export { cachedApi, CacheManager };