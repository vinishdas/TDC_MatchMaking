'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CheckCircle, CalendarDays, Settings } from 'lucide-react';
import styles from './AdminSidebar.module.css';

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { label: 'Verified Clients', path: '/dashboard/clients', icon: <CheckCircle size={20} /> },
    { label: 'Calendar', path: '/dashboard/calendar', icon: <CalendarDays size={20} /> },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.avatar}>
          <div className={styles.avatarPlaceholder}>AC</div>
        </div>
        <div>
          <h2 className={styles.title}>Admin<br/>Console</h2>
          <p className={styles.subtitle}>Elite Admin Portal</p>
        </div>
      </div>



      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link 
            key={item.label} 
            href={item.path}
            className={`${styles.navItem} ${pathname === item.path || (pathname.startsWith(item.path) && !item.exact) ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
