import React from 'react';
import { WorkPriority } from '@/types';

interface PriorityBadgeProps {
  priority: WorkPriority;
  variant?: 'pill' | 'badge';
}

export function PriorityBadge({ priority, variant = 'pill' }: PriorityBadgeProps) {
  if (variant === 'pill') {
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#FFF3EB] text-[#F97316] dark:bg-[#3D1E0B]/90 dark:text-[#FFA96B]">
          High
        </span>
      );
    }

    if (priority === 'medium') {
      return (
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#FEFCE8] text-[#CA8A04] dark:bg-[#3B3209]/90 dark:text-[#FDE047]">
          Medium
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#64748B] dark:bg-[#1E293B]/90 dark:text-[#94A3B8]">
        Low
      </span>
    );
  }

  if (priority === 'high') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        🔥 High
      </span>
    );
  }

  if (priority === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        ⚡ Medium
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
      ☕ Low
    </span>
  );
}
