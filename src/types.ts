/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory = 'pothole' | 'streetlight' | 'garbage' | 'water_leak' | 'other';

export type IssueStatus = 'Reported' | 'Verified' | 'In Progress' | 'Resolved';

export type IssuePriority = 'Low' | 'Medium' | 'High';

export interface TimelineEvent {
  status: IssueStatus;
  date: string;
  note: string;
}

export interface IssueReport {
  id: string;
  category: IssueCategory;
  predictedCategory?: IssueCategory;
  confidence?: number;
  priority?: IssuePriority;
  priorityExplanation?: string;
  title: string;
  description: string;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  locationName: string;
  imageUrl: string;
  confirmations: number;
  createdAt: string;
  timeline: TimelineEvent[];
}

export interface ClassificationResult {
  category: IssueCategory;
  confidence: number;
  description: string;
}

export interface Contributor {
  id: string;
  name: string;
  points: number;
  avatarColor?: string;
  isCurrentUser?: boolean;
}

export interface Hotspot {
  category: IssueCategory;
  areaName: string;
  reportCount: number;
  reportIds: string[];
  explanation: string;
  severity: 'Medium' | 'High' | 'Critical';
}


