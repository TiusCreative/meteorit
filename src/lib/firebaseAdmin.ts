import { cert, initializeApp as initializeAdminApp, getApps, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

export let firebaseInitError: string | null = null;

// Check if admin app is already initialized
let adminApp: App | null = null

if (!getApps().length) {
  if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    try {
      let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.trim();
      
      // Remove any leading/trailing quotes (single, double, escaped) recursively
      while (
        privateKey.startsWith('"') || 
        privateKey.startsWith("'") || 
        privateKey.startsWith('\\"') || 
        privateKey.startsWith("\\'")
      ) {
        if (privateKey.startsWith('\\"') || privateKey.startsWith("\\'")) {
          privateKey = privateKey.slice(2);
        } else {
          privateKey = privateKey.slice(1);
        }
      }
      while (
        privateKey.endsWith('"') || 
        privateKey.endsWith("'") || 
        privateKey.endsWith('\\"') || 
        privateKey.endsWith("\\'")
      ) {
        if (privateKey.endsWith('\\"') || privateKey.endsWith("\\'")) {
          privateKey = privateKey.slice(0, -2);
        } else {
          privateKey = privateKey.slice(0, -1);
        }
      }
      
      privateKey = privateKey.trim();
      // Replace literal escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      // Replace carriage returns
      privateKey = privateKey.replace(/\\r/g, '').replace(/\r/g, '');

      // Ensure it starts with the header
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey;
      }
      // Ensure it ends with the footer (in case it was cut off during paste on Vercel)
      if (!privateKey.includes('-----END PRIVATE KEY-----')) {
        privateKey = privateKey.trim() + '\n-----END PRIVATE KEY-----';
      }

      adminApp = initializeAdminApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      })
    } catch (err) {
      console.error("Failed to initialize Firebase Admin SDK:", err);
      firebaseInitError = err instanceof Error ? err.message : String(err);
    }
  } else {
    firebaseInitError = `Missing credentials: ProjectID=${!!process.env.FIREBASE_ADMIN_PROJECT_ID}, PrivateKey=${!!process.env.FIREBASE_ADMIN_PRIVATE_KEY}`;
    console.warn("⚠️ Firebase Admin credentials missing. Admin SDK operations will use fallback dummy objects.")
  }
} else {
  adminApp = getApps()[0]
}

// Dummy mock objects to prevent build failures during static generation
const dummyFirestore = {
  collection: () => {
    const query: any = {
      doc: () => ({
        get: () => Promise.resolve({ exists: false, data: () => null }),
        set: () => Promise.resolve(),
        update: () => Promise.resolve(),
        delete: () => Promise.resolve(),
      }),
      add: () => Promise.resolve({ id: 'mock-id' }),
      where: () => ({
        get: () => Promise.resolve({ empty: true, size: 0, forEach: () => {} }),
      }),
      orderBy: () => query,
      limit: () => query,
      get: () => Promise.resolve({ size: 0, empty: true, forEach: () => {} }),
    };
    return query;
  },
  batch: () => ({
    set: () => {},
    commit: () => Promise.resolve()
  })
} as any;

const dummyStorage = {
  bucket: () => ({
    file: () => ({
      save: () => Promise.resolve(),
      exists: () => Promise.resolve([false]),
    })
  })
} as any;

export const adminDb = adminApp ? getFirestore(adminApp) : dummyFirestore;
export const adminStorage = adminApp ? getStorage(adminApp) : dummyStorage;
export const isFirebaseMocked = !adminApp;

export default adminApp;