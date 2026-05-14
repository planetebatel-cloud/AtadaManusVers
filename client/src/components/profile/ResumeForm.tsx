import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { ResumeData, ResumeExperience, ResumeEducation } from "@/lib/resume-types";

interface ResumeFormProps {
  data: ResumeData;
  updateField: <K extends keyof ResumeData>(field: K, value: ResumeData[K]) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addExperience: () => void;
  updateExperience: (id: string, updates: Partial<ResumeExperience>) => void;
  removeExperience: (id: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, updates: Partial<ResumeEducation>) => void;
  removeEducation: (id: string) => void;
  updateContact: (updates: Partial<ResumeData["contact"]>) => void;
}

const stagger = (i: number) => ({ delay: 0.06 * i, duration: 0.35 });

export function ResumeForm({
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
}: ResumeFormProps) {
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed) {
      addSkill(trimmed);
      setNewSkill("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Personal Info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={stagger(0)}
        className="atada-card p-5"
      >
        <div className="label-xs mb-3">Personal Info</div>
        <div className="flex flex-col gap-3">
          <input
            className="atada-input"
            placeholder="Full name"
            value={data.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
          <input
            className="atada-input"
            placeholder="Professional title"
            value={data.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
          <input
            className="atada-input"
            placeholder="Location"
            value={data.location}
            onChange={(e) => updateField("location", e.target.value)}
          />
        </div>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={stagger(1)}
        className="atada-card p-5"
      >
        <div className="label-xs mb-3">About</div>
        <textarea
          className="atada-input !rounded-xl"
          style={{ minHeight: 100, resize: "vertical" }}
          placeholder="Write a short professional summary..."
          value={data.about}
          onChange={(e) => updateField("about", e.target.value)}
        />
      </motion.div>

      {/* Skills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={stagger(2)}
        className="atada-card p-5"
      >
        <div className="label-xs mb-3">Skills</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#FAFAFA] border border-[#D8D8D8] text-[#505050] rounded-md"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="text-[#B8B8B8] hover:text-[#0A0A0A] transition-colors ml-0.5"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="atada-input flex-1"
            placeholder="Add a skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
          />
          <button onClick={handleAddSkill} className="btn-pill btn-pill-outline !py-2 !px-3">
            <Plus size={14} />
          </button>
        </div>
      </motion.div>

      {/* Experience */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={stagger(3)}
        className="atada-card p-5"
      >
        <div className="label-xs mb-3">Experience</div>
        <div className="flex flex-col gap-4">
          {data.experience.map((exp) => (
            <div key={exp.id} className="relative p-3 bg-[#FAFAFA] rounded-lg border border-[#ECECEC]">
              <button
                onClick={() => removeExperience(exp.id)}
                className="absolute top-2 right-2 text-[#B8B8B8] hover:text-[#0A0A0A] transition-colors"
              >
                <X size={14} />
              </button>
              <div className="flex flex-col gap-2 pr-6">
                <input
                  className="atada-input !bg-white"
                  placeholder="Job title"
                  value={exp.title}
                  onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                />
                <input
                  className="atada-input !bg-white"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    className="atada-input !bg-white flex-1"
                    placeholder="Start date"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                  />
                  <input
                    className="atada-input !bg-white flex-1"
                    placeholder="End date"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                  />
                </div>
                <textarea
                  className="atada-input !bg-white !rounded-xl"
                  style={{ minHeight: 64, resize: "vertical" }}
                  placeholder="Description"
                  value={exp.description}
                  onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addExperience}
          className="btn-pill btn-pill-outline mt-3 w-full gap-1.5"
        >
          <Plus size={14} />
          Add Experience
        </button>
      </motion.div>

      {/* Education */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={stagger(4)}
        className="atada-card p-5"
      >
        <div className="label-xs mb-3">Education</div>
        <div className="flex flex-col gap-4">
          {data.education.map((edu) => (
            <div key={edu.id} className="relative p-3 bg-[#FAFAFA] rounded-lg border border-[#ECECEC]">
              <button
                onClick={() => removeEducation(edu.id)}
                className="absolute top-2 right-2 text-[#B8B8B8] hover:text-[#0A0A0A] transition-colors"
              >
                <X size={14} />
              </button>
              <div className="flex flex-col gap-2 pr-6">
                <input
                  className="atada-input !bg-white"
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                />
                <input
                  className="atada-input !bg-white"
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                />
                <input
                  className="atada-input !bg-white"
                  placeholder="Year"
                  value={edu.year}
                  onChange={(e) => updateEducation(edu.id, { year: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addEducation}
          className="btn-pill btn-pill-outline mt-3 w-full gap-1.5"
        >
          <Plus size={14} />
          Add Education
        </button>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={stagger(5)}
        className="atada-card p-5"
      >
        <div className="label-xs mb-3">Contact</div>
        <div className="flex flex-col gap-3">
          <input
            className="atada-input"
            placeholder="Email"
            value={data.contact.email}
            onChange={(e) => updateContact({ email: e.target.value })}
          />
          <input
            className="atada-input"
            placeholder="Phone"
            value={data.contact.phone}
            onChange={(e) => updateContact({ phone: e.target.value })}
          />
          <input
            className="atada-input"
            placeholder="Website"
            value={data.contact.website}
            onChange={(e) => updateContact({ website: e.target.value })}
          />
          <input
            className="atada-input"
            placeholder="LinkedIn"
            value={data.contact.linkedin}
            onChange={(e) => updateContact({ linkedin: e.target.value })}
          />
        </div>
      </motion.div>
    </div>
  );
}
