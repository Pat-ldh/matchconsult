import React from "react";
import type { ConsultantMatch } from "../types";

interface Props {
  consultant: ConsultantMatch;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="#eeeeee" strokeWidth="5" />
        <circle
          cx="30" cy="30" r={r}
          fill="none"
          stroke="#FF7900"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 500,
          color: "#FF7900",
        }}
      >
        {score}%
      </div>
    </div>
  );
}

export function ConsultantCard({ consultant }: Props) {
  return (
    <div className="ods-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 16 }}>
        {/* Avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#FF7900",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 500,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {initials(consultant.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + score ring */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: 16, color: "#000" }}>{consultant.name}</p>
              <p style={{ fontSize: 14, color: "var(--ods-text-secondary)", marginTop: 2 }}>{consultant.title}</p>
            </div>
            <ScoreRing score={consultant.score} />
          </div>

          {/* Skills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "14px 0" }}>
            {consultant.matched_skills.map((s) => (
              <span key={s} className="ods-tag-matched">{s}</span>
            ))}
            {consultant.missing_skills.map((s) => (
              <span key={s} className="ods-tag-missing">{s}</span>
            ))}
          </div>

          {/* AI explanation */}
          <p style={{ fontStyle: "italic", color: "var(--ods-text-secondary)", fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
            "{consultant.explanation}"
          </p>

          {/* Footer: availability + actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: consultant.available ? "var(--ods-success)" : "var(--ods-text-secondary)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, color: "var(--ods-text-secondary)" }}>
                {consultant.available ? "Disponible" : "En mission"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={`/api/cvs/${consultant.cv_filename}`}
                target="_blank"
                rel="noreferrer"
                className="ods-btn-outline"
              >
                Voir le CV
              </a>
              <button type="button" className="ods-btn-filled-sm">
                Contacter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
