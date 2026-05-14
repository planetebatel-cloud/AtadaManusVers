/**
 * ATADA — API Client
 * Connects frontend to FastAPI backend.
 * Handles auth tokens, SSE streaming, and all API calls.
 */

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// ─── Token Management ──────────────────────────────────────────────────────

let accessToken: string | null = localStorage.getItem("atada_token");
let refreshToken: string | null = localStorage.getItem("atada_refresh");

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("atada_token", access);
  localStorage.setItem("atada_refresh", refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("atada_token");
  localStorage.removeItem("atada_refresh");
  localStorage.removeItem("atada_user");
}

export function getToken() {
  return accessToken;
}

export function isAuthenticated() {
  return !!accessToken;
}

// ─── Fetch Wrapper ─────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && refreshToken) {
    // Try refresh
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`;
      const retry = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!retry.ok) throw new Error(`API error: ${retry.status}`);
      return retry.json();
    }
    clearTokens();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }

  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ─── Auth API ──────────────────────────────────────────────────────────────

export async function sendOTP(phone: string) {
  return apiFetch<{ message: string; phone: string; demo: boolean }>(
    "/auth/otp/send",
    {
      method: "POST",
      body: JSON.stringify({ phone }),
    },
  );
}

export async function peekDemoOTP(phone: string) {
  return apiFetch<{ code: string; expires_at: string }>(
    `/auth/otp/peek?phone=${encodeURIComponent(phone)}`,
  );
}

export async function verifyOTP(phone: string, code: string) {
  const data = await apiFetch<{
    access_token: string;
    refresh_token: string;
    user_id: string;
  }>("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });
  setTokens(data.access_token, data.refresh_token);
  localStorage.setItem("atada_user_id", data.user_id);
  return data;
}

export async function getMe() {
  return apiFetch<UserProfile>("/auth/me");
}

// ─── Jobs API ──────────────────────────────────────────────────────────────

export async function getJobs(skip = 0, limit = 20) {
  return apiFetch<JobData[]>(`/jobs?skip=${skip}&limit=${limit}`);
}

export async function getJobFeed(limit = 20) {
  return apiFetch<JobData[]>(`/jobs/feed?limit=${limit}`);
}

export async function getJob(id: string) {
  return apiFetch<JobData>(`/jobs/${id}`);
}

export async function swipeJob(jobId: string, action: "apply" | "skip") {
  return apiFetch<any>("/jobs/swipe", {
    method: "POST",
    body: JSON.stringify({ job_id: jobId, action }),
  });
}

// ─── Users API ─────────────────────────────────────────────────────────────

export async function updateProfile(data: Partial<UserProfile>) {
  return apiFetch<UserProfile>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getMyApplications() {
  return apiFetch<ApplicationData[]>("/users/me/applications");
}

export async function getCandidates(params?: { skills?: string; location?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.skills) qs.set("skills", params.skills);
  if (params?.location) qs.set("location", params.location);
  if (params?.limit) qs.set("limit", String(params.limit));
  return apiFetch<CandidateData[]>(`/users/candidates?${qs}`);
}

// ─── Chat API (SSE) ────────────────────────────────────────────────────────

export async function* streamChat(message: string): AsyncGenerator<ChatChunk> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
  });

  if (!res.ok || !res.body) {
    throw new Error("Chat stream failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data as ChatChunk;
        } catch {}
      }
    }
  }
}

// ─── Payments API ──────────────────────────────────────────────────────────

export async function createCheckout(plan: string) {
  return apiFetch<{ session_id: string; url: string }>("/payments/checkout", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export async function getInvoices() {
  return apiFetch<InvoiceData[]>("/payments/invoices");
}

// ─── Employer API ──────────────────────────────────────────────────────────

export async function getEmployerDashboard() {
  return apiFetch<EmployerDashboard>("/employer/dashboard");
}

export async function getApplicants(params?: { status?: string; job_id?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.job_id) qs.set("job_id", params.job_id);
  return apiFetch<ApplicationData[]>(`/employer/applicants?${qs}`);
}

export async function updateApplicantStatus(appId: string, status: string) {
  return apiFetch<ApplicationData>(`/employer/applicants/${appId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  phone?: string;
  name?: string;
  email?: string;
  location?: string;
  lat?: number | null;
  lng?: number | null;
  skills: string[];
  title?: string;
  about?: string;
  role: string;
  plan: string;
}

export interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_period: string;
  job_type: string;
  tags: string[];
  description: string | null;
  image_url: string | null;
  posted_at: string | null;
  match_score: number | null;
  distance: string | null;
  travel_time: string | null;
  reachable: boolean;
  drive_minutes: number | null;
  transit_minutes: number | null;
  distance_km: number | null;
  commute_source: string | null;
}

export interface ApplicationData {
  id: string;
  user_id: string;
  job_id: string;
  status: string;
  match_score: number | null;
  created_at: string;
}

export interface CandidateData {
  id: string;
  name: string;
  title: string | null;
  location: string | null;
  skills: string[];
  experience_years: number;
  about: string | null;
  trust_score: number;
  is_newbie: boolean;
}

export interface ChatChunk {
  type: "text_chunk" | "candidates_data" | "done";
  content?: string;
  candidates?: CandidateData[];
}

export interface InvoiceData {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  pdf_path: string | null;
  status: string;
  created_at: string;
}

export interface EmployerDashboard {
  total_jobs: number;
  active_jobs: number;
  total_applicants: number;
  new_applicants: number;
  plan: string;
}
