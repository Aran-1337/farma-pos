// src/lib/offline-db.js
// A simple wrapper for IndexedDB to handle offline data for Farma POS

const DB_NAME = 'FarmaOfflineDB';
const DB_VERSION = 2;

export const initOfflineDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for products cache
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      
      // Store for pending invoices to sync
      if (!db.objectStoreNames.contains('pendingInvoices')) {
        db.createObjectStore('pendingInvoices', { keyPath: 'tempId', autoIncrement: true });
      }

      // Store for settings/metadata
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
};

export const saveProductsOffline = async (products) => {
  const db = await initOfflineDB();
  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');
  
  // Clear old products first? Or just put new ones
  // For performance in large sets, we might want to be careful
  // store.clear(); 
  
  products.forEach(product => {
    store.put(product);
  });
  
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const getProductsOffline = async () => {
  const db = await initOfflineDB();
  const tx = db.transaction('products', 'readonly');
  const store = tx.objectStore('products');
  const request = store.getAll();
  
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
  });
};

export const saveInvoiceOffline = async (invoice) => {
  const db = await initOfflineDB();
  const tx = db.transaction('pendingInvoices', 'readwrite');
  const store = tx.objectStore('pendingInvoices');
  
  const record = {
    ...invoice,
    offlineAt: new Date().toISOString(),
    synced: false
  };
  
  const request = store.add(record);
  
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
  });
};

export const getPendingInvoices = async () => {
  const db = await initOfflineDB();
  const tx = db.transaction('pendingInvoices', 'readonly');
  const store = tx.objectStore('pendingInvoices');
  const request = store.getAll();
  
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
  });
};

export const removeSyncedInvoice = async (tempId) => {
  const db = await initOfflineDB();
  const tx = db.transaction('pendingInvoices', 'readwrite');
  const store = tx.objectStore('pendingInvoices');
  const request = store.delete(tempId);
  
  return new Promise((resolve) => {
    request.onsuccess = () => resolve();
  });
};
