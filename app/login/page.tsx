'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { loginSchema } from '@/validators/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate with Zod schema
    const validation = loginSchema.safeParse({ username, password });
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Invalid username or password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  const setQuickCredentials = (inputUsername: string, userPass: string) => {
    setUsername(inputUsername);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F4F6FF] dark:bg-[#07022E] text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#2511F7]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white dark:bg-[#0D0647] border border-slate-100 dark:border-blue-900/40 rounded-[32px] p-8 sm:p-10 shadow-2xl space-y-6 relative z-10"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/media-logo.jfif"
            alt="Nusa Media Logo"
            className="h-16 w-16 rounded-2xl object-cover shadow-md shadow-blue-600/30 border border-blue-400/30 mx-auto mb-2 bg-white"
          />
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A043D] dark:text-white">Nusa Media</h1>
          <p className="text-[#2511F7] dark:text-[#FFE600] text-xs sm:text-sm font-extrabold tracking-wide uppercase">
            Media Crew 2026
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium pt-1">
            Sign in with your credentials to access the work tracking system
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs sm:text-sm font-medium"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Username or Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="chairman or chairman@nusamedia.id"
                className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2511F7] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full pl-11 pr-11 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2511F7] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#2511F7] hover:bg-[#1B07DB] py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 active:scale-[0.99] disabled:opacity-50 transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div className="pt-4 border-t border-slate-100 dark:border-blue-900/40 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">Quick Demo Access (Username Shortcuts):</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQuickCredentials('chairman', 'AdminNusa2026!')}
              className="py-2 px-2 bg-[#F4F6FF] dark:bg-[#150B6E] hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-slate-200 dark:border-blue-900/40 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-200 text-center transition-colors truncate flex flex-col items-center"
              title="Chairman Account (username: chairman)"
            >
              <span>👑 Chairman</span>
              <span className="text-[9px] text-[#2511F7] dark:text-[#FFE600] font-normal">@chairman</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickCredentials('convener', 'AdminNusa2026!')}
              className="py-2 px-2 bg-[#F4F6FF] dark:bg-[#150B6E] hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-slate-200 dark:border-blue-900/40 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-200 text-center transition-colors truncate flex flex-col items-center"
              title="Convener Account (username: convener)"
            >
              <span>📋 Convener</span>
              <span className="text-[9px] text-[#2511F7] dark:text-[#FFE600] font-normal">@convener</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickCredentials('budi', 'AdminNusa2026!')}
              className="py-2 px-2 bg-[#F4F6FF] dark:bg-[#150B6E] hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-slate-200 dark:border-blue-900/40 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-200 text-center transition-colors truncate flex flex-col items-center"
              title="Member Account (username: budi)"
            >
              <span>👤 Member</span>
              <span className="text-[9px] text-[#2511F7] dark:text-[#FFE600] font-normal">@budi</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
