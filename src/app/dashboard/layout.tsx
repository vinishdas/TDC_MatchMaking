'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Basic auth check
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('isAuthenticated');
      if (!isAuth) {
        // Fallback for Auth Expiration
        sessionStorage.setItem('lastPath', window.location.pathname);
        router.push('/');
      }
    }
  }, [router]);

  return (
    <div className={styles.dashboardLayout}>
      <AdminSidebar />
      <div className={styles.mainWrapper}>
        <AdminTopbar />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
