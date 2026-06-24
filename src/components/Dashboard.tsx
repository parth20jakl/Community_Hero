/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, PieChart, Activity, CheckCircle2, 
  Users, AlertTriangle, ShieldCheck, Clock,
  Sparkles, Loader2, AlertCircle, Compass
} from 'lucide-react';
import { IssueReport, IssueCategory, IssueStatus, Hotspot } from '../types';

interface DashboardProps {
  reports: IssueReport[];
}

export default function Dashboard({ reports }: DashboardProps) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchHotspots = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/hotspots');
        if (!res.ok) {
          throw new Error('Failed to retrieve hotspot intelligence.');
        }
        const data = await res.json();
        if (active) {
          setHotspots(data.hotspots || []);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          console.error(err);
          setError(err.message || 'Failed to analyze hotspots');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchHotspots();
    return () => {
      active = false;
    };
  }, [reports]);

  // Compute Key Performance Indicators
  const stats = useMemo(() => {
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'Resolved').length;
    const active = total - resolved;
    const percentageResolved = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    // Total citizens confirmations
    const confirmations = reports.reduce((sum, r) => sum + r.confirmations, 0);

    // Count by category
    const categories: Record<IssueCategory, { count: number; color: string; emoji: string; label: string }> = {
      pothole: { count: 0, color: '#f97316', emoji: '⚠️', label: 'Road Potholes' },
      streetlight: { count: 0, color: '#3b82f6', emoji: '💡', label: 'Streetlighting' },
      garbage: { count: 0, color: '#10b981', emoji: '🗑️', label: 'Waste Disposal' },
      water_leak: { count: 0, color: '#0ea5e9', emoji: '💧', label: 'Water Leaks' },
      other: { count: 0, color: '#78716c', emoji: '🛠️', label: 'Other Hazards' },
    };

    // Count by status
    const statuses: Record<IssueStatus, number> = {
      Reported: 0,
      Verified: 0,
      'In Progress': 0,
      Resolved: 0,
    };

    reports.forEach(r => {
      if (categories[r.category]) categories[r.category].count++;
      if (typeof statuses[r.status] === 'number') statuses[r.status]++;
    });

    return {
      total,
      resolved,
      active,
      percentageResolved,
      confirmations,
      categories,
      statuses,
    };
  }, [reports]);

  // Compute category chart metrics
  const categoryChartList = useMemo(() => {
    const keys = Object.keys(stats.categories) as IssueCategory[];
    const list = keys.map(key => {
      const data = stats.categories[key];
      return {
        category: key,
        count: data.count,
        color: data.color,
        emoji: data.emoji,
        label: data.label,
        percentage: stats.total > 0 ? Math.round((data.count / stats.total) * 100) : 0,
      };
    });
    // Sort by count descending
    return list.sort((a, b) => b.count - a.count);
  }, [stats]);

  return (
    <div className="space-y-6" id="dashboard-root">
      {/* KPI Grid - Immersive UI borders and headings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Total Tickets</span>
            <span className="text-2xl md:text-3xl font-heading font-extrabold text-blue-950 block">{stats.total}</span>
            <span className="text-[10px] text-slate-500 block font-medium">Logged across SF Ledger</span>
          </div>
          <span className="p-3 bg-blue-50 text-blue-900 rounded-2xl flex-shrink-0">
            <Activity className="w-5 h-5 md:w-6 md:h-6" />
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Resolution Ratio</span>
            <span className="text-2xl md:text-3xl font-heading font-extrabold text-blue-950 block">{stats.percentageResolved}%</span>
            <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.resolved} Resolved</span>
            </span>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Confirms Logged</span>
            <span className="text-2xl md:text-3xl font-heading font-extrabold text-blue-950 block">{stats.confirmations}</span>
            <span className="text-[10px] text-slate-500 block font-medium">Active civic verifications</span>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl flex-shrink-0">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Open Backlog</span>
            <span className="text-2xl md:text-3xl font-heading font-extrabold text-blue-950 block">{stats.active}</span>
            <span className="text-[10px] text-amber-600 block font-semibold">Requiring city intervention</span>
          </div>
          <span className="p-3 bg-orange-50 text-orange-600 rounded-2xl flex-shrink-0">
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
          </span>
        </div>
      </div>

      {/* Recurring Hotspots Alert Section */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4" id="hotspots-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <Sparkles className="w-4 h-4 text-rose-600 animate-pulse fill-rose-600/10" />
            </span>
            <div>
              <h3 className="font-heading font-extrabold text-blue-950 text-sm md:text-base flex items-center gap-2">
                Recurring Civic Hotspots
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  AI Analyzed
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Active geofenced locations with 3+ reports of the exact same category within the last 30 days.
              </p>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono self-start sm:self-center bg-slate-100 px-2.5 py-1 rounded">
            Last analyzed: Just now
          </div>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <span className="text-xs font-semibold animate-pulse">Running Gemini Hotspot Cluster Engine...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Could not analyze hotspots: {error}</span>
          </div>
        ) : hotspots.length === 0 ? (
          <div className="p-6 border border-dashed border-slate-200 bg-white rounded-xl flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-700">All Sectors Clear</h4>
            <p className="text-[11px] text-slate-500 max-w-sm">
              No regions in the city currently exceed the threshold of 3+ matching alerts in the last 30 days. All systems stable.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hotspots.map((hotspot, idx) => {
              const catConfig = stats.categories[hotspot.category] || {
                color: '#64748B',
                emoji: '🚨',
                label: hotspot.category
              };

              let severityBadge = '';
              if (hotspot.severity === 'Critical') {
                severityBadge = 'bg-rose-100 text-rose-700 border-rose-200';
              } else if (hotspot.severity === 'High') {
                severityBadge = 'bg-orange-100 text-orange-700 border-orange-200';
              } else {
                severityBadge = 'bg-amber-100 text-amber-700 border-amber-200';
              }

              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden text-slate-800"
                >
                  {/* Category accent bar */}
                  <div 
                    className="absolute top-0 left-0 bottom-0 w-1"
                    style={{ backgroundColor: catConfig.color }}
                  />

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 pl-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm">{catConfig.emoji}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {catConfig.label} Hotspot
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold border ${severityBadge}`}>
                          {hotspot.severity}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-slate-900 text-sm">
                        {hotspot.areaName}
                      </h4>
                    </div>

                    <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-right flex-shrink-0">
                      <span className="text-xs font-black text-slate-700 block font-mono">
                        {hotspot.reportCount}
                      </span>
                      <span className="text-[8px] text-slate-400 block font-bold uppercase">
                        Active Alerts
                      </span>
                    </div>
                  </div>

                  {/* Explanation description */}
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 pl-4">
                    {hotspot.explanation}
                  </p>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pl-2">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-500 font-mono">
                        {hotspot.reportIds.length} flagged reports:
                      </span>
                      <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[9px]">
                        {hotspot.reportIds.join(', ')}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Dispatch Queued
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Graph Grid (Two columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Custom SVG horizontal chart) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-900" />
            <div>
              <h3 className="font-heading font-bold text-blue-950 text-sm md:text-base">Breakdown by Issue Type</h3>
              <p className="text-xs text-slate-500">Distribution of logged civic hazards</p>
            </div>
          </div>

          <div className="space-y-5">
            {categoryChartList.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{item.emoji}</span>
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold font-mono">
                      {item.count} tickets
                    </span>
                    <span className="text-slate-500 font-mono">{item.percentage}%</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="h-2 w-full bg-slate-50 rounded-full border border-slate-200/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline funnel resolution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-900" />
              <h3 className="font-heading font-bold text-blue-950 text-sm md:text-base">Audit Pipeline Funnel</h3>
            </div>
            <p className="text-xs text-slate-500">Volumetric state trackers of the reporting ledger</p>
          </div>

          {/* Workflow Stage display box */}
          <div className="grid grid-cols-2 gap-4 pb-4">
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center space-y-1">
              <span className="p-1.5 bg-amber-500/10 text-amber-750 rounded-lg inline-block">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-slate-500 block">Reported</span>
              <span className="text-xl font-extrabold text-blue-950 block font-mono">
                {stats.statuses.Reported}
              </span>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center space-y-1">
              <span className="p-1.5 bg-blue-500/10 text-blue-650 rounded-lg inline-block">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-slate-500 block">Verified</span>
              <span className="text-xl font-extrabold text-blue-950 block font-mono">
                {stats.statuses.Verified}
              </span>
            </div>

            <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl text-center space-y-1">
              <span className="p-1.5 bg-violet-500/10 text-violet-650 rounded-lg inline-block">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-slate-500 block">In Progress</span>
              <span className="text-xl font-extrabold text-blue-950 block font-mono">
                {stats.statuses['In Progress']}
              </span>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center space-y-1">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-650 rounded-lg inline-block">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-slate-500 block">Resolved</span>
              <span className="text-xl font-extrabold text-blue-950 block font-mono">
                {stats.statuses.Resolved}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
            <p className="text-[10px] font-bold text-slate-500">
              ⚡ Status Auto-Verifies once community confirmations hit 3+
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
