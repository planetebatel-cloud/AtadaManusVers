import { useState, useCallback, useEffect } from "react";
import type { ResumeData, ResumeExperience, ResumeEducation } from "@/lib/resume-types";
import { nanoid } from "nanoid";

const STORAGE_KEY = "atada_resume";

const defaultResume: ResumeData = {
  name: "Alex M.",
  title: "Frontend Developer",
  location: "Tel Aviv",
  about: "Passionate frontend developer with expertise in React, TypeScript, and modern web technologies. Focused on building high-performance, accessible user interfaces.",
  skills: ["React", "TypeScript", "Node.js"],
  experience: [
    {
      id: "exp_001",
      company: "Freelance",
      title: "Frontend Developer",
      startDate: "Jan 2023",
      endDate: "Present",
      description: "Building high-performance UI components for SaaS platforms. Working with React, TypeScript, and modern tooling.",
    },
  ],
  education: [
    {
      id: "edu_001",
      institution: "Tel Aviv University",
      degree: "B.Sc. Computer Science",
      year: "2022",
    },
  ],
  contact: {
    email: "alex@example.com",
    phone: "+972-50-000-0000",
    website: "",
    linkedin: "",
  },
};

function loadFromStorage(): ResumeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultResume;
}

export function useResumeState() {
  const [data, setData] = useState<ResumeData>(loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateField = useCallback(<K extends keyof ResumeData>(field: K, value: ResumeData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addSkill = useCallback((skill: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills : [...prev.skills, skill],
    }));
  }, []);

  const removeSkill = useCallback((skill: string) => {
    setData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }, []);

  const addExperience = useCallback(() => {
    const newExp: ResumeExperience = {
      id: nanoid(),
      company: "",
      title: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    setData((prev) => ({ ...prev, experience: [...prev.experience, newExp] }));
  }, []);

  const updateExperience = useCallback((id: string, updates: Partial<ResumeExperience>) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
  }, []);

  const addEducation = useCallback(() => {
    const newEdu: ResumeEducation = {
      id: nanoid(),
      institution: "",
      degree: "",
      year: "",
    };
    setData((prev) => ({ ...prev, education: [...prev.education, newEdu] }));
  }, []);

  const updateEducation = useCallback((id: string, updates: Partial<ResumeEducation>) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  }, []);

  const updateContact = useCallback((updates: Partial<ResumeData["contact"]>) => {
    setData((prev) => ({
      ...prev,
      contact: { ...prev.contact, ...updates },
    }));
  }, []);

  return {
    data,
    updateField,
    addSkill,
    removeSkill,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateContact,
  };
}
