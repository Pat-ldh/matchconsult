import React from "react";

interface Props {
  active: 1 | 2;
}

export function StepIndicator({ active }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 28,
      }}
    >
      <Step num={1} label="Fiche mission" isActive={active === 1} isDone={active === 2} />
      <div
        style={{
          flex: 1,
          height: 2,
          background: active === 2 ? "#FF7900" : "#cccccc",
          maxWidth: 48,
          transition: "background 0.3s",
        }}
      />
      <Step num={2} label="Résultats" isActive={active === 2} isDone={false} />
    </div>
  );
}

function Step({
  num,
  label,
  isActive,
  isDone,
}: {
  num: number;
  label: string;
  isActive: boolean;
  isDone: boolean;
}) {
  const accent = isActive || isDone;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: accent ? "#FF7900" : "#cccccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent ? "#fff" : "#666",
          fontWeight: 500,
          fontSize: 13,
          transition: "background 0.3s",
          flexShrink: 0,
        }}
      >
        {isDone ? "✓" : num}
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: accent ? "#FF7900" : "#999",
          whiteSpace: "nowrap",
          transition: "color 0.3s",
        }}
      >
        {label}
      </span>
    </div>
  );
}
