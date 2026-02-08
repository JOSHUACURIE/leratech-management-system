import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

// Create Query Client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (formerly cacheTime)
      staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
      
      // Retry configuration
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Network mode
      networkMode: 'offlineFirst', // Try cache first, then network
      
      // Error handling
      throwOnError: false,
    },
    mutations: {
      retry: 1,
      networkMode: 'online', // Only run mutations when online
    },
  },
});

// Query Keys Factory for type safety
export const queryKeys = {
  // Teacher Profile
  teacherProfile: () => ['teacher', 'profile'] as const,
  
  // Dashboard
  teacherDashboard: (teacherId: string) => ['teacher', teacherId, 'dashboard'] as const,
  
  // Assignments
  teacherAssignments: (teacherId: string) => ['teacher', teacherId, 'assignments'] as const,
  teacherAssignment: (assignmentId: string) => ['teacher', 'assignment', assignmentId] as const,
  pendingSubmissions: (teacherId: string) => ['teacher', teacherId, 'pending-submissions'] as const,
  
  // Activities
  teacherActivities: (teacherId: string, limit?: number) => 
    ['teacher', teacherId, 'activities', { limit }] as const,
  
  // Statistics
  teacherStatistics: (teacherId: string) => ['teacher', teacherId, 'statistics'] as const,
  
  // Classes
  teacherClasses: (teacherId: string) => ['teacher', teacherId, 'classes'] as const,
  
  // Students
  teacherStudents: (teacherId: string, classId?: string) => 
    ['teacher', teacherId, 'students', { classId }] as const,
  
  // Schemes
  teacherSchemes: (teacherId: string) => ['teacher', teacherId, 'schemes'] as const,
  
  // Records
  teacherRecords: (teacherId: string) => ['teacher', teacherId, 'records'] as const,
  
  // Lessons
  teacherLessons: (teacherId: string) => ['teacher', teacherId, 'lessons'] as const,
};

// React Query Provider Component
interface QueryProviderProps {
  children: React.ReactNode;
  enableDevtools?: boolean;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ 
  children, 
  enableDevtools = process.env.NODE_ENV === 'development' 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {enableDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

// Helper function to prefetch queries
export const prefetchQueries = {
  async teacherProfile(api: any) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.teacherProfile(),
      queryFn: async () => {
        try {
          const response = await api.get('/teachers/me/profile');
          return response.data;
        } catch (error) {
          console.error('Failed to prefetch teacher profile:', error);
          throw error;
        }
      },
    });
  },

  async teacherDashboard(api: any, teacherId: string) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.teacherDashboard(teacherId),
      queryFn: async () => {
        try {
          const response = await api.get(`/teachers/${teacherId}/dashboard`);
          return response.data;
        } catch (error) {
          console.error('Failed to prefetch teacher dashboard:', error);
          throw error;
        }
      },
    });
  },

  async teacherAssignments(api: any, teacherId: string) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.teacherAssignments(teacherId),
      queryFn: async () => {
        try {
          const response = await api.get(`/teachers/${teacherId}/assignments`);
          return response.data;
        } catch (error) {
          console.error('Failed to prefetch teacher assignments:', error);
          throw error;
        }
      },
    });
  },
};

// Helper function to invalidate queries
export const invalidateQueries = {
  async teacherProfile() {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.teacherProfile(),
    });
  },

  async teacherDashboard(teacherId: string) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.teacherDashboard(teacherId),
    });
  },

  async teacherAssignments(teacherId: string) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.teacherAssignments(teacherId),
    });
  },

  async teacherActivities(teacherId: string) {
    await queryClient.invalidateQueries({
      queryKey: ['teacher', teacherId, 'activities'],
    });
  },

  async allTeacherData(teacherId: string) {
    await queryClient.invalidateQueries({
      queryKey: ['teacher', teacherId],
    });
  },

  async all() {
    await queryClient.invalidateQueries();
  },
};

// Helper function to clear all caches
export const clearAllCaches = async () => {
  await queryClient.clear();
  console.log('[Cache] All React Query caches cleared');
};

// Hook for common query configurations
export const useTeacherQueries = () => {
  const api = async () => {
    // Dynamic import to avoid circular dependencies
    return await import('../api').then(mod => mod.default);
  };

  return {
    useTeacherProfile: (options = {}) => ({
      queryKey: queryKeys.teacherProfile(),
      queryFn: async () => {
        const client = await api();
        const response = await client.get('/teachers/me/profile');
        return response.data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      ...options,
    }),

    useTeacherDashboard: (teacherId: string, options = {}) => ({
      queryKey: queryKeys.teacherDashboard(teacherId),
      queryFn: async () => {
        const client = await api();
        const response = await client.get(`/teachers/${teacherId}/dashboard`);
        return response.data;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: true,
      ...options,
    }),

    useTeacherAssignments: (teacherId: string, options = {}) => ({
      queryKey: queryKeys.teacherAssignments(teacherId),
      queryFn: async () => {
        const client = await api();
        const response = await client.get(`/teachers/${teacherId}/assignments`);
        return response.data;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes (assignments change less frequently)
      gcTime: 1000 * 60 * 60 * 2, // 2 hours
      ...options,
    }),

    useTeacherActivities: (teacherId: string, limit = 20, options = {}) => ({
      queryKey: queryKeys.teacherActivities(teacherId, limit),
      queryFn: async () => {
        const client = await api();
        const response = await client.get(`/teachers/${teacherId}/activity`, {
          params: { limit }
        });
        return response.data;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes (activities update frequently)
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
      ...options,
    }),
  };
};

// Optimistic updates helper
export const optimisticUpdate = {
  teacherProfile: async (updater: (oldData: any) => any) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.teacherProfile() });
    
    const previousData = queryClient.getQueryData(queryKeys.teacherProfile());
    
    queryClient.setQueryData(queryKeys.teacherProfile(), (old: any) => {
      return updater(old);
    });
    
    return { previousData };
  },
  
  rollback: (key: any, previousData: any) => {
    queryClient.setQueryData(key, previousData);
  },
};

// Cache utilities
export const cacheUtils = {
  // Get cache size
  getCacheSize: () => {
    const cache = queryClient.getQueryCache();
    return cache.getAll().length;
  },

  // Get cache statistics
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.status === 'pending').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      freshQueries: queries.filter(q => !q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
    };
  },

  // Clear expired cache
  clearExpiredCache: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    queries.forEach(query => {
      if (query.isStale() && query.state.data) {
        cache.remove(query);
      }
    });
    
    return queries.length - cache.getAll().length;
  },
};

// Export default
export default {
  queryClient,
  QueryProvider,
  queryKeys,
  prefetchQueries,
  invalidateQueries,
  clearAllCaches,
  useTeacherQueries,
  optimisticUpdate,
  cacheUtils,
};