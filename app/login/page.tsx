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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500 border border-primary-500/20 shadow-inner mb-2">
            <ShieldCheck className="h-7 w-7 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Nusa Media</h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Sign in with your username or email to access your workspace
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs sm:text-sm"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="chairman or chairman@nusamedia.id"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary-600 active:scale-[0.99] disabled:opacity-50 transition-all duration-200"
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
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <p className="text-xs text-slate-400 text-center font-medium">Quick Demo Access (Username Shortcuts):</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQuickCredentials('chairman', 'AdminNusa2026!')}
              className="py-2 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-[11px] font-medium text-slate-300 text-center transition-colors truncate flex flex-col items-center"
              title="Chairman Account (username: chairman)"
            >
              <span>👑 Chairman</span>
              <span className="text-[9px] text-slate-400">@chairman</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickCredentials('convener', 'AdminNusa2026!')}
              className="py-2 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-[11px] font-medium text-slate-300 text-center transition-colors truncate flex flex-col items-center"
              title="Convener Account (username: convener)"
            >
              <span>📋 Convener</span>
              <span className="text-[9px] text-slate-400">@convener</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickCredentials('budi', 'AdminNusa2026!')}
              className="py-2 px-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-[11px] font-medium text-slate-300 text-center transition-colors truncate flex flex-col items-center"
              title="Member Account (username: budi)"
            >
              <span>👤 Member</span>
              <span className="text-[9px] text-slate-400">@budi</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
