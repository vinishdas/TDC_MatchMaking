'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, RefreshCcw, Heart, ArrowRight } from 'lucide-react';
import { getCustomers } from '@/lib/dataRepository';
import { Customer } from '@/types';
import styles from './dashboardHome.module.css';

export default function DashboardHome() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to fetch customers', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const verifiedCount = customers.length;
  const inProgressCount = customers.filter(c => c.statusTag === 'Pending Match').length;
  const matchedCount = customers.filter(c => c.statusTag === 'Matched').length;

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>My Activity</h2>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <BadgeCheck className={styles.statIcon} size={24} />
          </div>
          <div className={styles.statValue}>{verifiedCount}</div>
          <div className={styles.statLabel}>VERIFIED CLIENTS</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <RefreshCcw className={styles.statIcon} size={24} />
          </div>
          <div className={styles.statValue}>{inProgressCount}</div>
          <div className={styles.statLabel}>IN PROGRESS</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <Heart className={styles.statIcon} size={24} />
          </div>
          <div className={styles.statValue}>{matchedCount}</div>
          <div className={styles.statLabel}>MATCHED</div>
        </div>
      </div>

      <div className={styles.listHeader}>
        <h2 className={styles.sectionTitle}>Assigned Clients</h2>
        <button 
          className={styles.viewAllBtn}
          onClick={() => router.push('/dashboard/clients')}
        >
          View All <ArrowRight size={16} />
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>CLIENT NAME</th>
              <th>STATUS</th>
              <th>LAST INTERACTION</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>Loading...</td></tr>
            ) : customers.slice(0, 5).map(client => {
              const placeholderUrl = client.gender === 'Female' 
                ? 'https://api.dicebear.com/7.x/notionists/svg?seed=female&backgroundColor=f3ebe1'
                : 'https://api.dicebear.com/7.x/notionists/svg?seed=male&backgroundColor=e6eef5';

              return (
              <tr key={client.id}>
                <td>
                  <div className={styles.clientCell}>
                    <img src={placeholderUrl} alt="Avatar" className={styles.clientAvatar} />
                    <div>
                      <div className={styles.clientName}>{client.firstName} {client.lastName}</div>
                      <div className={styles.clientId}>ID: {client.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[client.statusTag.replace(/\s+/g, '')]}`}>
                    {client.statusTag}
                  </span>
                </td>
                <td>
                  <span className={styles.interactionText}>
                    {/* Mock interaction time */}
                    {client.statusTag === 'Matched' ? 'Yesterday' : '2 hours ago'}
                  </span>
                </td>
                <td>
                  <button 
                    className={styles.reviewBtn}
                    onClick={() => router.push(`/dashboard/customer/${client.id}`)}
                  >
                    Review
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
