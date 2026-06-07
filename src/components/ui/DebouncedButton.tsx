'use client';

import React, { useState, useCallback } from 'react';

interface DebouncedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClickAction: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
  debounceMs?: number;
  loadingSpinner?: React.ReactNode;
}

export const DebouncedButton: React.FC<DebouncedButtonProps> = ({
  onClickAction,
  debounceMs = 300,
  loadingSpinner = '...',
  children,
  disabled,
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isProcessing || disabled) return;
    
    setIsProcessing(true);
    try {
      await onClickAction(e);
    } finally {
      // Small artificial debounce to prevent double-clicks
      setTimeout(() => {
        setIsProcessing(false);
      }, debounceMs);
    }
  }, [onClickAction, isProcessing, disabled, debounceMs]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      {...props}
    >
      {isProcessing ? loadingSpinner : children}
    </button>
  );
};
