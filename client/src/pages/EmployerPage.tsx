/*
 * ATADA — Employer Portal
 * Dashboard + Job posting + Applicant management
 */

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Briefcase, Users, BarChart3, X, ChevronDown, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  getEmployerDashboard, getApplicants, updateApplicantStatus,
  getJobs, getToken, sendOTP, peekDemoOTP, verifyOTP,
  type EmployerDashboard, type ApplicationData, type JobData,
} from "@/lib/api";
import { toast } from "sonner";

const EMPLOYER_DEMO_PHONE = "+972509876543";

type Tab = "dashboard" | "applicants" | "post";

export default function EmployerPage() {
  const [, setLocation] = useLocation();
  const { user, login, authenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dashboard, setDashboard] = useState<EmployerDashboard | null>(null);
  const [applicants, setApplicants] = useState<ApplicationData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, apps, jobList] = await Promise.all([
        getEmployerDashboard().catch(() => null),
        getApplicants().catch(() => []),
        getJobs(0, 50).catch(() => []),
      ]);
      setDashboard(dash);
      setApplicants(apps);
      setJobs(jobList);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEmployerDemo = useCallback(async () => {
    setDemoLoading(true);
    try {
      await sendOTP(EMPLOYER_DEMO_PHONE);
      const peeked = await peekDemoOTP(EMPLOYER_DEMO_PHONE);
      const data = await verifyOTP(EMPLOYER_DEMO_PHONE, peeked.code);
      await login(data.access_token, data.refresh_token);
      toast.success("Logged in as Employer demo");
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Demo login failed");
    }
    setDemoLoading(false);
  }, [login, loadData]);

  const needsLogin = !authenticated || (!loading && dashboard === null);

  const handleStatusChange = useCallback(async (appId: string, status: string) => {
    try {
      await updateApplicantStatus(appId, status);
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F7F7F7]">
      {/* Tabs */}
      <div className="flex bg-white border-b border-[#ECECEC]">
        {([
          { id: "dashboard" as Tab, label: "Dashboard", icon: BarChart3 },
          { id: "applicants" as Tab, label: "Applicants", icon: Users },
          { id: "post" as Tab, label: "Post Job", icon: Plus },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors ${
              tab === id ? "text-[#0A0A0A] border-b-2 border-[#0A0A0A]" : "text-[#808080]"
            }`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-[800px] mx-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16"><span className="label-xs">Loading...</span></div>
        ) : needsLogin ? (
          <EmployerLoginPrompt onDemo={handleEmployerDemo} loading={demoLoading} authenticated={authenticated} />
        ) : (
          <>
            {tab === "dashboard" && <DashboardTab dashboard={dashboard} />}
            {tab === "applicants" && <ApplicantsTab applicants={applicants} jobs={jobs} onStatusChange={handleStatusChange} />}
            {tab === "post" && <PostJobTab onPosted={() => { setTab("dashboard"); loadData(); toast.success("Job posted!"); }} />}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Employer Login Prompt ──────────────────────────────────────────────────

function EmployerLoginPrompt({
  onDemo, loading, authenticated,
}: {
  onDemo: () => void; loading: boolean; authenticated: boolean;
}) {
  const [, setLocation] = useLocation();
  return (
    <div className="atada-card p-8 text-center">
      <Sparkles size={28} className="text-[#0A0A0A] mx-auto mb-3" />
      <p className="text-[16px] font-semibold text-[#0A0A0A] mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Employer access required
      </p>
      <p className="text-[12px] text-[#808080] mb-5 max-w-[360px] mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {authenticated
          ? "Your current account isn't an employer. Switch to the employer demo to post jobs and review applicants."
          : "One-click demo, no phone required. Post jobs, view AI-matched candidates, manage your hiring funnel."}
      </p>
      <div className="flex flex-col gap-2 max-w-[280px] mx-auto">
        <button
          type="button"
          onClick={onDemo}
          disabled={loading}
          className="btn-pill btn-pill-solid h-10 text-[12px] disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Try Employer Demo"}
        </button>
        <button
          type="button"
          onClick={() => setLocation("/auth")}
          className="btn-pill btn-pill-outline h-10 text-[12px]"
        >
          Use phone login instead
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────────────────────

function DashboardTab({ dashboard }: { dashboard: EmployerDashboard | null }) {
  if (!dashboard) {
    // Reachable only as a defensive fallback — needsLogin gate in parent
    // normally renders <EmployerLoginPrompt> in this state.
    return (
      <div className="atada-card p-8 text-center">
        <BarChart3 size={32} className="text-[#D8D8D8] mx-auto mb-3" />
        <p className="text-[14px] font-medium text-[#505050]">No data yet</p>
      </div>
    );
  }

  const stats = [
    { label: "Active Jobs", value: dashboard.active_jobs, total: dashboard.total_jobs },
    { label: "New Applicants", value: dashboard.new_applicants, total: dashboard.total_applicants },
    { label: "Plan", value: dashboard.plan.replace("_", " ").toUpperCase() },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="atada-card p-4 text-center"
          >
            <div className="text-[28px] font-bold text-[#0A0A0A]" style={{ fontFamily: "'DM Mono', monospace" }}>
              {s.value}
            </div>
            {s.total !== undefined && (
              <div className="text-[11px] text-[#B8B8B8] mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                of {s.total}
              </div>
            )}
            <div className="label-xs">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Applicants Tab ─────────────────────────────────────────────────────────

const STATUSES = ["applied", "reviewed", "interview", "offer", "rejected"];

function ApplicantsTab({
  applicants, jobs, onStatusChange,
}: {
  applicants: ApplicationData[];
  jobs: JobData[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const jobMap = new Map(jobs.map(j => [j.id, j]));

  if (applicants.length === 0) {
    return (
      <div className="atada-card p-8 text-center">
        <Users size={32} className="text-[#D8D8D8] mx-auto mb-3" />
        <p className="text-[14px] font-medium text-[#505050]">No applicants yet</p>
        <p className="text-[12px] text-[#B8B8B8] mt-1">Post a job to start receiving applications.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {applicants.map((app, i) => {
        const job = jobMap.get(app.job_id);
        return (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="atada-card p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#0A0A0A] truncate">
                  Applicant for: {job?.title || "Unknown Job"}
                </p>
                <p className="text-[11px] text-[#808080]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {new Date(app.created_at).toLocaleDateString()} · Score: {app.match_score ?? "—"}
                </p>
              </div>
              <select
                value={app.status}
                onChange={(e) => onStatusChange(app.id, e.target.value)}
                className="text-[11px] px-2 py-1.5 border border-[#D8D8D8] rounded-md bg-white"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Post Job Tab ───────────────────────────────────────────────────────────

function PostJobTab({ onPosted }: { onPosted: () => void }) {
  const [form, setForm] = useState({
    title: "", company: "", location: "", description: "",
    salary_min: "", salary_max: "", job_type: "full-time",
    tags: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.location) {
      toast.error("Fill in title, company, and location");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: form.title,
          company: form.company,
          location: form.location,
          description: form.description,
          salary_min: form.salary_min ? parseInt(form.salary_min) : null,
          salary_max: form.salary_max ? parseInt(form.salary_max) : null,
          job_type: form.job_type,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) onPosted();
      else toast.error("Failed to post job");
    } catch {
      toast.error("Failed to post job");
    }
    setLoading(false);
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="atada-card p-5">
        <div className="label-xs mb-3">Job Details</div>
        <div className="flex flex-col gap-3">
          <input className="atada-input" placeholder="Job title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="atada-input" placeholder="Company name *" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          <input className="atada-input" placeholder="Location *" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <textarea className="atada-input !rounded-xl" style={{ minHeight: 80, resize: "vertical" }} placeholder="Job description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </div>

      <div className="atada-card p-5">
        <div className="label-xs mb-3">Compensation & Type</div>
        <div className="flex gap-3">
          <input className="atada-input flex-1" placeholder="Min ILS/hr" type="number" value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))} />
          <input className="atada-input flex-1" placeholder="Max ILS/hr" type="number" value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))} />
        </div>
        <select className="atada-input mt-3" value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))}>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="gig">Gig</option>
        </select>
      </div>

      <div className="atada-card p-5">
        <div className="label-xs mb-3">Tags</div>
        <input className="atada-input" placeholder="React, TypeScript, Node.js (comma-separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
      </div>

      <button type="submit" disabled={loading} className="btn-pill btn-pill-solid h-11 gap-2 disabled:opacity-50">
        {loading ? "Posting..." : "Post Job — 199 ILS"}
      </button>
    </motion.form>
  );
}
