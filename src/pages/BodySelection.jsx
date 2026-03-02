import { useState } from "react";
import HumanScene   from "../components/HumanScene";
import SymptomPanel from "../components/SymptomPanel";
import GenderModal  from "../components/GenderModal";

export default function BodySelection() {
  const [modelPath,      setModelPath]      = useState(null);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [selectedData,   setSelectedData]   = useState(null);

  return (
    <div style={{
      width:"100vw", height:"100vh", overflow:"hidden", position:"relative",
      background:"radial-gradient(ellipse at 40% 30%, #12060a 0%, #080b14 60%, #04060f 100%)",
    }}>
      {/* grid bg */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(255,40,40,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,40,40,0.03) 1px,transparent 1px)",
        backgroundSize:"60px 60px",
      }} />

      {/* Model picker */}
      {!modelPath && (
        <GenderModal onSelect={(path) => setModelPath(path)} />
      )}

      {/* 3-D viewer */}
      {modelPath && (
        <>
          {/* top bar */}
          <header style={{
            position:"absolute", top:0, left:0, right:0, zIndex:10,
            padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between",
            borderBottom:"1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#ff4444", boxShadow:"0 0 10px rgba(255,68,68,0.8)", animation:"pulse 2s ease infinite" }} />
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:"#fff" }}>AI Symptom</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.12em" }}>Anatomy Explorer</span>
            </div>
            <button
              onClick={() => { setModelPath(null); setSelectedMuscle(null); }}
              style={{
                background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:8, color:"rgba(255,255,255,0.5)",
                padding:"6px 14px", fontSize:12, fontFamily:"sans-serif", cursor:"pointer",
              }}
            >← Change Model</button>
          </header>

          {/* canvas */}
          <div style={{ position:"absolute", inset:0, paddingTop:60 }}>
            <HumanScene
              modelPath={modelPath}
              onMuscleSelect={(name, data) => { setSelectedMuscle(name); setSelectedData(data); }}
            />
          </div>

          {/* bottom hint */}
          {!selectedMuscle && (
            <div style={{
              position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)",
              display:"flex", alignItems:"center", gap:10,
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:24, padding:"10px 20px", zIndex:10, whiteSpace:"nowrap",
            }}>
              <span>👆</span>
              <span style={{ fontFamily:"sans-serif", fontSize:12, color:"rgba(255,255,255,0.4)" }}>
                Rotate with mouse · Hover to identify regions · Click for symptoms
              </span>
            </div>
          )}

          {/* symptom panel */}
          {selectedMuscle && (
            <SymptomPanel
              muscleName={selectedMuscle}
              muscleData={selectedData}
              onClose={() => { setSelectedMuscle(null); setSelectedData(null); }}
            />
          )}
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}