'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Crown, Zap, User as UserIcon, Flame } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  username: string;
  role: 'chairman' | 'convener' | 'member';
  avatarUrl: string;
  highScore: number;
  updatedAt: string;
  isCurrentUser: boolean;
}

async function fetchLeaderboard() {
  try {
    const res = await fetch('/api/game/leaderboard', { cache: 'no-store' });
    const data = await res.json();
    if (!data.success) return [];
    return data.data as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function TeamLeaderboard() {
  const { data: leaderboard = [], isLoading, refetch } = useQuery({
    queryKey: ['game-leaderboard'],
    queryFn: fetchLeaderboard,
    refetchInterval: 15000, // Auto refresh every 15s
  });

  const topThree = leaderboard.slice(0, 3);
  const remainingList = leaderboard.slice(3);

  return (
    <div className="bg-white dark:bg-[#0D0647] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Team Scoreboard
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#2511F7] text-[#FFE600]">
                All Members
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Top scores achieved by Nusa Media Crew members
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#12095C] text-slate-600 dark:text-slate-300 hover:text-[#2511F7] dark:hover:text-[#FFE600] font-bold text-xs transition-colors border border-slate-200 dark:border-blue-900/40"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400 animate-pulse">
          Loading Team Leaderboard...
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <Flame className="w-8 h-8 text-amber-500 mx-auto opacity-50" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            No high scores recorded yet!
          </p>
          <p className="text-[11px] text-slate-400">
            Be the first team member to set a record!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {topThree.map((entry) => {
                const isGold = entry.rank === 1;
                const isSilver = entry.rank === 2;
                const isBronze = entry.rank === 3;

                return (
                  <div
                    key={entry.id}
                    className={`relative rounded-2xl p-4 text-center border transition-transform hover:scale-[1.02] flex flex-col items-center justify-between ${
                      isGold
                        ? 'bg-gradient-to-b from-amber-500/15 to-amber-500/5 border-amber-500/40 text-amber-900 dark:text-amber-200'
                        : isSilver
                        ? 'bg-gradient-to-b from-slate-400/15 to-slate-400/5 border-slate-400/40 text-slate-900 dark:text-slate-200'
                        : 'bg-gradient-to-b from-orange-600/15 to-orange-600/5 border-orange-500/40 text-orange-950 dark:text-orange-200'
                    }`}
                  >
                    {/* Crown / Rank Badge */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      {isGold ? (
                        <div className="h-7 w-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                          <Crown className="w-4 h-4 fill-current" />
                        </div>
                      ) : isSilver ? (
                        <div className="h-7 w-7 rounded-full bg-slate-400 text-white flex items-center justify-center shadow-md">
                          <Medal className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-md">
                          <Medal className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5 flex flex-col items-center">
                      {/* Avatar */}
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.name}
                          className={`h-11 w-11 rounded-full object-cover ring-2 ${
                            isGold ? 'ring-amber-500' : isSilver ? 'ring-slate-400' : 'ring-amber-700'
                          }`}
                        />
                      ) : (
                        <div
                          className={`h-11 w-11 rounded-full flex items-center justify-center font-black text-sm text-white shadow-sm ${
                            isGold ? 'bg-amber-500' : isSilver ? 'bg-slate-400' : 'bg-amber-700'
                          }`}
                        >
                          {entry.name.charAt(0)}
                        </div>
                      )}

                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-[120px]">
                          {entry.name} {entry.isCurrentUser && <span className="text-[10px] text-[#2511F7] dark:text-[#FFE600] font-black">(You)</span>}
                        </h4>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          {entry.role}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="mt-3 px-3 py-1 rounded-full bg-white dark:bg-[#07022E] border border-slate-200 dark:border-blue-900/40 text-xs font-black text-amber-500 shadow-sm flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{entry.highScore} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard Table List (Rank 4+) */}
          {remainingList.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
                Rankings
              </h3>
              <div className="space-y-1.5">
                {remainingList.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                      entry.isCurrentUser
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800/60'
                        : 'bg-slate-50/60 dark:bg-[#12095C]/40 border-slate-100 dark:border-blue-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-black text-slate-400">
                        #{entry.rank}
                      </span>

                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.name}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-blue-900"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[#2511F7] text-[#FFE600] flex items-center justify-center font-black text-xs">
                          {entry.name.charAt(0)}
                        </div>
                      )}

                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#2511F7] text-[#FFE600]">
                              You
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                          {entry.role}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-black text-[#2511F7] dark:text-[#FFE600] bg-white dark:bg-[#07022E] px-3 py-1 rounded-full border border-slate-200/60 dark:border-blue-900/40 shadow-sm">
                      {entry.highScore} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
