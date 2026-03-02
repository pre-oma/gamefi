'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={cn(
              'relative w-full rounded-2xl shadow-2xl border',
              'max-h-[90vh] overflow-hidden flex flex-col',
              resolvedTheme === 'dark'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200',
              sizes[size]
            )}
          >
            {/* Header */}
            {title && (
              <div className={cn(
                'flex items-center justify-between px-6 py-4 border-b',
                resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
              )}>
                <h2 className={cn(
                  'text-xl font-semibold',
                  resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
                )}>{title}</h2>
                <button
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    resolvedTheme === 'dark'
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
