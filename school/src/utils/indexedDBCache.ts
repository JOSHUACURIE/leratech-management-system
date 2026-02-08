// IndexedDB Utility for Persistent Caching
const DB_NAME = 'TeacherDashboardDB';
const DB_VERSION = 1;
const STORES = {
  PROFILE: 'teacher_profile',
  DASHBOARD: 'dashboard_data',
  ASSIGNMENTS: 'assignments',
  ACTIVITIES: 'activities',
  CACHE_METADATA: 'cache_metadata',
};

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.PROFILE)) {
          db.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.DASHBOARD)) {
          db.createObjectStore(STORES.DASHBOARD, { keyPath: 'teacher_id' });
        }

        if (!db.objectStoreNames.contains(STORES.ASSIGNMENTS)) {
          const assignmentStore = db.createObjectStore(STORES.ASSIGNMENTS, { keyPath: 'id' });
          assignmentStore.createIndex('teacher_id', 'teacher_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.ACTIVITIES)) {
          const activityStore = db.createObjectStore(STORES.ACTIVITIES, { keyPath: 'id' });
          activityStore.createIndex('teacher_id', 'teacher_id', { unique: false });
          activityStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CACHE_METADATA)) {
          db.createObjectStore(STORES.CACHE_METADATA, { keyPath: 'key' });
        }

        console.log('IndexedDB upgraded successfully');
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async set<T>(storeName: string, data: T, key?: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const dataWithTimestamp = {
        ...data,
        _cached_at: Date.now(),
      };
      
      const request = store.put(dataWithTimestamp);

      request.onsuccess = () => {
        // Update cache metadata
        this.updateCacheMetadata(storeName, key || 'default');
        resolve();
      };

      request.onerror = () => {
        console.error('IndexedDB put error:', request.error);
        reject(request.error);
      };
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const data = request.result;
        
        if (!data) {
          resolve(null);
          return;
        }

        // Check if cache is fresh
        const isFresh = this.isCacheFresh(data._cached_at, storeName);
        
        if (!isFresh) {
          console.log(`Cache stale for ${storeName}, returning with warning`);
          resolve({ ...data, _cache_stale: true } as T);
          return;
        }

        resolve(data as T);
      };

      request.onerror = () => {
        console.error('IndexedDB get error:', request.error);
        reject(request.error);
      };
    });
  }

  async getAll<T>(storeName: string, indexName?: string, query?: IDBValidKey): Promise<T[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      
      if (indexName && query) {
        const index = store.index(indexName);
        request = index.getAll(query);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        console.error('IndexedDB getAll error:', request.error);
        reject(request.error);
      };
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('IndexedDB delete error:', request.error);
        reject(request.error);
      };
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('IndexedDB clear error:', request.error);
        reject(request.error);
      };
    });
  }

  async clearAll(): Promise<void> {
    const promises = Object.values(STORES).map(store => this.clear(store));
    await Promise.all(promises);
  }

  private isCacheFresh(cachedAt: number, storeName: string): boolean {
    const now = Date.now();
    const age = now - cachedAt;
    
    const maxAge = this.getCacheMaxAge(storeName);
    return age < maxAge;
  }

  private getCacheMaxAge(storeName: string): number {
    const CACHE_DURATION = {
      [STORES.PROFILE]: 5 * 60 * 1000, // 5 minutes
      [STORES.DASHBOARD]: 2 * 60 * 1000, // 2 minutes
      [STORES.ASSIGNMENTS]: 5 * 60 * 1000, // 5 minutes
      [STORES.ACTIVITIES]: 1 * 60 * 1000, // 1 minute
    };

    return CACHE_DURATION[storeName as keyof typeof CACHE_DURATION] || 5 * 60 * 1000;
  }

  private async updateCacheMetadata(storeName: string, key: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE_METADATA], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE_METADATA);
      
      const metadata = {
        key: `${storeName}_${key}`,
        storeName,
        dataKey: key,
        lastUpdated: Date.now(),
      };
      
      const request = store.put(metadata);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('IndexedDB metadata update error:', request.error);
        reject(request.error);
      };
    });
  }

  async getCacheMetadata(): Promise<any[]> {
    return this.getAll(STORES.CACHE_METADATA);
  }
}

// Export singleton instance
export const indexedDBCache = new IndexedDBCache();
export { STORES };