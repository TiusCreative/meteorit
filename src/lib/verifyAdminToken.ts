import adminApp, { adminDb, isFirebaseMocked } from '@/lib/firebaseAdmin';

export interface AdminUser {
  uid: string;
  email?: string;
  role: string;
  active: boolean;
}

/**
 * Daftar email admin yang diizinkan — dibaca dari env var ADMIN_EMAILS
 * atau fallback ke daftar default hardcoded.
 * Format env: ADMIN_EMAILS="email1@gmail.com,email2@gmail.com"
 */
function getAdminEmailWhitelist(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || '';
  if (envEmails.trim()) {
    return envEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  }
  // Fallback default admin emails
  return [
    'creativecortex168@gmail.com',
    'timotiuss75@gmail.com',
    'tiuss75@gmail.com',
    'tius75@gmail.com',
    'tiuss168@gmail.com',
  ];
}

/**
 * Verifies a Firebase ID token from the Authorization header.
 * On Cloudflare Edge (where Firestore is unavailable), uses env-based email whitelist.
 * On Node.js runtime, also checks Firestore 'admins' collection.
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
    let uid = '';
    let email = '';

    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      uid = payload.user_id || payload.sub || '';
      email = payload.email || '';
    }

    if (!uid) {
      return null;
    }

    // === EDGE RUNTIME FALLBACK ===
    // Firestore tidak tersedia di Cloudflare Edge Runtime (adminDb = dummyFirestore).
    // Gunakan email whitelist dari env var dan Cloudflare D1 sebagai metode verifikasi utama.
    if (isFirebaseMocked) {
      const whitelist = getAdminEmailWhitelist();
      if (email && whitelist.includes(email.toLowerCase())) {
        console.log(`[verifyAdminToken] Edge auth OK via email whitelist: ${email}`);
        return {
          uid,
          email,
          role: 'admin',
          active: true
        };
      }

      // Check D1 database for admin role
      try {
        const { queryD1 } = await import('@/lib/d1Client');
        const d1Res = await queryD1('SELECT uid, email, role FROM users WHERE uid = ? OR email = ? LIMIT 1', [uid, email || '']);
        const row = d1Res?.results?.[0];
        if (row && (row.role === 'admin' || (row.email && whitelist.includes(row.email.toLowerCase())))) {
          console.log(`[verifyAdminToken] Edge auth OK via D1 record: ${row.email || uid}`);
          return {
            uid: row.uid || uid,
            email: row.email || email,
            role: 'admin',
            active: true
          };
        }
      } catch (d1Err) {
        console.warn(`[verifyAdminToken] D1 lookup failed on Edge:`, d1Err);
      }

      console.warn(`[verifyAdminToken] Edge auth DENIED. Email "${email}" not in whitelist or D1.`);
      return null;
    }

    // === NODE.JS RUNTIME — Gunakan Firestore ===
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

/**
 * Universal admin authorization check for API routes.
 * Supports Bearer token, x-admin-uid with D1/whitelist check, or x-admin-email.
 */
export async function verifyAdmin(request: Request): Promise<boolean> {
  // 1. Try Bearer token first
  try {
    const adminUser = await verifyAdminToken(request);
    if (adminUser && adminUser.role === 'admin' && adminUser.active) {
      return true;
    }
  } catch (err) {
    console.warn('[verifyAdmin] verifyAdminToken error:', err);
  }

  const whitelist = getAdminEmailWhitelist();

  // 2. Try x-admin-uid with D1 query
  const adminUid = request.headers.get('x-admin-uid');
  if (adminUid) {
    try {
      const { queryD1 } = await import('@/lib/d1Client');
      const res = await queryD1('SELECT uid, email, role FROM users WHERE uid = ? LIMIT 1', [adminUid]);
      const user = res?.results?.[0];
      if (user) {
        if (user.role === 'admin') return true;
        if (user.email && whitelist.includes(user.email.toLowerCase())) {
          return true;
        }
      }
    } catch (d1Err) {
      console.warn('[verifyAdmin] D1 user lookup error:', d1Err);
    }
  }

  // 3. Try x-admin-email if supplied
  const adminEmail = request.headers.get('x-admin-email');
  if (adminEmail && whitelist.includes(adminEmail.toLowerCase().trim())) {
    return true;
  }

  return false;
}
