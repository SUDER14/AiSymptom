import { useState } from "react";

const MODELS = [
  { key: "male_muscle",    label: "Male",   sub: "Muscle",   path: "/models/male_muscle/scene.glb",    icon: "💪" },
  { key: "male_skeleton",  label: "Male",   sub: "Skeleton", path: "/models/male_skeleton/scene.glb",  icon: "🦴" },
  { key: "female_muscle",  label: "Female", sub: "Muscle",   path: "/models/female_muscle/scene.glb",  icon: "💪" },
  { key: "female_skeleton",label: "Female", sub: "Skeleton", path: "/models/female_skeleton/scene.glb",icon: "🦴" },
];

export default function GenderModal({ onSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at 40% 30%, #12060a 0%, #080b14 60%, #04060f 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 200, gap: "40px", fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* grid bg */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,40,40,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,40,40,0.03) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div style={{ textAlign: "center", zIndex: 1 }}>
        <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#ff4444", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
          AI Symptom Explorer
        </p>
        <h1 style={{ margin: 0, fontSize: "clamp(26px,4vw,40px)", fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          Select your anatomy<br />
          <span style={{ color: "rgba(255,255,255,0.25)" }}>model to explore</span>
        </h1>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px",
        width: "100%", maxWidth: "520px", padding: "0 20px", boxSizing: "border-box", zIndex: 1,
      }}>
        {MODELS.map((m) => {
          const isHov = hovered === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onSelect(m.path, m.key)}
              onMouseEnter={() => setHovered(m.key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isHov ? "rgba(255,60,60,0.12)" : "rgba(255,255,255,0.03)",
                border: isHov ? "1px solid rgba(255,60,60,0.45)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px", padding: "28px 20px", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
                transition: "all 0.2s",
                transform: isHov ? "translateY(-4px)" : "translateY(0)",
                boxShadow: isHov ? "0 12px 32px rgba(255,50,50,0.15)" : "none",
              }}
            >
              <span style={{ fontSize: "32px" }}>{m.icon}</span>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "16px", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: isHov ? "#ff6b6b" : "#fff", transition: "color 0.2s" }}>
                  {m.label}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {m.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}