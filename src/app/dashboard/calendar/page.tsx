'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getScheduledCalls, ScheduledCall } from '@/lib/calendarRepository';
import { PhoneCall, ArrowRight } from 'lucide-react';
import styles from './calendar.module.css';

export default function CalendarPage() {
  const router = useRouter();
  const [calls, setCalls] = useState<ScheduledCall[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchCalls = async () => {
      const data = await getScheduledCalls();
      setCalls(data);
    };
    fetchCalls();
  }, []);

  const getCallsForDate = (date: Date) => {
    return calls.filter(call => {
      const callDate = new Date(call.date);
      return callDate.toDateString() === date.toDateString();
    });
  };

  const selectedDateCalls = getCallsForDate(selectedDate);

  // Optional: add markers to the calendar for days with calls
  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dayCalls = getCallsForDate(date);
      if (dayCalls.length > 0) {
        return <div className={styles.callDot}></div>;
      }
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Scheduled Calls</h1>
      <p className={styles.subtitle}>Manage your upcoming client meetings and follow-ups.</p>

      <div className={styles.layout}>
        <div className={styles.calendarSection}>
          <div className={styles.card}>
            <Calendar 
              onChange={(value) => setSelectedDate(value as Date)} 
              value={selectedDate}
              tileContent={tileContent}
              className={styles.customCalendar}
            />
          </div>
        </div>

        <div className={styles.detailsSection}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              Calls for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            
            {selectedDateCalls.length > 0 ? (
              <div className={styles.callsList}>
                {selectedDateCalls.map(call => (
                  <div key={call.id} className={styles.callItem}>
                    <div className={styles.callInfo}>
                      <div className={styles.iconBox}>
                        <PhoneCall size={20} />
                      </div>
                      <div className={styles.callContentWrapper}>
                        <h4 className={styles.clientName}>{call.customerName}</h4>
                        <p className={styles.clientId}>ID: {call.customerId}</p>
                        <button 
                          className={styles.viewProfileBtn}
                          onClick={() => router.push(`/dashboard/customer/${call.customerId}`)}
                        >
                          View Profile <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.upcomingBadge}>Upcoming</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No calls scheduled for this date.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
