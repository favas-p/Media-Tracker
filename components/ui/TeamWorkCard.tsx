/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, MoreVertical, CheckCircle2, Clock, PlayCircle, ChevronRight, ArrowRightLeft, Share2 } from 'lucide-react';
import { WorkDTO, WorkStatus } from '@/types';
import { AvatarGroup } from '@/components/ui/AvatarGroup';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { WorkStepLevelBar } from '@/components/ui/WorkStepLevelBar';
import { ShareWorkModal } from '@/components/ui/ShareWorkModal';

interface TeamWorkCardProps {
  work: WorkDTO;
  onStatusChange?: (id: string, newStatus: WorkStatus) => void;
  isDragging?: boolean;
}

export function TeamWorkCard({ work, onStatusChange, isDragging = false }: TeamWorkCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Format date range: e.g. "5 Sept 2024 - 5 Oct 2024" or fallback
  const startDateStr = work.createdAt
    ? format(new Date(work.createdAt), 'd MMM yyyy')
    : 'Start';
  const deadlineStr = work.deadline
    ? format(new Date(work.deadline), 'd MMM yyyy')
    : 'End';

  // Subtasks/tags to display as pastel pills under title
  const hasSubtasks = work.subtasks && work.subtasks.length > 0;

  return (
    <div
      className={`group relative bg-white dark:bg-[#0D0647] border border-slate-200/80 dark:border-blue-900/40 rounded-[24px] p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4 ${
        isDragging ? 'shadow-2xl scale-105 border-[#2511F7] dark:border-[#FFE600] z-30' : ''
      }`}
    >
      {/* 1. TOP ROW: Member Avatars on Left, Priority Badge & Options on Right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AvatarGroup users={work.assignedTo} max={3} size="md" />
        </div>

        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={work.priority} variant="pill" />

          {/* Quick Menu Button */}
          {onStatusChange && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                title="Move or change status"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Status Change Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-7 w-44 bg-white dark:bg-[#150B6E] border border-slate-100 dark:border-blue-900/60 rounded-2xl shadow-xl p-1.5 z-50 text-xs font-medium space-y-1">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 border-b border-slate-100 dark:border-blue-900/40">
                      Move Status To
                    </div>
                    {work.status !== 'pending' && (
                      <button
                        onClick={() => {
                          onStatusChange(work.id, 'pending');
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-2 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        To Do (Pending)
                      </button>
                    )}
                    {work.status !== 'in_progress' && (
                      <button
                        onClick={() => {
                          onStatusChange(work.id, 'in_progress');
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#2511F7] dark:hover:text-[#FFE600] flex items-center gap-2 transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-[#2511F7]" />
                        In Progress
                      </button>
                    )}
                    {work.status !== 'completed' && (
                      <button
                        onClick={() => {
                          onStatusChange(work.id, 'completed');
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Completed
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. MIDDLE ROW: Task Title & Tag Badges */}
      <div className="space-y-3">
        <Link href={`/works/${work.id}`} className="block">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug group-hover:text-[#2511F7] dark:group-hover:text-[#FFE600] transition-colors line-clamp-2">
            {work.title}
          </h3>
        </Link>

        {/* Category & Tags Row matching screenshot pill badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <CategoryBadge category={work.category} variant="pill" />

          {/* Render subtasks as tags if available (like Prototype, Research, Design system in screenshot) */}
          {hasSubtasks &&
            work.subtasks.slice(0, 2).map((subtask) => (
              <span
                key={subtask.id}
                className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#F3E8FF] text-[#9333EA] dark:bg-[#3B1963] dark:text-[#D8B4FE]"
              >
                {subtask.title}
              </span>
            ))}
        </div>

        {/* Work Step Progress Level Bar */}
        {hasSubtasks && (
          <div className="pt-1">
            <WorkStepLevelBar subtasks={work.subtasks} compact />
          </div>
        )}
      </div>

      {/* 3. BOTTOM ROW: Date Range */}
      <div className="pt-3 border-t border-slate-100 dark:border-blue-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            {startDateStr} - {deadlineStr}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowShareModal(true);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-[#2511F7] dark:hover:text-[#FFE600] hover:bg-slate-100 dark:hover:bg-blue-900/40 transition-colors"
            title="Share work card"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <Link
            href={`/works/${work.id}`}
            className="text-slate-400 hover:text-[#2511F7] dark:hover:text-[#FFE600] transition-colors p-1"
            title="Open work detail"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Share Work Modal */}
        <ShareWorkModal
          work={work}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      </div>
    </div>
  );
}
