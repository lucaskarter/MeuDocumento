import { Document, Folder, User } from '../types';
import { DEFAULT_FOLDERS } from '../constants';

const KEYS = {
  FOLDERS: 'docusafe_folders',
  DOCUMENTS: 'docusafe_documents',
};

// --- IndexedDB Configuration ---
const DB_NAME = 'DocuSafeDB';
const STORE_DOCS = 'documents';
const DB_VERSION = 1;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Migrate data from localStorage if it exists
const migrateFromLocalStorage = async () => {
  const localDocs = localStorage.getItem(KEYS.DOCUMENTS);
  if (localDocs) {
    try {
      const parsed: Document[] = JSON.parse(localDocs);
      if (parsed.length > 0) {
        const db = await getDB();
        const tx = db.transaction(STORE_DOCS, 'readwrite');
        const store = tx.objectStore(STORE_DOCS);
        
        await Promise.all(parsed.map(doc => {
            return new Promise<void>((res, rej) => {
                const req = store.put(doc);
                req.onsuccess = () => res();
                req.onerror = () => rej(req.error);
            });
        }));
      }
      localStorage.removeItem(KEYS.DOCUMENTS);
    } catch (e) {
      console.error("Migration failed", e);
    }
  }
};

// --- Folders (Synchronous - localStorage) ---
export const getFolders = (): Folder[] => {
  const data = localStorage.getItem(KEYS.FOLDERS);
  return data ? JSON.parse(data) : [];
};

export const saveFolders = (folders: Folder[]): void => {
  localStorage.setItem(KEYS.FOLDERS, JSON.stringify(folders));
};

export const createDefaultFolders = (): void => {
    if (getFolders().length === 0) {
        saveFolders(DEFAULT_FOLDERS);
    }
}

export const createFolder = (name: string, coverColor: string, icon: string): Folder => {
  const folders = getFolders();
  const newFolder: Folder = {
    id: Date.now().toString(),
    name,
    coverColor,
    icon,
    createdAt: Date.now(),
  };
  saveFolders([...folders, newFolder]);
  return newFolder;
};

export const updateFolder = (updatedFolder: Folder): void => {
  const folders = getFolders();
  const newFolders = folders.map(f => f.id === updatedFolder.id ? updatedFolder : f);
  saveFolders(newFolders);
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  const folders = getFolders();
  const newFolders = folders.filter(f => f.id !== folderId);
  saveFolders(newFolders);

  const docs = await getDocuments(folderId);
  const db = await getDB();
  const tx = db.transaction(STORE_DOCS, 'readwrite');
  const store = tx.objectStore(STORE_DOCS);
  
  await Promise.all(docs.map(doc => {
      return new Promise<void>((resolve, reject) => {
          const req = store.delete(doc.id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
      });
  }));
};

// --- Documents (Asynchronous - IndexedDB) ---

export const getDocuments = async (folderId?: string): Promise<Document[]> => {
  await migrateFromLocalStorage();

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readonly');
    const store = tx.objectStore(STORE_DOCS);
    const request = store.getAll();
    request.onsuccess = () => {
        let allDocs = request.result as Document[];
        if (folderId) {
            allDocs = allDocs.filter(d => d.folderId === folderId);
        }
        resolve(allDocs);
    };
    request.onerror = () => reject(request.error);
  });
};

export const addDocument = async (doc: Document): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCS, 'readwrite');
    const store = tx.objectStore(STORE_DOCS);
    const request = store.add(doc);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateDocument = async (updatedDoc: Document): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DOCS, 'readwrite');
        const store = tx.objectStore(STORE_DOCS);
        const request = store.put(updatedDoc);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteDocument = async (docId: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DOCS, 'readwrite');
        const store = tx.objectStore(STORE_DOCS);
        const request = store.delete(docId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};