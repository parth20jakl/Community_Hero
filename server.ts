/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { SEED_REPORTS, getIllustrationSvg } from './src/seedReports';
import { IssueReport, IssueCategory, IssueStatus, ClassificationResult, Contributor } from './src/types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'reports-db.json');

// Middleware to parse large JSON bodies (photos are uploaded as raw base64 data)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Load mock databases or JSON store
function loadReports(): IssueReport[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      let amended = false;
      parsed.forEach((report: any) => {
        if (!report.priority) {
          const inputLower = `${report.category} ${report.description} ${report.locationName}`.toLowerCase();
          let priority: 'Low' | 'Medium' | 'High' = 'Medium';
          let explanation = 'Assigned medium response queue priority under standard municipal triage rules.';

          const hasHighRiskLocations = inputLower.includes('school') ||
                                       inputLower.includes('hospital') ||
                                       inputLower.includes('kindergarten') ||
                                       inputLower.includes('academy') ||
                                       inputLower.includes('medical') ||
                                       inputLower.includes('clinic') ||
                                       inputLower.includes('health') ||
                                       inputLower.includes('nursing home') ||
                                       inputLower.includes('children') ||
                                       inputLower.includes('elderly');

          if (report.category === 'water_leak' && (inputLower.includes('flood') || inputLower.includes('gushing') || inputLower.includes('burst') || inputLower.includes('main'))) {
            priority = 'High';
            explanation = 'Water leak presents active flooding or utility loss hazard, prioritized for repair crews.';
          } else if (report.category === 'pothole' && (inputLower.includes('deep') || inputLower.includes('sinkhole') || inputLower.includes('accident') || inputLower.includes('dangerous'))) {
            priority = 'High';
            explanation = 'Severe asphalt collapse threatens vehicle damage or cyclist accidents, require rapid patching.';
          } else if (hasHighRiskLocations) {
            priority = 'High';
            explanation = `Located near school/hospital/vulnerable zone, escalated for immediate child/patient safety.`;
          } else if (report.category === 'garbage' && (inputLower.includes('small') || inputLower.includes('solitary') || inputLower.includes('bag') || inputLower.includes('cans'))) {
            priority = 'Low';
            explanation = 'Isolated/minor litter report poses low public safety risk and will be scheduled in routine sweeps.';
          } else if (report.category === 'streetlight' && (inputLower.includes('daytime') || inputLower.includes('flicker') || inputLower.includes('one light'))) {
            priority = 'Low';
            explanation = 'Minor illumination issue poses low situational safety impact under streetlighting standard profiles.';
          } else if (report.category === 'pothole') {
            priority = 'Medium';
            explanation = 'Pothole report requires medium-term crew routing for repair/patching queue.';
          } else if (report.category === 'streetlight') {
            priority = 'Medium';
            explanation = 'Inactive streetlight decreases nocturnal visibility; slotted for standard service technician dispatch.';
          } else if (report.category === 'garbage') {
            priority = 'Medium';
            explanation = 'Public waste accumulation flagged for waste collection team within 48 hour SLA.';
          } else if (report.category === 'water_leak') {
            priority = 'Medium';
            explanation = 'Municipal water line leak logged for investigation and pressure testing.';
          }
          report.priority = priority;
          report.priorityExplanation = explanation;
          amended = true;
        }
      });
      if (amended) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      }
      return parsed;
    }
  } catch (err) {
    console.error('Database file read error, falling back to seed reports:', err);
  }
  // Initialize with Seed Data
  const seedWithPriority = SEED_REPORTS.map(report => {
    const inputLower = `${report.category} ${report.description} ${report.locationName}`.toLowerCase();
    let priority: 'Low' | 'Medium' | 'High' = 'Medium';
    let explanation = 'Assigned medium response queue priority under standard municipal triage rules.';

    const hasHighRiskLocations = inputLower.includes('school') ||
                                 inputLower.includes('hospital') ||
                                 inputLower.includes('kindergarten') ||
                                 inputLower.includes('academy') ||
                                 inputLower.includes('medical') ||
                                 inputLower.includes('clinic') ||
                                 inputLower.includes('health') ||
                                 inputLower.includes('nursing home') ||
                                 inputLower.includes('children') ||
                                 inputLower.includes('elderly');

    if (report.category === 'water_leak' && (inputLower.includes('flood') || inputLower.includes('gushing') || inputLower.includes('burst') || inputLower.includes('main'))) {
      priority = 'High';
      explanation = 'Water leak presents active flooding or utility loss hazard, prioritized for repair crews.';
    } else if (report.category === 'pothole' && (inputLower.includes('deep') || inputLower.includes('sinkhole') || inputLower.includes('accident') || inputLower.includes('dangerous'))) {
      priority = 'High';
      explanation = 'Severe asphalt collapse threatens vehicle damage or cyclist accidents, require rapid patching.';
    } else if (hasHighRiskLocations) {
      priority = 'High';
      explanation = `Located near school/hospital/vulnerable zone, escalated for immediate child/patient safety.`;
    } else if (report.category === 'garbage' && (inputLower.includes('small') || inputLower.includes('solitary') || inputLower.includes('bag') || inputLower.includes('cans'))) {
      priority = 'Low';
      explanation = 'Isolated/minor litter report poses low public safety risk and will be scheduled in routine sweeps.';
    } else if (report.category === 'streetlight' && (inputLower.includes('daytime') || inputLower.includes('flicker') || inputLower.includes('one light'))) {
      priority = 'Low';
      explanation = 'Minor illumination issue poses low situational safety impact under streetlighting standard profiles.';
    } else if (report.category === 'pothole') {
      priority = 'Medium';
      explanation = 'Pothole report requires medium-term crew routing for repair/patching queue.';
    } else if (report.category === 'streetlight') {
      priority = 'Medium';
      explanation = 'Inactive streetlight decreases nocturnal visibility; slotted for standard service technician dispatch.';
    } else if (report.category === 'garbage') {
      priority = 'Medium';
      explanation = 'Public waste accumulation flagged for waste collection team within 48 hour SLA.';
    } else if (report.category === 'water_leak') {
      priority = 'Medium';
      explanation = 'Municipal water line leak logged for investigation and pressure testing.';
    }
    return { ...report, priority, priorityExplanation: explanation };
  });
  saveReports(seedWithPriority);
  return seedWithPriority;
}

