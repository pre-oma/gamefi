'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="w-full">
      {label && (
        <label className={cn(
          'block text-sm font-medium mb-1.5',
          resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
        )}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2',
            resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          )}>
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-lg px-4 py-2.5',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
            'transition-all duration-200',
            resolvedTheme === 'dark'
              ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500'
              : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            error ? 'border-red-500 focus:ring-red-500' : '',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2',
            resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          )}>
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};
