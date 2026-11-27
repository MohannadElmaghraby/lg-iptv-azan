/**
 * Fast IndexedDB catalog cache for instant startup on LG webOS 4.0 (handles 10,000+ channels)
 * Falls back cleanly if IndexedDB is unavailable.
 */

const DB_NAME = 'asyadtv_cache_db';
const STORE_NAME = 'catalog_store';
const CACHE_KEY = 'active_catalog_v1';

function openDb() {
  return new Promise(function (resolve, reject) {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = function () {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error); };
  });
}

export async function loadCachedCatalog() {
  try {
    const db = await openDb();
    return await new Promise(function (resolve) {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(CACHE_KEY);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { resolve(null); };
    });
  } catch (e) {
    return null;
  }
}

export async function saveCachedCatalog(catalogObj) {
  try {
    const db = await openDb();
    return await new Promise(function (resolve) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(catalogObj, CACHE_KEY);
      tx.oncomplete = function () { resolve(true); };
      tx.onerror = function () { resolve(false); };
    });
  } catch (e) {
    return false;
  }
}

export async function clearCachedCatalog() {
  try {
    const db = await openDb();
    return await new Promise(function (resolve) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(CACHE_KEY);
      tx.oncomplete = function () { resolve(true); };
      tx.onerror = function () { resolve(false); };
    });
  } catch (e) {
    return false;
  }
}
