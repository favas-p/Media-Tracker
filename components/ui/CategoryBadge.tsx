import React from 'react';
import { WorkCategory } from '@/types';
import { Image, Video, Film, Camera, Palette, Share2, Layers } from 'lucide-react';

interface CategoryBadgeProps {
  category: WorkCategory;
  variant?: 'pill' | 'badge';
  customLabel?: string;
}

const categoryConfig: Record<
  WorkCategory,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    pillClass: string;
  }
> = {
  poster: {
    label: 'Poster',
    icon: Image,
    colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    pillClass: 'bg-[#F3E8FF] text-[#9333EA] dark:bg-[#3B1963] dark:text-[#D8B4FE]',
  },
  video: {
    label: 'Video',
    icon: Video,
    colorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    pillClass: 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0C3B5E] dark:text-[#7DD3FC]',
  },
  reels: {
    label: 'Reels / TikTok',
    icon: Film,
    colorClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    pillClass: 'bg-[#FCE7F3] text-[#DB2777] dark:bg-[#501335] dark:text-[#FBCFE8]',
  },
  photo: {
    label: 'Photo',
    icon: Camera,
    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    pillClass: 'bg-[#FEF9C3] text-[#A16207] dark:bg-[#423405] dark:text-[#FDE047]',
  },
  design: {
    label: 'Design',
    icon: Palette,
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    pillClass: 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0C3B5E] dark:text-[#7DD3FC]',
  },
  social_media: {
    label: 'Social Media',
    icon: Share2,
    colorClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    pillClass: 'bg-[#E6F4EA] text-[#137333] dark:bg-[#0F3821] dark:text-[#81C995]',
  },
  other: {
    label: 'Other',
    icon: Layers,
    colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    pillClass: 'bg-[#F3E8FF] text-[#7E22CE] dark:bg-[#3B1963] dark:text-[#D8B4FE]',
  },
};

export function CategoryBadge({ category, variant = 'pill', customLabel }: CategoryBadgeProps) {
  const config = categoryConfig[category] || categoryConfig.other;
  const label = customLabel || config.label;
  const Icon = config.icon;

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${config.pillClass}`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.colorClass}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
