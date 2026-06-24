/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IssueReport, IssueCategory } from './types';

// Helper to generate a high-fidelity inline SVG illustration for each category of issue
export const getIllustrationSvg = (category: IssueCategory, title: string): string => {
  let innerContent = '';
  let bgColor = '#F1F5F9'; // slate-100

  if (category === 'pothole') {
    bgColor = '#E2E8F0'; // slate-200
    innerContent = `
      <!-- Asphalt Ground -->
      <rect x="0" y="0" width="400" height="300" fill="#475569" />
      <path d="M 0 150 C 100 120, 300 180, 400 150 L 400 300 L 0 300 Z" fill="#334155" />
      
      <!-- Pothole Crack Geometry -->
      <path d="M 120 180 C 140 150, 260 150, 280 180 C 290 200, 250 230, 200 230 C 140 230, 110 200, 120 180 Z" fill="#1E293B" stroke="#0F172A" stroke-width="3" />
      <!-- Inner deep cracks -->
      <path d="M 150 190 Q 200 200 250 185 M 135 185 Q 170 215 220 220 M 180 170 Q 190 195 195 225" stroke="#000000" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.6"/>
      <path d="M 120 180 L 90 170 L 60 175 M 280 180 L 320 190 L 350 185" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
      
      <!-- Loose gravel -->
      <circle cx="110" cy="195" r="4" fill="#64748B" />
      <circle cx="130" cy="215" r="3" fill="#475569" />
      <circle cx="270" cy="205" r="5" fill="#64748B" />
      <circle cx="290" cy="175" r="4" fill="#334155" />
      
      <!-- Warning Pylon / Traffic Cone -->
      <g transform="translate(230, 110) scale(0.9)">
        <polygon points="40,80 50,80 44,20 36,20" fill="#F97316" />
        <polygon points="32,100 48,100 46,80 34,80" fill="#F97316" />
        <ellipse cx="40" cy="100" rx="20" ry="5" fill="#F97316" />
        <!-- Reflective white band -->
        <polygon points="38,45 42,45 41.3,32 38.7,32" fill="#FFFFFF" />
        <polygon points="37,65 43,65 42.3,53 37.7,53" fill="#FFFFFF" />
        <!-- Drop Shadow -->
        <ellipse cx="40" cy="104" rx="22" ry="4" fill="#0F172A" opacity="0.3" />
      </g>
      
      <!-- Warning Tape or Sign Post -->
      <g transform="translate(60, 90)">
        <rect x="18" y="0" width="4" height="90" fill="#94A3B8" />
        <polygon points="0,15 40,15 35,35 5,35" fill="#FACC15" />
        <!-- Yellow sign board -->
        <rect x="-10" y="10" width="60" height="30" rx="3" fill="#FACC15" stroke="#D97706" stroke-width="2" />
        <!-- Warning Icon exclamation -->
        <path d="M 20 18 L 20 28" stroke="#000" stroke-width="3" stroke-linecap="round"/>
        <circle cx="20" cy="34" r="2" fill="#000" />
        <!-- Base Shadow -->
        <ellipse cx="20" cy="90" rx="12" ry="3" fill="#0F172A" opacity="0.4" />
      </g>
      
      <!-- Title Badge -->
      <rect x="10" y="10" width="120" height="24" rx="12" fill="#F97316" opacity="0.9" />
      <text x="70" y="26" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="bold">POTHOLE HERO</text>
    `;
  } else if (category === 'streetlight') {
    bgColor = '#0F172A'; // deep dark blue slate-900
    innerContent = `
      <!-- Night Sky background -->
      <rect x="0" y="0" width="400" height="300" fill="#0F172A" />
      <!-- Stars -->
      <circle cx="50" cy="40" r="1" fill="#FFFFFF" opacity="0.8" />
      <circle cx="120" cy="70" r="1.5" fill="#FFFFFF" opacity="0.5" />
      <circle cx="280" cy="30" r="1" fill="#FFFFFF" opacity="0.9" />
      <circle cx="340" cy="90" r="1.2" fill="#FFFFFF" opacity="0.4" />
      
      <!-- City Skyline silhouette in background -->
      <path d="M 0 300 L 0 200 L 40 200 L 40 180 L 80 180 L 80 240 L 120 240 L 120 150 L 170 150 L 170 210 L 220 210 L 220 170 L 260 170 L 260 250 L 300 250 L 300 130 L 350 130 L 350 220 L 400 220 L 400 300 Z" fill="#1E293B" />
      
      <!-- Streetlight Pole -->
      <g transform="translate(160, 40)">
        <!-- Pole shaft -->
        <rect x="38" y="20" width="6" height="240" fill="#64748B" />
        <path d="M 41 240 L 20 260 L 62 260 Z" fill="#475569" />
        <!-- Curved arm -->
        <path d="M 41 20 Q 30 -5, 5 -2 M 41 26 Q 33 5, 8 5" fill="#64748B" />
        
        <!-- Light Fixture casing -->
        <path d="M -2 -5 L 12 -5 L 8 -15 L -6 -15 Z" fill="#334155" transform="rotate(-10, 5, -5)" />
        
        <!-- The bulb/glass -->
        <ellipse cx="6" cy="-2" rx="7" ry="5" fill="#E2E8F0" />
        
        <!-- Red "X" representing a broken lamp (Since reports are usually broken streetlights) -->
        <line x1="-2" y1="-8" x2="14" y2="4" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
        <line x1="14" y1="-8" x2="-2" y2="4" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
        
        <!-- Faint glow representation (not working/flickering) -->
        <circle cx="6" cy="-2" r="12" fill="#FACC15" opacity="0.1" />
      </g>
      
      <!-- Sidewalk ground -->
      <rect x="0" y="260" width="400" height="40" fill="#334155" />
      <line x1="0" y1="260" x2="400" y2="260" stroke="#475569" stroke-width="2" />
      
      <!-- Title Badge -->
      <rect x="10" y="10" width="130" height="24" rx="12" fill="#3B82F6" opacity="0.9" />
      <text x="75" y="26" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="bold">STREETLIGHT ALERT</text>
    `;
  } else if (category === 'garbage') {
    bgColor = '#F8FAFC'; // slate-50
    innerContent = `
      <!-- Ground and brick wall wall -->
      <rect x="0" y="0" width="400" height="300" fill="#E2E8F0" />
      <rect x="0" y="210" width="400" height="90" fill="#94A3B8" />
      <line x1="0" y1="210" x2="400" y2="210" stroke="#475569" stroke-width="3" />
      
      <!-- Brick details in background -->
      <rect x="20" y="40" width="50" height="15" fill="#CBD5E1" rx="1" />
      <rect x="120" y="80" width="50" height="15" fill="#CBD5E1" rx="1" />
      <rect x="280" y="50" width="60" height="15" fill="#CBD5E1" rx="1" />
      <rect x="300" y="130" width="40" height="15" fill="#CBD5E1" rx="1" />
      <rect x="70" y="140" width="50" height="15" fill="#CBD5E1" rx="1" />
      
      <!-- Trash Can (Green Dumpster/Bin) -->
      <g transform="translate(130, 90)">
        <!-- Shadow -->
        <ellipse cx="65" cy="130" rx="45" ry="10" fill="#475569" opacity="0.4" />
        
        <!-- Bin Body -->
        <polygon points="30,40 100,40 90,125 40,125" fill="#10B981" />
        <!-- Wheels -->
        <circle cx="45" cy="130" r="8" fill="#1E293B" />
        <circle cx="45" cy="130" r="4" fill="#94A3B8" />
        <circle cx="85" cy="130" r="8" fill="#1E293B" />
        <circle cx="85" cy="130" r="4" fill="#94A3B8" />
        
        <!-- Ribs on trash bin -->
        <line x1="50" y1="50" x2="50" y2="115" stroke="#047857" stroke-width="3" stroke-linecap="round" />
        <line x1="65" y1="50" x2="65" y2="115" stroke="#047857" stroke-width="3" stroke-linecap="round" />
        <line x1="80" y1="50" x2="80" y2="115" stroke="#047857" stroke-width="3" stroke-linecap="round" />
        
        <!-- Recycling Symbol (Abstract) -->
        <path d="M 60 70 L 70 70 L 65 78 Z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" />
        
        <!-- Rim -->
        <rect x="25" y="32" width="80" height="10" rx="3" fill="#047857" />
        
        <!-- Overflowing Trash pile inside -->
        <path d="M 28 35 C 30 10, 50 15, 60 5 C 70 10, 85 5, 95 20 C 100 25, 102 35, 95 35 Z" fill="#64748B" />
        <!-- Discarded banana peel -->
        <path d="M 50 15 Q 40 5, 30 18 Q 45 22, 50 15 M 50 15 Q 55 2, 65 8" fill="#FACC15" stroke="#D97706" stroke-width="1" />
        <!-- Crumpled soda can -->
        <rect x="75" y="10" width="12" height="18" rx="2" fill="#38BDF8" transform="rotate(30, 75, 10)" />
        <circle cx="80" cy="14" r="3" fill="#0284C7" />
      </g>
      
      <!-- Garbage spilled on floor -->
      <g transform="translate(60, 200)">
        <!-- Trash bags -->
        <path d="M 180 20 C 160 5, 130 10, 130 30 C 130 50, 200 50, 190 30 C 185 20, 185 20, 180 20 Z" fill="#1E293B" />
        <!-- Ribbon tie -->
        <path d="M 180 20 Q 185 10, 190 18 M 180 20 Q 175 10, 170 18" stroke="#EF4444" stroke-width="2.5" fill="none" />
        
        <!-- Scattered cardboard box -->
        <polygon points="40,20 70,10 95,25 65,35" fill="#D97706" />
        <polygon points="40,20 65,35 65,55 40,35" fill="#B45309" />
        <polygon points="65,35 95,25 95,45 65,55" fill="#92400E" />
        <!-- Flaps open -->
        <polygon points="40,20 30,5 55,5 40,20" fill="#D97706" />
        <polygon points="70,10 75,-5 98,2 95,25" fill="#B45309" />
        
        <!-- Litters -->
        <circle cx="110" cy="35" r="5" fill="#F1F5F9" stroke="#94A3B8" /> <!-- paper bundle -->
        <path d="M 105 35 Q 112 32 115 38" stroke="#475569" stroke-width="1" fill="none" />
        
        <rect x="15" y="38" width="16" height="8" fill="#EF4444" transform="rotate(-15, 15, 38)" /> <!-- red pack -->
      </g>
      
      <!-- Title Badge -->
      <rect x="10" y="10" width="130" height="24" rx="12" fill="#10B981" opacity="0.9" />
      <text x="75" y="26" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="bold">CLEANUP REPORT</text>
    `;
  } else if (category === 'water_leak') {
    bgColor = '#EFF6FF'; // blue-50
    innerContent = `
      <!-- Street background -->
      <rect x="0" y="0" width="400" height="300" fill="#64748B" />
      <!-- Curb -->
      <rect x="0" y="80" width="400" height="20" fill="#94A3B8" />
      <line x1="0" y1="80" x2="400" y2="80" stroke="#cbd5e1" stroke-width="1" />
      <line x1="0" y1="100" x2="400" y2="100" stroke="#475569" stroke-width="2" />
      
      <!-- Sidewalk background -->
      <rect x="0" y="0" width="400" height="80" fill="#E2E8F0" />
      <line x1="100" y1="0" x2="100" y2="80" stroke="#94A3B8" stroke-width="1" />
      <line x1="250" y1="0" x2="250" y2="80" stroke="#94A3B8" stroke-width="1" />
      
      <!-- Splashing Water Fountain from the ground -->
      <g transform="translate(180, 105)">
        <!-- Giant puddle -->
        <ellipse cx="20" cy="90" rx="90" ry="25" fill="#38BDF8" opacity="0.7" />
        <ellipse cx="10" cy="92" rx="70" ry="18" fill="#0EA5E9" opacity="0.8" />
        <ellipse cx="25" cy="88" rx="40" ry="10" fill="#E0F2FE" opacity="0.9" />
        
        <!-- Damaged pipe/hole in road visual -->
        <ellipse cx="15" cy="85" rx="15" ry="6" fill="#1E293B" />
        
        <!-- Geyser Jet of water -->
        <!-- Splashes curve left -->
        <path d="M 15 85 Q -20 10, -50 40" fill="none" stroke="#E0F2FE" stroke-width="5" stroke-linecap="round" opacity="0.9" />
        <path d="M 15 85 Q -20 10, -50 40" fill="none" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" />
        
        <!-- Splashes curve right -->
        <path d="M 15 85 Q 40 5, 80 35" fill="none" stroke="#E0F2FE" stroke-width="4.5" stroke-linecap="round" opacity="0.9" />
        <path d="M 15 85 Q 40 5, 80 35" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" />
        
        <!-- Central spray -->
        <path d="M 15 85 Q 15 20, 25 15" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />
        <path d="M 15 85 Q 5 25, -2 20" fill="none" stroke="#E0F2FE" stroke-width="3.5" stroke-linecap="round" />
        
        <!-- Individual droplets -->
        <circle cx="-35" cy="25" r="4" fill="#E0F2FE" />
        <circle cx="-55" cy="48" r="3.5" fill="#38BDF8" />
        <circle cx="-10" cy="5" r="5" fill="#FFFFFF" />
        <circle cx="28" cy="10" r="4.5" fill="#FFFFFF" />
        <circle cx="60" cy="22" r="3" fill="#E0F2FE" />
        <circle cx="85" cy="45" r="4" fill="#38BDF8" />
        <circle cx="5" cy="50" r="3" fill="#0EA5E9" />
        <circle cx="35" cy="60" r="3.5" fill="#0EA5E9" />
      </g>
      
      <!-- Water ripple lines in puddle -->
      <path d="M 210,180 A 40,10 0 0,0 230,195" fill="none" stroke="#000000" stroke-width="1" opacity="0.15" />
      <path d="M 110,190 A 60,15 0 0,0 140,210" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.4" />
      
      <!-- Fire Hydrant nearby inside sidewalk -->
      <g transform="translate(60, 40) scale(0.65)">
        <ellipse cx="20" cy="50" rx="15" ry="5" fill="#0F172A" opacity="0.3" />
        <!-- body -->
        <rect x="8" y="10" width="24" height="40" fill="#EF4444" rx="2" />
        <!-- cap -->
        <path d="M 4 10 L 36 10 L 32 0 L 8 0 Z" fill="#EF4444" />
        <circle cx="20" cy="-2" r="4" fill="#991B1B" />
        <!-- side valves -->
        <rect x="2" y="20" width="6" height="10" fill="#7F1D1D" rx="1" />
        <rect x="32" y="20" width="6" height="10" fill="#7F1D1D" rx="1" />
        <!-- front cap -->
        <circle cx="20" cy="25" r="6" fill="#F87171" />
        <circle cx="20" cy="25" r="3" fill="#7F1D1D" />
      </g>
      
      <!-- Title Badge -->
      <rect x="10" y="10" width="130" height="24" rx="12" fill="#0EA5E9" opacity="0.9" />
      <text x="75" y="26" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="bold">ACTIVE LEAK ALERT</text>
    `;
  } else {
    // other category
    bgColor = '#F5F5F4'; // stone-100
    innerContent = `
      <!-- Street / Yard Ground representation -->
      <rect x="0" y="0" width="400" height="300" fill="#E7E5E4" />
      <rect x="0" y="160" width="400" height="140" fill="#D6D3D1" />
      <line x1="0" y1="160" x2="400" y2="160" stroke="#A8A29E" stroke-width="2" />
      
      <!-- Fallen Tree branch blocking sidewalk/road -->
      <g transform="translate(110, 110)">
        <!-- Shadow -->
        <path d="M -10 65 L 180 55 L 140 75 Z" fill="#78716C" opacity="0.4" />
        <!-- Main branch trunk -->
        <path d="M 10 50 Q 80 40, 160 55 L 158 63 Q 78 48, 8 58 Z" fill="#78350F" />
        <!-- Side twig -->
        <path d="M 70 46 Q 90 20, 115 15 L 117 20 Q 94 25, 74 48 Z" fill="#78350F" />
        <!-- Leaf cluster on the main branch -->
        <path d="M 130 50 C 110 35, 150 20, 170 35 C 190 30, 190 60, 170 65 C 160 80, 120 70, 130 50 Z" fill="#15803D" />
        <!-- Leaf cluster on the side twig -->
        <path d="M 100 15 C 90 0, 120 -10, 130 5 C 145 0, 140 25, 125 22 C 115 35, 95 25, 100 15 Z" fill="#166534" />
        <!-- Tiny leaves scattered on floor -->
        <ellipse cx="40" cy="62" rx="8" ry="4" fill="#22C55E" transform="rotate(15, 40, 62)" />
        <ellipse cx="65" cy="58" rx="6" ry="3" fill="#15803D" transform="rotate(-30, 65, 58)" />
        <ellipse cx="145" cy="68" rx="9" ry="5" fill="#166534" transform="rotate(45, 145, 68)" />
      </g>
      
      <!-- Utility maintenance hazard sign -->
      <g transform="translate(40, 120) scale(0.8)">
        <!-- Base shadow -->
        <ellipse cx="25" cy="70" rx="20" ry="4" fill="#000000" opacity="0.25" />
        <!-- A-Frame stand -->
        <polygon points="10,68 15,68 25,12 20,12" fill="#57534E" />
        <polygon points="40,68 35,68 25,12 30,12" fill="#44403C" />
        <rect x="13" y="45" width="24" height="4" fill="#78716C" />
        <!-- Warning text plate -->
        <polygon points="0,55 50,55 42,15 8,15" fill="#EF4444" stroke="#B91C1C" stroke-width="2" />
        <!-- Inner stripe -->
        <polygon points="5,50 45,50 39,20 11,20" fill="#FFFFFF" />
        <!-- Exclamation mark -->
        <rect x="23" y="24" width="4" height="15" rx="1" fill="#EF4444" />
        <circle cx="25" cy="44" r="2.5" fill="#EF4444" />
      </g>
      
      <!-- Title Badge -->
      <rect x="10" y="10" width="130" height="24" rx="12" fill="#78716C" opacity="0.9" />
      <text x="75" y="26" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="bold">GENERAL ISSUE</text>
    `;
  }

  // Combine into a valid SVG Data URI that can be rendered inside <img> or CSS background
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <defs>
      <linearGradient id="illustrationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" />
        <stop offset="100%" stop-color="${bgColor}EE" />
      </linearGradient>
    </defs>
    <!-- Background Frame -->
    <rect width="400" height="300" rx="8" fill="url(#illustrationGrad)" />
    ${innerContent}
  </svg>`;

  // Base64 encode for reliability inside img tags or standard SVG formatting
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const SEED_REPORTS: IssueReport[] = [
  {
    id: "rep-001",
    category: "pothole",
    title: "Deep Pothole in Crosswalk",
    description: "Extremely deep pothole stretching across the pedestrian crosswalk. It causes cars to swerve suddenly and is a severe trip hazard for the elderly and children crossing the street.",
    status: "Reported",
    latitude: 37.7610,
    longitude: -122.4215,
    locationName: "Valencia St & 18th St, San Francisco, CA",
    imageUrl: getIllustrationSvg("pothole", "Deep Pothole in Crosswalk"),
    confirmations: 1,
    createdAt: "2026-06-20T10:30:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-20T10:30:00-07:00", note: "Issue logged by citizen with automated photo verification." }
    ]
  },
  {
    id: "rep-002",
    category: "streetlight",
    title: "Completely Dark Alley Light",
    description: "The main overhead streetlight in this narrow alley has been out for over a week, making the entire block pitch black at night. Residents feel unsafe walking home.",
    status: "Verified",
    latitude: 37.8012,
    longitude: -122.4085,
    locationName: "Columbus Ave & Jack Kerouac Alley, San Francisco, CA",
    imageUrl: getIllustrationSvg("streetlight", "Completely Dark Alley Light"),
    confirmations: 3,
    createdAt: "2026-06-18T21:15:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-18T21:15:00-07:00", note: "Issue logged by neighborhood watch." },
      { status: "Verified", date: "2026-06-19T09:00:00-07:00", note: "Issue automatically transitioned to Verified after obtaining 3 community confirmations." }
    ]
  },
  {
    id: "rep-003",
    category: "garbage",
    title: "Illegal Trash Dumping near Pier",
    description: "Two commercial trash container lids are broken, and heavy garbage has been dumped on the public pathway. Wind is blowing trash into the bay water.",
    status: "In Progress",
    latitude: 37.8080,
    longitude: -122.4100,
    locationName: "The Embarcadero (Pier 39), San Francisco, CA",
    imageUrl: getIllustrationSvg("garbage", "Illegal Trash Dumping near Pier"),
    confirmations: 4,
    createdAt: "2026-06-17T08:00:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-17T08:00:00-07:00", note: "Initial report uploaded by visitor." },
      { status: "Verified", date: "2026-06-17T12:00:00-07:00", note: "Verified by community upvotes." },
      { status: "In Progress", date: "2026-06-19T14:30:00-07:00", note: "Public Works Department dispatched a cleanup unit to schedule dumpster replacement." }
    ]
  },
  {
    id: "rep-004",
    category: "water_leak",
    title: "Gushing Water Valve Leak",
    description: "A continuous flow of clean water is streaming flat out of a concrete utility cover, flooding the sidewalk and forming a massive stream down California Street.",
    status: "Resolved",
    latitude: 37.7925,
    longitude: -122.4030,
    locationName: "California St & Montgomery St, San Francisco, CA",
    imageUrl: getIllustrationSvg("water_leak", "Gushing Water Valve Leak"),
    confirmations: 5,
    createdAt: "2026-06-15T06:10:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-15T06:10:00-07:00", note: "Water leak reported on the way to work." },
      { status: "Verified", date: "2026-06-15T07:05:00-07:00", note: "Verified immediately by community upvotes." },
      { status: "In Progress", date: "2026-06-15T08:45:00-07:00", note: "Water Department crew arrived on site and turned off the lateral pipe valve." },
      { status: "Resolved", date: "2026-06-16T11:00:00-07:00", note: "Corroded gasket successfully replaced, street dried, and issue marked resolved." }
    ]
  },
  {
    id: "rep-005",
    category: "pothole",
    title: "Double Asphalt Sinkholes",
    description: "Two massive parallel potholes formed near the busy bus stop. Double-decker buses bounce aggressively over them, creating tremendous noise and shattering asphalt fragments.",
    status: "Verified",
    latitude: 37.7818,
    longitude: -122.4450,
    locationName: "Geary Blvd & Divisadero St, San Francisco, CA",
    imageUrl: getIllustrationSvg("pothole", "Double Asphalt Sinkholes"),
    confirmations: 3,
    createdAt: "2026-06-19T11:45:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-19T11:45:00-07:00", note: "Civic report submitted with transit-related hazard tagging." },
      { status: "Verified", date: "2026-06-21T18:20:00-07:00", note: "Community verified via upvotes." }
    ]
  },
  {
    id: "rep-006",
    category: "streetlight",
    title: "Flickering Overhead Fixture",
    description: "The streetlight above the pedestrian zebra crossing is flickering like a strobe light. Extremely distracting for oncoming drivers and dangerous for pedestrians crossing at night.",
    status: "Resolved",
    latitude: 37.7608,
    longitude: -122.4350,
    locationName: "Castro St & 18th St, San Francisco, CA",
    imageUrl: getIllustrationSvg("streetlight", "Flickering Overhead Fixture"),
    confirmations: 4,
    createdAt: "2026-06-14T22:30:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-14T22:30:00-07:00", note: "Strobe hazard streetlight logged." },
      { status: "Verified", date: "2026-06-14T23:55:00-07:00", note: "Verified rapidly." },
      { status: "In Progress", date: "2026-06-16T10:00:00-07:00", note: "Contractor crew began testing the light ballast." },
      { status: "Resolved", date: "2026-06-17T15:20:00-07:00", note: "LED lamp module replaced under warranty. Work confirmed finalized." }
    ]
  },
  {
    id: "rep-007",
    category: "garbage",
    title: "Massive Mattress Overflow",
    description: "Three large mattresses, furniture drawers, and piles of packing cardboard have been illegally dumped on the sidewalk near the corner, blocking wheel-chair ramp access.",
    status: "Reported",
    latitude: 37.7801,
    longitude: -122.4095,
    locationName: "6th St & Market St, San Francisco, CA",
    imageUrl: getIllustrationSvg("garbage", "Massive Mattress Overflow"),
    confirmations: 2,
    createdAt: "2026-06-21T09:12:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-21T09:12:00-07:00", note: "Illegally dumped household goods reported by walking resident." }
    ]
  },
  {
    id: "rep-008",
    category: "water_leak",
    title: "Sewer Drain Overflowing with Mud",
    description: "Water is bubbling up backwards through the street drainage mouth, carrying mud and leaves across the roadway. Strong sewage smell is beginning to permeate.",
    status: "In Progress",
    latitude: 37.7680,
    longitude: -122.4820,
    locationName: "Fulton St & 36th Ave (Golden Gate Park), San Francisco, CA",
    imageUrl: getIllustrationSvg("water_leak", "Sewer Drain Overflowing with Mud"),
    confirmations: 3,
    createdAt: "2026-06-18T13:40:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-18T13:40:00-07:00", note: "Drain block reported near the park entrance." },
      { status: "Verified", date: "2026-06-18T15:10:00-07:00", note: "Verified after third notification confirmation." },
      { status: "In Progress", date: "2026-06-20T11:00:00-07:00", note: "Vactor truck dispatched to flush the main storm drain sewer lines." }
    ]
  },
  {
    id: "rep-009",
    category: "pothole",
    title: "Steep Hill Pothole",
    description: "Located on our famous winding street, a deep brick-border pothole has formed. Tourists driving down are bottoming out their rental cars and blocking the flow of traffic.",
    status: "Reported",
    latitude: 37.8020,
    longitude: -122.4190,
    locationName: "Lombard St & Hyde St, San Francisco, CA",
    imageUrl: getIllustrationSvg("pothole", "Steep Hill Pothole"),
    confirmations: 0,
    createdAt: "2026-06-22T07:45:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-22T07:45:00-07:00", note: "Reported early morning by cable car technician." }
    ]
  },
  {
    id: "rep-010",
    category: "streetlight",
    title: "Broken Lamp and Exposed Wiring",
    description: "A streetlight pole was hit by a delivery vehicle. The lamp glass is completely shattered and some wiring inside the metal inspection hatch seems exposed.",
    status: "Verified",
    latitude: 37.7699,
    longitude: -122.4468,
    locationName: "Haight St & Ashbury St, San Francisco, CA",
    imageUrl: getIllustrationSvg("streetlight", "Broken Lamp and Exposed Wiring"),
    confirmations: 3,
    createdAt: "2026-06-19T23:50:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-19T23:50:00-07:00", note: "Severe structural hazard reported." },
      { status: "Verified", date: "2026-06-20T08:30:00-07:00", note: "Automatically verified after receiving 3 community alerts." }
    ]
  },
  {
    id: "rep-011",
    category: "garbage",
    title: "Post-Weekend Trash Can Overflow",
    description: "All trash receptacles near the Dolores Park lawn are packed, with hundreds of pizza boxes, plastic cups, and wrapping papers piled around them. Wild birds are nesting in the litter.",
    status: "Resolved",
    latitude: 37.7590,
    longitude: -122.4270,
    locationName: "Mission Dolores Park, San Francisco, CA",
    imageUrl: getIllustrationSvg("garbage", "Post-Weekend Trash Can Overflow"),
    confirmations: 6,
    createdAt: "2026-06-14T20:10:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-14T20:10:00-07:00", note: "Park visitor logged extreme litter levels." },
      { status: "Verified", date: "2026-06-14T21:30:00-07:00", note: "Verified rapidly by park-goers." },
      { status: "In Progress", date: "2026-06-15T06:00:00-07:00", note: "Park staff and cleaning crew deployed with collection vehicles." },
      { status: "Resolved", date: "2026-06-15T10:15:00-07:00", note: "Lawn cleared, trash bins thoroughly emptied and detailed." }
    ]
  },
  {
    id: "rep-012",
    category: "water_leak",
    title: "Water Main Sidewalk Bubbling",
    description: "Slight but constant flow of drinking water coming out between the paving blocks near the fountain. It has formed green slippery moss and pedestrians are slipping on it.",
    status: "Reported",
    latitude: 37.8062,
    longitude: -122.4228,
    locationName: "Ghirardelli Square near Beach St, San Francisco, CA",
    imageUrl: getIllustrationSvg("water_leak", "Water Main Sidewalk Bubbling"),
    confirmations: 1,
    createdAt: "2026-06-21T14:50:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-21T14:50:00-07:00", note: "Reported via mobile client." }
    ]
  },
  {
    id: "rep-013",
    category: "other",
    title: "Huge Fallen Oak Branch",
    description: "A gigantic oak tree branch has split off and fell directly blockading the main pedestrian running path. Runners have to climb over it or cross into vehicle lanes.",
    status: "In Progress",
    latitude: 37.7950,
    longitude: -122.4650,
    locationName: "Lincoln Blvd & Presidio Promenade, San Francisco, CA",
    imageUrl: getIllustrationSvg("other", "Huge Fallen Oak Branch"),
    confirmations: 3,
    createdAt: "2026-06-18T10:15:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-18T10:15:00-07:00", note: "Runner reported tree blockage." },
      { status: "Verified", date: "2026-06-18T13:45:00-07:00", note: "Verified by community." },
      { status: "In Progress", date: "2026-06-20T08:00:00-07:00", note: "Arborist department en route with chainsaws to segment and clear the blocked trail." }
    ]
  },
  {
    id: "rep-014",
    category: "pothole",
    title: "Van Ness Ave Lane Cracks",
    description: "A highly deep trench-like pothole runs parallel to the transit lane, popping tires of smaller cars when they try to switch into the bus lanes.",
    status: "Resolved",
    latitude: 37.7850,
    longitude: -122.4220,
    locationName: "Van Ness Ave & O'Farrell St, San Francisco, CA",
    imageUrl: getIllustrationSvg("pothole", "Van Ness Ave Lane Cracks"),
    confirmations: 4,
    createdAt: "2026-06-12T09:00:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-12T09:00:00-07:00", note: "Hazard logged." },
      { status: "Verified", date: "2026-06-12T11:20:00-07:00", note: "Verified." },
      { status: "In Progress", date: "2026-06-13T22:00:00-07:00", note: "Night maintenance crew operating with hot tar." },
      { status: "Resolved", date: "2026-06-14T05:00:00-07:00", note: "Asphalt repaved, flattened, and line repainted. Issue resolved." }
    ]
  },
  {
    id: "rep-015",
    category: "water_leak",
    title: "Damaged Hydrant Dripping",
    description: "A red fire hydrant has a broken side-nozzle cap and is dripping a constant stream of high-pressure mist, forming puddles on the sidewalk and wet parking spots.",
    status: "Verified",
    latitude: 37.7735,
    longitude: -122.4185,
    locationName: "Market St & 11th St, San Francisco, CA",
    imageUrl: getIllustrationSvg("water_leak", "Damaged Hydrant Dripping"),
    confirmations: 3,
    createdAt: "2026-06-20T17:40:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-20T17:40:00-07:00", note: "Logged by local merchant." },
      { status: "Verified", date: "2026-06-21T21:00:00-07:00", note: "Community verification achieved." }
    ]
  },
  {
    id: "rep-016",
    category: "other",
    title: "Shattered Bus Shelter Glass",
    description: "The side-panels of the transit bus shelter are entirely shattered, leaving glass scattered inside the seating bench area. Commuters have nowhere to sit safely.",
    status: "Reported",
    latitude: 37.7942,
    longitude: -122.4078,
    locationName: "Chinatown Stop (Grant Ave & Washington St), San Francisco, CA",
    imageUrl: getIllustrationSvg("other", "Shattered Bus Shelter Glass"),
    confirmations: 2,
    createdAt: "2026-06-21T19:00:00-07:00",
    timeline: [
      { status: "Reported", date: "2026-06-21T19:00:00-07:00", note: "Reported by evening commuter." }
    ]
  }
];
