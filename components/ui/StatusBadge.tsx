import React from 'react';
import { WorkStatus } from '@/types';
import { Clock, CheckCircle2, PlayCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: WorkStatus;
  deadline?: string;
}

export function StatusBadge({ status, deadline }: StatusBadgeProps) {
  const isOverdue =
    deadline &&
    status !== 'completed' &&
    new Date(deadline).getTime() < Date.now();

  const isDueSoon =
    deadline &&
    status !== 'completed' &&
    !isOverdue &&
    new Date(deadline).getTime() - Date.now() < 48 * 60 * 60 * 1000;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {status === 'pending' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      )}

      {status === 'in_progress' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <PlayCircle className="w-3.5 h-3.5 animate-pulse" />
          In Progress
        </span>
      )}

      {status === 'completed' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      )}

      {isOverdue && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </span>
      )}

      {isDueSoon && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          ⚡ Due Soon
        </span>
      )}
    </div>
  );
}
