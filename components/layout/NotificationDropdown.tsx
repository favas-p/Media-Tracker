/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  PlusCircle,
  MessageSquare,
  UserPlus,
  Clock,
  Check,
  Sparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface NotificationItem {
  id: string;
  workId: string;
  workTitle: string;
  userName: string;
  userAvatar: string;
  action: string;
  message: string;
  type: 'create' | 'status' | 'comment' | 'assign';
  createdAt: string;
}

async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch('/api/notifications', { cache: 'no-store' });
  const json = await res.json();
  if (!json.success) return [];
  return json.data;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load read notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nusa_read_notifications');
        if (saved) {
          setReadIds(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load read notifications state', e);
      }
    }
  }, []);

  // Fetch real notifications with automatic 15-second background polling
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 15000,
  });

  // Calculate unread items count
  const unreadNotifications = notifications.filter((n) => !readIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nusa_read_notifications', JSON.stringify(updated));
      }
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nusa_read_notifications', JSON.stringify(allIds));
    }
  };

  const getNotificationIcon = (type: NotificationItem['type'], message: string) => {
    if (message.includes('Completed')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
    }
    switch (type) {
      case 'create':
        return <PlusCircle className="w-4 h-4 text-[#2511F7] dark:text-[#FFE600] flex-shrink-0" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-sky-500 flex-shrink-0" />;
      case 'assign':
        return <UserPlus className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0D0647] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#150B6E] transition-colors shadow-sm focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#2511F7] text-[#FFE600] text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-[#0D0647] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Container */}
      {isOpen && (
        <div className="fixed left-1/2 -translate-x-1/2 top-16 w-[calc(100vw-2rem)] max-w-sm sm:absolute sm:left-auto sm:right-0 sm:translate-x-0 sm:top-full sm:mt-3 sm:w-96 sm:max-w-none bg-white dark:bg-[#0D0647] border border-slate-200 dark:border-blue-900/50 rounded-3xl shadow-2xl z-50 overflow-hidden font-sans backdrop-blur-xl transition-all">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-blue-900/40 flex items-center justify-between bg-slate-50/50 dark:bg-blue-950/30">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[#0D0647] dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#2511F7] text-[#FFE600] text-[10px] font-extrabold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-[#2511F7] dark:text-[#FFE600] hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-blue-900/30">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  No activity notifications yet
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.includes(item.id);
                return (
                  <Link
                    key={item.id}
                    href={`/works/${item.workId}`}
                    onClick={() => {
                      markAsRead(item.id);
                      setIsOpen(false);
                    }}
                    className={`block p-4 transition-colors hover:bg-slate-50 dark:hover:bg-blue-900/30 relative ${
                      !isRead
                        ? 'bg-blue-50/40 dark:bg-blue-950/20'
                        : 'opacity-85'
                    }`}
                  >
                    {!isRead && (
                      <span className="absolute left-2 top-5 w-1.5 h-1.5 rounded-full bg-[#2511F7] dark:bg-[#FFE600]" />
                    )}

                    <div className="flex items-start gap-3 pl-1">
                      {/* Avatar */}
                      {item.userAvatar ? (
                        <img
                          src={item.userAvatar}
                          alt={item.userName}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-400/40 flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#2511F7] text-[#FFE600] font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {item.userName?.charAt(0) || 'U'}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {getNotificationIcon(item.type, item.message)}
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-snug truncate">
                            {item.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