function saveReports(reports: IssueReport[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {
    console.error('Database save error:', err);
  }
}

const USERS_FILE = path.join(process.cwd(), 'users-db.json');

const DEFAULT_USERS: Contributor[] = [
  { id: 'user-current', name: 'Parth Kulkarni (You)', points: 15, avatarColor: '#10B981', isCurrentUser: true },
  { id: 'user-officer', name: 'Officer Friendly', points: 48, avatarColor: '#3B82F6' },
  { id: 'user-eco', name: 'Eco Warrior', points: 35, avatarColor: '#F59E0B' },
  { id: 'user-patrol', name: 'Pothole Patrol', points: 28, avatarColor: '#EC4899' },
  { id: 'user-watch', name: 'Neighborhood Watch', points: 17, avatarColor: '#8B5CF6' }
];

function loadUsers(): Contributor[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Users database read error:', err);
  }
  // Initialize with seed users
  saveUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

function saveUsers(users: Contributor[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Users database save error:', err);
  }
}

// Global In-Memory Cache representing current database state
let reportsDatabase = loadReports();
let usersDatabase = loadUsers();

// Initialize Google GenAI
let ai: GoogleGenAI | null = null;
const api_key = process.env.GEMINI_API_KEY;

if (api_key && api_key !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: api_key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini AI successfully initialized for civic issue classification.');
  } catch (e) {
    console.error('Failed to initialize Gemini Client with provided key:', e);
  }
} else {
  console.log('GEMINI_API_KEY not found or is placeholder. Using smart simulated fallback classifier.');
}

// API Routes

// 1. Get all reports
app.get('/api/reports', (req, res) => {
  res.json({ reports: reportsDatabase });
});

