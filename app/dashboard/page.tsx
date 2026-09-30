/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  Building2,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Laptop,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  Tv,
  ShieldCheck,
  FileText,
  Kanban,
  ExternalLink,
  Image,
  Share2,
  AlertTriangle,
  FolderCheck,
} from 'lucide-react';
import { format } from 'date-fns';

async function getDashboardData() {
  try {
    const res = await fetch('/api/dashboard', { cache: 'no-store' });
    const data = await res.json();
    if (!data.success) return null;
    return data.data;
  } catch (err) {
    return null;
  }
}

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
  });

  // Time Tracker state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(155); // 02:35 initial

  useEffect(() => {
    let timer: any;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string | null>('categories');

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  // Calendar Day Selector state
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Default fallback tasks
  const defaultTasks = [
    { id: '1', title: 'Video Editing Task', date: 'Today, 10:00', completed: true, icon: Tv, workId: '' },
    { id: '2', title: 'Social Media Post', date: 'Today, 12:30', completed: true, icon: Share2, workId: '' },
    { id: '3', title: 'Banner Graphic Design', date: 'Today, 15:00', completed: false, icon: Image, workId: '' },
    { id: '4', title: 'Content Review & Approval', date: 'Tomorrow, 11:00', completed: false, icon: FileText, workId: '' },
  ];

  const [tasks, setTasks] = useState(defaultTasks);

  // Sync real works from API into task list if available
  useEffect(() => {
    if (data?.allWorks && data.allWorks.length > 0) {
      const realTasks = data.allWorks.slice(0, 5).map((w: any, index: number) => ({
        id: w.id || String(index + 1),
        title: w.title,
        date: w.deadline ? format(new Date(w.deadline), 'MMM d, HH:mm') : 'Today',
        completed: w.status === 'completed',
        icon:
          w.category === 'video'
            ? Tv
            : w.category === 'graphic'
            ? Image
            : w.category === 'social_media'
            ? Share2
            : FileText,
        workId: w.id,
      }));
      setTasks(realTasks);
    }
  }, [data]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  // Real backend metrics
  const totalMembers = data?.stats?.totalMembers ?? 0;
  const pendingWorks = data?.stats?.pending ?? 0;
  const completedWorks = data?.stats?.completed ?? 0;
  const totalWorks = data?.stats?.total ?? 0;
  const inProgressWorks = data?.stats?.inProgress ?? 0;
  const overdueWorks = data?.stats?.overdue ?? 0;

  // Real percentages
  const pendingRate = data?.stats?.pendingRate ?? (totalWorks > 0 ? Math.round((pendingWorks / totalWorks) * 100) : 0);
  const inProgressRate = data?.stats?.inProgressRate ?? (totalWorks > 0 ? Math.round((inProgressWorks / totalWorks) * 100) : 0);
  const completionRate = data?.stats?.completionRate ?? (totalWorks > 0 ? Math.round((completedWorks / totalWorks) * 100) : 0);
  const overdueRate = data?.stats?.overdueRate ?? (totalWorks > 0 ? Math.round((overdueWorks / totalWorks) * 100) : 0);

  const userName = session?.user?.name || data?.user?.name || 'Media Member';
  const userRole = session?.user?.role || data?.user?.role || 'member';

  const upcomingItem1 = data?.myUpcomingWorks?.[0] || data?.allWorks?.[0];
  const upcomingItem2 = data?.myUpcomingWorks?.[1] || data?.allWorks?.[1];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Welcome Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A043D] dark:text-white flex items-center gap-2 flex-wrap">
            Welcome back, <span className="text-[#2511F7] dark:text-[#FFE600]">{userName}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Here is your NUSA Media Crew performance overview and assigned works for today.
          </p>
        </div>

        <Link
          href="/works/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#2511F7] hover:bg-[#1B07DB] text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Assign New Work
        </Link>
      </div>

      {/* 2. Real Project KPI Capsule & Counter Bar */}
      <div className="bg-white dark:bg-[#0D0647] rounded-[28px] p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-blue-900/40 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left 4 Real Capsule Progress Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto flex-1">
          {/* Pending Works Capsule */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Pending Works
            </span>
            <div className="h-9 rounded-full bg-[#12095C] text-white font-bold text-xs flex items-center px-4 shadow-sm relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#231499]"
                style={{ width: `${Math.max(pendingRate, 10)}%` }}
              />
              <span className="relative z-10">{pendingRate}%</span>
            </div>
          </div>

          {/* In Progress Capsule */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              In Progress
            </span>
            <div className="h-9 rounded-full bg-[#2511F7] text-white font-bold text-xs flex items-center px-4 shadow-sm relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#4230FF]"
                style={{ width: `${Math.max(inProgressRate, 10)}%` }}
              />
              <span className="relative z-10">{inProgressRate}%</span>
            </div>
          </div>

          {/* Completion Rate Capsule */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Completion Rate
            </span>
            <div className="h-9 rounded-full border border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-[#150B6E] text-slate-800 dark:text-white font-bold text-xs flex items-center px-4 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-200/60 to-indigo-200/60 dark:from-blue-900/60 dark:to-indigo-900/60"
                style={{ width: `${Math.max(completionRate, 10)}%` }}
              />
              <span className="relative z-10">{completionRate}%</span>
            </div>
          </div>

          {/* Overdue Rate Capsule */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Overdue Works
            </span>
            <div className="h-9 rounded-full border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-[#0D0647] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center px-4">
              <span>{overdueRate}%</span>
            </div>
          </div>
        </div>

        {/* Right 3 Real Stat Counters */}
        <div className="flex items-center justify-around sm:justify-end gap-6 sm:gap-8 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-blue-900/40 flex-shrink-0">
          {/* Real Members Counter */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#2511F7] dark:text-[#FFE600] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xl font-black text-[#0A043D] dark:text-white block leading-tight">
                {totalMembers}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Members
              </span>
            </div>
          </div>

          {/* Pending Works Counter */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xl font-black text-[#0A043D] dark:text-white block leading-tight">
                {pendingWorks}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Pending
              </span>
            </div>
          </div>

          {/* Completed Works Counter */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xl font-black text-[#0A043D] dark:text-white block leading-tight">
                {completedWorks}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= LEFT COLUMN (3 Cols) ================= */}
        <div className="lg:col-span-3 space-y-6">
          {/* Featured Profile Card */}
          <div className="bg-white dark:bg-[#0D0647] rounded-[28px] p-3 shadow-sm border border-slate-100 dark:border-blue-900/40 overflow-hidden relative group">
            <div className="relative h-72 w-full rounded-[22px] overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={
                  session?.user?.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`
                }
                alt={userName}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A043D]/95 via-transparent to-transparent flex flex-col justify-between p-4 text-white">
                <div />
                <div>
                  <h3 className="font-bold text-lg text-white leading-snug">
                    {userName}
                  </h3>
                  <p className="text-xs text-[#FFE600] font-bold capitalize">
                    {userRole === 'chairman'
                      ? 'Chairman & Lead'
                      : userRole === 'convener'
                      ? 'Convener'
                      : 'Media Member'}
                  </p>
                </div>
              </div>

              {/* Status Tag */}
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-blue-600/30 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold shadow-lg flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FFE600] animate-pulse" />
                <span className="capitalize">{userRole} Status</span>
              </div>
            </div>
          </div>

          {/* Accordion Menu List */}
          <div className="bg-white dark:bg-[#0D0647] rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-blue-900/40 space-y-3">
            {/* Item 1: Media Categories */}
            <div className="border-b border-slate-100 dark:border-blue-900/40 pb-3">
              <button
                onClick={() => toggleAccordion('categories')}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#2511F7] transition-colors py-1"
              >
                <span>Media Work Categories</span>
                {openAccordion === 'categories' ? (
                  <ChevronUp className="w-4 h-4 text-[#2511F7] dark:text-[#FFE600]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              <AnimatePresence>
                {openAccordion === 'categories' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-3 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center bg-[#F4F6FF] dark:bg-[#150B6E] p-2.5 rounded-xl text-slate-700 dark:text-slate-200 font-semibold">
                      <span className="flex items-center gap-2"><Tv className="w-3.5 h-3.5 text-[#2511F7]" /> Video Production</span>
                      <span className="font-bold text-[#2511F7] dark:text-[#FFE600]">{data?.stats?.categories?.video ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#F4F6FF] dark:bg-[#150B6E] p-2.5 rounded-xl text-slate-700 dark:text-slate-200 font-semibold">
                      <span className="flex items-center gap-2"><Image className="w-3.5 h-3.5 text-indigo-500" /> Graphic Designs</span>
                      <span className="font-bold text-[#2511F7] dark:text-[#FFE600]">{data?.stats?.categories?.graphic ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#F4F6FF] dark:bg-[#150B6E] p-2.5 rounded-xl text-slate-700 dark:text-slate-200 font-semibold">
                      <span className="flex items-center gap-2"><Share2 className="w-3.5 h-3.5 text-sky-500" /> Social Media</span>
                      <span className="font-bold text-[#2511F7] dark:text-[#FFE600]">{data?.stats?.categories?.socialMedia ?? 0}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Item 2: Work Status Breakdown */}
            <div className="border-b border-slate-100 dark:border-blue-900/40 pb-3">
              <button
                onClick={() => toggleAccordion('status')}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#2511F7] transition-colors py-1"
              >
                <span>Work Status Overview</span>
                {openAccordion === 'status' ? (
                  <ChevronUp className="w-4 h-4 text-[#2511F7] dark:text-[#FFE600]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <AnimatePresence>
                {openAccordion === 'status' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-3 space-y-2 text-xs"
                  >
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Pending Works</span>
                      <span className="font-bold text-amber-500">{pendingWorks}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>In Progress</span>
                      <span className="font-bold text-blue-500">{inProgressWorks}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Completed</span>
                      <span className="font-bold text-emerald-500">{completedWorks}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Item 3: Quick Navigation */}
            <div>
              <Link
                href="/works"
                className="w-full flex items-center justify-between text-xs font-bold text-[#2511F7] dark:text-[#FFE600] hover:underline py-1"
              >
                <span>View All Media Works →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ================= MIDDLE COLUMN (6 Cols) ================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* Top Row: 3 Mini Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Total Project Works */}
            <div className="bg-white dark:bg-[#0D0647] rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-blue-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Total Works
                  </h3>
                  <Link href="/works" className="text-slate-400 hover:text-[#2511F7]">
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {totalWorks}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Total Media Tasks
                  </span>
                  <span className="text-[10px] text-[#2511F7] dark:text-[#FFE600] font-bold block mt-0.5">
                    {completionRate}% Completed
                  </span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="mt-4">
                <div className="flex items-center justify-between gap-1.5 h-16 pt-2 border-b border-slate-100 dark:border-blue-900/40">
                  {[
                    Math.max(pendingWorks * 10, 15),
                    Math.max(inProgressWorks * 12, 25),
                    Math.max(completedWorks * 15, 35),
                    Math.max(overdueWorks * 8, 10),
                    20,
                    25,
                    Math.max(totalWorks * 5, 30),
                  ].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        style={{ height: `${Math.min(h, 100)}%` }}
                        className={`w-2.5 rounded-full transition-all ${
                          i === 2
                            ? 'bg-[#2511F7] shadow-sm shadow-blue-500/30'
                            : 'bg-[#2511F7]/30 dark:bg-[#2511F7]/40'
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400 pt-1.5 px-0.5">
                  <span>P</span>
                  <span>IP</span>
                  <span>C</span>
                  <span>O</span>
                  <span>V</span>
                  <span>G</span>
                  <span>S</span>
                </div>
              </div>
            </div>

            {/* Card 2: Time Tracker */}
            <div className="bg-white dark:bg-[#0D0647] rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-blue-900/40 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Time Tracker
                </h3>
                <button className="text-slate-400 hover:text-[#2511F7]">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {/* Circular Timer Ring */}
              <div className="my-3 flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-blue-950"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#2511F7]"
                      strokeDasharray="75, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {formatTimer(seconds)}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">
                      Work Time
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="h-8 w-8 rounded-full border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#150B6E] text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm"
                >
                  {isTimerRunning ? (
                    <Pause className="w-3.5 h-3.5 text-[#2511F7]" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => setSeconds(0)}
                  className="h-8 w-8 rounded-full border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#150B6E] text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm"
                  title="Reset Timer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Card 3: Completion Tracker */}
            <div className="bg-white dark:bg-[#0D0647] rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-blue-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Work Completion
                  </h3>
                  <span className="text-xs font-extrabold text-[#2511F7] dark:text-[#FFE600]">
                    {completionRate}%
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex text-[10px] font-bold text-slate-500 justify-between">
                    <span>{completedWorks} Done</span>
                    <span>{inProgressWorks} Active</span>
                    <span>{pendingWorks} Pending</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="h-8 rounded-xl bg-[#2511F7] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {completedWorks}
                    </div>
                    <div className="h-8 rounded-xl bg-[#12095C] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {inProgressWorks}
                    </div>
                    <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center">
                      {pendingWorks}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 text-[10px] text-slate-400 font-semibold flex items-center justify-between border-t border-slate-100 dark:border-blue-900/40 mt-2">
                <span>Active Members</span>
                <span className="text-slate-700 dark:text-slate-200 font-bold">
                  {totalMembers} Members
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Card: Calendar & Real Works Schedule Timeline */}
          <div className="bg-white dark:bg-[#0D0647] rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-blue-900/40 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <h3 className="text-sm font-extrabold text-[#0A043D] dark:text-white">
                {format(new Date(), 'MMMM yyyy')}
              </h3>
              <button className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Timeline Item 1 */}
            <div className="space-y-4 pt-2 relative">
              <div className="flex items-start gap-4 text-xs">
                <span className="text-slate-400 font-semibold w-16 pt-2 flex-shrink-0">
                  Upcoming #1
                </span>
                <div className="flex-1 bg-[#EEF0FF] dark:bg-[#150B6E] rounded-2xl p-3.5 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {upcomingItem1?.title || 'No upcoming works assigned'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-300">
                      {upcomingItem1?.description || 'Assign a work from Team Board'}
                    </p>
                  </div>
                  {upcomingItem1?.id && (
                    <Link
                      href={`/works/${upcomingItem1.id}`}
                      className="px-3 py-1.5 rounded-full bg-[#2511F7] text-white text-[10px] font-bold shadow-sm"
                    >
                      View Detail
                    </Link>
                  )}
                </div>
              </div>

              {/* Timeline Item 2 */}
              <div className="flex items-start gap-4 text-xs">
                <span className="text-slate-400 font-semibold w-16 pt-2 flex-shrink-0">
                  Upcoming #2
                </span>
                <div className="flex-1 bg-[#FFFBE6] dark:bg-[#2E2800] rounded-2xl p-3.5 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-amber-100">
                      {upcomingItem2?.title || 'Media Work Review'}
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                      {upcomingItem2?.description || 'Check status and update deadlines'}
                    </p>
                  </div>
                  {upcomingItem2?.id && (
                    <Link
                      href={`/works/${upcomingItem2.id}`}
                      className="px-3 py-1.5 rounded-full bg-[#FFE600] text-[#0A043D] text-[10px] font-bold shadow-sm"
                    >
                      View Detail
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (3 Cols) ================= */}
        <div className="lg:col-span-3 space-y-6">
          {/* Real Team Works Checklist Panel */}
          <div className="bg-[#12095C] dark:bg-[#080330] text-white rounded-[28px] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[480px] border border-blue-900/50">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-bold text-base text-white">
                  Team Media Works
                </h3>
                <span className="text-lg font-black text-[#FFE600]">
                  {completedCount}/{tasks.length}
                </span>
              </div>

              {/* Real Tasks List */}
              <div className="mt-5 space-y-3.5">
                {tasks.map((task) => {
                  const IconComp = task.icon;
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-[#FFE600] flex-shrink-0">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs font-bold truncate ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-white'
                            }`}
                          >
                            {task.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 block">
                            {task.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {task.workId && (
                          <Link
                            href={`/works/${task.workId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <button className="flex-shrink-0">
                          {task.completed ? (
                            <div className="h-6 w-6 rounded-full bg-[#FFE600] text-[#0A043D] flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-slate-500 flex items-center justify-center hover:border-[#FFE600]" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer Button */}
            <div className="pt-6 border-t border-white/10 mt-6">
              <Link
                href="/works"
                className="w-full py-3 px-4 rounded-2xl bg-[#2511F7] hover:bg-[#1B07DB] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/40 transition-all"
              >
                <span>View All Team Tasks</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
