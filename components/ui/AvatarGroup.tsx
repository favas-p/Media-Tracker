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
}

export function AvatarGroup({ users, max = 3 }: AvatarGroupProps) {
  if (!users || users.length === 0) {
    return <span className="text-xs text-slate-400 italic">Unassigned</span>;
  }

  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden py-1">
      {visibleUsers.map((user) => (
        <div
          key={user.id}
          className="relative inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 dark:bg-slate-800"
          title={user.name}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-700 text-white font-bold text-[10px]"
          title={`${remainingCount} more assignees`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
