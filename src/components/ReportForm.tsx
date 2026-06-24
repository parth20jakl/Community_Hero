/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Loader2, Sparkles, AlertCircle, RefreshCw, CheckCircle, Upload, Navigation, Map as MapIcon, Crosshair } from 'lucide-react';
import { IssueCategory, ClassificationResult } from '../types';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface ReportFormProps {
  initialLat?: number;
  initialLng?: number;
  initialLocationName?: string;
  onReportCreated: (newReport: any) => void;
  onCancel: () => void;
}

// Retrieve Google Maps API key
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Default center: San Francisco Civic Center
const SF_CENTER = { lat: 37.7749, lng: -122.4194 };

// Boundary limits for local fallback SVG board projection
const SF_BOUNDS = {
  minLat: 37.7000,
  maxLat: 37.8200,
  minLng: -122.5205,
  maxLng: -122.3550,
};

// Map local district names based on grid coordinates
const getSFNeighborhoodName = (latitude: number, longitude: number) => {
  if (latitude > 37.7950 && longitude < -122.4505) return 'Marina / Presidio';
  if (latitude > 37.7900 && longitude > -122.4205) return 'Financial District';
  if (latitude < 37.7650 && longitude > -122.4305) return 'Mission District';
  if (latitude < 37.7700 && longitude < -122.4505) return 'Sunset / Golden Gate';
  if (longitude < -122.4805) return 'Richmond / Ocean Beach';
  if (latitude > 37.7650 && latitude < 37.7850 && longitude > -122.4355 && longitude < -122.3955) return 'SOMA Area';
  if (latitude < 37.7620 && longitude < -122.4305 && longitude > -122.4505) return 'Castro / Twin Peaks';
  return 'SF Civic Center Corridor';
};

