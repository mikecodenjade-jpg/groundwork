/**
 * Offline caching utilities for BuildMyGroundwork PWA.
 *
 * Uses localStorage for small data caching and IndexedDB for the
 * background sync queue (shared with the service worker).
 */

const DB_NAME = "groundwork-offline";
const DB_VERSION = 1;
const SYNC_STORE = "sync-queue";
const CACHE_PREFIX = "gw-cache:";

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

/**
 * Open (or create) the groundwork-offline IndexedDB database.
 * The schema matches what the service worker expects.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        const store = db.createObjectStore(SYNC_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("tag", "tag");
      }
      if (!db.objectStoreNames.contains("cache-data")) {
        db.createObjectStore("cache-data", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Sync queue ──────────────────────────────────────────────────────────────

/**
 * Queue an API action for background sync. When connectivity is restored,
 * the service worker will replay these requests.
 */
export async function queueAction(payload: {
  url: string;
  method: string;
  body: string;
  headers?: Record<string, string>;
  tag: string;
}): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SYNC_STORE, "readwrite");
    const store = tx.objectStore(SYNC_STORE);
    store.add({
      url: payload.url,
      method: payload.method,
      body: payload.body,
      headers: payload.headers || {},
      tag: payload.tag,
      timestamp: Date.now(),
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB unavailable — silently fail, data will be lost
    console.warn("[offline-cache] Failed to queue action — IndexedDB unavailable");
  }
}

// ─── localStorage cache ──────────────────────────────────────────────────────

/**
 * Save data to the local cache (localStorage).
 * Best for small, frequently accessed data like user profiles and settings.
 */
export function cacheData(key: string, data: unknown): void {
  try {
    const wrapped = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(wrapped));
  } catch {
    // Storage full or unavailable
    console.warn("[offline-cache] Failed to cache data for key:", key);
  }
}

/**
 * Retrieve cached data from localStorage.
 * Returns null if the key doesn't exist or the data can't be parsed.
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const wrapped = JSON.parse(raw) as { data: T; timestamp: number };
    return wrapped.data;
  } catch {
    return null;
  }
}

// ─── Background Sync registration ────────────────────────────────────────────

/**
 * Register a background sync event with the service worker.
 * Returns true if registration succeeded, false if Background Sync
 * is not supported or no active service worker exists.
 */
export async function registerSync(tag: string): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration) {
      await (registration as ServiceWorkerRegistration & {
        sync: { register(tag: string): Promise<void> };
      }).sync.register(tag);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Connectivity check ──────────────────────────────────────────────────────

/**
 * Check if the browser reports being online.
 * Note: navigator.onLine can return false positives (connected to LAN
 * but no internet), but it reliably detects when truly offline.
 */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