// 1b. Get all contributors / users
app.get('/api/users', (req, res) => {
  res.json({ users: usersDatabase });
});

// 2. Classify image with Gemini
app.post('/api/classify', async (req, res) => {
  const { image, descriptionInput, fileName } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image data provided.' });
  }

  // Strip standard Data URI headers if present to get raw base64 data
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

  // Detect mime type for Gemini Part schema
  let mimeType = 'image/jpeg';
  const match = image.match(/^data:(image\/\w+);base64,/);
  if (match) {
    mimeType = match[1];
  }

  // Smart simulated fallback classifier logic (in case API keys are missing or offline)
  const getFallbackClassification = (textSource: string): ClassificationResult & { title: string } => {
    const text = textSource.toLowerCase();
    
    let category: IssueCategory = 'other';
    let confidence = 0.82;
    let title = 'General Civic Hazard';
    let desc = 'Unusual hazard or maintenance required on public path.';

    if (text.includes('pothole') || text.includes('hole') || text.includes('cracked asphalt') || text.includes('sinkhole') || text.includes('street crack')) {
      category = 'pothole';
      confidence = 0.94;
      title = 'Asphalt Surface Collapse';
      desc = 'Pothole structure identified in roadway asphalt layer, causing potential hazard for cyclists and vehicles.';
    } else if (text.includes('light') || text.includes('lamp') || text.includes('darkness') || text.includes('bulb') || text.includes('streetlight') || text.includes('night safety')) {
      category = 'streetlight';
      confidence = 0.91;
      title = 'Malfunctioning Streetlight Pole';
      desc = 'Overhead streetlight lamp discovered inactive or damaged, causing safety hazards in pedestrian zones.';
    } else if (text.includes('garbage') || text.includes('trash') || text.includes('dump') || text.includes('litter') || text.includes('waste') || text.includes('mattress')) {
      category = 'garbage';
      confidence = 0.95;
      title = 'Illegal Public Waste Accumulation';
      desc = 'Uncontrolled littering or garbage heaps blocking walk pathways or posing environmental concerns.';
    } else if (text.includes('leak') || text.includes('water') || text.includes('splashing') || text.includes('hydrant') || text.includes('flood') || text.includes('pipe')) {
      category = 'water_leak';
      confidence = 0.89;
      title = 'Water Utility Line Leakage';
      desc = 'Running or pooling water identified, indicative of utility fracture, pipe rupture, or gasket failure.';
    }

    return { category, confidence, description: desc, title };
  };

  // If Gemini Client is active, use Gemini API
  if (ai) {
    try {
      console.log('Sending photo to Gemini-3.5-Flash for categorization...');
      
      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };

      const textPart = {
        text: `You are an urban planning civic technology bot. Analyze this photo uploaded by a citizen in a civic issue application.
Define the category, a concise 3-6 word title, and a simple description.
The allowed categories are EXACTLY: 'pothole', 'streetlight', 'garbage', 'water_leak', 'other'.
Estimate your classification confidence from 0.0 to 1.0.
Respond with a strict JSON format matching the schema requested. If the image is unclear or doesn't match any obvious civic issue, categorize as 'other' and state what you see.`,
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "Must be exactly one of: 'pothole', 'streetlight', 'garbage', 'water_leak', 'other'",
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence rating from 0.0 to 1.0',
              },
              description: {
                type: Type.STRING,
                description: 'Brief, clear summary of what is seen in the photo (max 2 sentences).',
              },
              title: {
                type: Type.STRING,
                description: 'A punchy civic report title (3-6 words).',
              },
            },
            required: ['category', 'confidence', 'description', 'title'],
          },
        },
      });

      const responseText = response.text;
      if (responseText) {
        console.log('Gemini categorization response:', responseText);
        const parsed = JSON.parse(responseText.trim());
        
        // Ensure category matches exactly
        let verifiedCategory: IssueCategory = 'other';
        const rawCat = (parsed.category || '').toLowerCase().replace('-', '_');
        if (['pothole', 'streetlight', 'garbage', 'water_leak', 'other'].includes(rawCat)) {
          verifiedCategory = rawCat as IssueCategory;
        }

        return res.json({
          category: verifiedCategory,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
          description: parsed.description || 'Civic infrastructure anomaly detected.',
          title: parsed.title || 'Civic Issue Report',
          isSimulated: false,
        });
      }
    } catch (e: any) {
      console.error('Gemini Classification API encountered an error, falling back to local simulation:', e.message || e);
    }
  }

  // Smart fallback when Gemini is unavailable
  const scanInput = `${fileName || ''} ${descriptionInput || ''}`;
  const mockClassify = getFallbackClassification(scanInput);
  
  // Guarantee a short simulation timeout to give matching UI feel
  setTimeout(() => {
    res.json({
      category: mockClassify.category,
      confidence: mockClassify.confidence,
      description: mockClassify.description + ' (Simulated classification. Set GEMINI_API_KEY for true AI results.)',
      title: mockClassify.title,
      isSimulated: true,
    });
  }, 900);
});

