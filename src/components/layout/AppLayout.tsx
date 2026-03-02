'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/components/ThemeProvider';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BetaBanner } from '../BetaBanner';
import { FeedbackWidget } from '../FeedbackWidget';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, loadData } = useStore();
  const { resolvedTheme } = useTheme();

  // Sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state
  if (isLoading || !isAuthenticated) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center transition-colors',
        resolvedTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
      )}>
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-300',
      resolvedTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
    )}>
      {/* Beta Banner */}
      <BetaBanner />

      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* TopBar */}
      <TopBar
        onMenuClick={() => setIsMobileOpen(true)}
        sidebarCollapsed={isCollapsed}
      />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          'lg:pl-64',
          isCollapsed && 'lg:pl-[72px]'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
};
