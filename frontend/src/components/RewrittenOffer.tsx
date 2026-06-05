import React from "react";
import type { RewrittenOffer as Offer } from "../types";

interface Props {
  offer: Offer;
  onEdit: () => void;
}

export function RewrittenOffer({ offer, onEdit }: Props) {
  return (
    <div className="ods-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <h3 style={{ fontWeight: 500, fontSize: 17 }}>Offre analysée</h3>
        <span className="ods-badge-ai">✦ Reformulée par IA</span>
      </div>

      <Field label="Titre du poste" value={offer.title} />
      <Field label="Type de mission" value={offer.mission_type} />
      <Field label="Durée estimée" value={offer.duration} />

      <div style={{ marginBottom: 16 }}>
        <p className="ods-field-label">Compétences techniques</p>
        <ChipList tags={offer.technical_skills} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p className="ods-field-label">Compétences comportementales</p>
        <ChipList tags={offer.soft_skills} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p className="ods-field-label">Contexte client</p>
        <p className="ods-field-value" style={{ color: "var(--ods-text-secondary)", lineHeight: 1.6 }}>
          {offer.client_context}
        </p>
      </div>

      <div style={{ height: 1, background: "var(--ods-border)", margin: "4px 0 16px" }} />

      <button type="button" className="ods-tlink" onClick={onEdit}>
        ✎ Modifier l'offre
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p className="ods-field-label">{label}</p>
      <p className="ods-field-value">{value}</p>
    </div>
  );
}

function ChipList({ tags }: { tags: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {tags.map((t) => (
        <span key={t} className="ods-chip-plain">{t}</span>
      ))}
    </div>
  );
}
