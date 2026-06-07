'use client';

import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({ 
  children, 
  padding = 'medium',
  style,
  ...props 
}: CardProps) {
  const paddingStyles = {
    none: '0',
    small: '0.5rem',
    medium: '1.5rem',
    large: '2rem'
  };

  const baseStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: paddingStyles[padding],
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    border: '1px solid #E5E7EB',
  };

  // Dark mode compatibility can be handled via external CSS class if needed, 
  // but for the MVP component we define a robust inline style default.

  return (
    <motion.div
      style={{ ...baseStyle, ...style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
