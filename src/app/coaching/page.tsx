'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components';
import { COACHING_MODULES, DIFFICULTY_COLORS, CoachingModule, CoachingLesson } from '@/data/coaching-content';
import { cn } from '@/lib/utils';

export default function CoachingArenaPage() {
  const [selectedModule, setSelectedModule] = useState<CoachingModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CoachingLesson | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState<Record<string, boolean>>({});

  const handleBackToModules = () => {
    setSelectedModule(null);
    setSelectedLesson(null);
    setQuizAnswers({});
    setShowQuizResults({});
  };

  const handleBackToLessons = () => {
    setSelectedLesson(null);
    setQuizAnswers({});
    setShowQuizResults({});
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: answerIndex }));
  };

  const handleCheckAnswer = (questionIndex: number) => {
    setShowQuizResults((prev) => ({ ...prev, [questionIndex]: true }));
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-bold text-white mt-6 mb-4 first:mt-0">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-white mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
        if (match) {
          return (
            <div key={index} className="flex items-start gap-2 mb-2 ml-4">
              <span className="text-emerald-400 mt-1">&#8226;</span>
              <span>
                <strong className="text-white">{match[1]}</strong>:{' '}
                <span className="text-slate-400">{match[2]}</span>
              </span>
            </div>
          );
        }
      }
      if (line.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2 ml-4">
            <span className="text-emerald-400 mt-1">&#8226;</span>
            <span className="text-slate-400">{line.replace('- ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('| ')) {
        const cells = line.split('|').filter((cell) => cell.trim());
        const isHeader = index > 0 && content.split('\n')[index - 1]?.includes('|');
        const isHeaderRow = cells.every((cell) => !cell.includes('-'));

        if (line.includes('---')) return null;

        return (
          <div key={index} className="flex gap-0 text-sm mb-1">
            {cells.map((cell, cellIndex) => (
              <div
                key={cellIndex}
                className={cn(
                  'flex-1 px-3 py-2',
                  cellIndex === 0 && 'bg-slate-800/80 rounded-l-lg',
                  cellIndex === cells.length - 1 && 'rounded-r-lg',
                  cellIndex > 0 && 'bg-slate-800/50',
                  'text-slate-300 border-b border-slate-700/50'
                )}
              >
                {cell.trim()}
              </div>
            ))}
          </div>
        );
      }
      if (line.trim() === '') return <div key={index} className="h-2" />;
      return (
        <p key={index} className="text-slate-400 mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <AppLayout>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-emerald-400 font-medium">Coaching Arena</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Master the Stock Market</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Learn the fundamentals of investing through interactive lessons. Understand stocks, risk types, and build your investment knowledge.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Module Selection View */}
          {!selectedModule && (
            <motion.div
              key="modules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {COACHING_MODULES.map((module, index) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedModule(module)}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-emerald-500/30 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-all">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={module.icon} />
                        </svg>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium capitalize',
                          DIFFICULTY_COLORS[module.difficulty].bg,
                          DIFFICULTY_COLORS[module.difficulty].text,
                          DIFFICULTY_COLORS[module.difficulty].border,
                          'border'
                        )}
                      >
                        {module.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">{module.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-sm">{module.lessons.length} lessons</span>
                      <svg
                        className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Progress Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12"
              >
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Ready to Start Learning?</h3>
                      <p className="text-slate-400">
                        Begin with Stock Market Basics if you're new, or jump to any module that interests you.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-400">{COACHING_MODULES.length}</div>
                        <div className="text-slate-500">Modules</div>
                      </div>
                      <div className="w-px h-12 bg-slate-700" />
                      <div className="text-center">
                        <div className="text-3xl font-bold text-teal-400">
                          {COACHING_MODULES.reduce((acc, m) => acc + m.lessons.length, 0)}
                        </div>
                        <div className="text-slate-500">Lessons</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Lesson Selection View */}
          {selectedModule && !selectedLesson && (
            <motion.div
              key="lessons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Back Button */}
              <button
                onClick={handleBackToModules}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Modules
              </button>

              {/* Module Header */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedModule.icon} />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-white">{selectedModule.title}</h2>
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium capitalize',
                          DIFFICULTY_COLORS[selectedModule.difficulty].bg,
                          DIFFICULTY_COLORS[selectedModule.difficulty].text,
                          DIFFICULTY_COLORS[selectedModule.difficulty].border,
                          'border'
                        )}
                      >
                        {selectedModule.difficulty}
                      </span>
                    </div>
                    <p className="text-slate-400">{selectedModule.description}</p>
                  </div>
                </div>
              </div>

              {/* Lessons List */}
              <div className="space-y-4">
                {selectedModule.lessons.map((lesson, index) => (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedLesson(lesson)}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-semibold group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                          {lesson.title}
                        </h3>
                        <p className="text-slate-500 text-sm">
                          {lesson.keyPoints?.length || 0} key points
                          {lesson.quiz && ` • ${lesson.quiz.length} quiz question${lesson.quiz.length > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Lesson Content View */}
          {selectedModule && selectedLesson && (
            <motion.div
              key="lesson-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Back Button */}
              <button
                onClick={handleBackToLessons}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {selectedModule.title}
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-white mb-6">{selectedLesson.title}</h1>
                    <div className="prose prose-invert prose-slate max-w-none">
                      {renderContent(selectedLesson.content)}
                    </div>
                  </div>

                  {/* Quiz Section */}
                  {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test Your Knowledge
                      </h2>

                      {selectedLesson.quiz.map((question, qIndex) => (
                        <div key={qIndex} className="mb-6 last:mb-0">
                          <p className="text-white font-medium mb-4">{question.question}</p>
                          <div className="space-y-2 mb-4">
                            {question.options.map((option, oIndex) => {
                              const isSelected = quizAnswers[qIndex] === oIndex;
                              const showResult = showQuizResults[qIndex];
                              const isCorrect = oIndex === question.correctIndex;

                              return (
                                <button
                                  key={oIndex}
                                  onClick={() => !showResult && handleQuizAnswer(qIndex, oIndex)}
                                  disabled={showResult}
                                  className={cn(
                                    'w-full text-left px-4 py-3 rounded-xl border transition-all',
                                    !showResult && isSelected && 'border-emerald-500 bg-emerald-500/10',
                                    !showResult && !isSelected && 'border-slate-700 bg-slate-800/50 hover:border-slate-600',
                                    showResult && isCorrect && 'border-green-500 bg-green-500/10',
                                    showResult && isSelected && !isCorrect && 'border-red-500 bg-red-500/10',
                                    showResult && !isSelected && !isCorrect && 'border-slate-700 bg-slate-800/30 opacity-50'
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={cn(
                                        'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                                        !showResult && isSelected && 'border-emerald-500 bg-emerald-500',
                                        !showResult && !isSelected && 'border-slate-600',
                                        showResult && isCorrect && 'border-green-500 bg-green-500',
                                        showResult && isSelected && !isCorrect && 'border-red-500 bg-red-500'
                                      )}
                                    >
                                      {showResult && isCorrect && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                      {showResult && isSelected && !isCorrect && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className={cn('text-slate-300', showResult && isCorrect && 'text-green-400')}>
                                      {option}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {!showQuizResults[qIndex] && quizAnswers[qIndex] !== undefined && (
                            <button
                              onClick={() => handleCheckAnswer(qIndex)}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                            >
                              Check Answer
                            </button>
                          )}

                          {showQuizResults[qIndex] && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                'p-4 rounded-xl border',
                                quizAnswers[qIndex] === question.correctIndex
                                  ? 'bg-green-500/10 border-green-500/30'
                                  : 'bg-amber-500/10 border-amber-500/30'
                              )}
                            >
                              <p
                                className={cn(
                                  'font-medium mb-1',
                                  quizAnswers[qIndex] === question.correctIndex ? 'text-green-400' : 'text-amber-400'
                                )}
                              >
                                {quizAnswers[qIndex] === question.correctIndex ? 'Correct!' : 'Not quite!'}
                              </p>
                              <p className="text-slate-400 text-sm">{question.explanation}</p>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar - Key Points */}
                <div className="space-y-6">
                  {selectedLesson.keyPoints && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sticky top-24">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Key Takeaways
                      </h3>
                      <div className="space-y-3">
                        {selectedLesson.keyPoints.map((point, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-slate-400 text-sm">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation Between Lessons */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">In This Module</h3>
                    <div className="space-y-2">
                      {selectedModule.lessons.map((lesson, index) => (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setQuizAnswers({});
                            setShowQuizResults({});
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3',
                            selectedLesson.id === lesson.id
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          )}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <span className="truncate">{lesson.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Section */}
        {!selectedModule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-3">Already Know the Basics?</h3>
              <p className="text-slate-400 mb-6 max-w-xl mx-auto">
                Head over to the Learning Center for more advanced content or start building your portfolio right away.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/learn">
                  <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors">
                    Learning Center
                  </button>
                </Link>
                <Link href="/portfolio">
                  <button className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors">
                    Build Portfolio
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
    </AppLayout>
  );
}
