/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Kanban,
  UserCheck,
  Link as LinkIcon,
} from 'lucide-react';
import { fetchMembers } from '@/services/member';
import { createWork } from '@/services/work';
import { createWorkSchema } from '@/validators/work';
import { WorkCategory, WorkPriority } from '@/types';
import { isAdminRole } from '@/lib/auth-utils';

export default function NewWorkPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isAdminRole(session?.user?.role);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WorkCategory>('video');
  const [priority, setPriority] = useState<WorkPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<{ title: string; assignedTo: string }[]>([
    { title: '1. Program Poster Design', assignedTo: '' },
    { title: '2. Video Shoot', assignedTo: '' },
    { title: '3. Video Editing', assignedTo: '' },
    { title: '4. Photo Framing', assignedTo: '' },
  ]);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Fetch Team Members
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetchMembers(),
  });

  const createMutation = useMutation({
    mutationFn: createWork,
    onSuccess: (newWork) => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/works/${newWork.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create work item');
    },
  });

  const toggleAssignee = (memberId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleAddSubtask = () => {
    setSubtasks((prev) => [...prev, { title: `${prev.length + 1}. `, assignedTo: '' }]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (index: number, field: 'title' | 'assignedTo', value: string) => {
    setSubtasks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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

    const validSubtasks = subtasks
      .filter((st) => st.title.trim().length > 0)
      .map((st) => ({
        title: st.title.trim(),
        assignedTo: st.assignedTo || undefined,
        status: 'pending' as const,
      }));

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      deadline,
      assignedTo: selectedAssignees,
      subtasks: validSubtasks,
      attachments,
    };

    const validation = createWorkSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || 'Please check form fields.');
      return;
    }

    createMutation.mutate(payload);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
        <div className="h-14 w-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-2xl font-bold">
          🚫
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Only Chairman and Conveners can create and assign new works to team members.
        </p>
        <Link
          href="/works"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold text-xs"
        >
          Return to Works Board
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans pb-12">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/works"
          className="p-2.5 rounded-full border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#150B6E] hover:bg-slate-100 dark:hover:bg-blue-900/60 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A043D] dark:text-white">
            Create & Assign Work
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Assign media tasks, set deadlines, and attach reference briefs.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs sm:text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0D0647] border border-slate-100 dark:border-blue-900/40 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Work Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Weekly Highlight Reels & Poster Design"
            className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2511F7] transition-colors"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Description / Brief
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide detail instructions, aspect ratio, camera settings, tone, etc."
            className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-3xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2511F7] transition-colors"
          />
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorkCategory)}
              className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
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
              className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority 🔥</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Deadline <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
            />
          </div>
        </div>

        {/* Member Assignees Checklist */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#2511F7] dark:text-[#FFE600]" />
              Assign to Team Members <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400 font-medium">
              {selectedAssignees.length} selected
            </span>
          </div>

          {isLoadingMembers ? (
            <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : (
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
                        ? 'border-[#2511F7] bg-[#2511F7]/10 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-blue-900/40 bg-[#F4F6FF] dark:bg-[#150B6E] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#2511F7] border-[#2511F7] text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Plus className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <img
                      src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                      alt={m.name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{m.name}</p>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {m.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Program Workflow Steps (Addon Works) Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Kanban className="w-4 h-4 text-[#2511F7] dark:text-[#FFE600]" />
              Program Workflow & Addon Works (Ordered Steps)
            </label>
            <button
              type="button"
              onClick={handleAddSubtask}
              className="text-xs font-bold text-[#2511F7] dark:text-[#FFE600] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Program Step
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set up ordered program steps (e.g., 1. Poster, 2. Video Shoot, 3. Video Editing) and assign specific members to each step.
          </p>

          <div className="space-y-2.5">
            {subtasks.map((st, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40"
              >
                <span className="h-6 w-6 rounded-full bg-[#2511F7] text-[#FFE600] font-black text-[10px] flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>

                <input
                  type="text"
                  value={st.title}
                  onChange={(e) => handleSubtaskChange(idx, 'title', e.target.value)}
                  placeholder={`Step ${idx + 1} Title (e.g. Video Shoot, Photo Framing...)`}
                  className="flex-1 bg-white dark:bg-[#0D0647] border border-slate-200 dark:border-blue-900/40 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2511F7]"
                />

                <select
                  value={st.assignedTo}
                  onChange={(e) => handleSubtaskChange(idx, 'assignedTo', e.target.value)}
                  className="bg-white dark:bg-[#0D0647] border border-slate-200 dark:border-blue-900/40 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2511F7]"
                >
                  <option value="">-- Assign Member --</option>
                  {members?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(idx)}
                  className="p-2 text-rose-500 hover:text-rose-600 rounded-xl hover:bg-rose-500/10 transition-colors flex-shrink-0 self-end sm:self-auto"
                  title="Remove Step"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Attachments Section */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <LinkIcon className="w-4 h-4 text-[#2511F7] dark:text-[#FFE600]" />
            Attachments & Reference URLs (Cloudinary / Unsplash / Drive)
          </label>

          <div className="flex gap-2">
            <input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="flex-1 bg-[#F4F6FF] dark:bg-[#150B6E] border border-slate-200 dark:border-blue-900/40 rounded-full px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2511F7]"
            />
            <button
              type="button"
              onClick={handleAddAttachment}
              className="px-4 py-2.5 rounded-full bg-slate-200 dark:bg-[#150B6E] text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition-colors"
            >
              Add URL
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2 pt-1">
              {attachments.map((url, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-[#F4F6FF] dark:bg-[#150B6E] rounded-2xl border border-slate-200 dark:border-blue-900/40 text-xs"
                >
                  <span className="truncate max-w-md text-[#2511F7] dark:text-[#FFE600] font-semibold">
                    {url}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(i)}
                    className="text-rose-500 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-blue-900/40">
          <Link
            href="/works"
            className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#150B6E] transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2511F7] hover:bg-[#1B07DB] text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 hover:scale-105"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                Assign Work
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

