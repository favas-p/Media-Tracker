/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Kanban,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Sparkles,
  Calendar,
  Activity as ActivityIcon,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { AvatarGroup } from '@/components/ui/AvatarGroup';
import { isAdminRole } from '@/lib/auth-utils';
import { formatDistanceToNow, format } from 'date-fns';

async function getDashboardData() {
  const res = await fetch('/api/dashboard', { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to load dashboard data');
  return data.data;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = isAdminRole(session?.user?.role);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  const stats = data?.stats || {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary-600 via-primary-500 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Nusa Media Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {session?.user?.name || 'Team Member'}! 👋
          </h1>
          <p className="text-primary-100 text-xs sm:text-sm max-w-xl">
            Here is your media team performance overview and assigned works for today.
          </p>
        </div>

        {isAdmin && (
          <div className="relative z-10 flex-shrink-0">
            <Link
              href="/works/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-primary-600 font-bold text-sm shadow-lg hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Assign New Work
            </Link>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Works
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Kanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {isLoading ? '...' : stats.total}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Pending
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {isLoading ? '...' : stats.pending}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              In Progress
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {isLoading ? '...' : stats.inProgress}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Completed
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {isLoading ? '...' : stats.completed}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Overdue</span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {isLoading ? '...' : stats.overdue}
          </p>
        </motion.div>
      </div>

      {/* Main Content Split: My Upcoming Works & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Upcoming Works */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                My Assigned Works
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Works assigned to you with upcoming deadlines
              </p>
            </div>
            <Link
              href="/my-works"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              View All My Works
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : data?.myUpcomingWorks?.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-xl">
                🎉
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                All caught up!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You have no pending works assigned to you right now. Take a break or check the team board!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.myUpcomingWorks?.map((work: any) => (
                <Link
                  key={work.id}
                  href={`/works/${work.id}`}
                  className="block group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-500/40 rounded-2xl p-4 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={work.category} />
                        <PriorityBadge priority={work.priority} />
                        <StatusBadge status={work.status} deadline={work.deadline} />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors truncate">
                        {work.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                      <div className="text-right">
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {format(new Date(work.deadline), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <AvatarGroup users={work.assignedTo} max={2} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Team Activity Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-primary-500" />
              Recent Activity
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 4].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-2.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.recentActivities?.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No recent activities recorded.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {data?.recentActivities?.map((act: any) => (
                  <div key={act.id} className="relative flex items-start gap-3 pl-2">
                    <img
                      src={
                        act.user?.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user?.name}`
                      }
                      alt={act.user?.name}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 flex-shrink-0 z-10"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="text-slate-900 dark:text-slate-200 font-medium">
                        <span className="font-bold">{act.user?.name}</span>{' '}
                        {act.action === 'created' && 'created new work'}
                        {act.action === 'status_changed' &&
                          `changed status to ${act.meta?.to?.replace('_', ' ')}`}
                        {act.action === 'commented' && 'added a comment on'}
                        {act.action === 'assigned' && 'updated assignees for'}
                        {act.action === 'updated' && 'updated'}
                        {' '}
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          &quot;{act.workTitle}&quot;
                        </span>
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
