'use client';

import React, { useState } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import styles from './AdminTopbar.module.css';

export const AdminTopbar = () => {
  const [search, setSearch] = useState('');

  return (
    <header className={styles.topbar}>
      <h1 className={styles.logo}>TDC Matchmaker</h1>
      
      <div className={styles.actions}>
        <div className={styles.profileBtn}>
          <div className={styles.avatar}>AM</div>
        </div>
      </div>
    </header>
  );
};
