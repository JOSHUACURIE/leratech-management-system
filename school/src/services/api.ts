import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },

});


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

export const schoolAPI = {

  getSchoolInfo: (slug: string) =>
    api.get(`/schools/${slug}`),
  
  checkSchoolSlug: (slug: string) =>
    api.get(`/schools/check/${slug}`),
};

export const subjectAPI = {
  // Fetch all subjects for the school context
  getAll: () => api.get('/subjects'),

  // Get subjects by category (e.g., 'Sciences')
  getByCategory: (category: string) => api.get(`/subjects/category/${category}`),

  // Create a new subject (Matches your Prisma controller)
  // Payload: { code, name, category }
  create: (data: { code: string; name: string; category: string }) => 
    api.post('/subjects', data),

  // Update existing subject
  update: (id: string, data: any) => api.put(`/subjects/${id}`, data),

  // Delete subject
  delete: (id: string) => api.delete(`/subjects/${id}`)
};

/**
 * Academic Calendar API
 * Handles Years, Terms, and the institution's timeline
 */
export const academicAPI = {
  // --- Academic Years ---
  getYears: () => api.get('/academic/years'),
  
  createYear: (data: { year_name: string; start_date: string; end_date: string; is_current: boolean }) => 
    api.post('/academic/years', data),

  // Get the single active year marked as 'is_current'
  getActiveYear: () => api.get('/academic/years/active'),

  // --- Academic Terms ---
  getTerms: (yearId: string) => api.get(`/academic/years/${yearId}/terms`),

  createTerm: (data: { academic_year_id: string; term_name: string; start_date: string; end_date: string; is_current: boolean }) => 
    api.post('/academic/terms', data),

  // Update a term or mark it as current
  updateTerm: (id: string, data: any) => api.put(`/academic/terms/${id}`, data),

  // --- Grading Scale ---
  getGradingSystem: () => api.get('/grading/default'),
  
  updateGradeScale: (id: string, data: { minScore: number; maxScore: number; points: number; grade: string }) => 
    api.put(`/grading/scale/${id}`, data),

  updateRemark: (scaleId: string, description: string) => 
    api.patch('/grading/scales/remarks', { scaleId, description })
};
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/users/change-password', { currentPassword, newPassword }),
};
// Add these to your existing API file
export const classAPI = {
  getAll: () => api.get('/classes'),
  getStreamsByClass: (classId: string) => api.get(`/streams?classId=${classId}`),
  getSubjects: () => api.get('/subjects'), // Adjust endpoint as per your backend
};

export const studentAPI = {
  getAll: (search = "") => api.get(`/students?search=${search}`),
  create: (data: any) => api.post('/students', data),
  delete: (id: string) => api.delete(`/students/${id}`),
};

export default api;