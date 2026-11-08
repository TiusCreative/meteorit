export let firebaseInitError: string | null = null;
let adminApp: any = null;

// Dummy mock objects to prevent build failures during static generation and on Cloudflare Edge
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

let dbInstance = dummyFirestore;
let storageInstance = dummyStorage;

// Only initialize Firebase Admin if running in a Node.js server environment (not Edge/Cloudflare)
if (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME !== 'edge' && typeof window === 'undefined') {
  if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    try {
      // Dynamic require via eval to prevent Webpack from bundling gRPC/stream in edge/client
      const nodeRequire = eval('require');
      const { cert, initializeApp: initializeAdminApp, getApps } = nodeRequire('firebase-admin/app');
      const { getFirestore } = nodeRequire('firebase-admin/firestore');
      const { getStorage } = nodeRequire('firebase-admin/storage');

      if (!getApps().length) {
        let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.trim();
        while (privateKey.startsWith('"') || privateKey.startsWith("'")) privateKey = privateKey.slice(1);
        while (privateKey.endsWith('"') || privateKey.endsWith("'")) privateKey = privateKey.slice(0, -1);
        privateKey = privateKey.trim().replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\r/g, '');
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey;
        }
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
        });
      } else {
        adminApp = getApps()[0];
      }

      if (adminApp) {
        dbInstance = getFirestore(adminApp);
        storageInstance = getStorage(adminApp);
      }
    } catch (err: any) {
      console.warn("Firebase Admin SDK disabled on this runtime:", err?.message || err);
      firebaseInitError = err instanceof Error ? err.message : String(err);
    }
  }
}

export const adminDb = dbInstance;
export const adminStorage = storageInstance;
export const isFirebaseMocked = !adminApp;

export default adminApp;
