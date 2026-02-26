'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components';
import { useStore } from '@/store/useStore';
import { PORTFOLIO_TEMPLATES, TemplateCategory, RiskLevel, Formation } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORIES: { value: TemplateCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Templates' },
  { value: 'growth', label: 'Growth' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'sector', label: 'Sector' },
  { value: 'trending', label: 'Trending' },
];

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string }> = {
  low: { bg: 'bg-green-500/20', text: 'text-green-400' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

const DIFFICULTY_COLORS = {
  beginner: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  intermediate: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  advanced: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
};

export default function TemplatesPage() {
  const router = useRouter();
  const { currentUser, createPortfolio, assignAssetToPosition } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [creatingFromTemplate, setCreatingFromTemplate] = useState<string | null>(null);

  const filteredTemplates = PORTFOLIO_TEMPLATES.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  const handleUseTemplate = async (templateId: string) => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    const template = PORTFOLIO_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setCreatingFromTemplate(templateId);

    try {
      // Create a new portfolio with the template's formation
      const portfolio = await createPortfolio(
        `${template.name} (Copy)`,
        template.description,
        template.formation
      );

      if (portfolio) {
        // Assign assets from template
        // Note: This would need the actual asset data to be fetched
        // For now, we just create the portfolio and redirect
        router.push(`/portfolio/${portfolio.id}`);
      }
    } catch (error) {
      console.error('Failed to create portfolio from template:', error);
    } finally {
      setCreatingFromTemplate(null);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Portfolio Templates</h1>
        <p className="text-slate-400">
          Get started quickly with pre-built portfolio strategies. Clone a template and customize it to your liking.
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              selectedCategory === cat.value
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            )}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* Templates Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-white">{template.name}</h3>
                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">
                  {template.formation}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-4">{template.description}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    RISK_COLORS[template.expectedRisk].bg,
                    RISK_COLORS[template.expectedRisk].text
                  )}
                >
                  {template.expectedRisk.charAt(0).toUpperCase() + template.expectedRisk.slice(1)} Risk
                </span>
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    DIFFICULTY_COLORS[template.difficulty].bg,
                    DIFFICULTY_COLORS[template.difficulty].text
                  )}
                >
                  {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                </span>
              </div>
            </div>

            {/* Stocks Preview */}
            <div className="p-4 bg-slate-800/30">
              <p className="text-xs text-slate-500 mb-2">Included Stocks</p>
              <div className="flex flex-wrap gap-1">
                {template.stocks.slice(0, 6).map((stock) => (
                  <span
                    key={stock.positionId}
                    className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300"
                  >
                    {stock.symbol}
                  </span>
                ))}
                {template.stocks.length > 6 && (
                  <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-500">
                    +{template.stocks.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="px-6 py-3 border-t border-slate-800">
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => handleUseTemplate(template.id)}
                disabled={creatingFromTemplate === template.id}
                className={cn(
                  'w-full py-2 rounded-lg font-medium transition-colors',
                  'bg-emerald-500 hover:bg-emerald-600 text-white',
                  creatingFromTemplate === template.id && 'opacity-50 cursor-not-allowed'
                )}
              >
                {creatingFromTemplate === template.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Use This Template'
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No templates found for this category.</p>
        </div>
      )}
    </AppLayout>
  );
}
