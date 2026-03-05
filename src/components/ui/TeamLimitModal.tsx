'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from './Button';
import { TEAM_SLOT_UNLOCK_COST } from '@/types';

interface TeamLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeams: number;
  maxTeams: number;
  userXp: number;
  onUnlockSlot?: () => void;
}

export const TeamLimitModal: React.FC<TeamLimitModalProps> = ({
  isOpen,
  onClose,
  currentTeams,
  maxTeams,
  userXp,
  onUnlockSlot,
}) => {
  const { resolvedTheme } = useTheme();
  const canUnlock = userXp >= TEAM_SLOT_UNLOCK_COST;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              'relative w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden',
              resolvedTheme === 'dark'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200'
            )}
          >
            {/* Warning Icon */}
            <div className={cn(
              'flex justify-center pt-6',
              resolvedTheme === 'dark' ? 'bg-slate-900' : 'bg-white'
            )}>
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <h3 className={cn(
                'text-xl font-bold mb-2',
                resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}>
                Team Limit Reached
              </h3>
              <p className={cn(
                'mb-4',
                resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              )}>
                You currently have <span className="font-semibold text-emerald-500">{currentTeams}</span> out of <span className="font-semibold text-emerald-500">{maxTeams}</span> team slots filled.
              </p>
              <p className={cn(
                'text-sm mb-6',
                resolvedTheme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              )}>
                To create or clone a new team, you need to either delete an existing team or unlock a new slot.
              </p>

              {/* Unlock Option */}
              <div className={cn(
                'p-4 rounded-xl mb-6 border',
                resolvedTheme === 'dark'
                  ? 'bg-slate-800/50 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              )}>
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    'font-medium',
                    resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'
                  )}>
                    Unlock New Slot
                  </span>
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    {TEAM_SLOT_UNLOCK_COST} XP
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className={cn(resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>
                    Your XP:
                  </span>
                  <span className={cn(
                    'font-medium',
                    canUnlock ? 'text-emerald-500' : 'text-red-400'
                  )}>
                    {userXp} XP
                  </span>
                </div>
                {canUnlock ? (
                  <Button
                    onClick={onUnlockSlot}
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Unlock Slot (+1 Team)
                  </Button>
                ) : (
                  <div className={cn(
                    'text-center text-sm py-2 rounded-lg',
                    resolvedTheme === 'dark' ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-100 text-slate-500'
                  )}>
                    Need {TEAM_SLOT_UNLOCK_COST - userXp} more XP to unlock
                  </div>
                )}
              </div>

              {/* Close Button */}
              <Button
                onClick={onClose}
                variant="ghost"
                className={cn(
                  'w-full',
                  resolvedTheme === 'dark'
                    ? 'border-slate-700 text-slate-400 hover:text-white'
                    : 'border-slate-300 text-slate-600 hover:text-slate-900'
                )}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
