import React from 'react';
import { Trophy, Medal, Sparkles, RefreshCw } from 'lucide-react';
import { Contributor } from '../types';

interface LeaderboardProps {
  users: Contributor[];
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Leaderboard({ users, onRefresh, isLoading }: LeaderboardProps) {
  // Sort users by points descending
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="leaderboard-panel">
      {/* Header section with Trophy theme */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-blue-950 shadow-md animate-bounce-slow">
            <Trophy className="w-5 h-5 fill-yellow-100" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-white text-base tracking-tight">Civic Leaderboard</h3>
            <p className="text-[11px] text-indigo-200 font-medium">SF's top performing hazard spotters</p>
          </div>
        </div>

        <button 
          onClick={onRefresh}
          disabled={isLoading}
          type="button"
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
          title="Refresh rankings"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Points rules */}
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Acquire municipal reward points!</span>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <span className="flex items-center gap-1"><span className="text-emerald-600 font-black">+5</span> Report Ticket</span>
          <span className="flex items-center gap-1"><span className="text-indigo-600 font-black">+1</span> Support/Upvote</span>
        </div>
      </div>

      {/* List layout */}
      <div className="p-4 divide-y divide-slate-100">
        {sortedUsers.map((user, index) => {
          const isMe = user.isCurrentUser;

          return (
            <div 
              key={user.id} 
              className={`flex items-center justify-between py-3 px-3 rounded-xl transition-all my-1 border ${
                isMe 
                  ? 'bg-emerald-50/60 border-emerald-100/80 shadow-[0_2px_8px_rgba(16,185,129,0.05)]' 
                  : 'hover:bg-slate-50/50 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Ranking badge/number */}
                <div className="w-7 flex-shrink-0 flex items-center justify-center font-heading font-black text-sm">
                  {index === 0 ? (
                    <Medal className="w-5.5 h-5.5 text-yellow-500 fill-yellow-100" />
                  ) : index === 1 ? (
                    <Medal className="w-5.5 h-5.5 text-slate-400 fill-slate-50" />
                  ) : index === 2 ? (
                    <Medal className="w-5.5 h-5.5 text-amber-600 fill-amber-50" />
                  ) : (
                    <span className="text-slate-400 font-bold">#{index + 1}</span>
                  )}
                </div>

                {/* Avatar circle */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs uppercase shadow-sm flex-shrink-0"
                  style={{ backgroundColor: user.avatarColor || '#3B82F6' }}
                >
                  {user.name.substring(0, 1)}
                </div>

                {/* User info */}
                <div className="min-w-0">
                  <h4 className={`text-xs md:text-sm font-bold truncate flex items-center gap-1.5 ${
                    isMe ? 'text-emerald-900 font-black' : 'text-slate-800 font-bold'
                  }`}>
                    <span>{user.name}</span>
                    {isMe && (
                      <span className="bg-emerald-500 text-white font-black text-[8px] uppercase px-1.5 py-0.5 rounded tracking-widest leading-none">
                        YOU
                      </span>
                    )}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {index === 0 
                      ? '🏆 Grand Marshal' 
                      : index === 1 
                        ? '⭐ Elite Inspector' 
                        : index === 2 
                          ? '⚡ Lead Defender' 
                          : 'Civic Citizen'}
                  </span>
                </div>
              </div>

              {/* Points badge */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${
                  isMe 
                    ? 'bg-emerald-500 text-blue-950 border-emerald-400 shadow-sm' 
                    : 'bg-slate-150 text-slate-700 border-slate-200'
                }`}>
                  {user.points} <span className="text-[10px] font-black opacity-85">PTS</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
