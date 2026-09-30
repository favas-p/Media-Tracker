/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Camera, Save, CheckCircle2, AlertCircle, Loader2, ShieldCheck, LogOut } from 'lucide-react';
import { updateProfileSchema } from '@/validators/auth';

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setAvatarUrl(session.user.avatarUrl || '');
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      name: name.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    };

    const validation = updateProfileSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Please check form fields.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local NextAuth session
      await updateSession({
        name: data.data.name,
        avatarUrl: data.data.avatarUrl,
      });

      setSuccess('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A043D] dark:text-white flex items-center gap-2.5">
          <User className="w-8 h-8 text-[#2511F7] dark:text-[#FFE600]" />
          My Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Update your display name, avatar, or change your login password.
        </p>
      </div>

      {/* User Info Overview Banner */}
      <div className="bg-white dark:bg-[#0D0647] border border-slate-100 dark:border-blue-900/40 rounded-[28px] p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <img
          src={
            avatarUrl ||
            session?.user?.avatarUrl ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name}`
          }
          alt={session?.user?.name || 'User'}
          className="h-20 w-20 rounded-full object-cover ring-4 ring-[#2511F7]/30"
        />
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{session?.user?.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-[#2511F7] dark:text-[#FFE600] border border-blue-500/20">
              {session?.user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5 text-[#2511F7] dark:text-[#FFE600]" />
            {session?.user?.email}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-[#0D0647] border border-slate-100 dark:border-blue-900/40 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#0A043D] dark:text-white uppercase tracking-wider">
              Personal Information
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Avatar Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-blue-900/40 space-y-4">
            <h3 className="text-xs font-bold text-[#0A043D] dark:text-white uppercase tracking-wider">
              Change Password (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2511F7] hover:bg-[#1B07DB] text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 hover:scale-105"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Logout / Account Session Card */}
      <div className="bg-white dark:bg-[#0D0647] border border-rose-100 dark:border-rose-950/40 rounded-[28px] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
            <LogOut className="w-4 h-4 text-rose-500" />
            Account Logout
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign out of your Nusa Media session anytime to secure your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all duration-200 hover:scale-105"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout Now</span>
        </button>
      </div>
    </div>
  );
}


