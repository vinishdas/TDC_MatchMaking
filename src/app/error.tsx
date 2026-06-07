'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Graceful intercept of unauthorized access / Auth Expiration
    if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized') || error.message.toLowerCase().includes('expired')) {
      console.warn('Session expired. Redirecting to login...');
      // In a real app we'd securely cache local states here before redirecting
      sessionStorage.setItem('lastPath', window.location.pathname);
      router.push('/');
    } else {
      console.error(error);
    }
  }, [error, router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1.5rem',
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text)'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        padding: '3rem',
        borderRadius: 'var(--border-radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
          System Interruption
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          {error.message || 'An unexpected anomaly occurred during processing.'}
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-neutral)',
            borderRadius: 'var(--border-radius-md)',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Attempt Recovery
        </button>
      </div>
    </div>
  );
}
