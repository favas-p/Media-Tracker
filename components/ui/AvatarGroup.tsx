/* eslint-disable @next/next/no-img-element */
import React from 'react';

interface UserAvatar {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface AvatarGroupProps {
  users: UserAvatar[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap = [
  'bg-amber-500 text-white',
  'bg-blue-600 text-white',
  'bg-emerald-600 text-white',
  'bg-purple-600 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-600 text-white',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorMap.length;
  return colorMap[index];
}

export function AvatarGroup({ users, max = 3, size = 'md' }: AvatarGroupProps) {
  if (!users || users.length === 0) {
    return <span className="text-xs text-slate-400 italic font-medium">Unassigned</span>;
  }

  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const sizeClasses = {
    sm: 'h-6 w-6 text-[9px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-9 w-9 text-xs',
  }[size];

  return (
    <div className="flex items-center -space-x-2.5 overflow-visible py-0.5">
      {visibleUsers.map((user) => {
        const initials = user.name
          ? user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : '?';
        const colorClass = getAvatarColor(user.name || 'User');

        return (
          <div
            key={user.id}
            className={`relative inline-block ${sizeClasses} rounded-full ring-2 ring-white dark:ring-[#0D0647] shadow-sm flex-shrink-0 transition-transform hover:z-10 hover:scale-110`}
            title={user.name}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  if ((e.target as HTMLElement).nextElementSibling) {
                    ((e.target as HTMLElement).nextElementSibling as HTMLElement).style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <span
              className={`flex h-full w-full items-center justify-center font-bold rounded-full ${colorClass}`}
              style={{ display: user.avatarUrl ? 'none' : 'flex' }}
            >
              {initials}
            </span>
          </div>
        );
      })}
      {remainingCount > 0 && (
        <div
          className={`flex ${sizeClasses} items-center justify-center rounded-full ring-2 ring-white dark:ring-[#0D0647] bg-slate-800 text-white font-bold shadow-sm`}
          title={`${remainingCount} more assignees`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