export default function ReportForm({
  initialLat,
  initialLng,
  initialLocationName,
  onReportCreated,
  onCancel,
}: ReportFormProps) {
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IssueCategory>('other');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<number>(initialLat || SF_CENTER.lat);
  const [lng, setLng] = useState<number>(initialLng || SF_CENTER.lng);
  const [locationName, setLocationName] = useState(initialLocationName || 'San Francisco, CA');
  
  // Geolocation capturing
  const [isCapturingGeo, setIsCapturingGeo] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // SVG coordinate board hover helper
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const fallbackMapRef = useRef<SVGSVGElement>(null);

  // AI Classification result
  const [aiResult, setAiResult] = useState<(ClassificationResult & { isSimulated?: boolean }) | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Duplicate check states
  const [duplicateReport, setDuplicateReport] = useState<any | null>(null);
  const [duplicateReason, setDuplicateReason] = useState<string>('');
  const [isUpvoting, setIsUpvoting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ image?: string; title?: string; description?: string }>({});

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (val.trim()) {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (val.trim()) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  // Update location coords state and human address helper
  const handleLocationSelect = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    const neighborhood = getSFNeighborhoodName(newLat, newLng);
    setLocationName(`${neighborhood} (Approx. ${newLat.toFixed(4)}, ${newLng.toFixed(4)})`);
  };

  // Sync with prop changes (e.g. from clicking on the primary map hub tab)
  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
    }
    if (initialLocationName) {
      setLocationName(initialLocationName);
    }
  }, [initialLat, initialLng, initialLocationName]);

  // Request browser geolocation on load if not pre-seeded by clicking on the Map tab
  useEffect(() => {
    if (!initialLat && !initialLng) {
      captureGeolocation();
    }
  }, []);

  const captureGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS location is not supported by your current browser.');
      return;
    }

    setIsCapturingGeo(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        handleLocationSelect(userLat, userLng);
        setIsCapturingGeo(false);
      },
      (error) => {
        console.warn('Individual geolocation capture timed out:', error);
        // Fallback to coordinates
        const rLat = 37.74 + Math.random() * 0.05;
        const rLng = -122.46 + Math.random() * 0.06;
        handleLocationSelect(rLat, rLng);
        setGeoError('GPS handshake was blocked/timed out. Recentered coordinate selection map.');
        setIsCapturingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Convert uploaded image file to payload base64
  const processImageFile = (file: File) => {
    if (!file) return;
    setImageName(file.name);
    setErrors(prev => ({ ...prev, image: undefined }));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Str = e.target?.result as string;
      setImage(base64Str);
      // Trigger Gemini classification analysis immediately
      triggerAiClassification(base64Str, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const triggerAiClassification = async (base64Image: string, fileName: string) => {
    setIsScanning(true);
    setAiResult(null);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          fileName,
          descriptionInput: description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to query classifier service');
      }

      const result = await response.json();
      setAiResult(result);
      
      // Load pre-populated values from Gemini API
      setCategory(result.category);
      if (result.title) {
        setTitle(result.title);
        setErrors(prev => ({ ...prev, title: undefined }));
      }
      if (result.description) {
        setDescription(result.description);
        setErrors(prev => ({ ...prev, description: undefined }));
      }
    } catch (err) {
      console.error('AI Classification API failure:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleForceSubmit = async () => {
    setIsSubmitting(true);
    setDuplicateReport(null);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title,
          description,
          latitude: lat,
          longitude: lng,
          locationName,
          imageUrl: image,
          predictedCategory: aiResult?.category || null,
          confidence: aiResult?.confidence || null,
          ignoreDuplicate: true, // Tell backend to bypass check!
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish report ticket.');
      }

      const payload = await response.json();
      onReportCreated(payload.report);
    } catch (err) {
      console.error(err);
      alert('Failed to transmit report. Please check server availability and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvoteExisting = async () => {
    if (!duplicateReport) return;
    setIsUpvoting(true);
    try {
      const res = await fetch(`/api/reports/${duplicateReport.id}/confirm`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Thank you! You have successfully upvoted the existing ticket (ID: ${duplicateReport.id}). Upvoting helps avoid system duplications and escalates issues faster.`);
        onReportCreated(data.report); // Bounce user back to feed and update state!
      } else {
        alert('Could not process the upvote. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while processing upvote.');
    } finally {
      setIsUpvoting(false);
      setDuplicateReport(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core custom validation
    const newErrors: { image?: string; title?: string; description?: string } = {};
    if (!image) {
      newErrors.image = 'An evidence photo is required. Please upload or drag and drop an image of the hazard.';
    }
    if (!title.trim()) {
      newErrors.title = 'A brief title is required to publish this ticket.';
    }
    if (!description.trim()) {
      newErrors.description = 'A detailed description is required so response crews can evaluate the safety risk.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const el = document.getElementById('report-form-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title,
          description,
          latitude: lat,
          longitude: lng,
          locationName,
          imageUrl: image,
          predictedCategory: aiResult?.category || null,
          confidence: aiResult?.confidence || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish report ticket.');
      }

      const payload = await response.json();
      
      if (payload.isDuplicate) {
        setDuplicateReport(payload.duplicateOf);
        setDuplicateReason(payload.reason);
      } else {
        onReportCreated(payload.report);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to transmit report. Please check server availability and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SVG Helper projections for local visual mockboard
  const projectX = (longitude: number) => {
    return ((longitude - SF_BOUNDS.minLng) / (SF_BOUNDS.maxLng - SF_BOUNDS.minLng)) * 100;
  };

  const projectY = (latitude: number) => {
    return (1 - (latitude - SF_BOUNDS.minLat) / (SF_BOUNDS.maxLat - SF_BOUNDS.minLat)) * 100;
  };

  const handleFallbackMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!fallbackMapRef.current) return;
    const rect = fallbackMapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pctX = clickX / rect.width;
    const pctY = 1 - (clickY / rect.height);

    const clickLng = SF_BOUNDS.minLng + pctX * (SF_BOUNDS.maxLng - SF_BOUNDS.minLng);
    const clickLat = SF_BOUNDS.minLat + pctY * (SF_BOUNDS.maxLat - SF_BOUNDS.minLat);

    handleLocationSelect(clickLat, clickLng);
  };

  const handleFallbackMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!fallbackMapRef.current) return;
    const rect = fallbackMapRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 max-w-4xl mx-auto" id="report-form-container">
      {/* Visual Form Head header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-blue-950 flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-emerald-500 animate-pulse" />
            File a New Civic Report
          </h2>
          <p className="text-xs text-slate-500 mt-1">Upload photogrammetric proof, Gemini AI will auto-categorize, and pin on the map below</p>
        </div>
        <button 
          onClick={onCancel}
          type="button" 
          className="text-xs font-black px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Comprehensive validation error overview summary card */}
        {Object.keys(errors).length > 0 && (
          <div className="col-span-1 md:col-span-2 bg-rose-50 border border-rose-200 rounded-xl p-4.5 flex items-start gap-3.5 text-rose-900 shadow-sm" id="form-validation-summary">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-heading font-bold text-sm">Please correct the following errors before submitting:</h4>
              <ul className="list-disc list-inside mt-1.5 text-xs space-y-1 font-medium text-rose-800">
                {errors.image && <li>{errors.image}</li>}
                {errors.title && <li>{errors.title}</li>}
                {errors.description && <li>{errors.description}</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Column 1: Evidence Materials (Photo Upload + Interactive Map Location Selector) */}
        <div className="space-y-6" id="evidence-visuals-column">
          
          {/* Section A: Photo evidence upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <span>Step 1: Upload Proof Photo</span>
              <span className="text-red-500 font-bold">*</span>
            </label>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            {!image ? (
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragActive 
                    ? 'border-emerald-500 bg-emerald-55/20' 
                    : errors.image 
                      ? 'border-rose-500 bg-rose-50/10 hover:bg-rose-50/20' 
                      : 'border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-slate-50/50'
                }`}
              >
                <Upload className={`w-10 h-10 mb-3 ${errors.image ? 'text-rose-400' : 'text-slate-400'}`} />
                <p className="text-sm font-semibold text-slate-700">Drag & Drop photograph here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse local folders</p>
                <p className="text-[10px] text-slate-400 bg-slate-200 px-2.5 py-0.5 rounded-full mt-4">JPG, PNG up to 10MB</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-100 group shadow-sm">
                <img 
                  src={image} 
                  alt="Uploaded evidence" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />

                {/* Laser scan animation overlay */}
                <AnimatePresence>
                  {isScanning && (
                    <motion.div 
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="absolute left-0 right-0 h-1.5 bg-emerald-500 shadow-xl shadow-emerald-500/80 z-10"
                    />
                  )}
                </AnimatePresence>

                {/* Loading scanning blur */}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <span className="text-xs font-bold tracking-wide mt-2 animate-pulse text-emerald-300">Gemini AI Indexing...</span>
                  </div>
                )}

                {/* Delete / Reset photo choice */}
                {!isScanning && (
                  <button 
                    type="button" 
                    onClick={() => { setImage(null); setAiResult(null); setErrors(prev => ({ ...prev, image: undefined })); }}
                    className="absolute top-3 right-3 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Change Photo"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {errors.image && (
              <p className="text-xs text-rose-600 mt-2 flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errors.image}</span>
              </p>
            )}
          </div>

          {/* Section B: Interactive Pin-Map Location Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>Step 2: Pinpoint Location on Map</span>
                <span className="text-red-500 font-bold">*</span>
              </label>

              {/* Reset GPS trigger button */}
              <button 
                type="button" 
                onClick={captureGeolocation}
                disabled={isCapturingGeo}
                className="text-[10px] font-bold px-2 py-1 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 rounded-lg flex items-center gap-1 bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                title="Locate My Address"
              >
                <Navigation className={`w-3 h-3 text-emerald-500 ${isCapturingGeo ? 'animate-spin' : ''}`} />
                <span>Device GPS</span>
              </button>
            </div>

            {/* Interactive mini mapping space */}
            <div className="relative h-64 w-full bg-[#091125] rounded-xl overflow-hidden border border-slate-200 shadow-inner flex flex-col justify-end">
              {hasValidKey ? (
                // Google Map Selector Implementation
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    center={{ lat, lng }}
                    zoom={15}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    onClick={(e) => {
                      if (!e.detail.latLng) return;
                      const clickLat = typeof e.detail.latLng.lat === 'function' ? e.detail.latLng.lat() : e.detail.latLng.lat;
                      const clickLng = typeof e.detail.latLng.lng === 'function' ? e.detail.latLng.lng() : e.detail.latLng.lng;
                      handleLocationSelect(clickLat, clickLng);
                    }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <AdvancedMarker position={{ lat, lng }} title="Target Pin Location">
                      <div className="relative flex h-8 w-8 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-65"></span>
                        <span className="relative flex h-4.5 w-4.5 rounded-full bg-red-650 border-2 border-white shadow-xl"></span>
                      </div>
                    </AdvancedMarker>
                  </Map>
                </APIProvider>
              ) : (
                // Falling back to beautiful custom clickable coordinate grid board
                <svg
                  ref={fallbackMapRef}
                  className="absolute inset-0 w-full h-full cursor-crosshair"
                  onClick={handleFallbackMapClick}
                  onMouseMove={handleFallbackMouseMove}
                  onMouseLeave={() => setCursorPos(null)}
                >
                  {/* Cyber Grid Backdrop */}
                  <g className="opacity-5">
                    {Array.from({ length: 40 }).map((_, i) => {
                      const pos = (i / 40) * 100;
                      return (
                        <g key={i}>
                          <line x1={`${pos}%`} y1="0" x2={`${pos}%`} y2="100%" stroke="#10b981" strokeWidth="0.5" />
                          <line x1="0" y1={`${pos}%`} x2="100%" y2={`${pos}%`} stroke="#10b981" strokeWidth="0.5" />
                        </g>
                      );
                    })}
                  </g>

                  {/* Water mass illustration contour */}
                  <path
                    d="M 0,0 L 100,0 Q 150,30 180,70 T 200,120 T 250,200 L 0,200 Z"
                    fill="#060b18"
                    opacity="0.5"
                  />

                  {/* Intersect grid HUD tracks */}
                  {cursorPos && (
                    <>
                      <line x1={cursorPos.x} y1="0" x2={cursorPos.x} y2="100%" stroke="#10b981" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
                      <line x1="0" y1={cursorPos.y} x2="100%" y2={cursorPos.y} stroke="#10b981" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
                      <circle cx={cursorPos.x} cy={cursorPos.y} r="5" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4" className="animate-pulse" />
                    </>
                  )}

                  {/* Red/Bouncing active report target pin point */}
                  <g>
                    <circle
                      cx={`${projectX(lng)}%`}
                      cy={`${projectY(lat)}%`}
                      r="16"
                      fill="#ef4444"
                      opacity="0.35"
                      className="animate-pulse"
                      style={{ transformOrigin: `${projectX(lng)}% ${projectY(lat)}%` }}
                    />
                    <circle
                      cx={`${projectX(lng)}%`}
                      cy={`${projectY(lat)}%`}
                      r="9"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={`${projectX(lng)}%`}
                      cy={`${projectY(lat)}%`}
                      r="5"
                      fill="#ef4444"
                      stroke="#091125"
                      strokeWidth="1.5"
                      className="shadow-md"
                    />
                  </g>
                </svg>
              )}

              {/* Overlay HUD instructions */}
              <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 border-t border-slate-800 p-2 text-[10px] text-slate-350 flex items-center justify-between pointer-events-none z-10 text-center gap-1 leading-tight font-medium">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Crosshair className="w-3 h-3 text-emerald-400" />
                  <span>Interactive Selection:</span>
                </span>
                <span>Click visual grid above to shift hazard coordinates instantly</span>
              </div>
            </div>

            {/* Coordinates / Address Display Label */}
            <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
              <MapPin className="w-4.5 h-4.5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Report Coordinate Hub</span>
                <p className="text-xs font-semibold text-slate-700 truncate">{locationName}</p>
              </div>
            </div>

            {geoError && (
              <p className="text-[10px] text-amber-600 flex items-center gap-1.5 mt-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{geoError}</span>
              </p>
            )}
          </div>

        </div>

        {/* Column 2: Specific Ledger details */}
        <div className="space-y-6 flex flex-col justify-between" id="ledger-specifics-column">
          
          <div className="space-y-6">

            {/* AI analysis notification box */}
            <AnimatePresence>
              {aiResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    aiResult.isSimulated 
                      ? 'bg-amber-50 border-amber-205 text-amber-800' 
                      : 'bg-emerald-55/70 border-emerald-150 text-emerald-800'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold flex items-center gap-2">
                      <span>{aiResult.isSimulated ? 'Classified Matcher (Simulator)' : 'Gemini AI Vision Analysis'}</span>
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                        {(aiResult.confidence * 100).toFixed(0)}% Conf.
                      </span>
                    </div>
                    <p className="mt-1 opacity-90 leading-relaxed font-medium">{aiResult.description}</p>
                    <p className="mt-2 text-[10px] text-slate-500 font-semibold">
                      AI-predicted category: <strong className="underline uppercase text-emerald-800">{aiResult.category.replace('_', ' ')}</strong> ({(aiResult.confidence * 100).toFixed(0)}% confidence). You can override this using the dropdown below before publishing.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inputs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Hazard Category <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-700 block cursor-pointer transition-all"
              >
                <option value="pothole">🕳️ Pothole on Street/Crosswalk</option>
                <option value="streetlight">💡 Broken or Flickering Streetlight</option>
                <option value="garbage">🗑️ Garbage Pile or Container Overflow</option>
                <option value="water_leak">💧 Plumbing Pipe or Water Leak</option>
                <option value="other">⚠️ Other Public Safety Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Refined Ticket Title <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Obstructed water main valve on 14th Ave"
                className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700 transition-all placeholder:text-slate-450 ${
                  errors.title ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200'
                }`}
              />
              {errors.title && (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Detailed Hazard Summary <span className="text-red-500 font-bold">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Please describe the approximate size, threat level, and exact details of the public risk. This helps response crews triage the queue."
                className={`w-full px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700 transition-all placeholder:text-slate-450 leading-relaxed ${
                  errors.description ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200'
                }`}
              />
              {errors.description && (
                <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.description}</span>
                </p>
              )}
            </div>

          </div>

          {/* Form control actions at bottom */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs md:text-sm rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Close Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isScanning}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50 text-blue-950 font-black text-xs md:text-sm rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Ticket...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>Publish Civic Ticket</span>
                </>
              )}
            </button>
          </div>

        </div>

      </form>

      {/* Duplicate warning confirmation dialog modal overlay */}
      <AnimatePresence>
        {duplicateReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-2xl w-full text-slate-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2 flex-grow">
                  <h3 className="font-heading font-extrabold text-blue-950 text-lg leading-tight">
                    Likely Duplicate Civic Issue Found Nearby!
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Our system detected an existing open ticket within <strong>100 meters</strong> of your proposed location. Gemini compared details and estimated they might represent the exact same hazard. Let's work together to avoid cluttering the city ledger!
                  </p>
                </div>
              </div>

              {/* Gemini Rationale Analysis banner */}
              {duplicateReason && (
                <div className="bg-amber-50/65 border border-amber-100 p-4 rounded-xl mt-4 space-y-1">
                  <span className="text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-amber-700 font-black uppercase tracking-wider">
                    Gemini Comparison Rationale
                  </span>
                  <p className="text-xs font-semibold italic text-slate-700 leading-relaxed mt-1">
                    &ldquo;{duplicateReason}&rdquo;
                  </p>
                </div>
              )}

              {/* Comparison Cards row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Proposed report */}
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      YOUR NEW SUBMISSION
                    </span>
                    <h4 className="font-sans font-bold text-slate-850 text-sm mt-1 truncate">
                      {title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                      {description || 'No description provided.'}
                    </p>
                  </div>
                  {image && (
                    <div className="mt-3 aspect-video bg-black rounded-lg overflow-hidden border border-slate-200">
                      <img src={image} className="w-full h-full object-cover" alt="New Submission" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                {/* Existing report */}
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block">
                        EXISTING OPEN ISSUE
                      </span>
                      <span className="bg-slate-200 text-slate-800 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                        ID: {duplicateReport.id}
                      </span>
                    </div>
                    <h4 className="font-sans font-bold text-slate-850 text-sm mt-1 truncate">
                      {duplicateReport.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                      {duplicateReport.description}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {duplicateReport.imageUrl && (
                      <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-200 relative flex items-center justify-center">
                        {duplicateReport.imageUrl.startsWith('<svg') ? (
                          <div
                            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                            dangerouslySetInnerHTML={{ __html: duplicateReport.imageUrl }}
                          />
                        ) : (
                          <img
                            src={duplicateReport.imageUrl}
                            className="w-full h-full object-cover"
                            alt="Existing Issue"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between mt-1">
                      <span>Status: {duplicateReport.status}</span>
                      <span>👍 {duplicateReport.confirmations} Votes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons row */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDuplicateReport(null)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm rounded-xl transition-all cursor-pointer"
                >
                  Edit My Report
                </button>
                <button
                  type="button"
                  onClick={handleForceSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-xs md:text-sm rounded-xl transition-all cursor-pointer"
                >
                  Submit Anyway
                </button>
                <button
                  type="button"
                  disabled={isUpvoting}
                  onClick={handleUpvoteExisting}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-blue-950 font-black text-xs md:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  {isUpvoting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Upvoting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Upvote Existing (+1) & Cancel</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
