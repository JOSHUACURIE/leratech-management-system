import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import api from '../services/api';

// Teacher Profile Hook
export const useTeacherProfile = () => {
  return useQuery({
    queryKey: queryKeys.teacherProfile(),
    queryFn: async () => {
      const response = await api.get('/teachers/me/profile');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Teacher Dashboard Hook
export const useTeacherDashboard = (teacherId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.teacherDashboard(teacherId),
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}/dashboard`);
      return response.data.data;
    },
    enabled: !!teacherId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Teacher Assignments Hook
export const useTeacherAssignments = (teacherId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.teacherAssignments(teacherId),
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}/assignments`);
      return response.data.data;
    },
    enabled: !!teacherId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Single Assignment Hook
export const useAssignment = (assignmentId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.teacherAssignment(assignmentId),
    queryFn: async () => {
      const response = await api.get(`/teachers/assignments/${assignmentId}`);
      return response.data.data;
    },
    enabled: !!assignmentId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// Pending Submissions Hook
export const usePendingSubmissions = (teacherId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.pendingSubmissions(teacherId),
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}/assignments/pending-submissions`);
      return response.data.data || [];
    },
    enabled: !!teacherId && enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Teacher Activities Hook
export const useTeacherActivities = (teacherId: string, limit = 5, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.teacherActivities(teacherId, limit),
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}/activity`, {
        params: { limit },
      });
      return response.data.data || [];
    },
    enabled: !!teacherId && enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Teacher Statistics Hook
export const useTeacherStatistics = (teacherId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.teacherStatistics(teacherId),
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}/statistics`);
      return response.data.data;
    },
    enabled: !!teacherId && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Teacher Classes Hook
export const useTeacherClasses = (teacherId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.teacherClasses(teacherId),
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}/classes`);
      return response.data.data;
    },
    enabled: !!teacherId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// Teacher Students Hook
export const useTeacherStudents = (teacherId: string, classId?: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.teacherStudents(teacherId, classId),
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}/students`, {
        params: classId ? { class_id: classId } : undefined,
      });
      return response.data.data;
    },
    enabled: !!teacherId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation Hooks

// Update Profile Mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/teachers/me/profile', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate profile query
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacherProfile(),
      });
    },
  });
};

// Record Attendance Mutation
export const useRecordAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/attendance', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacherDashboard(variables.teacher_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacherStatistics(variables.teacher_id),
      });
    },
  });
};

// Submit Scores Mutation
export const useSubmitScores = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/scores', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.pendingSubmissions(variables.teacher_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacherDashboard(variables.teacher_id),
      });
    },
  });
};

// Create Lesson Plan Mutation
export const useCreateLessonPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/lessons', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacherDashboard(variables.teacher_id),
      });
    },
  });
};

// Upload Scheme Mutation
export const useUploadScheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/schemes', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, variables: any) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacherDashboard(variables.get('teacher_id')),
      });
    },
  });
};

// Custom hook for prefetching data
export const usePrefetchDashboardData = () => {
  const queryClient = useQueryClient();

  return {
    prefetchProfile: async () => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.teacherProfile(),
        queryFn: async () => {
          const response = await api.get('/teachers/me/profile');
          return response.data.data;
        },
      });
    },

    prefetchDashboard: async (teacherId: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.teacherDashboard(teacherId),
        queryFn: async () => {
          const response = await api.get(`/teachers/${teacherId}/dashboard`);
          return response.data.data;
        },
      });
    },

    prefetchAll: async (teacherId: string) => {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.teacherProfile(),
          queryFn: async () => {
            const response = await api.get('/teachers/me/profile');
            return response.data.data;
          },
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.teacherDashboard(teacherId),
          queryFn: async () => {
            const response = await api.get(`/teachers/${teacherId}/dashboard`);
            return response.data.data;
          },
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.teacherAssignments(teacherId),
          queryFn: async () => {
            const response = await api.get(`/teachers/${teacherId}/assignments`);
            return response.data.data;
          },
        }),
      ]);
    },
  };
};