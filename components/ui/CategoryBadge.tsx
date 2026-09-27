import React from 'react';
import { WorkCategory } from '@/types';
import { Image, Video, Film, Camera, Palette, Share2, Layers } from 'lucide-react';

interface CategoryBadgeProps {
  category: WorkCategory;
}

const categoryConfig: Record<
  WorkCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string }
> = {
  poster: {
    label: 'Poster',
    icon: Image,
    colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  },
  video: {
    label: 'Video',
    icon: Video,
    colorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  },
  reels: {
    label: 'Reels/TikTok',
    icon: Film,
    colorClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  },
  photo: {
    label: 'Photo',
    icon: Camera,
    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  design: {
    label: 'Design',
    icon: Palette,
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  social_media: {
    label: 'Social Media',
    icon: Share2,
    colorClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
  },
  other: {
    label: 'Other',
    icon: Layers,
    colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = categoryConfig[category] || categoryConfig.other;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${config.colorClass}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
