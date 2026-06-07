'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Lock, User, Key } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { DebouncedButton } from '@/components/ui/DebouncedButton';
import styles from './login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter both username and password.', 'warning');
      return;
    }

    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 800));

    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('isAuthenticated', 'true');
      const lastPath = sessionStorage.getItem('lastPath');
      if (lastPath) {
        sessionStorage.removeItem('lastPath');
        router.push(lastPath);
      } else {
        router.push('/dashboard');
      }
    } else {
      showToast('Invalid credentials. Try admin / admin', 'error');
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.splitCard}>
        {/* Left Side: Branding */}
        <div className={styles.brandSide}>
          <div className={styles.brandContent}>
            <h2 className={styles.heroText}>Find your perfect<br/>match.</h2>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className={styles.formSide}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <div className={styles.logoHeader}>
                <Heart fill="#a87e5b" color="#a87e5b" size={28} strokeWidth={1} />
                <span className={styles.logoText}>Connect</span>
              </div>
              <h1 className={styles.title}>Get Started</h1>
            </div>

          <form className={styles.form}>
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><User size={18} /></span>
                <input 
                  id="username"
                  type="text" 
                  className={styles.input} 
                  placeholder="Your email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}><Key size={18} /></span>
                <input 
                  id="password"
                  type="password" 
                  className={styles.input} 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className={styles.forgotRow}>
                <a href="#" className={styles.forgotLink}>Forgot Password?</a>
              </div>
            </div>

            <DebouncedButton 
              onClickAction={handleLogin}
              className={styles.submitBtn}
              loadingSpinner="Authenticating..."
            >
              Log In →
            </DebouncedButton>
          </form>

            <div className={styles.footer}>
              Need assistance? <a href="#" className={styles.supportLink}>Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
