import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Individual clickable symptom button ───────────────────────────────────────
function SymptomButton({ text, index, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "11px 14px", textAlign: "left",
        background: selected
          ? "linear-gradient(135deg,rgba(255,60,60,0.2),rgba(255,30,30,0.12))"
          : "rgba(255,60,60,0.05)",
        border: `1px solid ${selected ? "rgba(255,68,68,0.6)" : "rgba(255,60,60,0.14)"}`,
        borderRadius: 9, cursor: "pointer",
        animation: "fadeSlideIn 0.3s ease both",
        animationDelay: `${index * 0.06}s`,
        transition: "all 0.18s ease",
        boxShadow: selected ? "0 0 16px rgba(255,68,68,0.2)" : "none",
        transform: selected ? "translateX(3px)" : "translateX(0)",
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(255,60,60,0.1)";
          e.currentTarget.style.borderColor = "rgba(255,68,68,0.4)";
          e.currentTarget.style.transform = "translateX(3px)";
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.background = "rgba(255,60,60,0.05)";
          e.currentTarget.style.borderColor = "rgba(255,60,60,0.14)";
          e.currentTarget.style.transform = "translateX(0)";
        }
      }}
    >
      {/* Checkbox indicator */}
      <span style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${selected ? "#ff4444" : "rgba(255,255,255,0.2)"}`,
        background: selected ? "#ff4444" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
      }}>
        {selected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
      </span>

      {/* Symptom text */}
      <span style={{
        flex: 1, fontSize: 13,
        color: selected ? "#fff" : "rgba(255,255,255,0.72)",
        fontFamily: "'DM Sans',sans-serif", lineHeight: 1.4,
        fontWeight: selected ? 600 : 400,
        transition: "all 0.15s",
      }}>
        {text}
      </span>

      {selected && (
        <span style={{ fontSize: 10, color: "rgba(255,100,100,0.8)", fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
          ✓ Selected
        </span>
      )}
    </button>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function SymptomPanel({ muscleName, muscleData, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef();
  const [selected, setSelected] = useState(new Set());

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Reset selection when muscle changes
  useEffect(() => { setSelected(new Set()); }, [muscleName]);

  if (!muscleData) return null;

  const toggleSymptom = (s) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const selectedList = [...selected];
  const hasSelection = selectedList.length > 0;

  // Build a natural-language message from selected symptoms
  const buildMessage = () => {
    if (selectedList.length === 1) {
      return `I am experiencing ${selectedList[0]} in my ${muscleData.label}. Can you help me understand what might be causing this and what I should do?`;
    }
    const last = selectedList[selectedList.length - 1];
    const rest = selectedList.slice(0, -1).join(", ");
    return `I am experiencing ${rest} and ${last} in my ${muscleData.label}. Can you help me understand what might be causing these and what I should do?`;
  };

  const goToDoctor = (symptomOverride) => {
    const symptom = symptomOverride ?? (hasSelection ? buildMessage() : null);
    navigate("/doctor", {
      state: {
        muscleName: muscleData.label,
        muscleKey: muscleName,
        selectedSymptom: symptom,
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 99,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
        animation: "fadeIn 0.2s ease",
      }} onClick={onClose} />

      {/* Panel */}
      <div ref={panelRef} style={{
        position: "fixed", top: 0, right: 0, height: "100vh",
        width: 380, maxWidth: "92vw",
        background: "linear-gradient(160deg,#0d1117 0%,#0a0d16 100%)",
        borderLeft: "1px solid rgba(255,60,60,0.2)",
        zIndex: 100, display: "flex", flexDirection: "column", overflowY: "auto",
        animation: "slideInRight 0.35s cubic-bezier(0.22,1,0.36,1) both",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
      }}>

        {/* Header */}
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "60%", height: 2, background: "linear-gradient(90deg,#ff4444,transparent)" }} />
          <button onClick={onClose} style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 16,
          }}>✕</button>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontFamily: "'DM Sans',sans-serif", color: "#ff4444", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
            Region Selected
          </p>
          <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
            {muscleData.label}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Symptom selection */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                Common Symptoms
              </p>
              {hasSelection && (
                <button
                  onClick={() => setSelected(new Set())}
                  style={{ fontSize: 11, color: "rgba(255,100,100,0.6)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: 0 }}
                >
                  Clear all
                </button>
              )}
            </div>

            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans',sans-serif" }}>
              ✅ Select your symptoms then chat with the AI doctor
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {muscleData.symptoms.map((s, i) => (
                <SymptomButton
                  key={i}
                  text={s}
                  index={i}
                  selected={selected.has(s)}
                  onClick={() => toggleSymptom(s)}
                />
              ))}
            </div>
          </div>

          {/* Selection summary */}
          {hasSelection && (
            <div style={{
              padding: "12px 14px",
              background: "rgba(255,68,68,0.06)",
              border: "1px solid rgba(255,68,68,0.2)",
              borderRadius: 10,
              animation: "fadeSlideIn 0.2s ease",
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,100,100,0.7)", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Selected ({selectedList.length})
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>
                {selectedList.join(" · ")}
              </p>
            </div>
          )}

          {/* Warning */}
          <div style={{ padding: "12px 14px", background: "rgba(255,200,0,0.05)", border: "1px solid rgba(255,200,0,0.15)", borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 11.5, fontFamily: "'DM Sans',sans-serif", color: "rgba(255,200,100,0.6)", lineHeight: 1.5 }}>
              ⚠️ These are potential symptoms only. Always consult a medical professional.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px 28px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Chat with selected symptoms */}
          <button
            onClick={() => goToDoctor()}
            disabled={!hasSelection}
            style={{
              width: "100%", padding: "13px 14px",
              background: hasSelection
                ? "linear-gradient(135deg,#ef4444,#b91c1c)"
                : "rgba(255,255,255,0.04)",
              border: hasSelection ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: hasSelection ? "#fff" : "rgba(255,255,255,0.2)",
              fontSize: 14, fontFamily: "'Syne',sans-serif", fontWeight: 700,
              cursor: hasSelection ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
              boxShadow: hasSelection ? "0 4px 20px rgba(239,68,68,0.4)" : "none",
            }}
            onMouseEnter={e => { if (hasSelection) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(239,68,68,0.55)"; } }}
            onMouseLeave={e => { if (hasSelection) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(239,68,68,0.4)"; } }}
          >
            {hasSelection
              ? `🩺 Chat about ${selectedList.length === 1 ? selectedList[0] : `${selectedList.length} symptoms`}`
              : "Select symptoms above to chat"}
          </button>

          <button
            onClick={() => navigate("/appointments", { state: { muscleName: muscleData.label, muscleKey: muscleName } })}
            style={{
              width: "100%", padding: "13px 14px",
              background: "linear-gradient(135deg,#4a90e2,#357abd)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 14, fontFamily: "'Syne',sans-serif", fontWeight: 700,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
              boxShadow: "0 4px 20px rgba(74,144,226,0.4)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(74,144,226,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(74,144,226,0.4)"; }}
          >
            🗓 Book Hospital Appointment
          </button>

          {/* Consult about whole region — removed; only symptom-specific chat remains */}

          <button onClick={onClose} style={{
            width: "100%", padding: 10,
            background: "transparent", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, color: "rgba(255,255,255,0.3)",
            fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
          }}>
            Back to body
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
        @keyframes fadeSlideIn  { from{transform:translateX(10px);opacity:0} to{transform:translateX(0);opacity:1} }
      `}</style>
    </>
  );
}