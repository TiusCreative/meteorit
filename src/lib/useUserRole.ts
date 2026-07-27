"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Custom hook untuk mengambil role pengguna aktif secara reaktif.
 * Mengembalikan role string ('user' | 'premium' | 'admin')
 * dan flag helper isPremiumOrAdmin.
 */
export function useUserRole() {
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebaseConfig');
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            let userRole = userData?.role || 'user';

            // Validasi kedaluwarsa premium secara dinamis
            if (userRole === 'premium' && userData?.premiumExpiry) {
              const expiry = new Date(userData.premiumExpiry);
              if (expiry < new Date()) {
                userRole = 'user';
                // Auto-clean database secara aman di background
                const { updateDoc } = await import('firebase/firestore');
                updateDoc(userRef, { role: 'user' }).catch(err => {
                  console.error('[useUserRole] Gagal auto-reset expired premium:', err);
                });
              }
            }

            setRole(userRole);
          } else {
            setRole('user');
          }
        } catch (err) {
          console.error('[useUserRole] Gagal mengambil detail user:', err);
          setRole('user');
        }
      } else {
        setRole('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    role,
    loading,
    isPremiumOrAdmin: role === 'premium' || role === 'admin'
  };
}
