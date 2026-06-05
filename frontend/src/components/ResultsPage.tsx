import React, { useState } from "react";
import { StepIndicator } from "./StepIndicator";
import { RewrittenOffer } from "./RewrittenOffer";
import { ConsultantCard } from "./ConsultantCard";
import type { AnalyzeResponse } from "../types";

type SortKey = "score" | "name" | "available";

interface Props {
  data: AnalyzeResponse;
  onBack: () => void;
}

export function ResultsPage({ data, onBack }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("score");

  const sorted = [...data.consultants].sort((a, b) => {
    if (sortKey === "score") return b.score - a.score;
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "available") return Number(b.available) - Number(a.available);
    return 0;
  });

  return (
    <div
      className="ods-fade-in"
      style={{ background: "var(--ods-surface)", minHeight: "calc(100vh - 56px)", padding: "28px 0 80px" }}
    >
      <div className="ods-container-wide">
        {/* Header row: step indicator + back link */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <StepIndicator active={2} />
          <div style={{ flex: 1 }} />
          <button type="button" className="ods-tlink" onClick={onBack}>
            ← Modifier la mission
          </button>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}>
          {/* Left panel — sticky */}
          <div style={{ position: "sticky", top: 73 }}>
            <RewrittenOffer offer={data.rewritten_offer} onEdit={onBack} />
          </div>

          {/* Right panel */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <p style={{ fontSize: 19 }}>
                <strong style={{ fontWeight: 500 }}>{data.consultants.length} consultant{data.consultants.length > 1 ? "s" : ""}</strong>{" "}
                matchés
              </p>

              <select
                className="ods-select"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="score">Trier par score</option>
                <option value="available">Trier par disponibilité</option>
                <option value="name">Trier par nom</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {sorted.map((c) => (
                <ConsultantCard key={c.id} consultant={c} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
