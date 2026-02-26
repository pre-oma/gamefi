'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { AppLayout, Button, Input, Modal } from '@/components';
import { cn, copyToClipboard } from '@/lib/utils';
import { ThemeMode } from '@/types';

export default function SettingsPage() {
  const { currentUser, updateProfile, logout } = useStore();

  // Account settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [priceAlertNotifications, setPriceAlertNotifications] = useState(true);

  // Referral
  const [referralCode, setReferralCode] = useState('');
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Generate a referral code based on user ID
  useEffect(() => {
    if (currentUser) {
      // Create a simple referral code from user ID
      const code = currentUser.id.substring(0, 8).toUpperCase();
      setReferralCode(code);
    }
  }, [currentUser]);

  const handleCopyReferralCode = async () => {
    const success = await copyToClipboard(referralCode);
    if (success) {
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  const handleCopyReferralLink = async () => {
    const link = typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${referralCode}`
      : '';
    const success = await copyToClipboard(link);
    if (success) {
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (!newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(result.error || 'Failed to change password');
      }
    } catch {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          theme,
          notifications: {
            email: emailNotifications,
            push: pushNotifications,
            priceAlerts: priceAlertNotifications,
          },
        }),
      });
      // Show success feedback
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      });

      if (response.ok) {
        logout();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account settings and preferences</p>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Username</label>
              <p className="text-white">@{currentUser?.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
              <p className="text-white">{currentUser?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{passwordError}</p>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-400">{passwordSuccess}</p>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              type="password"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
            />

            <Input
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
            />

            <Input
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
            />

            <Button type="submit" isLoading={isChangingPassword}>
              Change Password
            </Button>
          </form>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-sm text-slate-400">Receive updates via email</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  emailNotifications ? 'bg-emerald-500' : 'bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    emailNotifications ? 'translate-x-7' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Push Notifications</p>
                <p className="text-sm text-slate-400">Receive push notifications</p>
              </div>
              <button
                onClick={() => setPushNotifications(!pushNotifications)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  pushNotifications ? 'bg-emerald-500' : 'bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    pushNotifications ? 'translate-x-7' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Price Alerts</p>
                <p className="text-sm text-slate-400">Get notified when price targets are hit</p>
              </div>
              <button
                onClick={() => setPriceAlertNotifications(!priceAlertNotifications)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  priceAlertNotifications ? 'bg-emerald-500' : 'bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    priceAlertNotifications ? 'translate-x-7' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <Button onClick={handleSavePreferences} variant="outline" className="mt-4">
              Save Preferences
            </Button>
          </div>
        </motion.div>

        {/* Referral */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-2">Referral Program</h2>
          <p className="text-sm text-slate-400 mb-4">
            Invite friends and earn 100 XP for each successful referral!
          </p>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">Your Referral Code</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono">
                {referralCode}
              </code>
              <Button
                variant="outline"
                onClick={handleCopyReferralCode}
                className="shrink-0"
              >
                {copiedReferral ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <Button variant="outline" onClick={handleCopyReferralLink} className="w-full">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Copy Referral Link
          </Button>
        </motion.div>

        {/* Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Appearance</h2>

          <div className="grid grid-cols-3 gap-3">
            {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all',
                  theme === mode
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                )}
              >
                <div className="text-2xl mb-2">
                  {mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '💻'}
                </div>
                <p className="text-sm text-white capitalize">{mode}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-slate-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(true)}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Delete Account
          </Button>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">
              This action cannot be undone. This will permanently delete your account and remove all your data including portfolios, challenges, and badges.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Type <span className="font-mono text-red-400">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              placeholder="DELETE"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="flex-1 bg-red-500 hover:bg-red-600"
              disabled={deleteConfirmation !== 'DELETE'}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
