/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Crosshair, Filter, Sparkles, Navigation, Info, AlertTriangle } from 'lucide-react';
import { IssueReport, IssueCategory, IssueStatus } from '../types';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';

interface MapViewProps {
  reports: IssueReport[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  onInitiateReportAt: (lat: number, lng: number, locationName: string) => void;
}

// Retrieve the Google Maps API Key securely from the server env or bundle vars
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Default center: San Francisco Civic Center
const SF_CENTER = { lat: 37.7749, lng: -122.4194 };

/**
 * Inner component with direct map context access via `@vis.gl/react-google-maps` hooks.
 */
function GoogleMapImplementation({
  reports,
  selectedIssueId,
  onSelectIssue,
  onInitiateReportAt,
  userLocation,
  isLocating,
  locateUser,
  getStatusColor,
}: {
  reports: IssueReport[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  onInitiateReportAt: (lat: number, lng: number, locationName: string) => void;
  userLocation: { lat: number; lng: number } | null;
  isLocating: boolean;
  locateUser: () => void;
  getStatusColor: (status: IssueStatus) => string;
}) {
  const map = useMap();
  const [hoveredReport, setHoveredReport] = useState<IssueReport | null>(null);

  // Smoothly pan the viewport to the user's current GPS location on update or manual target triggers
  useEffect(() => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(14);
    }
  }, [map, userLocation]);

  // Center on any active sidebar/feed report selected programmatically by the user
  useEffect(() => {
    if (map && selectedIssueId) {
      const selected = reports.find((r) => r.id === selectedIssueId);
      if (selected) {
        map.panTo({ lat: selected.latitude, lng: selected.longitude });
        map.setZoom(15);
      }
    }
  }, [map, selectedIssueId, reports]);

