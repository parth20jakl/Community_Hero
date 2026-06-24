/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Map, ListFilter, BarChart, PlusCircle, 
  MapPin, AlertCircle, Info, Loader2, Sparkles, CheckSquare, Trophy
} from 'lucide-react';

import { IssueReport, IssueStatus, Contributor } from './types';
import MapView from './components/MapView';
import FeedView from './components/FeedView';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import DetailModal from './components/DetailModal';
import Leaderboard from './components/Leaderboard';

type ActiveTab = 'map' | 'feed' | 'dashboard' | 'leaderboard';

export default function App() {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  
  // Contributor points states
  const [users, setUsers] = useState<Contributor[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Modal tracking states
  const [isReporting, setIsReporting] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Pre-fill reporting coordinates when users click on the active Map View
  const [prefillCoords, setPrefillCoords] = useState<{ lat: number; lng: number; locationName: string } | null>(null);

  // Load all reports from full-stack backend Express server
  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Network Error: Failed to synchronization ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load contributors list:', err);
    }
  };

  useEffect(() => {
    loadReports();
    loadUsers();
  }, []);

  // Upvote / Confirm an active issue
  const handleConfirmIssue = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/confirm`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        // Update local React state with the updated report
        setReports(prev => prev.map(r => r.id === id ? data.report : r));
        loadUsers(); // Refresh rankings!
      }
    } catch (err) {
      console.error('Confirmation handshake failed:', err);
    }
  };

  // Administrative / Moderator manually updating status triggers
  const handleStatusUpdate = async (id: string, status: IssueStatus, note: string) => {
    try {
      const res = await fetch(`/api/reports/${id}/status-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        const data = await res.json();
        // Reactively replace in our active records list
        setReports(prev => prev.map(r => r.id === id ? data.report : r));
      }
    } catch (err) {
      console.error('Status override update failed:', err);
    }
  };

  // Callback when a user interactively clicks on the geographic SF map
  const handleInitiateReportFromMap = (lat: number, lng: number, locationName: string) => {
    setPrefillCoords({ lat, lng, locationName });
    setIsReporting(true);
  };

  // Callback after successful new ticket created
  const handleReportCreated = (newReport: IssueReport) => {
    setReports(prev => {
      const exists = prev.some(r => r.id === newReport.id);
      if (exists) {
        return prev.map(r => r.id === newReport.id ? newReport : r);
      }
      return [newReport, ...prev];
    });
    setIsReporting(false);
    setPrefillCoords(null);
    setActiveTab('feed'); // bounce them to feed so they see their report sitting right at the top!
    loadUsers(); // Refresh rankings and points status!
  };

  // Retrieve current active selected report object
  const activeSelectedIssue = reports.find(r => r.id === selectedIssueId);

  // Find the current registered user in retrieved list
  const currentUser = users.find(u => u.isCurrentUser);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between" id="app-wrapper">
      {/* Platform header - Immersive UI blue-900 theme */}
      <header className="bg-blue-900 text-white py-3.5 px-4 md:px-8 sticky top-0 z-40 shadow-xl border-none" id="platform-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Headline branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-400 rounded-lg flex items-center justify-center font-black text-blue-950 shadow-md">
              CH
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-heading font-bold tracking-tight text-white flex items-center gap-2 leading-none">
                COMMUNITY<span className="font-light opacity-80">HERO</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden md:inline-block">
                  Civic-Tech Active
                </span>
              </h1>
              <p className="text-[10px] md:text-xs text-slate-200/80 font-medium">SF Collaborative Issue Dispatch Ledger</p>
            </div>
          </div>

          {/* Action Row: Switching views & New Ticket button */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* View Switching tabs styled as Immersive pills */}
            <div className="bg-blue-950/40 p-1 rounded-xl flex items-center gap-1 border border-white/10 text-xs md:text-sm font-bold">
              <button
                onClick={() => { setActiveTab('map'); setIsReporting(false); }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'map' ? 'bg-white/10 text-emerald-400 shadow-sm' : 'hover:bg-white/5 text-white/80 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>Map Hub</span>
              </button>
              
              <button
                onClick={() => { setActiveTab('feed'); setIsReporting(false); }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'feed' ? 'bg-white/10 text-emerald-400 shadow-sm' : 'hover:bg-white/5 text-white/80 hover:text-white'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Tickets Feed</span>
              </button>
              
              <button
                onClick={() => { setActiveTab('dashboard'); setIsReporting(false); }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-white/10 text-emerald-400 shadow-sm' : 'hover:bg-white/5 text-white/80 hover:text-white'
                }`}
              >
                <BarChart className="w-3.5 h-3.5" />
                <span>Civic Stats</span>
              </button>

              <button
                onClick={() => { setActiveTab('leaderboard'); setIsReporting(false); }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'leaderboard' ? 'bg-white/10 text-emerald-400 shadow-sm' : 'hover:bg-white/5 text-white/80 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Leaderboard</span>
              </button>
            </div>

            {/* Current user’s point badge shown as top telemetry option */}
            {currentUser && (
              <button
                onClick={() => { setActiveTab('leaderboard'); setIsReporting(false); }}
                type="button"
                className="px-3.5 py-1.5 bg-blue-950/50 hover:bg-blue-950/75 border border-emerald-500/30 text-emerald-300 font-bold text-xs md:text-sm rounded-lg shadow-inner flex items-center gap-1.5 hover:scale-[1.02] cursor-pointer transition-all"
                title="Your citizen score. Click to see Leaderboard."
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/20" />
                <span>{currentUser.points} PTS</span>
              </button>
            )}

            {/* Launch Report form styled as Immersive Emerald trigger */}
            <button
              onClick={() => { setPrefillCoords(null); setIsReporting(true); }}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-blue-950 font-bold text-xs md:text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>NEW REPORT</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Core Viewport Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8" id="platform-viewport-stage">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <Loader2 className="w-12 h-12 text-blue-650 animate-spin mb-4" />
            <h3 className="font-heading font-bold text-slate-700 text-lg">Synchronizing Ledger Data...</h3>
            <p className="text-xs text-slate-400 mt-1">Connecting to Community Hero full-stack ledger base</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* If actively reporting, show ReportForm */}
            {isReporting ? (
              <motion.div
                key="reporting-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <ReportForm
                  initialLat={prefillCoords?.lat}
                  initialLng={prefillCoords?.lng}
                  initialLocationName={prefillCoords?.locationName}
                  onReportCreated={handleReportCreated}
                  onCancel={() => { setIsReporting(false); setPrefillCoords(null); }}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'map' && (
                  <div className="space-y-6">
                    {/* Welcome Notice Banner */}
                    <div className="bg-white border border-slate-200 p-4.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0 mt-0.5">
                          <Sparkles className="w-5 h-5" />
                        </span>
                        <div>
                          <h4 className="font-heading font-bold text-blue-900 text-sm">Interactive Dispatch Center</h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            This live projections map showcases citizen reports regarding potholes, leaks, and hazards. <strong>Click anywhere on the physical layout map</strong> to pin an exact coordinate and file an automated report!
                          </p>
                        </div>
                      </div>
                    </div>

                    <MapView
                      reports={reports}
                      selectedIssueId={selectedIssueId}
                      onSelectIssue={setSelectedIssueId}
                      onInitiateReportAt={handleInitiateReportFromMap}
                    />
                  </div>
                )}

                {activeTab === 'feed' && (
                  <FeedView
                    reports={reports}
                    onSelectIssue={setSelectedIssueId}
                    onConfirmIssue={handleConfirmIssue}
                  />
                )}

                {activeTab === 'dashboard' && (
                  <Dashboard reports={reports} />
                )}

                {activeTab === 'leaderboard' && (
                  <Leaderboard users={users} onRefresh={loadUsers} isLoading={usersLoading} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer credits info */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-xs text-center border-t border-slate-850 mt-12" id="platform-footer">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="p-1.5 bg-blue-600/15 text-blue-400 rounded-lg">
              <Shield className="w-4 h-4" />
            </span>
            <span className="font-black text-white text-sm tracking-wide uppercase">Community Hero Ledger</span>
          </div>
          <p className="max-w-md mx-auto text-slate-500 leading-relaxed">
            Collaborating with active citizens to audit, log, verify, and resolve crucial public works issues for a safer, cleaner city. Fully automated image categorization is facilitated by Gemini AI.
          </p>
          <div className="text-[10px] text-slate-600 border-t border-slate-800/80 pt-4 max-w-sm mx-auto">
            <span>© 2026 Community Hero Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* DETAIL MODAL DRAWER OVERLAY */}
      <AnimatePresence>
        {selectedIssueId && activeSelectedIssue && (
          <DetailModal
            issue={activeSelectedIssue}
            onClose={() => setSelectedIssueId(null)}
            onConfirmIssue={handleConfirmIssue}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
