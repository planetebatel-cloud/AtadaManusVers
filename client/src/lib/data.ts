/*
 * ATADA — Data Layer
 * Types + API adapters + mock fallbacks
 */

import type { JobData } from "./api";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  distance: string;
  travelTime: string;
  salary: string;
  type: "full-time" | "part-time" | "contract" | "gig";
  tags: string[];
  reachable: boolean;
  matchScore: number;
  postedAt: string;
  description: string;
  imageUrl?: string;
  driveMinutes?: number | null;
  transitMinutes?: number | null;
  distanceKm?: number | null;
}

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  location: string;
  skills: string[];
  title?: string;
}

// ─── Mock User ──────────────────────────────────────────────────────────────

export const mockUser: UserProfile = {
  id: "u_001",
  name: "Alex M.",
  initials: "AM",
  location: "Tel Aviv",
  skills: ["React", "TypeScript", "Node.js"],
  title: "Frontend Developer",
};

// ─── Mock Jobs ───────────────────────────────────────────────────────────────

export const mockJobs: Job[] = [
  {
    id: "j_001",
    title: "Frontend Developer",
    company: "Wix",
    location: "Tel Aviv",
    distance: "2.4 km",
    travelTime: "18 min",
    salary: "₪40/h",
    type: "contract",
    tags: ["React", "TypeScript", "Remote-friendly"],
    reachable: true,
    matchScore: 94,
    postedAt: "2h ago",
    description: "Build high-performance UI components for a global SaaS platform. Work with a senior team on cutting-edge web tech.",
  },
  {
    id: "j_002",
    title: "UX Engineer",
    company: "Monday.com",
    location: "Tel Aviv",
    distance: "3.1 km",
    travelTime: "22 min",
    salary: "₪45/h",
    type: "full-time",
    tags: ["Figma", "React", "Design Systems"],
    reachable: true,
    matchScore: 88,
    postedAt: "4h ago",
    description: "Bridge design and engineering. Own the component library and drive design system adoption across 12 product teams.",
  },
  {
    id: "j_003",
    title: "React Native Dev",
    company: "Rapyd",
    location: "Haifa",
    distance: "94 km",
    travelTime: "1h 20min",
    salary: "₪38/h",
    type: "contract",
    tags: ["React Native", "Mobile", "Fintech"],
    reachable: false,
    matchScore: 71,
    postedAt: "6h ago",
    description: "Develop mobile payment flows for a global fintech platform. Requires deep React Native expertise.",
  },
  {
    id: "j_004",
    title: "Full Stack Engineer",
    company: "Fiverr",
    location: "Tel Aviv",
    distance: "1.8 km",
    travelTime: "14 min",
    salary: "₪50/h",
    type: "full-time",
    tags: ["Node.js", "React", "PostgreSQL"],
    reachable: true,
    matchScore: 82,
    postedAt: "1d ago",
    description: "Own features end-to-end on a marketplace used by 4M+ freelancers. Fast-paced, high-ownership environment.",
  },
  {
    id: "j_005",
    title: "TypeScript Architect",
    company: "JFrog",
    location: "Netanya",
    distance: "31 km",
    travelTime: "40 min",
    salary: "₪60/h",
    type: "full-time",
    tags: ["TypeScript", "Architecture", "DevTools"],
    reachable: true,
    matchScore: 79,
    postedAt: "1d ago",
    description: "Lead TypeScript architecture for developer tooling products. Define patterns, mentor engineers, and drive technical strategy.",
  },
  {
    id: "j_006",
    title: "UI Developer",
    company: "Elementor",
    location: "Tel Aviv",
    distance: "2.9 km",
    travelTime: "20 min",
    salary: "₪35/h",
    type: "part-time",
    tags: ["CSS", "React", "WordPress"],
    reachable: true,
    matchScore: 66,
    postedAt: "2d ago",
    description: "Build pixel-perfect UI for the world's most popular website builder. Part-time, flexible hours.",
  },
];

// ─── Mock AI Chat Messages ────────────────────────────────────────────────────

export const initialChatMessages: ChatMessage[] = [
  {
    id: "m_001",
    role: "ai",
    content: "Hey Alex. I found 6 jobs near you matching your React + TypeScript profile.",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: "m_002",
    role: "ai",
    content: "This one at Wix is 18 minutes away and pays ₪40/h. 94% match. Want to apply?",
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
  },
];

export const detailChatMessages: ChatMessage[] = [
  {
    id: "dm_001",
    role: "ai",
    content: "I've ranked these jobs by match score and travel time. The top 3 are all reachable within 25 minutes.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: "dm_002",
    role: "ai",
    content: "The Wix role matches 4 of your 5 top skills. Monday.com is slightly further but pays 12% more.",
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
  },
  {
    id: "dm_003",
    role: "ai",
    content: "Rapyd in Haifa is a strong technical match but travel time is 1h 20min — flagged as unreachable for your preferences.",
    timestamp: new Date(Date.now() - 6 * 60 * 1000),
  },
];

// ─── AI Response Simulator ────────────────────────────────────────────────────
// Future: Replace with LangChain / OpenAI streaming

const aiResponses = [
  "You can reach this job in 25 minutes by public transit.",
  "This one matches your profile better — 88% skill overlap.",
  "The salary is 15% above your current target range.",
  "3 similar roles opened in the last 24 hours in your area.",
  "Based on your profile, you have a strong chance here. Apply now?",
  "This company has a 4.2/5 rating from employees.",
  "I can help you tailor your resume for this role.",
  "Want me to compare this with the Monday.com offer?",
  "This is a contract role — typically 3–6 months with renewal option.",
  "You've skipped 2 similar roles. Want to revisit them?",
];

let aiResponseIndex = 0;

export function getNextAiResponse(): string {
  const response = aiResponses[aiResponseIndex % aiResponses.length];
  aiResponseIndex++;
  return response;
}

// ─── API → Frontend Adapter ──────────────────────────────────────────────────

export function apiJobToJob(j: JobData): Job {
  let salary = "";
  if (j.salary_min) {
    salary = `₪${j.salary_min}`;
    if (j.salary_max && j.salary_max !== j.salary_min) {
      salary = `₪${j.salary_min}-${j.salary_max}`;
    }
    salary += `/${j.salary_period === "hour" ? "h" : j.salary_period === "month" ? "mo" : "yr"}`;
  }

  const posted = j.posted_at
    ? formatTimeAgo(new Date(j.posted_at))
    : "recently";

  return {
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    distance: j.distance || "",
    travelTime: j.travel_time || "",
    salary,
    type: j.job_type as Job["type"],
    tags: j.tags,
    reachable: j.reachable,
    matchScore: j.match_score ?? 50,
    postedAt: posted,
    description: j.description || "",
    imageUrl: j.image_url || undefined,
    driveMinutes: j.drive_minutes,
    transitMinutes: j.transit_minutes,
    distanceKm: j.distance_km,
  };
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
