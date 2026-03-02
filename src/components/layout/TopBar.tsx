'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/components/ThemeProvider';
import { cn, calculateLevel } from '@/lib/utils';

interface TopBarProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick, sidebarCollapsed }) => {
  const { currentUser, logout, notifications } = useStore();
  const { resolvedTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const levelInfo = currentUser ? calculateLevel(currentUser.xp) : null;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 backdrop-blur-md border-b transition-all duration-300',
        resolvedTheme === 'dark'
          ? 'bg-slate-900/95 border-slate-800'
          : 'bg-white/95 border-slate-200',
        'left-0 lg:left-64',
        sidebarCollapsed && 'lg:left-[72px]'
      )}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className={cn(
            'lg:hidden p-2 rounded-lg transition-colors',
            resolvedTheme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          )}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* XP Badge */}
          {levelInfo && (
            <div className={cn(
              'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full',
              resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
            )}>
              <span className="text-emerald-500 font-bold text-sm">Lv.{levelInfo.level}</span>
              <div className={cn(
                'w-16 h-1.5 rounded-full overflow-hidden',
                resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
              )}>
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  style={{ width: `${(levelInfo.currentXp / levelInfo.nextLevelXp) * 100}%` }}
                />
              </div>
              <span className={cn(
                'text-xs',
                resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              )}>{currentUser?.xp} XP</span>
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'relative p-2 rounded-lg transition-colors',
                resolvedTheme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      'absolute right-0 mt-2 w-80 rounded-xl shadow-2xl overflow-hidden z-50 border',
                      resolvedTheme === 'dark'
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-white border-slate-200'
                    )}
                  >
                    <div className={cn(
                      'p-4 border-b',
                      resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                    )}>
                      <h3 className={cn(
                        'font-semibold',
                        resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
                      )}>Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">No notifications yet</div>
                      ) : (
                        notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif.id}
                            className={cn(
                              'p-4 border-b last:border-0 transition-colors',
                              resolvedTheme === 'dark'
                                ? 'border-slate-800 hover:bg-slate-800/50'
                                : 'border-slate-100 hover:bg-slate-50',
                              !notif.read && 'bg-emerald-500/5'
                            )}
                          >
                            <p className={cn(
                              'text-sm',
                              resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                            )}>{notif.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                'flex items-center gap-2 p-1.5 rounded-lg transition-colors',
                resolvedTheme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
              )}
            >
              <img
                src={currentUser?.avatar}
                alt={currentUser?.username}
                className="w-8 h-8 rounded-full ring-2 ring-emerald-500/30"
              />
              <span className={cn(
                'hidden sm:block text-sm font-medium max-w-[100px] truncate',
                resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}>
                {currentUser?.displayName}
              </span>
              <svg className={cn(
                'w-4 h-4 hidden sm:block',
                resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      'absolute right-0 mt-2 w-56 rounded-xl shadow-2xl overflow-hidden z-50 border',
                      resolvedTheme === 'dark'
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-white border-slate-200'
                    )}
                  >
                    <div className={cn(
                      'p-4 border-b',
                      resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                    )}>
                      <p className={cn(
                        'font-semibold',
                        resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
                      )}>{currentUser?.displayName}</p>
                      <p className={cn(
                        'text-sm',
                        resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      )}>@{currentUser?.username}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                          resolvedTheme === 'dark'
                            ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        )}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                          resolvedTheme === 'dark'
                            ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        )}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
