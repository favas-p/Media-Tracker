import React from 'react';
import { SubTaskDTO } from '@/types';
import { ListChecks } from 'lucide-react';

interface WorkStepLevelBarProps {
  subtasks?: SubTaskDTO[];
  compact?: boolean;
}

export const WorkStepLevelBar: React.FC<WorkStepLevelBarProps> = ({ subtasks, compact = false }) => {
  if (!subtasks || subtasks.length === 0) return null;

  const totalSteps = subtasks.length;
  const completedSteps = subtasks.filter((st) => st.status === 'completed').length;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={`${completedSteps}/${totalSteps} steps completed`}>
        <div className="flex items-center gap-1">
          {subtasks.map((st, i) => (
            <span
              key={st.id || i}
              title={`Step ${i + 1}: ${st.title} (${st.status.replace('_', ' ')})`}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                st.status === 'completed'
                  ? 'bg-emerald-500 ring-2 ring-emerald-400/30'
                  : st.status === 'in_progress'
                  ? 'bg-amber-400 ring-2 ring-amber-400/30 animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {completedSteps}/{totalSteps}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 p-2.5 rounded-2xl bg-[#F8F9FD] dark:bg-[#1E1A3D] border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <ListChecks className="w-3.5 h-3.5 text-[#2511F7] dark:text-[#FFE600]" />
          Program Workflow
        </span>
        <span className="font-extrabold text-[#2511F7] dark:text-[#FFE600]">
          {completedSteps}/{totalSteps} Steps Done
        </span>
      </div>

      {/* Step Level Bar / Dots */}
      <div className="flex items-center gap-1.5 pt-0.5">
        {subtasks.map((st, i) => {
          const isDone = st.status === 'completed';
          const isInProgress = st.status === 'in_progress';

          return (
            <div key={st.id || i} className="flex-1 relative group">
              <div
                className={`h-2 rounded-full transition-all ${
                  isDone
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                    : isInProgress
                    ? 'bg-amber-400 shadow-sm shadow-amber-400/40 animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
              {/* Tooltip on Hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 whitespace-nowrap bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-semibold py-1 px-2 rounded-lg shadow-lg pointer-events-none">
                Step {i + 1}: {st.title} ({isDone ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'})
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
