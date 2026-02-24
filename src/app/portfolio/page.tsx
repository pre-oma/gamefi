'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Header, Button, PortfolioCard, Modal, Input } from '@/components';
import { Formation, FORMATIONS } from '@/types';

export default function PortfolioListPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading, loadData, portfolios, createPortfolio } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<Formation>('4-3-3');

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;

    try {
      const portfolio = await createPortfolio(newPortfolioName, newPortfolioDesc, selectedFormation);
      setShowCreateModal(false);
      setNewPortfolioName('');
      setNewPortfolioDesc('');
      router.push(`/portfolio/${portfolio.id}`);
    } catch (error) {
      console.error('Failed to create portfolio:', error);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Teams</h1>
            <p className="text-slate-400">Manage your investment portfolios.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Team
          </Button>
        </motion.div>

        {portfolios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-16 text-center"
          >
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">No teams yet</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Create your first investment team to start building your portfolio and tracking performance.
            </p>
            <Button size="lg" onClick={() => setShowCreateModal(true)}>
              Create Your First Team
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {portfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <PortfolioCard portfolio={portfolio} showUser={false} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Create Portfolio Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Team" size="md">
        <div className="space-y-6">
          <Input
            label="Team Name"
            placeholder="e.g., Growth Champions"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
          />

          <Input
            label="Description (Optional)"
            placeholder="Describe your investment strategy..."
            value={newPortfolioDesc}
            onChange={(e) => setNewPortfolioDesc(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Select Formation</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(FORMATIONS) as Formation[]).map((formation) => (
                <button
                  key={formation}
                  onClick={() => setSelectedFormation(formation)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                    selectedFormation === formation
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <span className="text-lg font-bold text-white">{formation}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreatePortfolio} className="flex-1" disabled={!newPortfolioName.trim()}>
              Create Team
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
