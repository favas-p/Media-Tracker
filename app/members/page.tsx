/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Key,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { fetchMembers, createMember, updateMember, resetMemberPassword } from '@/services/member';
import { UserDTO, UserRole } from '@/types';
import { isAdminRole } from '@/lib/auth-utils';
import { format } from 'date-fns';

export default function MembersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = isAdminRole(session?.user?.role);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editMember, setEditMember] = useState<UserDTO | null>(null);
  const [resetPasswordMember, setResetPasswordMember] = useState<UserDTO | null>(null);

  // Form states
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('member');
  const [addAvatarUrl, setAddAvatarUrl] = useState('');

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editIsActive, setEditIsActive] = useState(true);

  const [newPassword, setNewPassword] = useState('');

  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Fetch Members
  const { data: members, isLoading, isError } = useQuery({
    queryKey: ['members', roleFilter],
    queryFn: () =>
      fetchMembers({
        role: roleFilter !== 'all' ? roleFilter : undefined,
        includeInactive: true,
      }),
  });

  // Create Member Mutation
  const addMutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setIsAddOpen(false);
      resetAddForm();
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Failed to create member');
    },
  });

  // Edit Member Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => updateMember(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setEditMember(null);
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Failed to update member');
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass: string }) =>
      resetMemberPassword(id, { newPassword: pass }),
    onSuccess: () => {
      setModalSuccess('Password reset successfully!');
      setTimeout(() => {
        setResetPasswordMember(null);
        setModalSuccess(null);
        setNewPassword('');
      }, 1500);
    },
    onError: (err: Error) => {
      setModalError(err.message || 'Failed to reset password');
    },
  });

  const resetAddForm = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddRole('member');
    setAddAvatarUrl('');
    setModalError(null);
  };

  const openEditModal = (m: UserDTO) => {
    setEditMember(m);
    setEditName(m.name);
    setEditEmail(m.email);
    setEditRole(m.role);
    setEditIsActive(m.isActive);
    setModalError(null);
  };

  const openResetPasswordModal = (m: UserDTO) => {
    setResetPasswordMember(m);
    setNewPassword('');
    setModalError(null);
    setModalSuccess(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    addMutation.mutate({
      name: addName.trim(),
      email: addEmail.trim(),
      password: addPassword,
      role: addRole,
      avatarUrl: addAvatarUrl.trim() || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    setModalError(null);
    editMutation.mutate({
      id: editMember.id,
      input: {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        isActive: editIsActive,
      },
    });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordMember || !newPassword) return;
    setModalError(null);
    resetPasswordMutation.mutate({ id: resetPasswordMember.id, pass: newPassword });
  };

  const filteredMembers = members?.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          Only Chairman and Conveners can manage team members.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold text-xs"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A043D] dark:text-white flex items-center gap-2.5">
            <Users className="w-8 h-8 text-[#2511F7] dark:text-[#FFE600]" />
            Nusa Media Team Members
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manage user roles, create new team member accounts, or reset passwords.
          </p>
        </div>

        <button
          onClick={() => {
            resetAddForm();
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2511F7] hover:bg-[#1B07DB] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
          Add New Member
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-[#151233] border border-slate-100 dark:border-slate-800/80 rounded-[28px] p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-[#F8F9FD] dark:bg-[#1E1A3D] border border-slate-200 dark:border-slate-700/60 rounded-full pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#6C47FF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#F8F9FD] dark:bg-[#1E1A3D] border border-slate-200 dark:border-slate-700/60 rounded-full px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#6C47FF]"
          >
            <option value="all">All Roles</option>
            <option value="chairman">Chairman</option>
            <option value="convener">Convener</option>
            <option value="member">Member</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-[28px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredMembers?.length === 0 ? (
        <div className="bg-white dark:bg-[#151233] border border-slate-100 dark:border-slate-800/80 rounded-[28px] p-12 text-center space-y-3 shadow-sm">
          <p className="text-base font-bold text-slate-900 dark:text-white">No members found</p>
          <p className="text-xs text-slate-400 font-medium">Try adjusting search or role filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers?.map((m) => (
            <motion.div
              key={m.id}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-[#151233] border border-slate-100 dark:border-slate-800/80 rounded-[28px] p-6 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                  alt={m.name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-[#6C47FF]/30 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {m.name}
                    </h3>
                    {!m.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-500/10 text-rose-500">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">{m.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        m.role === 'chairman'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : m.role === 'convener'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {m.role === 'chairman' && <ShieldCheck className="w-3 h-3" />}
                      {m.role === 'convener' && <Shield className="w-3 h-3" />}
                      {m.role === 'member' && <UserIcon className="w-3 h-3" />}
                      {m.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-medium">
                  Joined {m.createdAt ? format(new Date(m.createdAt), 'MMM yyyy') : 'Recently'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openResetPasswordModal(m)}
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1A3D] text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                    title="Reset Password"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(m)}
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E1A3D] text-[#6C47FF] hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                    title="Edit Member"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal: Add Member */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Team Member</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Maya Indah"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="maya@nusamedia.id"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initial Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Role</label>
                    <select
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="member">Member</option>
                      <option value="convener">Convener</option>
                      <option value="chairman">Chairman</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Avatar URL (Optional)</label>
                    <input
                      type="url"
                      value={addAvatarUrl}
                      onChange={(e) => setAddAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-md hover:bg-primary-600 transition-all disabled:opacity-50"
                  >
                    {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Member */}
      <AnimatePresence>
        {editMember && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Member Details</h3>
                <button onClick={() => setEditMember(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="member">Member</option>
                      <option value="convener">Convener</option>
                      <option value="chairman">Chairman</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                    <select
                      value={editIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditIsActive(e.target.value === 'active')}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Deactivated</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMember(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-md hover:bg-primary-600 transition-all disabled:opacity-50"
                  >
                    {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Reset Password */}
      <AnimatePresence>
        {resetPasswordMember && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h3>
                <button onClick={() => setResetPasswordMember(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setting new password for <strong>{resetPasswordMember.name}</strong> ({resetPasswordMember.email}).
              </p>

              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetPasswordMember(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending || !newPassword}
                    className="px-5 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-md hover:bg-amber-600 transition-all disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
