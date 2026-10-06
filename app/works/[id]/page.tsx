/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Edit,
  Trash2,
  Send,
  MessageSquare,
  Activity as ActivityIcon,
  Paperclip,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
  PlayCircle,
  AlertTriangle,
  ListChecks,
  Share2,
} from 'lucide-react';
import { fetchWorkById, updateWorkStatus, updateSubtaskStatus, deleteWork, addWorkComment } from '@/services/work';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { ShareWorkModal } from '@/components/ui/ShareWorkModal';
import { WorkStatus } from '@/types';
import { isAdminRole } from '@/lib/auth-utils';
import { format, formatDistanceToNow } from 'date-fns';

export default function WorkDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [commentMessage, setCommentMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch Work details, comments, and activities
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['work', id],
    queryFn: () => fetchWorkById(id),
    enabled: !!id,
  });

  const work = data?.work;
  const comments = data?.comments || [];
  const activities = data?.activities || [];

  const isAdmin = isAdminRole(session?.user?.role);
  const isAssigned = work?.assignedTo.some((u) => u.id === session?.user?.id);
  const canChangeStatus = isAdmin || isAssigned;

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: WorkStatus) => updateWorkStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work', id] });
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to change status');
    },
  });

  // Subtask Status Mutation
  const subtaskMutation = useMutation({
    mutationFn: ({ subtaskId, status }: { subtaskId: string; status: WorkStatus }) =>
      updateSubtaskStatus(id, subtaskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work', id] });
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to update program step status');
    },
  });

  // Comment Mutation
  const commentMutation = useMutation({
    mutationFn: (msg: string) => addWorkComment(id, msg),
    onSuccess: () => {
      setCommentMessage('');
      queryClient.invalidateQueries({ queryKey: ['work', id] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to post comment');
    },
  });

  // Delete Work Mutation
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this work? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await deleteWork(id);
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push('/works');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete work');
      setIsDeleting(false);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentMessage.trim()) return;
    commentMutation.mutate(commentMessage.trim());
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-2xl font-bold">
          ❓
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Work Not Found</h2>
        <p className="text-xs text-slate-500">The requested work may have been deleted.</p>
        <Link
          href="/works"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold text-xs"
        >
          Back to Team Board
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 font-sans pb-12">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/works"
            className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1A3D] hover:bg-slate-100 dark:hover:bg-[#282350] text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CategoryBadge category={work.category} />
              <PriorityBadge priority={work.priority} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-white">
              {work.title}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Share Task Button */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2511F7] hover:bg-[#1B07DB] text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Share Task</span>
          </button>

          {/* Admin Action Buttons */}
          {isAdmin && (
            <>
              <Link
                href={`/works/${id}/edit`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1A3D] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Work
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold hover:underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Work Overview Card */}
      <div className="bg-white dark:bg-[#151233] border border-slate-100 dark:border-slate-800/80 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Status Control Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F8F9FD] dark:bg-[#1E1A3D] rounded-2xl border border-slate-200 dark:border-slate-700/60 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status:</span>
            <StatusBadge status={work.status} deadline={work.deadline} />
          </div>

          {canChangeStatus ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Update Status:</span>
              <div className="flex gap-1.5">
                {(['pending', 'in_progress', 'completed'] as WorkStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => statusMutation.mutate(s)}
                    disabled={work.status === s || statusMutation.isPending}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      work.status === s
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-500'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Only assignees or admins can change status</span>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description / Instructions</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {work.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              Deadline
            </span>
            <p className="font-bold text-slate-900 dark:text-white">
              {format(new Date(work.deadline), 'MMMM d, yyyy (EEEE)')}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <User className="w-3.5 h-3.5" />
              Assigned By
            </span>
            <p className="font-bold text-slate-900 dark:text-white">
              {work.createdBy?.name || 'Chairman'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              Created On
            </span>
            <p className="font-bold text-slate-900 dark:text-white">
              {format(new Date(work.createdAt), 'MMM d, yyyy @ HH:mm')}
            </p>
          </div>
        </div>

        {/* Completion Metadata Banner if Completed */}
        {work.status === 'completed' && work.completedAt && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <span>Completed on {format(new Date(work.completedAt), 'MMMM d, yyyy @ HH:mm')}</span>
              {work.completedBy && <span> by <strong>{work.completedBy.name}</strong></span>}
            </div>
          </div>
        )}
      </div>

      {/* Program Workflow / Addon Works Steps */}
      {work.subtasks && work.subtasks.length > 0 && (
        <div className="bg-white dark:bg-[#151233] border border-slate-100 dark:border-slate-800/80 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-extrabold text-[#1E1B4B] dark:text-white">
                  Program Workflow & Addon Works
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sequential program steps and assigned members for this work.
              </p>
            </div>

            {/* Overall Step Progress Bar */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {work.subtasks.filter((st) => st.status === 'completed').length} / {work.subtasks.length} Done
                </span>
                <p className="text-[10px] text-slate-400">
                  {Math.round(
                    (work.subtasks.filter((st) => st.status === 'completed').length / work.subtasks.length) * 100
                  )}% Completed
                </p>
              </div>
              <div className="w-24 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${
                      (work.subtasks.filter((st) => st.status === 'completed').length / work.subtasks.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Subtask Step Cards */}
          <div className="space-y-3">
            {work.subtasks.map((st, index) => {
              const canUserUpdateThisStep =
                isAdmin || isAssigned || (st.assignedTo && st.assignedTo.id === session?.user?.id);

              return (
                <div
                  key={st.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    st.status === 'completed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                      : st.status === 'in_progress'
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                      : 'bg-[#F8F9FD] dark:bg-[#1E1A3D] border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  {/* Step Number & Info */}
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        st.status === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : st.status === 'in_progress'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="space-y-1">
                      <h4
                        className={`text-sm font-bold ${
                          st.status === 'completed'
                            ? 'line-through text-slate-500 dark:text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {st.title}
                      </h4>

                      {/* Assigned Member Tag */}
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="text-slate-400 font-medium">Assigned Member:</span>
                        {st.assignedTo ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <img
                              src={
                                st.assignedTo.avatarUrl ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${st.assignedTo.name}`
                              }
                              alt={st.assignedTo.name}
                              className="h-4 w-4 rounded-full"
                            />
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                              {st.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">All Work Assignees</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges & Quick Action Controls */}
                  <div className="flex items-center gap-3 flex-shrink-0 self-end md:self-center">
                    <StatusBadge status={st.status} />

                    {canUserUpdateThisStep && (
                      <div className="flex items-center gap-1">
                        {(['pending', 'in_progress', 'completed'] as WorkStatus[]).map((stStatus) => (
                          <button
                            key={stStatus}
                            onClick={() =>
                              subtaskMutation.mutate({ subtaskId: st.id, status: stStatus })
                            }
                            disabled={st.status === stStatus || subtaskMutation.isPending}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                              st.status === stStatus
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-500'
                            }`}
                          >
                            {stStatus === 'in_progress' ? 'In Progress' : stStatus}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid Split: Assignees & Attachments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assignees Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            Assigned Team Members ({work.assignedTo.length})
          </h3>

          <div className="space-y-3">
            {work.assignedTo.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"
              >
                <img
                  src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                  alt={u.name}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-primary-500/20"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Attachments Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-primary-500" />
            Reference Attachments ({work.attachments.length})
          </h3>

          {work.attachments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No attachments uploaded for this work.</p>
          ) : (
            <div className="space-y-2">
              {work.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs hover:border-primary-500 transition-colors group"
                >
                  <span className="truncate max-w-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary-500">
                    {url}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-500 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid Split: Discussion Comments & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Comments Stream */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            Discussion & Updates ({comments.length})
          </h3>

          {/* Comment Input Form */}
          <form onSubmit={handlePostComment} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
            <textarea
              rows={2}
              value={commentMessage}
              onChange={(e) => setCommentMessage(e.target.value)}
              placeholder="Post a comment or work update..."
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentMutation.isPending || !commentMessage.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-md hover:bg-primary-600 transition-all disabled:opacity-50"
              >
                {commentMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Post Comment
              </button>
            </div>
          </form>

          {/* Comment Cards Stream */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                No comments posted yet. Start the discussion above!
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-start gap-3"
                >
                  <img
                    src={c.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user?.name}`}
                    alt={c.user?.name}
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{c.user?.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {c.user?.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {c.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Activity Audit Log */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ActivityIcon className="w-5 h-5 text-primary-500" />
            Activity Timeline
          </h3>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No activity history found.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {activities.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-3 pl-1">
                    <img
                      src={
                        act.user?.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user?.name}`
                      }
                      alt={act.user?.name}
                      className="h-6 w-6 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 z-10"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        <span className="font-bold">{act.user?.name}</span>{' '}
                        {act.action === 'created' && 'created this work'}
                        {act.action === 'status_changed' &&
                          `changed status to ${String(act.meta?.to || '').replace('_', ' ')}`}
                        {act.action === 'commented' && 'added a comment'}
                        {act.action === 'updated' && 'updated details'}
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

      {/* Share Work Modal */}
      <ShareWorkModal
        work={work}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
