'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { ONBOARDING_STEPS } from '@/types';
import { cn } from '@/lib/utils';

interface OnboardingProps {
  onComplete?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { currentUser } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (currentUser && !hasChecked) {
      checkOnboardingStatus();
    }
  }, [currentUser, hasChecked]);

  const checkOnboardingStatus = async () => {
    if (!currentUser) return;
    setHasChecked(true);

    try {
      // Check localStorage first for quick response
      const completed = localStorage.getItem(`onboarding_${currentUser.id}`);
      if (completed) {
        return;
      }

      // Check database
      const res = await fetch(`/api/onboarding?userId=${currentUser.id}`);
      const data = await res.json();

      if (data.success && !data.hasCompleted) {
        setCurrentStep(data.currentStep || 0);
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  const completeStep = async () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await finishOnboarding();
    }
  };

  const skipOnboarding = async () => {
    await finishOnboarding(true);
  };

  const finishOnboarding = async (skipped = false) => {
    if (!currentUser) return;

    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          completed: !skipped,
          skipped,
        }),
      });

      localStorage.setItem(`onboarding_${currentUser.id}`, 'true');
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }

    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80" />

        {/* Spotlight effect - would highlight the target element */}
        {step.target && (
          <style jsx global>{`
            [data-tour="${step.target.replace('[data-tour="', '').replace('"]', '')}"] {
              position: relative;
              z-index: 51;
              box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.5);
              border-radius: 8px;
            }
          `}</style>
        )}

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'absolute bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-md w-full',
            'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          )}
        >
          {/* Progress indicator */}
          <div className="flex gap-1 mb-4">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  index <= currentStep ? 'bg-emerald-500' : 'bg-slate-700'
                )}
              />
            ))}
          </div>

          {/* Welcome icon for first step */}
          {currentStep === 0 && (
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚽</span>
            </div>
          )}

          <h3 className="text-xl font-bold text-white mb-2 text-center">{step.title}</h3>
          <p className="text-slate-400 text-center mb-6">{step.description}</p>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <button
              onClick={skipOnboarding}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
            >
              Skip Tutorial
            </button>
            <button
              onClick={completeStep}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              {currentStep < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Get Started'}
            </button>
          </div>

          {/* Step counter */}
          <p className="text-center text-slate-500 text-sm mt-4">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// API route for onboarding
export const onboardingApiHandler = {
  GET: async (userId: string) => {
    // Implementation in API route
  },
  POST: async (data: { userId: string; completed: boolean; skipped: boolean }) => {
    // Implementation in API route
  },
};
