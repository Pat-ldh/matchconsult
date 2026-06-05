import React, { useState } from "react";
import { StepIndicator } from "./StepIndicator";
import type { AnalyzeRequest } from "../types";

const EXAMPLES = [
  "Dev Java Senior",
  "Chef de projet MOA",
  "Architecte Cloud",
];

const SAMPLES: Record<string, string> = {
  "Dev Java Senior":
    "Nous recherchons un développeur Java senior pour la refonte du SI d'un acteur bancaire. Stack : Java 17, Spring Boot, microservices, REST, PostgreSQL, Kafka. Mission en régie, 6 mois renouvelables, équipe Scrum de 6 personnes. Démarrage sous 2 semaines.",
  "Chef de projet MOA":
    "Nous cherchons un Chef de projet MOA expérimenté pour piloter la transformation digitale d'une direction métier dans le secteur assurance. Conduite du changement, recueil des besoins, rédaction des spécifications fonctionnelles, coordination avec la DSI. Mission forfait, 12 mois.",
  "Architecte Cloud":
    "Recherche Architecte Cloud Azure / AWS pour accompagner la migration d'une infrastructure on-premise vers le cloud. Définition de l'architecture cible, sécurité, FinOps, accompagnement des équipes dev. Profil confirmé 7+ ans, certifications cloud appréciées.",
};

interface Props {
  onSubmit: (req: AnalyzeRequest) => void;
  loading: boolean;
  totalCvs: number;
}

export function MissionInput({ onSubmit, loading, totalCvs }: Props) {
  const [text, setText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availability, setAvailability] = useState("");
  const [priorityInput, setPriorityInput] = useState("");
  const [prioritySkills, setPrioritySkills] = useState<string[]>([]);
  const [maxResults, setMaxResults] = useState(10);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && priorityInput.trim()) {
      setPrioritySkills((prev) => [...prev, priorityInput.trim()]);
      setPriorityInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setPrioritySkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSubmit = () => {
    if (!text.trim() || loading) return;
    onSubmit({
      mission_text: text,
      required_availability: availability || undefined,
      priority_skills: prioritySkills.length > 0 ? prioritySkills : undefined,
      max_results: maxResults,
    });
  };

  return (
    <div className="ods-container ods-page ods-fade-in">
      <div className="ods-card" style={{ padding: 32 }}>
        <StepIndicator active={1} />

        <div style={{ height: 1, background: "var(--ods-border)", margin: "24px 0" }} />

        <h2 className="ods-section-title">Décrivez votre mission</h2>

        <div style={{ marginBottom: 16 }}>
          <label className="ods-label" htmlFor="mission-textarea">
            Fiche de poste / description de mission
          </label>
          <textarea
            id="mission-textarea"
            className="ods-textarea"
            placeholder="Collez ici votre fiche de poste, appel d'offre, ou description de mission…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Quick-fill chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
          <span className="ods-label" style={{ marginRight: 4 }}>Exemples :</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="ods-chip"
              onClick={() => setText(SAMPLES[ex] ?? ex)}
              disabled={loading}
              type="button"
            >
              + {ex}
            </button>
          ))}
        </div>

        {/* Advanced options collapsible */}
        <div style={{ marginBottom: 24 }}>
          <button
            type="button"
            className={"ods-collapse-head" + (showAdvanced ? " open" : "")}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <span>Options avancées</span>
            <span className="chev">▾</span>
          </button>

          {showAdvanced && (
            <div className="ods-collapse-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <label className="ods-label" htmlFor="availability">
                    Disponibilité requise
                  </label>
                  <input
                    id="availability"
                    type="date"
                    className="ods-input"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  />
                </div>

                <div>
                  <label className="ods-label">Compétences prioritaires</label>
                  <input
                    className="ods-input"
                    placeholder="Tapez une compétence et appuyez sur Entrée…"
                    value={priorityInput}
                    onChange={(e) => setPriorityInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                  />
                  {prioritySkills.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {prioritySkills.map((s) => (
                        <span
                          key={s}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            height: 28,
                            padding: "0 10px",
                            background: "var(--ods-surface)",
                            border: "1px solid var(--ods-border)",
                            borderRadius: "var(--ods-radius)",
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                          onClick={() => handleRemoveSkill(s)}
                        >
                          {s}
                          <span style={{ opacity: 0.6, fontSize: 14 }}>×</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label className="ods-label">Nombre de résultats</label>
                  <span style={{ fontWeight: 500, color: "var(--ods-orange)", fontSize: 14 }}>{maxResults}</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#FF7900" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ods-text-secondary)", fontSize: 11, marginTop: 4 }}>
                  <span>3</span><span>20</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          className="ods-btn-primary"
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          type="button"
          style={{ fontSize: 16 }}
        >
          {loading && <span className="ods-spinner" />}
          {loading ? "Analyse en cours…" : "Analyser et matcher →"}
        </button>

        <p style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "#999" }}>
          {totalCvs > 0
            ? `Le système va reformuler votre offre et la comparer à ${totalCvs} CVs disponibles`
            : "Chargement des CVs en cours…"}
        </p>
      </div>
    </div>
  );
}
