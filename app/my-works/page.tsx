/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, CheckSquare, Clock, Filter, AlertCircle, ExternalLink } from 'lucide-react';
import { fetchWorks, updateWorkStatus } from '@/services/work';
import { WorkDTO, WorkStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { format } from 'date-fns';

export default function MyWorksPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: works, isLoading, isError } = useQuery({
    queryKey: ['my-works', selectedStatus],
    queryFn: () =>
      fetchWorks({
        myWorks: true,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      }),
  });

  // Optimistic UI status toggle mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: WorkStatus }) =>
      updateWorkStatus(id, newStatus),
    onMutate: async ({ id, newStatus }) => {
      setErrorMessage(null);
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['my-works'] });

      // Snapshot previous value
      const previousWorks = queryClient.getQueryData<WorkDTO[]>(['my-works', selectedStatus]);

      // Optimistically update cache
      if (previousWorks) {
        queryClient.setQueryData<WorkDTO[]>(
          ['my-works', selectedStatus],
          previousWorks.map((work) =>
            work.id === id ? { ...work, status: newStatus } : work
          )
        );
      }

      return { previousWorks };
    },
    onError: (err: Error, variables, context) => {
      // Revert optimistic update on failure
      if (context?.previousWorks) {
        queryClient.setQueryData(['my-works', selectedStatus], context.previousWorks);
      }
      setErrorMessage(err.message || 'Failed to update work status.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-works'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['works'] });
    },
  });

  const handleToggleComplete = (work: WorkDTO) => {
    const nextStatus: WorkStatus = work.status === 'completed' ? 'in_progress' : 'completed';
    statusMutation.mutate({ id: work.id, newStatus: nextStatus });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-primary-500" />
            My Assigned Works
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tap the checkbox to immediately mark works complete or in progress.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === tab.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Works List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : works?.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No works found in this view
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {selectedStatus === 'all'
              ? 'You do not have any works assigned to you yet.'
              : `No works currently marked as ${selectedStatus.replace('_', ' ')}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {works?.map((work) => {
              const isCompleted = work.status === 'completed';

              return (
                <motion.div
                  key={work.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`group bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-sm hover:shadow-md ${
                    isCompleted
                      ? 'border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 opacity-80'
                      : 'border-slate-200 dark:border-slate-800 hover:border-primary-500/40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* One-Tap Checkbox Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(work)}
                      className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 border ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-primary-500 text-transparent'
                      }`}
                      title={isCompleted ? 'Mark in progress' : 'Mark complete'}
                    >
                      <motion.div
                        initial={false}
                        animate={{ scale: isCompleted ? 1 : 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </motion.div>
                    </button>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={work.category} />
                        <PriorityBadge priority={work.priority} />
                        <StatusBadge status={work.status} deadline={work.deadline} />
                      </div>

                      <h3
                        className={`font-bold text-base transition-all ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white group-hover:text-primary-500'
                        }`}
                      >
                        {work.title}
                      </h3>

                      {work.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {work.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" />
                          Deadline: {format(new Date(work.deadline), 'MMM d, yyyy (EEE)')}
                        </span>
                        <span>Assigned by {work.createdBy?.name || 'Admin'}</span>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Link
                      href={`/works/${work.id}`}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary-500 hover:text-white hover:border-primary-500 text-slate-500 dark:text-slate-400 transition-all flex-shrink-0"
                      title="View Details"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
