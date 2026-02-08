// cacheUtils.ts
import CryptoJS from 'crypto-js';

export type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
  metadata?: {
    filters?: Record<string, any>;
    entity?: string;
  };
};

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 1000; // Maximum cache entries
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default TTL

  private constructor() {
    // Load cache from localStorage on initialization
    this.loadFromStorage();
    
    // Save cache to localStorage periodically
    setInterval(() => this.saveToStorage(), 30000);
    
    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000);
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Generate cache key from endpoint and ordered filters
   */
  generateKey(endpoint: string, filters?: Record<string, any>): string {
    if (!filters || Object.keys(filters).length === 0) {
      return endpoint;
    }

    // Sort filters by key to ensure consistent ordering
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((acc, key) => {
        if (filters[key] !== undefined && filters[key] !== null) {
          acc[key] = filters[key];
        }
        return acc;
      }, {} as Record<string, any>);

    const filterString = JSON.stringify(sortedFilters);
    const hash = CryptoJS.MD5(filterString).toString();
    return `${endpoint}:${hash}`;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl?: number, metadata?: any): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      metadata
    });

    // Apply LRU eviction if cache is full
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }

    // Save to localStorage for persistence
    this.saveToStorage();
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries for a specific endpoint
   */
  clearEndpoint(endpoint: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.startsWith(`${endpoint}:`) || key === endpoint) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    this.saveToStorage();
  }

  /**
   * Invalidate cache entries that match certain filter patterns
   */
  invalidateByPattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    this.saveToStorage();
  }

  /**
   * Get all cache entries with their metadata
   */
  getStats(): {
    total: number;
    size: number;
    endpoints: string[];
    entries: Array<{ key: string; age: number; expiresIn: number }>;
  } {
    const now = Date.now();
    const endpoints = new Set<string>();
    const entries: Array<{ key: string; age: number; expiresIn: number }> = [];

    for (const [key, entry] of this.cache) {
      const endpoint = key.split(':')[0];
      endpoints.add(endpoint);
      
      entries.push({
        key,
        age: now - entry.timestamp,
        expiresIn: entry.expiresAt - now
      });
    }

    return {
      total: this.cache.size,
      size: this.maxSize,
      endpoints: Array.from(endpoints),
      entries
    };
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    localStorage.removeItem('api-cache');
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('api-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const savedCache = localStorage.getItem('api-cache');
      if (savedCache) {
        const cacheData = JSON.parse(savedCache);
        this.cache = new Map(cacheData);
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
      this.cache = new Map();
    }
  }
}

/**
 * Cache configuration for different endpoints
 */
export const cacheConfig = {
  // Short TTL for frequently changing data
  SHORT_TTL: 1 * 60 * 1000, // 1 minute
  // Medium TTL for moderately changing data
  MEDIUM_TTL: 5 * 60 * 1000, // 5 minutes
  // Long TTL for rarely changing data
  LONG_TTL: 30 * 60 * 1000, // 30 minutes
  // Very long TTL for static data
  VERY_LONG_TTL: 24 * 60 * 60 * 1000, // 24 hours
  
  // Endpoint-specific TTL configuration
  endpoints: {
    // Academic data (rarely changes)
    '/academic/years': 24 * 60 * 60 * 1000,
    '/academic/terms': 12 * 60 * 60 * 1000,
    '/academic/current-term': 30 * 60 * 1000,
    
    // Subjects and classes (rarely changes)
    '/subjects': 24 * 60 * 60 * 1000,
    '/classes': 24 * 60 * 60 * 1000,
    '/streams': 24 * 60 * 60 * 1000,
    
    // Teacher data (moderately changes)
    '/teachers/me/subjects': 30 * 60 * 1000,
    '/teachers/me/workload': 30 * 60 * 1000,
    '/teachers/me/assignments': 10 * 60 * 1000,
    
    // Student data (moderately changes)
    '/students': 15 * 60 * 1000,
    '/students?search': 5 * 60 * 1000,
    
    // Schemes and records (frequently changes)
    '/teachers/schemes': 5 * 60 * 1000,
    '/teachers/records': 5 * 60 * 1000,
    
    // Assignments (frequently changes)
    '/assignments/teacher': 2 * 60 * 1000,
    '/assignments/student': 2 * 60 * 1000,
    '/assignments/admin': 2 * 60 * 1000,
    
    // Attendance (frequently changes)
    '/attendance': 2 * 60 * 1000,
    
    // Finance data (sensitive, shorter cache)
    '/finance': 1 * 60 * 1000,
    '/admin/finance': 1 * 60 * 1000,
    
    // User profile (moderately changes)
    '/users/profile': 15 * 60 * 1000,
    
    // Default TTL
    default: 5 * 60 * 1000
  }
} as const;