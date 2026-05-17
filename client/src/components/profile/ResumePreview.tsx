import { forwardRef, memo } from "react";
import type { ResumeData } from "@/lib/resume-types";
import { Mail, Phone, Globe, Linkedin, MapPin } from "lucide-react";

interface ResumePreviewProps {
  data: ResumeData;
}

const ResumePreviewInner = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ data }, ref) => {
    const initials = data.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        ref={ref}
        className="bg-white"
        style={{
          width: 794,
          minHeight: 1123,
          padding: "60px 56px",
          fontFamily: "'DM Sans', sans-serif",
          color: "#0A0A0A",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 8 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#0A0A0A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#FFFFFF", fontSize: 22, fontWeight: 700 }}>{initials}</span>
          </div>
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {data.name}
            </h1>
            <p
              style={{
                fontSize: 16,
                color: "#505050",
                margin: "4px 0 0",
                fontWeight: 400,
              }}
            >
              {data.title}
            </p>
            {data.location && (
              <p
                style={{
                  fontSize: 12,
                  color: "#808080",
                  margin: "4px 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <MapPin size={12} />
                {data.location}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 2,
            background: "linear-gradient(to right, #0A0A0A, #D8D8D8, transparent)",
            margin: "20px 0 28px",
          }}
        />

        {/* About */}
        {data.about && (
          <section style={{ marginBottom: 28 }}>
            <SectionTitle>About</SectionTitle>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#282828", margin: 0 }}>
              {data.about}
            </p>
          </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <SectionTitle>Experience</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A" }}>
                        {exp.title || "Position"}
                      </div>
                      <div style={{ fontSize: 13, color: "#505050", marginTop: 2 }}>
                        {exp.company || "Company"}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#808080",
                        fontFamily: "'DM Mono', monospace",
                        whiteSpace: "nowrap",
                        marginLeft: 16,
                      }}
                    >
                      {exp.startDate}
                      {exp.startDate && exp.endDate ? " \u2013 " : ""}
                      {exp.endDate}
                    </span>
                  </div>
                  {exp.description && (
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: "#505050", margin: "6px 0 0" }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <SectionTitle>Education</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.education.map((edu) => (
                <div
                  key={edu.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A" }}>
                      {edu.degree || "Degree"}
                    </div>
                    <div style={{ fontSize: 13, color: "#505050", marginTop: 2 }}>
                      {edu.institution || "Institution"}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#808080",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {edu.year}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <SectionTitle>Skills</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: "5px 14px",
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: "'DM Mono', monospace",
                    background: "#FAFAFA",
                    border: "1px solid #D8D8D8",
                    borderRadius: 4,
                    color: "#505050",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        {(data.contact.email || data.contact.phone || data.contact.website || data.contact.linkedin) && (
          <section style={{ marginBottom: 20 }}>
            <SectionTitle>Contact</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 12, color: "#505050" }}>
              {data.contact.email && (
                <ContactItem icon={<Mail size={13} />} text={data.contact.email} />
              )}
              {data.contact.phone && (
                <ContactItem icon={<Phone size={13} />} text={data.contact.phone} />
              )}
              {data.contact.website && (
                <ContactItem icon={<Globe size={13} />} text={data.contact.website} />
              )}
              {data.contact.linkedin && (
                <ContactItem icon={<Linkedin size={13} />} text={data.contact.linkedin} />
              )}
            </div>
          </section>
        )}

        {/* Footer watermark hint */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 32,
            textAlign: "center",
            fontSize: 9,
            color: "#B8B8B8",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Generated with ATADA
        </div>
      </div>
    );
  }
);

ResumePreviewInner.displayName = "ResumePreviewInner";

// Memoize so unrelated re-renders of ProfilePage (e.g. typing in fields that
// don't change preview output, like Home Address) don't repaint the heavy
// preview tree. Re-renders only when `data` identity changes.
export const ResumePreview = memo(ResumePreviewInner);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h2
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "'DM Mono', monospace",
          color: "#808080",
          margin: 0,
        }}
      >
        {children}
      </h2>
      <div
        style={{
          height: 1,
          background: "linear-gradient(to right, #ECECEC, transparent)",
          marginTop: 6,
        }}
      />
    </div>
  );
}

function ContactItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {icon}
      {text}
    </span>
  );
}
