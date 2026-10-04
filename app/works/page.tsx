/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Kanban,
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  X,
  ExternalLink,
  MoreVertical,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { fetchWorks, updateWorkStatus } from '@/services/work';
import { fetchMembers } from '@/services/member';
import { WorkDTO, WorkStatus } from '@/types';
import { TeamWorkCard } from '@/components/ui/TeamWorkCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { AvatarGroup } from '@/components/ui/AvatarGroup';
import { WorkStepLevelBar } from '@/components/ui/WorkStepLevelBar';
import { isAdminRole } from '@/lib/auth-utils';
import { format } from 'date-fns';

export default function TeamBoardPage() {
  const { data: session } = useSession();
  const isAdmin = isAdminRole(session?.user?.role);
  const queryClient = useQueryClient();

  // View mode: 'kanban', 'card' (Default), 'list'
  const [viewMode, setViewMode] = useState<'kanban' | 'card' | 'list'>('card');

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [assignedTo, setAssignedTo] = useState<string>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch Team Members for Filter Dropdown
  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetchMembers(),
  });

  // Fetch Works with Filters
  const { data: works, isLoading, isError } = useQuery({
    queryKey: ['works', search, status, category, priority, assignedTo],
    queryFn: () =>
      fetchWorks({
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        category: category !== 'all' ? category : undefined,
        priority: priority !== 'all' ? priority : undefined,
        assignedTo: assignedTo !== 'all' ? assignedTo : undefined,
      }),
  });

  // Optimistic UI mutation for changing work status
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: WorkStatus }) =>
      updateWorkStatus(id, newStatus),
    onMutate: async ({ id, newStatus }) => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: ['works'] });
      const previousWorks = queryClient.getQueryData<WorkDTO[]>([
        'works',
        search,
        status,
        category,
        priority,
        assignedTo,
      ]);

      if (previousWorks) {
        queryClient.setQueryData<WorkDTO[]>(
          ['works', search, status, category, priority, assignedTo],
          previousWorks.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
        );
      }

      return { previousWorks };
    },
    onError: (err: Error, _vars, context) => {
      if (context?.previousWorks) {
        queryClient.setQueryData(
          ['works', search, status, category, priority, assignedTo],
          context.previousWorks
        );
      }
      setActionError(err.message || 'Failed to update work status.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['my-works'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleStatusChange = (id: string, newStatus: WorkStatus) => {
    statusMutation.mutate({ id, newStatus });
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setCategory('all');
    setPriority('all');
    setAssignedTo('all');
  };

  const hasActiveFilters =
    search !== '' || status !== 'all' || category !== 'all' || priority !== 'all' || assignedTo !== 'all';

  // Columns for Kanban Board view
  const columns: { id: WorkStatus; title: string }[] = [
    { id: 'pending', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'completed', title: 'Completed' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A043D] dark:text-white flex items-center gap-2.5">
            <Kanban className="w-8 h-8 text-[#2511F7] dark:text-[#FFE600]" />
            Team Works Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Browse, manage, and track team tasks with our interactive board cards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: Kanban, Cards, List */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#0D0647] p-1.5 rounded-full border border-slate-200/80 dark:border-blue-900/40 shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-[#2511F7] text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'card'
                  ? 'bg-[#2511F7] text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-[#2511F7] text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="List Table View"
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {isAdmin && (
            <Link
              href="/works/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2511F7] hover:bg-[#1B07DB] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Assign New Work
            </Link>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {actionError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="font-bold text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="bg-white dark:bg-[#0D0647] border border-slate-200/80 dark:border-blue-900/40 rounded-[28px] p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Bar */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search works..."
              className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2511F7]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#F8F9FD] dark:bg-[#1E1A3D] border border-slate-200 dark:border-slate-700/60 rounded-full px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">To Do (Pending)</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#F8F9FD] dark:bg-[#1E1A3D] border border-slate-200 dark:border-slate-700/60 rounded-full px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
            >
              <option value="all">All Categories</option>
              <option value="poster">Poster</option>
              <option value="video">Video</option>
              <option value="reels">Reels / TikTok</option>
              <option value="photo">Photo</option>
              <option value="design">Design</option>
              <option value="social_media">Social Media</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-[#F8F9FD] dark:bg-[#1E1A3D] border border-slate-200 dark:border-slate-700/60 rounded-full px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Member Filter */}
          <div>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-[#F8F9FD] dark:bg-[#1E1A3D] border border-slate-200 dark:border-slate-700/60 rounded-full px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
            >
              <option value="all">All Assignees</option>
              {members?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-xs text-slate-500 font-medium">
              Showing filtered results ({works?.length || 0} works)
            </span>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Board Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((col) => (
            <div key={col} className="space-y-4">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              {[1, 2].map((i) => (
                <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[24px] animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : works?.length === 0 ? (
        <div className="bg-white dark:bg-[#0D0647] border border-slate-200/80 dark:border-blue-900/40 rounded-[28px] p-12 text-center space-y-3 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-[#150B6E] text-[#2511F7] dark:text-[#FFE600] flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No works match your filter parameters
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms, category, or status selection.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#2511F7] text-white text-xs font-bold mt-2 hover:bg-[#1B07DB]"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW (Matching UI Screenshot design) */
        <div className="bg-[#F7F8FA] dark:bg-[#07022E]/80 border border-slate-200/60 dark:border-blue-900/30 rounded-[32px] p-4 sm:p-6 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {columns.map((column) => {
              const columnWorks = works?.filter((w) => w.status === column.id) || [];

              return (
                <div key={column.id} className="space-y-4 flex flex-col min-h-[500px]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
                        {column.title}
                      </h2>
                      <span className="h-5 w-5 rounded-full bg-slate-200/80 dark:bg-blue-900/50 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center">
                        {columnWorks.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                      title="Column options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Vertical Cards Stack */}
                  <div className="space-y-4 flex-1">
                    <AnimatePresence>
                      {columnWorks.map((work) => (
                        <motion.div
                          key={work.id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <TeamWorkCard work={work} onStatusChange={handleStatusChange} />
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {columnWorks.length === 0 && (
                      <div className="h-32 border-2 border-dashed border-slate-200 dark:border-blue-900/30 rounded-[24px] flex items-center justify-center text-xs text-slate-400 font-medium">
                        No tasks in {column.title}
                      </div>
                    )}
                  </div>

                  {/* "+ Add new task" Column Action Button (Matching UI Screenshot) */}
                  {isAdmin && (
                    <Link
                      href={`/works/new?status=${column.id}`}
                      className="inline-flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#2511F7] dark:hover:text-[#FFE600] transition-colors rounded-2xl group"
                    >
                      <span className="h-7 w-7 rounded-full bg-[#FFE600] dark:bg-[#2511F7] text-slate-900 dark:text-white flex items-center justify-center font-extrabold text-sm shadow-sm group-hover:scale-110 transition-transform">
                        +
                      </span>
                      <span>Add new task</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'card' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {works?.map((work) => (
              <motion.div
                key={work.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <TeamWorkCard work={work} onStatusChange={handleStatusChange} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <div className="bg-white dark:bg-[#0D0647] border border-slate-200/80 dark:border-blue-900/40 rounded-[28px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FD] dark:bg-[#150B6E] border-b border-slate-100 dark:border-blue-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-5">Title & Steps</th>
                  <th className="py-4 px-3">Category</th>
                  <th className="py-4 px-3">Priority</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 px-3">Deadline</th>
                  <th className="py-4 px-3">Assignees</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-blue-900/40 text-xs">
                {works?.map((work) => (
                  <tr
                    key={work.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#150B6E]/40 transition-colors"
                  >
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white max-w-xs space-y-1">
                      <Link href={`/works/${work.id}`} className="hover:text-[#2511F7] dark:hover:text-[#FFE600] block truncate">
                        {work.title}
                      </Link>
                      <WorkStepLevelBar subtasks={work.subtasks} compact />
                    </td>
                    <td className="py-4 px-3">
                      <CategoryBadge category={work.category} variant="pill" />
                    </td>
                    <td className="py-4 px-3">
                      <PriorityBadge priority={work.priority} variant="pill" />
                    </td>
                    <td className="py-4 px-3">
                      <StatusBadge status={work.status} deadline={work.deadline} />
                    </td>
                    <td className="py-4 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {format(new Date(work.deadline), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4 px-3">
                      <AvatarGroup users={work.assignedTo} max={3} />
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <Link
                        href={`/works/${work.id}`}
                        className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#150B6E] hover:bg-[#2511F7] hover:text-white dark:hover:bg-[#2511F7] text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 text-[11px] font-semibold transition-all"
                      >
                        Details
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
