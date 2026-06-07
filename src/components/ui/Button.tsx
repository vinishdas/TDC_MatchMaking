'use client';

import { ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className, 
  ...props 
}: ButtonProps) {
  const baseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    border: 'none',
    opacity: isLoading ? 0.7 : 1,
    fontFamily: 'inherit'
  };

  const variants = {
    primary: { backgroundColor: '#0A192F', color: '#FFFFFF' },
    secondary: { backgroundColor: '#D4AF37', color: '#0A192F' },
    danger: { backgroundColor: '#EF4444', color: '#FFFFFF' }
  };

  return (
    <motion.button
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      style={{ ...baseStyle, ...variants[variant] }}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? 'Processing...' : children}
    </motion.button>
  );
}
