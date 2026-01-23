'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components';

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

const sections: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    content: (
      <div className="space-y-4">
        <p>Welcome to Gamefi Invest! This platform lets you build investment portfolios using a soccer team formation metaphor.</p>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li><strong>Register/Login</strong> - Create an account or log in to get started</li>
          <li><strong>Create a Portfolio</strong> - Go to "My Teams" and click "Create New Team"</li>
          <li><strong>Choose a Formation</strong> - Select from formations like 4-3-3, 4-4-2, etc.</li>
          <li><strong>Add Assets</strong> - Click on each position to assign stocks, ETFs, or other assets</li>
          <li><strong>Track Performance</strong> - Monitor your portfolio's returns over time</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'portfolios',
    title: 'Creating & Managing Portfolios',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Creating a New Portfolio</h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li>Navigate to <Link href="/portfolio" className="text-emerald-400 hover:underline">My Teams</Link></li>
          <li>Click the "Create New Team" button</li>
          <li>Enter a name and description for your portfolio</li>
          <li>Select a formation (determines your asset allocation strategy)</li>
          <li>Choose whether to make it public or private</li>
        </ol>

        <h4 className="font-semibold text-white mt-6">Adding Assets to Positions</h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li>Click on any empty position on the formation field</li>
          <li>Search for stocks, ETFs, or other assets by name or symbol</li>
          <li>Select an asset to assign it to that position</li>
          <li>Each position gets an equal allocation (~9% each for 11 positions)</li>
        </ol>

        <h4 className="font-semibold text-white mt-6">Formation Strategy</h4>
        <ul className="list-disc list-inside space-y-2 text-slate-300">
          <li><strong>Goalkeeper (GK)</strong> - Ultra-safe, low-risk assets (bonds, stable ETFs)</li>
          <li><strong>Defenders</strong> - Low-risk, stable assets (blue-chip stocks, REITs)</li>
          <li><strong>Midfielders</strong> - Medium-risk, balanced assets</li>
          <li><strong>Attackers</strong> - High-risk, high-reward growth stocks</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'following',
    title: 'Following Users & Earning XP',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-white">How to Follow Users</h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li>Go to <Link href="/explore" className="text-emerald-400 hover:underline">Explore</Link> to discover other users</li>
          <li>Click on a user's profile or portfolio to view their page</li>
          <li>Click the "Follow" button on their profile</li>
          <li>You'll see their portfolios in your feed</li>
        </ol>

        <h4 className="font-semibold text-white mt-6">XP & Rewards System</h4>
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-300">Gaining a follower</span>
            <span className="text-emerald-400 font-semibold">+100 XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Creating a portfolio</span>
            <span className="text-emerald-400 font-semibold">+50 XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Portfolio gets liked</span>
            <span className="text-emerald-400 font-semibold">+10 XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Portfolio gets cloned</span>
            <span className="text-emerald-400 font-semibold">+25 XP</span>
          </div>
        </div>

        <p className="text-slate-400 text-sm">XP helps you level up and unlock badges. Check your level progress in the header!</p>
      </div>
    ),
  },
  {
    id: 'compare',
    title: 'Comparing Portfolios',
    icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Side-by-Side Comparison</h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li>Navigate to <Link href="/compare" className="text-emerald-400 hover:underline">Compare</Link> from the header</li>
          <li>Select 2-4 portfolios using the dropdown selectors</li>
          <li>Choose from your own portfolios or public portfolios from other users</li>
          <li>View visual bar charts comparing key metrics</li>
          <li>See a detailed comparison table with all metrics</li>
        </ol>

        <h4 className="font-semibold text-white mt-6">Metrics Compared</h4>
        <ul className="list-disc list-inside space-y-2 text-slate-300">
          <li><strong>Total Return</strong> - Overall percentage gain/loss</li>
          <li><strong>Sharpe Ratio</strong> - Risk-adjusted returns (higher is better)</li>
          <li><strong>Beta</strong> - Market volatility correlation (1 = market average)</li>
          <li><strong>Volatility</strong> - Price fluctuation measure (lower = more stable)</li>
          <li><strong>Max Drawdown</strong> - Largest peak-to-trough decline</li>
          <li><strong>Win Rate</strong> - Percentage of positive return days</li>
        </ul>

        <p className="text-slate-400 text-sm">The best value in each metric is highlighted in green!</p>
      </div>
    ),
  },
  {
    id: 'date-range',
    title: 'Date Range Performance',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Viewing Performance by Date Range</h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li>Open any portfolio detail page</li>
          <li>Find the "Performance History" section</li>
          <li>Use the preset buttons: 1W, 1M, 3M, 6M, 1Y, or All</li>
          <li>Click "Custom" to select specific start and end dates</li>
          <li>The chart and metrics will update to show that time period</li>
        </ol>

        <h4 className="font-semibold text-white mt-6">Quick Presets</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <span className="text-emerald-400 font-semibold">1W</span>
            <p className="text-xs text-slate-400">Last 7 days</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <span className="text-emerald-400 font-semibold">1M</span>
            <p className="text-xs text-slate-400">Last month</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <span className="text-emerald-400 font-semibold">3M</span>
            <p className="text-xs text-slate-400">Last 3 months</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <span className="text-emerald-400 font-semibold">6M</span>
            <p className="text-xs text-slate-400">Last 6 months</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <span className="text-emerald-400 font-semibold">1Y</span>
            <p className="text-xs text-slate-400">Last year</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <span className="text-emerald-400 font-semibold">All</span>
            <p className="text-xs text-slate-400">Full history</p>
          </div>
        </div>

        <p className="text-slate-400 text-sm">Custom dates can extend up to 2 years before portfolio creation to see historical market context.</p>
      </div>
    ),
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard & Rankings',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Compete for Top Rankings</h4>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li>Visit the <Link href="/leaderboard" className="text-emerald-400 hover:underline">Leaderboard</Link></li>
          <li>Filter by time period: Day, Week, Month, Year, or All Time</li>
          <li>See top-performing public portfolios ranked by returns</li>
          <li>Click on any portfolio to view details or clone it</li>
        </ol>

        <h4 className="font-semibold text-white mt-6">How to Climb the Rankings</h4>
        <ul className="list-disc list-inside space-y-2 text-slate-300">
          <li>Make your portfolio public to appear on the leaderboard</li>
          <li>Build a well-balanced, high-performing portfolio</li>
          <li>Diversify across different asset types and sectors</li>
          <li>Match assets to appropriate risk positions</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'social',
    title: 'Social Features',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    content: (
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Interact with the Community</h4>
        <ul className="list-disc list-inside space-y-2 text-slate-300">
          <li><strong>Like</strong> - Show appreciation for portfolios you admire</li>
          <li><strong>Clone</strong> - Copy a portfolio to customize it as your own</li>
          <li><strong>Share</strong> - Share portfolios on Twitter, Facebook, or copy the link</li>
          <li><strong>Follow</strong> - Stay updated on users' portfolio changes</li>
          <li><strong>Export</strong> - Download portfolio data as CSV</li>
        </ul>

        <h4 className="font-semibold text-white mt-6">Notifications</h4>
        <p className="text-slate-300">Click the bell icon in the header to see:</p>
        <ul className="list-disc list-inside space-y-2 text-slate-300">
          <li>New followers (and the XP you earned!)</li>
          <li>Likes on your portfolios</li>
          <li>When someone clones your portfolio</li>
          <li>Badges and achievements earned</li>
        </ul>
      </div>
    ),
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">How to Use Gamefi Invest</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Your complete guide to building winning investment portfolios using our soccer-themed platform
          </p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Quick Navigation</h2>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
              >
                {section.title}
              </a>
            ))}
          </div>
        </motion.div>

        {/* Guide Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              </div>
              <div className="p-6 text-slate-300">
                {section.content}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-slate-400 mb-4">Ready to start building your dream team?</p>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Portfolio
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
