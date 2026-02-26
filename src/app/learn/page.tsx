'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components';
import { LEARNING_SECTIONS, ASSET_TYPE_TOPICS, RISK_LEVEL_COLORS } from '@/data/learning-content';
import { cn } from '@/lib/utils';

export default function LearnPage() {
  const [activeSection, setActiveSection] = useState('asset-types');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const currentSection = LEARNING_SECTIONS.find((s) => s.id === activeSection);

  return (
    <AppLayout>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Investment Learning Center</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Master the fundamentals of investing and learn how to build a winning portfolio using the Gamefi approach.
          </p>
        </motion.div>

        {/* Section Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8 justify-center"
        >
          {LEARNING_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                activeSection === section.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              )}
            >
              {section.title}
            </button>
          ))}
        </motion.div>

        {/* Section Content */}
        {currentSection && (
          <motion.div
            key={currentSection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Section Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">{currentSection.title}</h2>
              <p className="text-slate-400">{currentSection.description}</p>
            </div>

            {/* Asset Types Grid */}
            {currentSection.topics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentSection.topics.map((topic) => (
                  <motion.div
                    key={topic.type}
                    layout
                    className={cn(
                      'bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300',
                      expandedTopic === topic.type && 'md:col-span-2 lg:col-span-3'
                    )}
                    onClick={() => setExpandedTopic(expandedTopic === topic.type ? null : topic.type)}
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          topic.type === 'stock' && 'bg-blue-500/20',
                          topic.type === 'etf' && 'bg-purple-500/20',
                          topic.type === 'bond' && 'bg-green-500/20',
                          topic.type === 'reit' && 'bg-orange-500/20',
                          topic.type === 'commodity' && 'bg-yellow-500/20'
                        )}>
                          <span className={cn(
                            'text-2xl font-bold',
                            topic.type === 'stock' && 'text-blue-400',
                            topic.type === 'etf' && 'text-purple-400',
                            topic.type === 'bond' && 'text-green-400',
                            topic.type === 'reit' && 'text-orange-400',
                            topic.type === 'commodity' && 'text-yellow-400'
                          )}>
                            {topic.type.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{topic.title}</h3>
                          <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400 uppercase">
                            {topic.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-400 text-sm mb-4">{topic.description}</p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Risk Level</p>
                          <p className={cn(
                            'text-sm font-medium',
                            topic.risk.includes('Low') && 'text-green-400',
                            topic.risk.includes('Medium') && 'text-yellow-400',
                            topic.risk.includes('High') && 'text-red-400'
                          )}>{topic.risk}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Volatility</p>
                          <p className={cn(
                            'text-sm font-medium',
                            topic.volatility === 'Low' && 'text-green-400',
                            topic.volatility === 'Medium' && 'text-yellow-400',
                            (topic.volatility === 'High' || topic.volatility === 'Very High') && 'text-red-400'
                          )}>{topic.volatility}</p>
                        </div>
                      </div>

                      {expandedTopic === topic.type && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="border-t border-slate-800 pt-4 mt-4"
                        >
                          <div className="mb-4">
                            <p className="text-xs text-slate-500 mb-1">Best For</p>
                            <p className="text-sm text-slate-300">{topic.bestFor}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Examples</p>
                            <div className="flex flex-wrap gap-2">
                              {topic.examples.map((example) => (
                                <span key={example} className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300">
                                  {example}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div className="flex items-center justify-end mt-4 text-emerald-400 text-sm">
                        {expandedTopic === topic.type ? 'Click to collapse' : 'Click to expand'}
                        <svg
                          className={cn('w-4 h-4 ml-1 transition-transform', expandedTopic === topic.type && 'rotate-180')}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Markdown Content */}
            {currentSection.content && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <div className="prose prose-invert prose-slate max-w-none">
                  {currentSection.content.split('\n').map((line, index) => {
                    if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-xl font-bold text-white mt-6 mb-4">{line.replace('## ', '')}</h2>;
                    }
                    if (line.startsWith('- **')) {
                      const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                      if (match) {
                        return (
                          <div key={index} className="flex items-start gap-2 mb-2">
                            <span className="text-emerald-400 mt-1">&#8226;</span>
                            <span>
                              <strong className="text-white">{match[1]}</strong>: <span className="text-slate-400">{match[2]}</span>
                            </span>
                          </div>
                        );
                      }
                    }
                    if (line.trim() === '') return <div key={index} className="h-2" />;
                    return <p key={index} className="text-slate-400 mb-2">{line}</p>;
                  })}
                </div>
              </div>
            )}

            {/* Tips List */}
            {currentSection.tips && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                <h3 className="text-lg font-semibold text-white mb-6">Investment Tips Checklist</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSection.tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-300">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Build Your Portfolio?</h3>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">
              Put your knowledge into practice by creating your first investment team. Choose your formation and start selecting assets.
            </p>
            <Link href="/portfolio">
              <button className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors">
                Create Portfolio
              </button>
            </Link>
          </div>
        </motion.div>
    </AppLayout>
  );
}
