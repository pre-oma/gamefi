'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AppLayout, LeaderboardTable } from '@/components';

export default function LeaderboardPage() {
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-slate-400">See how your portfolio stacks up against the competition.</p>
      </motion.div>

      {/* Trophy Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center gap-6">
          <div className="text-6xl">🏆</div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Compete for the Top</h2>
            <p className="text-slate-400">
              Build the best performing portfolio and climb the ranks. Top performers earn badges and rewards!
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <LeaderboardTable />
      </motion.div>
    </AppLayout>
  );
}
