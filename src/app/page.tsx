'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { LoginForm, RegisterForm } from '@/components';

type AuthView = 'login' | 'register';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadData } = useStore();
  const [authView, setAuthView] = useState<AuthView>('login');

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return authView === 'login' ? (
    <LoginForm onSwitchToRegister={() => setAuthView('register')} />
  ) : (
    <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
  );
}
