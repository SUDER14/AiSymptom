import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function SymptomTag({ text, index }) {
  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:10,
      padding:"10px 14px",
      background:"rgba(255,60,60,0.06)", border:"1px solid rgba(255,60,60,0.15)",
      borderRadius:8,
      animation:"fadeSlideIn 0.3s ease both",
      animationDelay:`${index * 0.06}s`,
    }}>
      <span style={{
        width:6, height:6, borderRadius:"50%", background:"#ff4444",
        flexShrink:0, marginTop:5, boxShadow:"0 0 6px rgba(255,68,68,0.6)",
      }}/>
      <span style={{ fontSize:13, color:"rgba(255,255,255,0.75)", fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>
        {text}
      </span>
    </div>
  );
}

export default function SymptomPanel({ muscleName, muscleData, onClose }) {
  const navigate  = useNavigate();
  const panelRef  = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (!muscleData) return null;

  return (
    <>
      {/* backdrop */}
      <div style={{
        position:"fixed", inset:0, zIndex:99,
        background:"rgba(0,0,0,0.45)", backdropFilter:"blur(2px)",
        animation:"fadeIn 0.2s ease",
      }} onClick={onClose}/>

      {/* panel */}
      <div ref={panelRef} style={{
        position:"fixed", top:0, right:0, height:"100vh",
        width:380, maxWidth:"92vw",
        background:"linear-gradient(160deg,#0d1117 0%,#0a0d16 100%)",
        borderLeft:"1px solid rgba(255,60,60,0.2)",
        zIndex:100, display:"flex", flexDirection:"column", overflowY:"auto",
        animation:"slideInRight 0.35s cubic-bezier(0.22,1,0.36,1) both",
        boxShadow:"-20px 0 60px rgba(0,0,0,0.5)",
      }}>

        {/* Header */}
        <div style={{ padding:"28px 24px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", position:"relative" }}>
          <div style={{ position:"absolute", top:0, left:0, width:"60%", height:2, background:"linear-gradient(90deg,#ff4444,transparent)" }}/>
          <button onClick={onClose} style={{
            position:"absolute", top:20, right:20,
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:6, width:30, height:30,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:"rgba(255,255,255,0.5)", fontSize:16,
          }}>✕</button>
          <p style={{ margin:"0 0 4px", fontSize:11, fontFamily:"'DM Sans',sans-serif", color:"#ff4444", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600 }}>
            Region Selected
          </p>
          <h2 style={{ margin:0, fontSize:22, fontFamily:"'Syne',sans-serif", fontWeight:700, color:"#fff", letterSpacing:"-0.01em" }}>
            {muscleData.label}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding:"20px 24px", flex:1, display:"flex", flexDirection:"column", gap:22 }}>

          <div>
            <p style={{ margin:"0 0 12px", fontSize:11, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              Common symptoms
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {muscleData.symptoms.map((s,i) => <SymptomTag key={i} text={s} index={i}/>)}
            </div>
          </div>

          <div style={{ padding:"12px 14px", background:"rgba(255,200,0,0.05)", border:"1px solid rgba(255,200,0,0.15)", borderRadius:8 }}>
            <p style={{ margin:0, fontSize:11.5, fontFamily:"'DM Sans',sans-serif", color:"rgba(255,200,100,0.6)", lineHeight:1.5 }}>
              ⚠️ These are potential symptoms only. Always consult a medical professional.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"20px 24px 28px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", gap:10 }}>
          <p style={{ margin:"0 0 2px", fontSize:12, fontFamily:"'DM Sans',sans-serif", color:"rgba(255,255,255,0.3)", textAlign:"center" }}>
            Talk to our AI doctor about these symptoms
          </p>

          <button
            onClick={() => navigate("/doctor", { state: { muscleName: muscleData.label, muscleKey: muscleName } })}
            style={{
              width:"100%", padding:14,
              background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
              border:"none", borderRadius:10,
              color:"#fff", fontSize:14,
              fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:"0.04em",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              boxShadow:"0 4px 20px rgba(37,99,235,0.35)",
              transition:"all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 28px rgba(37,99,235,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)";    e.currentTarget.style.boxShadow="0 4px 20px rgba(37,99,235,0.35)"; }}
          >
            🩺 Consult AI Doctor about {muscleData.label}
          </button>

          <button onClick={onClose} style={{
            width:"100%", padding:11,
            background:"transparent", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:10, color:"rgba(255,255,255,0.4)",
            fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
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