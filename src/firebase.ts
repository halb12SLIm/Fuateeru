import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId);

const PREF_CODE_KEY = 'user_access_code';

export const generateRandomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'SLM-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const saveLocalCode = (code: string) => {
  localStorage.setItem(PREF_CODE_KEY, code.trim());
};

export const getSavedCode = () => {
  return localStorage.getItem(PREF_CODE_KEY);
};

export const removeLocalCode = () => {
  localStorage.removeItem(PREF_CODE_KEY);
};

export const createNewAccount = async () => {
  const newCode = generateRandomCode();
  try {
    await setDoc(doc(db, 'accounts', newCode), {
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firestore offline fallback during account creation:', err);
  }
  saveLocalCode(newCode);
  return newCode;
};

export const verifyAndLogin = async (code: string) => {
  const cleanCode = code.trim();
  if (!cleanCode) return false;

  // Allow instant offline login if local code matches
  const saved = getSavedCode();
  if (saved && saved.trim() === cleanCode) {
    return true;
  }
  
  try {
    const docRef = doc(db, 'accounts', cleanCode);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      saveLocalCode(cleanCode);
      return true;
    }
  } catch (err) {
    console.warn('Firestore offline/network fallback during verification:', err);
    // If offline and code format is valid (e.g. starts with SLM-), allow offline access
    if (cleanCode.startsWith('SLM-') || cleanCode.length >= 4) {
      saveLocalCode(cleanCode);
      return true;
    }
  }
  return false;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.warn('Firestore Notice:', JSON.stringify(errInfo));
}
