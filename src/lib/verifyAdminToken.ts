import { getAuth } from 'firebase-admin/auth';
import adminApp, { adminDb, isFirebaseMocked } from '@/lib/firebaseAdmin';

export interface AdminUser {
  uid: string;
  email?: string;
  role: string;
  active: boolean;
}

/**
 * Verifies a Firebase ID token from the Authorization header
 * and checks if the user is in the Firestore 'admins' collection with role="admin" and active=true.
 */
export async function verifyAdminToken(request: Request): Promise<AdminUser | null> {
  // Bypass verification in local development if Firebase Admin is mocked
  if (isFirebaseMocked && process.env.NODE_ENV === 'development') {
    const devUid = request.headers.get('x-admin-uid') || 'dev-admin-uid';
    const devEmail = request.headers.get('x-admin-email') || 'admin@meteorit.my.id';
    return {
      uid: devUid,
      email: devEmail,
      role: 'admin',
      active: true
    };
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split('Bearer ')[1];
  if (!token) return null;

  try {
    if (!adminApp) {
      console.error('Firebase Admin App is not initialized.');
      return null;
    }
    
    const adminAuth = getAuth(adminApp);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // 1. Check if document exists with ID = uid in 'admins' collection
    const adminDoc = await adminDb.collection('admins').doc(uid).get();
    let isAuthorized = false;
    let adminData = adminDoc.exists ? adminDoc.data() : null;

    if (adminDoc.exists && adminData) {
      if (adminData.role === 'admin' && adminData.active === true) {
        isAuthorized = true;
      }
    }

    // 2. Query by 'uid' field if not found by document ID in 'admins'
    if (!isAuthorized) {
      const q = await adminDb.collection('admins').where('uid', '==', uid).limit(1).get();
      if (!q.empty) {
        adminData = q.docs[0].data();
        if (adminData?.role === 'admin' && adminData?.active === true) {
          isAuthorized = true;
        }
      }
    }

    // 3. Fallback: Check if user exists in 'users' collection with role 'admin'
    if (!isAuthorized) {
      const userDoc = await adminDb.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.role === 'admin') {
          isAuthorized = true;
          adminData = {
            role: 'admin',
            active: true,
            email: userData?.email || email
          };
        }
      }
    }

    // 4. Fallback: Check if user's email is in the admin whitelist settings
    if (!isAuthorized && email) {
      try {
        const settingsDoc = await adminDb.collection('settings').doc('global').get();
        if (settingsDoc.exists) {
          const whitelist: string[] = settingsDoc.data()?.adminEmails || [];
          if (whitelist.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
            isAuthorized = true;
            adminData = {
              role: 'admin',
              active: true,
              email
            };
          }
        }
      } catch (err) {
        console.error('Error fetching global settings for fallback check:', err);
      }
    }

    if (isAuthorized && adminData) {
      return {
        uid,
        email: email || adminData.email,
        role: adminData.role,
        active: adminData.active
      };
    }
    
    console.warn(`Access denied for UID: ${uid}. Not found in admins collection or active=false/role!=admin.`);
    return null;
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return null;
  }
}
