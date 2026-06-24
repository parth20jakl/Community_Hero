/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, ThumbsUp, Calendar, ChevronRight, Check, AlertTriangle, Eye } from 'lucide-react';
import { IssueReport, IssueCategory, IssueStatus } from '../types';

interface FeedViewProps {
  reports: IssueReport[];
  onSelectIssue: (issueId: string) => void;
  onConfirmIssue: (issueId: string) => void;
}

export default function FeedView({
  reports,
  onSelectIssue,
  onConfirmIssue,
}: FeedViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'confirmations'>('newest');

  // Filter and sort combined lists
  const filteredAndSortedReports = useMemo(() => {
    const filtered = reports.filter((r) => {
      const matchesSearch = 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.locationName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });

    const getPriorityVal = (p?: 'Low' | 'Medium' | 'High') => {
      if (p === 'High') return 3;
      if (p === 'Medium') return 2;
      return 1;
    };

    return [...filtered].sort((a, b) => {
      if (sortBy === 'priority') {
        const valA = getPriorityVal(a.priority);
        const valB = getPriorityVal(b.priority);
        if (valB !== valA) return valB - valA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'confirmations') {
        return b.confirmations - a.confirmations;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reports, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Styling helper
  const getCategoryDetails = (cat: IssueCategory) => {
    switch (cat) {
      case 'pothole': return { emoji: '⚠️', label: 'Pothole', bg: 'bg-orange-50 text-orange-700 border-orange-100' };
      case 'streetlight': return { emoji: '💡', label: 'Streetlight', bg: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'garbage': return { emoji: '🗑️', label: 'Garbage Heap', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'water_leak': return { emoji: '💧', label: 'Water Leak', bg: 'bg-sky-50 text-sky-700 border-sky-100' };
      default: return { emoji: '🛠️', label: 'General Hazard', bg: 'bg-slate-50 text-slate-700 border-slate-100' };
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'Reported': 
        return { 
          bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', 
          dot: 'bg-amber-500',
          label: 'Reported' 
        };
      case 'Verified': 
        return { 
          bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20', 
          dot: 'bg-blue-500',
          label: 'Community Verified' 
        };
      case 'In Progress': 
        return { 
          bg: 'bg-violet-500/10 text-violet-600 border-violet-500/20', 
          dot: 'bg-violet-500',
          label: 'In Progress' 
        };
      case 'Resolved': 
        return { 
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', 
          dot: 'bg-emerald-500',
          label: 'Resolved' 
        };
    }
  };

  // Human date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6" id="feed-view-root">
      {/* Search & Tabs Controls - Immersive UI solid styling */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by title, neighborhood street, or issue description..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-900 focus:bg-white rounded-xl text-sm font-semibold outline-none transition-all text-slate-700"
          />
        </div>

        {/* Categories and Status Filters Grid */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Category Pills - using deep blue and active themes */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedCategory('pothole')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                selectedCategory === 'pothole'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>⚠️</span> <span>Potholes</span>
            </button>
            <button
              onClick={() => setSelectedCategory('streetlight')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                selectedCategory === 'streetlight'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>💡</span> <span>Streetlights</span>
            </button>
            <button
              onClick={() => setSelectedCategory('garbage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                selectedCategory === 'garbage'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>🗑️</span> <span>Garbage</span>
            </button>
            <button
              onClick={() => setSelectedCategory('water_leak')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                selectedCategory === 'water_leak'
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>💧</span> <span>Water Leaks</span>
            </button>
          </div>

          {/* Status & Sort Select controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer outline-none hover:border-slate-300"
              >
                <option value="newest">Recent Reports First</option>
                <option value="priority">🔥 High Priority First</option>
                <option value="confirmations">👍 Most Confirmed Records</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow Stage:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer outline-none hover:border-slate-300"
              >
                <option value="all">Unfiltered (All Stages)</option>
                <option value="Reported">Reported</option>
                <option value="Verified">Verified</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Yield total count indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
        <span>Displaying {filteredAndSortedReports.length} results</span>
        {filteredAndSortedReports.length === 0 && <span className="text-red-500">No matches found</span>}
      </div>

      {/* Grid List cards */}
      <motion.div 
        layout 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredAndSortedReports.map((report) => {
            const cat = getCategoryDetails(report.category);
            const badge = getStatusBadge(report.status);

            return (
              <motion.article
                layout
                key={report.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-500/25 shadow-sm hover:shadow-md transition-all flex flex-col group h-full"
              >
                {/* Product Header preview */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={report.imageUrl}
                    alt={report.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Category Pill overlay */}
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 shadow-sm bg-white/95 backdrop-blur text-slate-700 border-slate-200/50`}>
                      <span>{cat.emoji}</span> <span>{cat.label}</span>
                    </span>
                  </div>

                  {/* Status Indicator overlay */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-sm bg-white/95 backdrop-blur ${badge.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(report.createdAt)}</span>
                        <span>•</span>
                        <span>ID: {report.id}</span>
                      </div>
                      {report.priority && (
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                          report.priority === 'High'
                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                            : report.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`} title={report.priorityExplanation}>
                          {report.priority === 'High' && <span className="text-[10px]">🔥</span>}
                          <span>{report.priority} Priority</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-heading font-extrabold text-blue-950 text-base leading-snug group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {report.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  {/* Location label */}
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-900 flex-shrink-0" />
                    <span className="truncate">{report.locationName}</span>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-2">
                    {/* Upvote button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid triggering details
                        onConfirmIssue(report.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all outline-none cursor-pointer ${
                        report.status === 'Resolved'
                          ? 'bg-slate-150 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-100 hover:scale-105 active:scale-95'
                      }`}
                      disabled={report.status === 'Resolved'}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Confirm ({report.confirmations})</span>
                    </button>

                    {/* View details call of action */}
                    <button
                      type="button"
                      onClick={() => onSelectIssue(report.id)}
                      className="text-xs font-bold text-slate-500 hover:text-blue-900 flex items-center gap-1 outline-none transition-colors cursor-pointer"
                    >
                      <span>Explore Ticket</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom thresholds progress bar for Reported -> Verified transition */}
                {report.status === 'Reported' && (
                  <div className="px-5 pb-3">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((report.confirmations / 3) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                      <span>Threshold for Verification</span>
                      <span>{report.confirmations}/3 Alerts</span>
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
