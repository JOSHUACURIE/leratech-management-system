// cachedApi.ts
import axios, { type AxiosRequestConfig } from 'axios';
import { CacheManager, cacheConfig } from '../utils/cacheUtils';

// Create cache manager instance
const cacheManager = CacheManager.getInstance();

// Types for cache-aware API calls
interface CachedResponse<T> {
  data: T;
  fromCache: boolean;
  timestamp: number;
}

interface CachedRequestConfig extends AxiosRequestConfig {
  cache?: {
    ttl?: number;
    forceRefresh?: boolean;
    invalidateOnWrite?: boolean;
  };
}

/**
 * Enhanced API client with caching support
 */
export class CachedApiClient {
  private api = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Setup interceptors
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor (keeping your existing error handling)
    this.api.interceptors.response.use(
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
            
            // Clear cache on logout
            cacheManager.clearAll();
            
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
  }

  /**
   * Get cached response or make API call
   */
  async get<T>(url: string, config?: CachedRequestConfig): Promise<CachedResponse<T>> {
    const cacheKey = cacheManager.generateKey(url, config?.params);
    const cacheOptions = config?.cache || {};
    
    // Check if we should force refresh
    if (!cacheOptions.forceRefresh) {
      const cachedData = cacheManager.get<T>(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          timestamp: Date.now()
        };
      }
    }

    // Make API call
    const response = await this.api.get<T>(url, config);
    
    // Determine TTL
    const ttl = this.determineTTL(url, cacheOptions.ttl);
    
    // Cache the response
    cacheManager.set(cacheKey, response.data, ttl, {
      url,
      params: config?.params,
      method: 'GET'
    });

    return {
      data: response.data,
      fromCache: false,
      timestamp: Date.now()
    };
  }

  /**
   * POST request with cache invalidation
   */
  async post<T>(url: string, data?: any, config?: CachedRequestConfig): Promise<CachedResponse<T>> {
    const response = await this.api.post<T>(url, data, config);
    
    // Invalidate related cache entries
    this.invalidateRelatedCache(url);
    
    // Cache the response for POST requests that return data
    if (config?.cache) {
      const cacheKey = cacheManager.generateKey(url, config.params);
      const ttl = this.determineTTL(url, config.cache.ttl);
      cacheManager.set(cacheKey, response.data, ttl);
    }

    return {
      data: response.data,
      fromCache: false,
      timestamp: Date.now()
    };
  }

  /**
   * PUT request with cache invalidation
   */
  async put<T>(url: string, data?: any, config?: CachedRequestConfig): Promise<CachedResponse<T>> {
    const response = await this.api.put<T>(url, data, config);
    
    // Invalidate related cache entries
    this.invalidateRelatedCache(url);
    
    // Extract entity ID from URL for targeted invalidation
    const entityId = this.extractEntityId(url);
    if (entityId) {
      this.invalidateEntityCache(url, entityId);
    }

    return {
      data: response.data,
      fromCache: false,
      timestamp: Date.now()
    };
  }

  /**
   * DELETE request with cache invalidation
   */
  async delete<T>(url: string, config?: CachedRequestConfig): Promise<CachedResponse<T>> {
    const response = await this.api.delete<T>(url, config);
    
    // Invalidate related cache entries
    this.invalidateRelatedCache(url);
    
    // Extract entity ID from URL for targeted invalidation
    const entityId = this.extractEntityId(url);
    if (entityId) {
      this.invalidateEntityCache(url, entityId);
    }

    return {
      data: response.data,
      fromCache: false,
      timestamp: Date.now()
    };
  }

  /**
   * Determine TTL based on URL pattern
   */
  private determineTTL(url: string, customTTL?: number): number {
    if (customTTL !== undefined) {
      return customTTL;
    }

    // Check endpoint-specific TTL
    for (const [pattern, ttl] of Object.entries(cacheConfig.endpoints)) {
      if (url.includes(pattern)) {
        return ttl as number;
      }
    }

    return cacheConfig.endpoints.default;
  }

  /**
   * Invalidate cache entries related to the URL
   */
  private invalidateRelatedCache(url: string): void {
    // Extract base endpoint (e.g., /teachers/schemes from /teachers/schemes/123)
    const baseEndpoint = url.split('/').slice(0, 3).join('/');
    
    // Invalidate all cache entries for this endpoint
    cacheManager.clearEndpoint(baseEndpoint);
    
    // Also invalidate parent endpoints
    const parentEndpoints = [
      '/teachers/schemes',
      '/teachers/records',
      '/assignments',
      '/attendance',
      '/finance',
      '/students',
      '/subjects',
      '/classes'
    ];

    parentEndpoints.forEach(endpoint => {
      if (url.includes(endpoint)) {
        cacheManager.clearEndpoint(endpoint);
      }
    });
  }

  /**
   * Invalidate cache for specific entity
   */
  private invalidateEntityCache(url: string, entityId: string): void {
    const pattern = new RegExp(`.*${entityId}.*`, 'i');
    cacheManager.invalidateByPattern(pattern);
  }

  /**
   * Extract entity ID from URL
   */
  private extractEntityId(url: string): string | null {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    
    // Check if last part looks like an ID (UUID or numeric)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastPart) ||
        /^\d+$/.test(lastPart)) {
      return lastPart;
    }
    
    return null;
  }

  /**
   * Clear cache for specific endpoint
   */
  clearCache(endpoint: string): void {
    cacheManager.clearEndpoint(endpoint);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    cacheManager.clearAll();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): ReturnType<typeof cacheManager.getStats> {
    return cacheManager.getStats();
  }
}

// Create singleton instance
export const cachedApi = new CachedApiClient();