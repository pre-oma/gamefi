'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { LoginForm, RegisterForm } from '@/components';

type AuthView = 'login' | 'register' | 'landing';

const FEATURES = [
  { icon: '⚽', title: 'Build Your Dream Team', description: 'Create portfolios using soccer formations. Each position represents a different risk level.' },
  { icon: '📊', title: 'Real Market Data', description: 'Track real stock prices and performance with data from major exchanges.' },
  { icon: '🏆', title: 'Compete & Earn XP', description: 'Challenge the S&P 500 or other users. Win challenges to earn XP and level up.' },
  { icon: '📚', title: 'Learn as You Go', description: 'Interactive lessons and coaching tips help you understand investing fundamentals.' },
  { icon: '🎯', title: 'Track Performance', description: 'Monitor returns, volatility, Sharpe ratio, and other key metrics in real-time.' },
  { icon: '👥', title: 'Social Investing', description: 'Follow other investors, clone top portfolios, and share your strategies.' },
];

const STATS = [
  { value: '500+', label: 'Stocks Available' },
  { value: '11', label: 'Players Per Team' },
  { value: '6', label: 'Formations' },
  { value: '20+', label: 'Badges to Earn' },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadData } = useStore();
  const [authView, setAuthView] = useState<AuthView>('landing');

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

  if (authView === 'login') {
    return <LoginForm onSwitchToRegister={() => setAuthView('register')} />;
  }

  if (authView === 'register') {
    return <RegisterForm onSwitchToLogin={() => setAuthView('login')} />;
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Beta Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto px-4 py-2 text-center">
          <span className="px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded mr-2">BETA</span>
          <span className="text-amber-200 text-sm">Early access - Join now and get 500 XP bonus!</span>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">Gamefi Invest</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthView('login')}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthView('register')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Learn Investing Through
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400"> Fantasy Sports</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              Build your dream team of stocks, compete against other investors, and learn real investing skills - all while having fun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setAuthView('register')}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                Start Building Your Team
              </button>
              <button
                onClick={() => setAuthView('login')}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-lg transition-colors"
              >
                I Have an Account
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto"
          >
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Combine the thrill of fantasy sports with real investing education
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-3xl p-8 md:p-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
            <p className="text-slate-400 mb-6">
              Join thousands of users learning to invest the fun way. Get 500 XP bonus when you sign up!
            </p>
            <button
              onClick={() => setAuthView('register')}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-lg transition-colors"
            >
              Create Free Account
            </button>
            <p className="text-slate-500 text-sm mt-4">No credit card required. Free forever.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-slate-400">Gamefi Invest</span>
          </div>
          <p className="text-slate-500 text-sm">
            Educational platform. Not financial advice. Paper trading only.
          </p>
        </div>
      </footer>
    </div>
  );
}
