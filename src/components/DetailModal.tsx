/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, MapPin, ThumbsUp, Calendar, AlertOctagon, ShieldCheck, 
  Wrench, CheckCircle2, ArrowRight, Loader2, Plus, AlertCircle 
} from 'lucide-react';
import { IssueReport, IssueStatus, IssueCategory, TimelineEvent } from '../types';

interface DetailModalProps {
  issue: IssueReport;
  onClose: () => void;
  onConfirmIssue: (issueId: string) => void;
  onStatusUpdate: (issueId: string, status: IssueStatus, note: string) => Promise<void>;
}

export default function DetailModal({
  issue,
  onClose,
  onConfirmIssue,
  onStatusUpdate,
}: DetailModalProps) {
  // Moderator control panel states
  const [modStatus, setModStatus] = useState<IssueStatus>(issue.status);
  const [modNote, setModNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Styling helpers
  const getCategoryTheme = (cat: IssueCategory) => {
    switch (cat) {
      case 'pothole': return { icon: '⚠️', label: 'Pothole Hazard' };
      case 'streetlight': return { icon: '💡', label: 'Broken Streetlight' };
      case 'garbage': return { icon: '🗑️', label: 'Garbage Accumulation' };
      case 'water_leak': return { icon: '💧', label: 'Water Infrastructure Leak' };
      default: return { icon: '🛠️', label: 'General Civic Hazard' };
    }
  };

  const getTimelineColors = (status: IssueStatus) => {
    switch (status) {
      case 'Reported': 
        return { 
          bg: 'bg-amber-100 text-amber-600 border-amber-200', 
          icon: <AlertOctagon className="w-4 h-4" />,
          label: 'Issue Logged' 
        };
      case 'Verified': 
        return { 
          bg: 'bg-blue-100 text-blue-600 border-blue-200', 
          icon: <ShieldCheck className="w-4 h-4" />,
          label: 'Audit Verified' 
        };
      case 'In Progress': 
        return { 
          bg: 'bg-violet-100 text-violet-600 border-violet-200', 
          icon: <Wrench className="w-4 h-4" />,
          label: 'Crew Dispatched' 
        };
      case 'Resolved': 
        return { 
          bg: 'bg-emerald-100 text-emerald-600 border-emerald-200', 
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: 'Issue Resolved' 
        };
    }
  };

  const currentCategory = getCategoryTheme(issue.category);

  // Submit moderator administrative status update
  const handleModUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    
    try {
      await onStatusUpdate(issue.id, modStatus, modNote || `Administrative milestone: Status transitioned to ${modStatus}.`);
      setModNote(''); // clear message field on success
    } catch (err) {
      console.error(err);
      alert('Failed to execute administrative update.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Convert ISO Date to Readable Text
  const formatFullDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Recent Timestamp';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 overflow-y-auto" id="detail-modal-root">
      {/* Container Slide-up dialog box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Left Side: Photo preview details & map coordinate */}
        <div className="w-full md:w-1/2 bg-slate-50 relative border-r border-slate-100 h-[300px] md:h-auto overflow-hidden">
          <img 
            src={issue.imageUrl} 
            alt={issue.title}
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />

          {/* Floaters */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/95 backdrop-blur text-slate-800 shadow-md border border-slate-200/50 flex items-center gap-1.5 self-start">
              <span>{currentCategory.icon}</span> <span>{currentCategory.label}</span>
            </span>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-2.5 transition-colors cursor-pointer shadow-md z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Bottom GPS Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-white text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="truncate">{issue.locationName}</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-300 mt-1.5 font-mono">
              <span>LAT: {issue.latitude.toFixed(6)}</span>
              <span>•</span>
              <span>LNG: {issue.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Metadata Scroll, Timeline events, Administrator override widget */}
        <div className="w-full md:w-1/2 flex flex-col h-[60vh] md:h-[80vh]">
          {/* Scrollable Content wrapper */}
          <div className="p-6 md:p-8 overflow-y-auto flex-grow space-y-6">
            {/* Header issue parameters */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Citizen Ticket Info</span>
                <span>•</span>
                <span>ID: {issue.id}</span>
              </div>
              <h3 className="text-xl md:text-2xl font-heading font-extrabold text-blue-950 leading-tight">
                {issue.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium font-serif italic">
                Reported on {formatFullDate(issue.createdAt)}
              </p>
            </div>

            {/* Description details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Statement of Facts</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {issue.description}
              </p>
            </div>

            {/* Gemini Municipal Triage Evaluation */}
            {issue.priority && (
              <div className={`p-4 rounded-xl border ${
                issue.priority === 'High'
                  ? 'bg-rose-50/55 border-rose-100 text-rose-950'
                  : issue.priority === 'Medium'
                    ? 'bg-amber-50/55 border-amber-200/80 text-amber-950'
                    : 'bg-slate-50/80 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <span>Triage Evaluation:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest ${
                    issue.priority === 'High'
                      ? 'bg-rose-100 text-rose-800'
                      : issue.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-800'
                  }`}>{issue.priority} PRIORITY</span>
                </div>
                {issue.priorityExplanation && (
                  <p className="text-xs mt-2 italic font-semibold leading-relaxed text-slate-600">
                    &ldquo;{issue.priorityExplanation}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* UPVOTE COUNT BUTTON BLOCK */}
            <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-100 flex items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-bold text-emerald-950">Support Verification</h5>
                <p className="text-[11px] text-slate-600 mt-0.5">Confirming reports helps municipal agencies prioritize fixes faster.</p>
              </div>
              <button 
                type="button" 
                onClick={() => onConfirmIssue(issue.id)}
                className={`py-2 px-4 shadow-md hover:shadow-lg rounded-xl text-xs font-black flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
                  issue.status === 'Resolved'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-none shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-blue-950 hover:scale-105'
                }`}
                disabled={issue.status === 'Resolved'}
              >
                <ThumbsUp className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Confirm ({issue.confirmations})</span>
              </button>
            </div>

            {/* TIMELINE SECTION */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Milestone Audit Trail</h4>
              
              <div className="relative pl-6 border-l-2 border-slate-100/80 space-y-5">
                {issue.timeline.map((event, idx) => {
                  const meta = getTimelineColors(event.status);
                  return (
                    <div key={idx} className="relative">
                      {/* Left icon bullet */}
                      <span className={`absolute -left-[35px] top-0 p-1.5 rounded-full border shadow-sm bg-white ${meta.bg}`}>
                        {meta.icon}
                      </span>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-700">{meta.label}</span>
                          <span className="text-[10px] text-slate-400 font-medium font-serif italic">
                            {new Date(event.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/20">
                          {event.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ADMINISTRATIVE OVERRIDE PANEL FOR DEVELOPMENT SANDBOX testing */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2 bg-slate-100/50 px-3 py-2 rounded-xl border border-slate-200/50 text-slate-700">
                <AlertCircle className="w-4 h-4 text-violet-600 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Municipal Testing Console</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Simulate dispatcher updates. Use these administrative blocks to manually transition local status.
              </p>

              <form onSubmit={handleModUpdate} className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                {/* Selector Status */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Target dispatch Status</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Reported', 'Verified', 'In Progress', 'Resolved'] as IssueStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setModStatus(st)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                          modStatus === st
                            ? 'bg-violet-600 text-white shadow-sm font-extrabold'
                            : 'bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-600'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Update message */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Milestone/Dispatch Note (Optional)</span>
                  <input
                    type="text"
                    value={modNote}
                    onChange={(e) => setModNote(e.target.value)}
                    placeholder="e.g. Cleared blocked tree limb using local crane crew..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400"
                  />
                </div>

                {/* Submit button override */}
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-750 font-bold text-white text-xs rounded-lg shadow-sm hover:shadow active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-3 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Commit Administrative Milestone</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Fixed Action row */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              Close Ticket
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
