import React from 'react';
import { WorkPriority } from '@/types';

interface PriorityBadgeProps {
  priority: WorkPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (priority === 'high') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        🔥 High
      </span>
    );
  }

  if (priority === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        ⚡ Medium
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
      ☕ Low
    </span>
  );
}