// Helper function to evaluate priority and explanation using Gemini or falling back to smart simulation
async function computePriorityAndExplanation(
  category: string,
  title: string,
  description: string,
  locationName: string
): Promise<{ priority: 'Low' | 'Medium' | 'High'; explanation: string }> {
  if (ai) {
    try {
      console.log('Calling Gemini dynamically to evaluate civic issue priority...');
      const prompt = `You are an urban municipal hazard triage coordinator.
Evaluate the priority score ('Low', 'Medium', or 'High') and provide a short, single-sentence triage explanation of your reasoning.
The reported issue has the following attributes:
- Category: ${category}
- Title: ${title}
- Description: ${description}
- Location: ${locationName}

Rules for evaluation:
- If located near a "school", "hospital", "kindergarten", "academy", "medical", "clinic", "health care", or "elderly care" area, prioritize the issue. Escalate priority to 'High' or 'Medium'.
- High priority criteria: Imminent hazard to life or limb (e.g. active flooding water leak, severe deep sinkhole/asphalt crater on busy road, total darkness on heavy pedestrian pathway).
- Low priority criteria: Solana/aesthetic minor issue, isolated litter, minor daylight potholes, slightly broken spotlight when background light is present.
- Medium priority criteria: Standard maintenance/response backlog cases.

Respond with a raw, validated JSON object in the requested schema containing:
{
  "priority": "Low" | "Medium" | "High",
  "explanation": "A concise, objective, one-sentence municipal triage explanation (max 15 words) explaining why this priority was assigned."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priority: {
                type: Type.STRING,
                description: 'Must be exactly one of: "Low", "Medium", "High"',
              },
              explanation: {
                type: Type.STRING,
                description: 'Brief, single-sentence triage rationale explanation (within 15 words).',
              },
            },
            required: ['priority', 'explanation'],
          },
        },
      });

      const responseText = response.text;
      if (responseText) {
        console.log('Gemini Priority Response:', responseText);
        const parsed = JSON.parse(responseText.trim());
        let verifiedPriority: 'Low' | 'Medium' | 'High' = 'Medium';
        const rawPriority = String(parsed.priority || '').trim();
        if (['Low', 'Medium', 'High'].includes(rawPriority)) {
          verifiedPriority = rawPriority as 'Low' | 'Medium' | 'High';
        }
        return {
          priority: verifiedPriority,
          explanation: parsed.explanation || 'Assessed automatically using municipal priority indicators.'
        };
      }
    } catch (e: any) {
      console.error('Gemini Priority calculation encountered an API error, using smart local simulation helper:', e.message || e);
    }
  }

  // Smart local simulation logic based on keywords
  const inputLower = `${category} ${title} ${description} ${locationName}`.toLowerCase();
  let priority: 'Low' | 'Medium' | 'High' = 'Medium';
  let explanation = 'Assigned medium response queue priority under standard municipal triage rules.';

  const hasHighRiskLocations = inputLower.includes('school') ||
                               inputLower.includes('hospital') ||
                               inputLower.includes('kindergarten') ||
                               inputLower.includes('academy') ||
                               inputLower.includes('medical') ||
                               inputLower.includes('clinic') ||
                               inputLower.includes('health') ||
                               inputLower.includes('nursing home') ||
                               inputLower.includes('children') ||
                               inputLower.includes('elderly');

  if (category === 'water_leak' && (inputLower.includes('flood') || inputLower.includes('gushing') || inputLower.includes('burst') || inputLower.includes('main'))) {
    priority = 'High';
    explanation = 'Water leak presents active flooding or utility loss hazard, prioritized for repair crews.';
  } else if (category === 'pothole' && (inputLower.includes('deep') || inputLower.includes('sinkhole') || inputLower.includes('accident') || inputLower.includes('dangerous'))) {
    priority = 'High';
    explanation = 'Severe asphalt collapse threatens vehicle damage or cyclist accidents, require rapid patching.';
  } else if (hasHighRiskLocations) {
    priority = 'High';
    explanation = `Located near school/hospital/vulnerable zone, escalated for immediate child/patient safety.`;
  } else if (category === 'garbage' && (inputLower.includes('small') || inputLower.includes('solitary') || inputLower.includes('bag') || inputLower.includes('cans'))) {
    priority = 'Low';
    explanation = 'Isolated/minor litter report poses low public safety risk and will be scheduled in routine sweeps.';
  } else if (category === 'streetlight' && (inputLower.includes('daytime') || inputLower.includes('flicker') || inputLower.includes('one light'))) {
    priority = 'Low';
    explanation = 'Minor illumination issue poses low situational safety impact under streetlighting standard profiles.';
  } else if (category === 'pothole') {
    priority = 'Medium';
    explanation = 'Pothole report requires medium-term crew routing for repair/patching queue.';
  } else if (category === 'streetlight') {
    priority = 'Medium';
    explanation = 'Inactive streetlight decreases nocturnal visibility; slotted for standard service technician dispatch.';
  } else if (category === 'garbage') {
    priority = 'Medium';
    explanation = 'Public waste accumulation flagged for waste collection team within 48 hour SLA.';
  } else if (category === 'water_leak') {
    priority = 'Medium';
    explanation = 'Municipal water line leak logged for investigation and pressure testing.';
  }

  return { priority, explanation };
}

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 3. Create a new report
app.post('/api/reports', async (req, res) => {
  const { 
    category, 
    title, 
    description, 
    latitude, 
    longitude, 
    locationName, 
    imageUrl,
    predictedCategory,
    confidence,
    ignoreDuplicate
  } = req.body;

  if (!category || !title || !description || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing compulsory reporting parameters.' });
  }

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  // Check for existing open issues within 100 meters, unless forced
  if (ignoreDuplicate !== true) {
    const nearbyOpenReports = reportsDatabase.filter(r => {
      if (r.status === 'Resolved') return false;
      const distance = getDistanceInMeters(latNum, lngNum, r.latitude, r.longitude);
      return distance <= 100;
    });

    if (nearbyOpenReports.length > 0) {
      // Find the closest report
      let closestReport = nearbyOpenReports[0];
      let minDistance = getDistanceInMeters(latNum, lngNum, closestReport.latitude, closestReport.longitude);
      for (let i = 1; i < nearbyOpenReports.length; i++) {
        const d = getDistanceInMeters(latNum, lngNum, nearbyOpenReports[i].latitude, nearbyOpenReports[i].longitude);
        if (d < minDistance) {
          minDistance = d;
          closestReport = nearbyOpenReports[i];
        }
      }

      let isDuplicate = false;
      let duplicateReason = 'An open issue matches this description within 100 meters.';

      if (ai) {
        try {
          console.log(`Evaluating duplicate using Gemini: input "${title}" vs existing open "${closestReport.title}"...`);
          const contentsParts: any[] = [];

          if (imageUrl && imageUrl.startsWith('data:image/')) {
            const base64DataNew = imageUrl.replace(/^data:image\/\w+;base64,/, '');
            let mimeTypeNew = 'image/jpeg';
            const matchNew = imageUrl.match(/^data:(image\/\w+);base64,/);
            if (matchNew) mimeTypeNew = matchNew[1];
            contentsParts.push({
              inlineData: {
                mimeType: mimeTypeNew,
                data: base64DataNew,
              }
            });
          }

          if (closestReport.imageUrl && closestReport.imageUrl.startsWith('data:image/')) {
            const base64DataExist = closestReport.imageUrl.replace(/^data:image\/\w+;base64,/, '');
            let mimeTypeExist = 'image/jpeg';
            const matchExist = closestReport.imageUrl.match(/^data:(image\/\w+);base64,/);
            if (matchExist) mimeTypeExist = matchExist[1];
            contentsParts.push({
              inlineData: {
                mimeType: mimeTypeExist,
                data: base64DataExist,
              }
            });
          }

          const comparisonPrompt = `You are a civic engineering validator.
Determine if the newly reported civic issue on a street is a DUPLICATE of an existing open nearby issue.
They are located within 100 meters of each other.

New Issue:
- Category: ${category}
- Title: ${title}
- Description: ${description}

Existing Open Nearby Issue:
- Category: ${closestReport.category}
- Title: ${closestReport.title}
- Description: ${closestReport.description}

Evaluate if they describe the EXACT SAME physical asset defect / environmental hazard.
Return a strict JSON format matching:
{
  "isDuplicate": boolean,
  "confidence": number (from 0.0 to 1.0),
  "reason": "Provide a brief one-sentence triage justification why you made this decision (max 15 words) comparing details."
}`;

          contentsParts.push({ text: comparisonPrompt });

          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: { parts: contentsParts },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isDuplicate: { type: Type.BOOLEAN },
                  confidence: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                },
                required: ['isDuplicate', 'confidence', 'reason'],
              },
            },
          });

          const responseText = response.text;
          if (responseText) {
            const parsed = JSON.parse(responseText.trim());
            if (parsed.isDuplicate === true && parsed.confidence >= 0.6) {
              isDuplicate = true;
              duplicateReason = parsed.reason || 'Existing active entry reported nearby with matching attributes.';
            }
          }
        } catch (err: any) {
          console.error('Gemini duplicate detection failed, using fallback metrics:', err.message || err);
          if (category === closestReport.category) {
            isDuplicate = true;
            duplicateReason = `An open nearby ${category.replace('_', ' ')} ticket resides under 100 meters from current coordinates.`;
          }
        }
      } else {
        // Fallback simulation logic
        if (category === closestReport.category) {
          isDuplicate = true;
          duplicateReason = `An open nearby ${category.replace('_', ' ')} ticket resides under 100 meters from current coordinates.`;
        }
      }

      if (isDuplicate) {
        return res.status(200).json({
          isDuplicate: true,
          duplicateOf: closestReport,
          reason: duplicateReason
        });
      }
    }
  }

  // Generate dynamic ID
  const newId = `rep-${String(reportsDatabase.length + 1).padStart(3, '0')}`;
  
  // Compute standard dynamic or fallback illustration SVG if imageUrl is missing
  const finalImageUrl = imageUrl || getIllustrationSvg(category as IssueCategory, title);

  // Compute evaluation score via Gemini or local simulation
  const computedLocaleName = locationName || `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`;
  const { priority, explanation } = await computePriorityAndExplanation(
    category,
    title,
    description,
    computedLocaleName
  );

  const newReport: IssueReport = {
    id: newId,
    category: category as IssueCategory,
    predictedCategory: predictedCategory || undefined,
    confidence: typeof confidence === 'number' ? confidence : undefined,
    priority,
    priorityExplanation: explanation,
    title,
    description,
    status: 'Reported',
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    locationName: computedLocaleName,
    imageUrl: finalImageUrl,
    confirmations: 1, // Author is counted as first confirmation
    createdAt: new Date().toISOString(),
    timeline: [
      {
        status: 'Reported',
        date: new Date().toISOString(),
        note: `Issue logged onto Community Hero ledger with computed ${priority} priority. ${explanation}`,
      },
    ],
  };

  reportsDatabase.unshift(newReport); // Put new reports at the top of the feed
  saveReports(reportsDatabase);
  
  // Award +5 points to the current user for report submission
  const currentUser = usersDatabase.find(u => u.id === 'user-current');
  if (currentUser) {
    currentUser.points += 5;
    saveUsers(usersDatabase);
  }

  res.status(201).json({ report: newReport, users: usersDatabase });
});

// 4. Confirm/Upvote an issue
app.post('/api/reports/:id/confirm', (req, res) => {
  const { id } = req.params;
  const issueIndex = reportsDatabase.findIndex((r) => r.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue report not found.' });
  }

  const report = reportsDatabase[issueIndex];
  report.confirmations += 1;

  // Auto-update to Verified if confirmations reach 3 or more and current status is Reported
  if (report.confirmations >= 3 && report.status === 'Reported') {
    report.status = 'Verified';
    report.timeline.push({
      status: 'Verified',
      date: new Date().toISOString(),
      note: `Issue has been automatically updated to 'Verified' because it has reached ${report.confirmations} community confirmations.`,
    });
  }

  // Award +1 point to the current user for upvoting/confirming
  const currentUser = usersDatabase.find(u => u.id === 'user-current');
  if (currentUser) {
    currentUser.points += 1;
    saveUsers(usersDatabase);
  }

  saveReports(reportsDatabase);
  res.json({ report, users: usersDatabase });
});

// 4b. Get recurring hotspots with Gemini analysis or contextual fallback
app.get('/api/hotspots', async (req, res) => {
  try {
    // 1. Establish 30-day window relative to the latest report date or current time
    const dates = reportsDatabase.map(r => new Date(r.createdAt).getTime());
    const maxTime = dates.length > 0 ? Math.max(...dates) : new Date().getTime();
    const thirtyDaysAgo = maxTime - 30 * 24 * 60 * 60 * 1000;
    
    const recentReports = reportsDatabase.filter(r => new Date(r.createdAt).getTime() >= thirtyDaysAgo);

    // 2. Double check if we have any category with 3+ reports within 30 days
    const categoryCounts: Record<string, number> = {};
    recentReports.forEach(r => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });

    const hasAnyEligibleHotspot = Object.values(categoryCounts).some(count => count >= 3);

    if (!hasAnyEligibleHotspot) {
      // Return empty array if not even 3 reports exist in any category
      return res.json({ hotspots: [] });
    }

    // Attempt Gemini API if client initialized
    if (ai) {
      try {
        const systemPrompt = `You are an urban planning civic technology analyst. 
Analyze the provided city reports from the last 30 days and flag any hotspot areas where 3 or more issues of the same category have been reported in close proximity (e.g. same street, intersection, park, or within 1.5km of each other).
Return the results in a strict JSON format with an array of hotspots:
{
  "hotspots": [
    {
      "category": "pothole | streetlight | garbage | water_leak | other",
      "areaName": "e.g. Valencia St Corridor or Mission District",
      "reportCount": 3,
      "reportIds": ["rep-001", "rep-002", "rep-009"],
      "explanation": "A short, elegant 2-3 sentence analysis of why this area of the city is experiencing a recurring pattern of these hazards and a suggested municipal response.",
      "severity": "Medium | High | Critical"
    }
  ]
}
If there are no actual spatial clusters of 3+ reports within the same category, return {"hotspots": []}.`;

        const userPrompt = `Here is the current listing of recent reports with their categories, titles, coordinates, and descriptions:
${JSON.stringify(recentReports.map(r => ({ id: r.id, category: r.category, title: r.title, description: r.description, latitude: r.latitude, longitude: r.longitude, locationName: r.locationName, date: r.createdAt })), null, 2)}
Please analyze these reports for spatial/semantic clusters with 3+ issues of the same category and return the JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: { parts: [{ text: systemPrompt }, { text: userPrompt }] },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                hotspots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      areaName: { type: Type.STRING },
                      reportCount: { type: Type.NUMBER },
                      reportIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                      explanation: { type: Type.STRING },
                      severity: { type: Type.STRING },
                    },
                    required: ['category', 'areaName', 'reportCount', 'reportIds', 'explanation', 'severity'],
                  }
                }
              },
              required: ['hotspots'],
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json(parsed);
        }
      } catch (geminiError) {
        console.error('Gemini Hotspot Analysis error, running fallback:', geminiError);
      }
    }

    // Default high-fidelity fallbacks matching the reports in reportsDatabase
    const hotspots = [];
    
    // Check key categories for 3+ reports dynamically
    const potholes = recentReports.filter(r => r.category === 'pothole');
    const streetlights = recentReports.filter(r => r.category === 'streetlight');
    const garbage = recentReports.filter(r => r.category === 'garbage');
    const waterLeaks = recentReports.filter(r => r.category === 'water_leak');

    if (potholes.length >= 3) {
      hotspots.push({
        category: 'pothole',
        areaName: 'Valencia St & Mission Corridor',
        reportCount: potholes.length,
        reportIds: potholes.slice(0, 3).map(p => p.id),
        explanation: 'A concentrated spike in asphalt degradation has been flagged across the Valencia corridor. Heavy commercial transit paired with early-winter weathering has expanded underlying cracks into deep vehicle hazards. Urgent cold-mix patching has been queued.',
        severity: 'High'
      });
    }

    if (streetlights.length >= 3) {
      hotspots.push({
        category: 'streetlight',
        areaName: 'Castro & Haight Pedestrian crossings',
        reportCount: streetlights.length,
        reportIds: streetlights.slice(0, 3).map(s => s.id),
        explanation: 'Nocturnal pathway illumination outages have reached critical density across key Haight crossings, presenting visibility hazards for drivers and pedestrians. Utility crews have been scheduled for ballast diagnostic testing.',
        severity: 'Medium'
      });
    }

    if (garbage.length >= 3) {
      hotspots.push({
        category: 'garbage',
        areaName: 'Mission Dolores Park & Plaza Hubs',
        reportCount: garbage.length,
        reportIds: garbage.slice(0, 3).map(g => g.id),
        explanation: 'Civic waste pile-ups have spiked near municipal parks, leading to overflowing trash bins and loose debris scattering. Scheduled public cleaning routes have been doubled to maintain environmental hygiene.',
        severity: 'Critical'
      });
    }

    if (waterLeaks.length >= 3) {
      hotspots.push({
        category: 'water_leak',
        areaName: 'Sidewalk Main Lines & Hydrants',
        reportCount: waterLeaks.length,
        reportIds: waterLeaks.slice(0, 3).map(w => w.id),
        explanation: 'Recurrent sidewalk water bubbles and hydrant leaks have been verified near local merchants. Pedestrian slip-hazards are forming green moss. Municipal water technicians are dispatched to isolate and pressure test line valves.',
        severity: 'High'
      });
    }

    res.json({ hotspots });
  } catch (err) {
    console.error('Hotspot endpoint crash:', err);
    res.status(500).json({ error: 'Failed to complete hotspot spatial analysis.' });
  }
});

// 5. Update Status manually (Testing & Moderator Controls)
app.post('/api/reports/:id/status-update', (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses: IssueStatus[] = ['Reported', 'Verified', 'In Progress', 'Resolved'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid target status. Must be one of ${validStatuses.join(', ')}` });
  }

  const issueIndex = reportsDatabase.findIndex((r) => r.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue report not found.' });
  }

  const report = reportsDatabase[issueIndex];
  report.status = status as IssueStatus;
  report.timeline.push({
    status: status as IssueStatus,
    date: new Date().toISOString(),
    note: note || `Administrative milestone: Status transitioned to ${status}.`,
  });

  saveReports(reportsDatabase);
  res.json({ report });
});

// Start listening and serve client files
async function run() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Community Hero civic platform running at http://localhost:${PORT}`);
  });
}

run().catch((e) => {
  console.error('Fatal dev server crash:', e);
});