  const handleMapClick = (e: any) => {
    if (!e.detail.latLng) return;
    const lat = typeof e.detail.latLng.lat === 'function' ? e.detail.latLng.lat() : e.detail.latLng.lat;
    const lng = typeof e.detail.latLng.lng === 'function' ? e.detail.latLng.lng() : e.detail.latLng.lng;

    // Estimate San Francisco local districts based on grid quadrants
    let neighborhood = 'SF Neighborhood';
    if (lat > 37.7950 && lng < -122.4505) neighborhood = 'Marina / Presidio';
    else if (lat > 37.7900 && lng > -122.4205) neighborhood = 'Financial District';
    else if (lat < 37.7650 && lng > -122.4305) neighborhood = 'Mission District';
    else if (lat < 37.7700 && lng < -122.4505) neighborhood = 'Sunset / Golden Gate';
    else if (lng < -122.4805) neighborhood = 'Richmond / Ocean Beach';
    else if (lat > 37.7650 && lat < 37.7850 && lng > -122.4355 && lng < -122.3955) neighborhood = 'SOMA Area';
    else if (lat < 37.7620 && lng < -122.4305 && lng > -122.4505) neighborhood = 'Castro / Twin Peaks';

    const locationName = `${neighborhood} (Approx. ${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    onInitiateReportAt(lat, lng, locationName);
  };

  return (
    <div className="relative w-full h-[550px] bg-slate-900 overflow-hidden" style={{ minHeight: '520px' }}>
      <Map
        defaultCenter={SF_CENTER}
        defaultZoom={12}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Pulsating user GPS locator coordinate indicator */}
        {userLocation && (
          <AdvancedMarker position={userLocation} title="Your Current Location">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-65"></span>
              <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-blue-600 border-2 border-white shadow-xl"></span>
            </div>
          </AdvancedMarker>
        )}

        {/* Dynamic Ticket Markers on Maps Grid */}
        {reports.map((report) => {
          const isSelected = selectedIssueId === report.id;
          const color = getStatusColor(report.status);

          return (
            <AdvancedMarker
              key={report.id}
              position={{ lat: report.latitude, lng: report.longitude }}
              title={report.title}
              onClick={() => {
                onSelectIssue(report.id);
              }}
              onMouseEnter={() => setHoveredReport(report)}
              onMouseLeave={() => setHoveredReport(null)}
            >
              <Pin
                background={color}
                borderColor="#ffffff"
                glyphColor="#ffffff"
                scale={isSelected ? 1.3 : 0.95}
              />
            </AdvancedMarker>
          );
        })}

        {/* Hover info popover card */}
        {hoveredReport && (
          <InfoWindow
            position={{ lat: hoveredReport.latitude, lng: hoveredReport.longitude }}
            onCloseClick={() => setHoveredReport(null)}
          >
            <div className="p-1 max-w-xs text-slate-800">
              <div className="flex items-start gap-2.5">
                <img
                  src={hoveredReport.imageUrl}
                  alt={hoveredReport.title}
                  className="w-10 h-10 object-cover rounded border border-slate-200 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: getStatusColor(hoveredReport.status) }}
                    >
                      {hoveredReport.status}
                    </span>
                    <span className="text-[9px] text-slate-500 capitalize">{hoveredReport.category.replace('_', ' ')}</span>
                    {hoveredReport.priority && (
                      <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        hoveredReport.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : hoveredReport.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {hoveredReport.priority}
                      </span>
                    )}
                  </div>
                  <h4 className="font-heading font-bold text-slate-900 text-xs mt-1 truncate">{hoveredReport.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{hoveredReport.locationName}</p>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* Floating GPS manual locate button */}
      <button
        type="button"
        disabled={isLocating}
        onClick={locateUser}
        className="absolute top-4 right-4 bg-white hover:bg-slate-50 text-slate-850 px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-bold text-xs"
        title="Find My Location"
      >
        <Navigation className={`w-3.5 h-3.5 text-emerald-500 stroke-[2.5] ${isLocating ? 'animate-spin' : ''}`} />
        <span>{isLocating ? 'TRACING GPS...' : 'LOCATE ME'}</span>
      </button>

      {/* Map Guidelines Panel */}
      <div className="absolute bottom-4 left-4 bg-slate-900/95 text-white backdrop-blur px-3 py-2.5 rounded-xl shadow-md border border-slate-800 flex items-center gap-2 text-[10px] sm:text-xs font-bold leading-none pointer-events-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Click coordinates on Google Map to submit a civic safety file</span>
      </div>
    </div>
  );
}

export default function MapView({
  reports,
  selectedIssueId,
  onSelectIssue,
  onInitiateReportAt,
}: MapViewProps) {
  const [filterCategory, setFilterCategory] = useState<IssueCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filters mapping
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchCat = filterCategory === 'all' || r.category === filterCategory;
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchCat && matchStatus;
    });
  }, [reports, filterCategory, filterStatus]);

  // Request high accuracy GPS on mount
  useEffect(() => {
    locateUser();
  }, []);

  const locateUser = () => {
    setIsLocating(true);
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setIsLocating(false);
        },
        (error) => {
          console.warn("Could not retrieve precise locator coordinates:", error);
          setLocationError("Navigator GPS blocked or unavailable in standard sandboxed environment. Defaulting coordinate view.");
          setUserLocation(SF_CENTER);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setLocationError("Geolocation permissions not offered by current browser platform.");
      setUserLocation(SF_CENTER);
      setIsLocating(false);
    }
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'Reported':
        return '#f59e0b'; // Amber-500
      case 'Verified':
        return '#3b82f6'; // Blue-500
      case 'In Progress':
        return '#8b5cf6'; // Violet-500
      case 'Resolved':
        return '#10b981'; // Emerald-500
      default:
        return '#64748b';
    }
  };

  // Warning screen if no Google Maps API key persists
  if (!hasValidKey) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto my-6 text-center" id="gmp-key-splash">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
            <MapPin className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-xl font-heading font-black text-blue-950">Google Maps Platform Key Required</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Unlock a fully responsive, interactive Google Map to project, filter, and navigate real San Francisco citizen reports instantly.
          </p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3.5 text-xs text-slate-600 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-blue-900">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Simple 2-Step Setup Ledger:
            </p>
            <div className="space-y-2">
              <p>
                <strong>1. Acquire an API Key:</strong> Get your own standard Google Maps Platform key from the official cloud console:
                <br />
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline font-bold"
                >
                  console.cloud.google.com/google/maps-apis/start
                </a>
              </p>
              <p>
                <strong>2. Add as AI Studio Secret:</strong> 
                <br />
                Open the <strong>Settings</strong> button (⚙️ gear icon, top-right corner) → click <strong>Secrets</strong> → add a secret with the key name <code className="bg-slate-100 rounded border border-slate-300 px-1 py-0.5 text-red-600 font-mono font-bold">GOOGLE_MAPS_PLATFORM_KEY</code> → paste your API key as the value.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            ⚡ The application will automatically compile and hot-reload upon saving your secret.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" id="map-view-container">
      {/* Immersive Controls Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-blue-50 text-blue-900 rounded-lg">
            <Crosshair className="w-5 h-5 animate-pulse text-emerald-600" />
          </span>
          <div>
            <h3 className="font-heading font-bold text-blue-950 text-sm md:text-base">Interactive Civic Dispatch Map</h3>
            <p className="text-xs text-slate-500">Official Google Maps Platform projection overlays highlighting active safety reports</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="outline-none bg-transparent font-semibold text-slate-600 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Potholes 🕳️</option>
              <option value="streetlight">Streetlights 💡</option>
              <option value="garbage">Garbage 🗑️</option>
              <option value="water_leak">Water Leaks 💧</option>
              <option value="other">Other Hazards ⚠️</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="outline-none bg-transparent font-semibold text-slate-600 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Verified">Verified</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {locationError && (
        <div className="mx-4 my-2 p-3 bg-blue-50 border border-blue-100 text-blue-800 text-[11px] rounded-xl flex items-center gap-2 font-medium">
          <Info className="w-3.5 h-3.5 flex-shrink-0 text-blue-700" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Google API Core Provider Wrapper */}
      <APIProvider apiKey={API_KEY} version="weekly">
        <GoogleMapImplementation
          reports={filteredReports}
          selectedIssueId={selectedIssueId}
          onSelectIssue={onSelectIssue}
          onInitiateReportAt={onInitiateReportAt}
          userLocation={userLocation}
          isLocating={isLocating}
          locateUser={locateUser}
          getStatusColor={getStatusColor}
        />
      </APIProvider>

      {/* Legend Indicators */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-6 flex-wrap text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100"></span>
          <span>Reported</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100"></span>
          <span>Verified</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-violet-500 ring-4 ring-violet-100"></span>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
          <span>Resolved</span>
        </div>
      </div>
    </div>
  );
}
