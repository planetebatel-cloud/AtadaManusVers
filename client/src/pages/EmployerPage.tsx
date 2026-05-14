/*
 * ATADA — Employer Portal
 * Dashboard + Job posting + Applicant management
 */

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Briefcase, Users, BarChart3, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  getEmployerDashboard, getApplicants, updateApplicantStatus,
  getJobs, getToken, type EmployerDashboard, type ApplicationData, type JobData,
} from "@/lib/api";
import { toast } from "sonner";

type Tab = "dashboard" | "applicants" | "post";

export default function EmployerPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dashboard, setDashboard] = useState<EmployerDashboard | null>(null);
  const [applicants, setApplicants] = useState<ApplicationData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

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
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#ECECEC]">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-[#505050] hover:text-[#0A0A0A] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
          <span className="label-xs" style={{ fontFamily: "'DM Mono', monospace" }}>EMPLOYER PORTAL</span>
        </div>
        <div className="w-8" />
      </header>

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
        ) : (
          <>
            {tab === "dashboard" && <DashboardTab dashboard={dashboard} />}
            {tab === "applicants" && <ApplicantsTab applicants={applicants} jobs={jobs} onStatusChange={handleStatusChange} />}
            {tab === "post" && <PostJobTab onPosted={() => { setTab("dashboard"); toast.success("Job posted!"); }} />}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────────────────────

function DashboardTab({ dashboard }: { dashboard: EmployerDashboard | null }) {
  if (!dashboard) {
    return (
      <div className="atada-card p-8 text-center">
        <BarChart3 size={32} className="text-[#D8D8D8] mx-auto mb-3" />
        <p className="text-[14px] font-medium text-[#505050]">Employer access required</p>
        <p className="text-[12px] text-[#B8B8B8] mt-1">Log in as an employer to see your dashboard.</p>
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
