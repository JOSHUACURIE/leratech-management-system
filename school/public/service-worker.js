// Service Worker for Caching Strategy
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Cache duration in milliseconds
const CACHE_DURATION = {
  PROFILE: 5 * 60 * 1000, // 5 minutes
  DASHBOARD: 2 * 60 * 1000, // 2 minutes
  STATISTICS: 10 * 60 * 1000, // 10 minutes
  ASSIGNMENTS: 5 * 60 * 1000, // 5 minutes
  ACTIVITIES: 1 * 60 * 1000, // 1 minute
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
};

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/teachers/me/profile',
  '/teachers/.*/dashboard',
  '/teachers/.*/assignments',
  '/teachers/.*/activity',
  '/teachers/.*/statistics',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[Service Worker] Skip waiting');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== API_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with Network First, Cache Fallback strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cacheable = isCacheable(url.pathname);

  if (!cacheable) {
    // Don't cache this endpoint, just fetch
    try {
      return await fetch(request);
    } catch (error) {
      console.error('[Service Worker] Fetch failed:', error);
      return new Response(JSON.stringify({ 
        error: 'Network error',
        offline: true 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  const cache = await caches.open(API_CACHE);

  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone the response
      const responseToCache = networkResponse.clone();
      
      // Add timestamp to cache metadata
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: new Headers(responseToCache.headers)
      });
      responseWithTimestamp.headers.set('sw-cache-timestamp', Date.now().toString());
      
      // Cache the response
      cache.put(request, responseWithTimestamp);
      
      return networkResponse;
    }
    
    // If network fails, fall back to cache
    return await getCachedResponse(cache, request, url.pathname);
  } catch (error) {
    console.log('[Service Worker] Network failed, using cache');
    return await getCachedResponse(cache, request, url.pathname);
  }
}

// Handle image requests with Cache First strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a placeholder image or error response
    return new Response('', { status: 404 });
  }
}

// Handle static assets with Cache First, Network Fallback strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Static asset fetch failed:', error);
    return new Response('', { status: 404 });
  }
}

// Check if endpoint is cacheable
function isCacheable(pathname) {
  return CACHEABLE_APIS.some(pattern => {
    const regex = new RegExp(pattern);
    return regex.test(pathname);
  });
}

// Get cached response with freshness check
async function getCachedResponse(cache, request, pathname) {
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    return new Response(JSON.stringify({ 
      error: 'No cached data available',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check if cache is still fresh
  const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
  if (cacheTimestamp) {
    const age = Date.now() - parseInt(cacheTimestamp);
    const maxAge = getCacheMaxAge(pathname);
    
    if (age > maxAge) {
      console.log('[Service Worker] Cache stale, but using anyway (offline)');
      // Add a header to indicate stale cache
      const staleResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: new Headers(cachedResponse.headers)
      });
      staleResponse.headers.set('sw-cache-stale', 'true');
      return staleResponse;
    }
  }
  
  return cachedResponse;
}

// Get cache max age based on endpoint
function getCacheMaxAge(pathname) {
  if (pathname.includes('/profile')) return CACHE_DURATION.PROFILE;
  if (pathname.includes('/dashboard')) return CACHE_DURATION.DASHBOARD;
  if (pathname.includes('/statistics')) return CACHE_DURATION.STATISTICS;
  if (pathname.includes('/assignments')) return CACHE_DURATION.ASSIGNMENTS;
  if (pathname.includes('/activity')) return CACHE_DURATION.ACTIVITIES;
  return CACHE_DURATION.STATIC;
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});