/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  UserCheck,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';
import { fetchMembers } from '@/services/member';
import { fetchWorkById, updateWork } from '@/services/work';
import { updateWorkSchema } from '@/validators/work';
import { WorkCategory, WorkPriority, WorkStatus } from '@/types';
import { isAdminRole } from '@/lib/auth-utils';

export default function EditWorkPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isAdminRole(session?.user?.role);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WorkCategory>('video');
  const [priority, setPriority] = useState<WorkPriority>('medium');
  const [status, setStatus] = useState<WorkStatus>('pending');
  const [deadline, setDeadline] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch Work Details
  const { data, isLoading: isLoadingWork } = useQuery({
    queryKey: ['work', id],
    queryFn: () => fetchWorkById(id),
    enabled: !!id,
  });

  // Fetch Team Members
  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetchMembers(),
  });

  useEffect(() => {
    if (data?.work) {
      const w = data.work;
      setTitle(w.title);
      setDescription(w.description || '');
      setCategory(w.category);
      setPriority(w.priority);
      setStatus(w.status);
      setDeadline(w.deadline ? w.deadline.split('T')[0] : '');
      setSelectedAssignees(w.assignedTo.map((u) => u.id));
      setAttachments(w.attachments || []);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateWork(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work', id] });
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/works/${id}`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update work item');
    },
  });

  const toggleAssignee = (memberId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(memberId) ? prev.filter((i) => i !== memberId) : [...prev, memberId]
    );
  };

  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) return;
    try {
      new URL(attachmentUrl.trim());
      setAttachments((prev) => [...prev, attachmentUrl.trim()]);
      setAttachmentUrl('');
      setError(null);
    } catch {
      setError('Please enter a valid URL for attachment.');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status,
      deadline,
      assignedTo: selectedAssignees,
      attachments,
    };

    const validation = updateWorkSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Please check form fields.');
      return;
    }

    updateMutation.mutate(payload);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-slate-500">Only Chairman and Conveners can edit works.</p>
        <Link
          href={`/works/${id}`}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold text-xs"
        >
          Back to Details
        </Link>
      </div>
    );
  }

  if (isLoadingWork) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/works/${id}`}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Edit Work Details
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Update title, status, deadline, or member assignments.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Work Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorkCategory)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="video">Video</option>
              <option value="reels">Reels / TikTok</option>
              <option value="poster">Poster</option>
              <option value="photo">Photo</option>
              <option value="design">Design</option>
              <option value="social_media">Social Media</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as WorkPriority)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High 🔥</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WorkStatus)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Deadline
            </label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Member Assignees */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-primary-500" />
            Assignees ({selectedAssignees.length} selected)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {members?.map((m) => {
              const isSelected = selectedAssignees.includes(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => toggleAssignee(m.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500/10 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <img
                    src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                    alt={m.name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{m.name}</p>
                    <span className="text-[10px] text-slate-400 uppercase">{m.role}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <Link
            href={`/works/${id}`}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary-500 text-white text-xs font-bold shadow-md hover:bg-primary-600 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
