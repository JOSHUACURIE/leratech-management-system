import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { CACHE_EXPIRY, LOCAL_STORAGE_KEY, type CacheStore,type CacheData } from "../types/assignment.types";

export const useCache = () => {
  const [refreshing, setRefreshing] = useState(false);

  const getCache = useCallback((): CacheStore => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error("Error reading cache:", error);
      return {};
    }
  }, []);

  const setCache = useCallback((key: keyof CacheStore, subKey: string | null, data: any) => {
    try {
      const cache = getCache();
      const cacheEntry: CacheData = {
        timestamp: Date.now(),
        data,
        expiry: CACHE_EXPIRY
      };

      if (subKey) {
        if (!cache[key]) {
          cache[key] = {};
        }
        (cache[key] as Record<string, CacheData>)[subKey] = cacheEntry;
      } else {
        cache[key] = cacheEntry;
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error("Error setting cache:", error);
    }
  }, [getCache]);

  const getCachedData = useCallback(<T,>(key: keyof CacheStore, subKey?: string, useCache: boolean = true): T | null => {
    if (!useCache) return null;

    try {
      const cache = getCache();
      let cacheEntry: CacheData | undefined;

      if (subKey && cache[key]) {
        cacheEntry = (cache[key] as Record<string, CacheData>)[subKey];
      } else {
        cacheEntry = cache[key] as CacheData;
      }

      if (cacheEntry && (Date.now() - cacheEntry.timestamp) < cacheEntry.expiry) {
        return cacheEntry.data as T;
      }
    } catch (error) {
      console.error("Error getting cached data:", error);
    }

    return null;
  }, [getCache]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      toast.success("Cache cleared successfully");
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }, []);

  const getCacheStats = useCallback(() => {
    const cache = getCache();
    let totalItems = 0;
    let expiredItems = 0;
    
    Object.entries(cache).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        if ('timestamp' in value) {
          totalItems++;
          if (Date.now() - (value as CacheData).timestamp > (value as CacheData).expiry) {
            expiredItems++;
          }
        } else {
          Object.values(value as Record<string, CacheData>).forEach(subCache => {
            if (subCache && 'timestamp' in subCache) {
              totalItems++;
              if (Date.now() - subCache.timestamp > subCache.expiry) {
                expiredItems++;
              }
            }
          });
        }
      }
    });
    
    return { totalItems, expiredItems };
  }, [getCache]);

  return {
    getCache,
    setCache,
    getCachedData,
    clearCache,
    getCacheStats,
    refreshing,
    setRefreshing
  };
};