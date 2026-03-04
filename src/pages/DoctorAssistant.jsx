import { Suspense, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useNavigate, useLocation } from "react-router-dom";
import * as THREE from "three";
import { useAuth } from "../context/AuthContext";

// Preload all 3 files upfront so swaps are instant
useGLTF.preload("/models/doctor/avatar.glb");
useGLTF.preload("/models/doctor/idle.glb");
useGLTF.preload("/models/doctor/talking.glb");

const API_BASE = "http://localhost:3001/api";
const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

// ── Language options ───────────────────────────────────────────────────────────
const LANGUAGES = [
  { label: "🇬🇧 English", inputCode: "en-US", ttsLang: "en-US" },
  { label: "🇮🇳 Tamil", inputCode: "ta-IN", ttsLang: "ta-IN" },
  { label: "🇮🇳 Telugu", inputCode: "te-IN", ttsLang: "te-IN" },
  { label: "🇮🇳 Hindi", inputCode: "hi-IN", ttsLang: "hi-IN" },
];

// ── Voice gender options ───────────────────────────────────────────────────────
const VOICE_GENDERS = [
  { label: "👩 Female Voice", value: "female" },
  { label: "👨 Male Voice", value: "male" },
];

// ── Web Speech API speaker ─────────────────────────────────────────────────────
// Picks the best available browser voice matching gender + language
function getBrowserVoice(lang, gender) {
  const voices = window.speechSynthesis?.getVoices() || [];
  const langPrefix = lang.split("-")[0].toLowerCase();

  // Score voices: prefer matching language and gender keywords
  const scored = voices.map(v => {
    const name = v.name.toLowerCase();
    const langMatch = v.lang.toLowerCase().startsWith(langPrefix) ? 2 : 0;
    const femaleKw = ["female", "woman", "girl", "zira", "hazel", "cortana", "samantha", "victoria", "karen", "moira", "fiona", "ava", "allison"];
    const maleKw = ["male", "man", "boy", "david", "mark", "daniel", "jorge", "thomas", "alex", "fred"];
    const kw = gender === "female" ? femaleKw : maleKw;
    const genderMatch = kw.some(k => name.includes(k)) ? 3 : 0;
    return { v, score: langMatch + genderMatch };
  });

  scored.sort((a, b) => b.score - a.score);
  // Fallback: any voice for the language, or first available
  return scored[0]?.v || voices[0] || null;
}

// ── Patient intake form ──────────────────────────────────────────────────────
function PatientIntakeForm({ onSubmit, initialSymptom }) {
  const [form, setForm] = useState({
    age: "", gender: "female", weight: "", height: "",
    conditions: "", medications: "", allergies: "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fieldStyle = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "#fff",
    fontSize: 13, padding: "10px 14px",
    outline: "none", fontFamily: "'DM Sans',sans-serif",
    transition: "border-color 0.2s",
  };
  const labelStyle = { fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 5, display: "block", fontFamily: "'DM Sans',sans-serif" };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#080b14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", overflow: "auto" }}>
      {/* Blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,0.08) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,37,235,0.07) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.025) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#1e40af)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px", boxShadow: "0 0 28px rgba(37,99,235,0.5)" }}>🩺</div>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif", letterSpacing: "-0.03em" }}>Before We Begin</h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Share a few health details so the AI doctor can give you accurate, personalised advice.</p>
          {initialSymptom && <div style={{ marginTop: 10, display: "inline-block", padding: "5px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, fontSize: 12, color: "rgba(255,130,130,0.9)" }}>Symptom: {initialSymptom}</div>}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Row: Age + Gender */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Age</label>
              <input type="number" min="1" max="120" placeholder="e.g. 28" value={form.age} onChange={e => set("age", e.target.value)} style={{ ...fieldStyle, width: "100%" }} />
            </div>
            <div>
              <label style={labelStyle}>Biological Gender</label>
              <select value={form.gender} onChange={e => set("gender", e.target.value)} style={{ ...fieldStyle, width: "100%" }}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Row: Weight + Height */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Weight (kg)</label>
              <input type="number" min="1" placeholder="e.g. 65" value={form.weight} onChange={e => set("weight", e.target.value)} style={{ ...fieldStyle, width: "100%" }} />
            </div>
            <div>
              <label style={labelStyle}>Height (cm)</label>
              <input type="number" min="1" placeholder="e.g. 165" value={form.height} onChange={e => set("height", e.target.value)} style={{ ...fieldStyle, width: "100%" }} />
            </div>
          </div>

          {/* Existing conditions */}
          <div>
            <label style={labelStyle}>Existing Medical Conditions</label>
            <input type="text" placeholder="e.g. Diabetes, Hypertension, Asthma (or None)" value={form.conditions} onChange={e => set("conditions", e.target.value)} style={fieldStyle} />
          </div>

          {/* Medications */}
          <div>
            <label style={labelStyle}>Current Medications</label>
            <input type="text" placeholder="e.g. Metformin, Lisinopril (or None)" value={form.medications} onChange={e => set("medications", e.target.value)} style={fieldStyle} />
          </div>

          {/* Allergies */}
          <div>
            <label style={labelStyle}>Known Allergies</label>
            <input type="text" placeholder="e.g. Penicillin, NSAIDs (or None)" value={form.allergies} onChange={e => set("allergies", e.target.value)} style={fieldStyle} />
          </div>

          {/* Submit */}
          <button
            onClick={() => onSubmit(form)}
            style={{ width: "100%", padding: "14px", marginTop: 4, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer", boxShadow: "0 8px 28px rgba(37,99,235,0.45)", transition: "transform 0.15s", letterSpacing: "-0.01em" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            🩺 Start Consultation
          </button>

          <button
            onClick={() => onSubmit(null)}
            style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}
          >
            Skip — chat without health details
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 16 }}>Details stay in this session only. Nothing is stored externally.</p>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, select:focus { border-color: rgba(37,99,235,0.5) !important; }
        select option { background: #0d1525; color: #fff; }
      `}</style>
    </div>
  );
}

// ── Red-flag keyword patterns ─────────────────────────────────────────────────
const RED_FLAG_PATTERNS = [
  { re: /chest\s*pain.{0,80}(left\s*arm|jaw|neck|sweat|breath)/i, label: "Possible heart attack — call emergency services" },
  { re: /(left\s*arm|jaw).{0,80}chest\s*pain/i, label: "Possible heart attack — call emergency services" },
  { re: /sudden.{0,20}(severe|worst).{0,30}headache/i, label: "Possible stroke or brain bleed" },
  { re: /thunderclap.{0,20}headache/i, label: "Possible subarachnoid haemorrhage" },
  { re: /(difficulty|trouble|can'?t).{0,15}breath/i, label: "Breathing emergency" },
  { re: /shortness\s*of\s*breath.{0,50}(chest|pain|dizziness)/i, label: "Possible cardiac or pulmonary emergency" },
  { re: /cough(ing)?\s*(up|out)?\s*blood/i, label: "Coughing blood — seek immediate care" },
  { re: /sudden.{0,20}(weakness|numbness|paralysis).{0,40}(face|arm|leg|one\s*side)/i, label: "Possible stroke — FAST: Face, Arms, Speech, Time" },
  { re: /loss\s*of\s*consciousness|passed?\s*out|won'?t\s*wake/i, label: "Loss of consciousness — call emergency services" },
  { re: /severe\s*abdominal.{0,40}(rigid|board.like|can'?t\s*move)/i, label: "Possible surgical abdominal emergency" },
];
function checkRedFlags(text) {
  for (const { re, label } of RED_FLAG_PATTERNS) if (re.test(text)) return label;
  return null;
}

// ── Drug interaction lookup ────────────────────────────────────────────────────
const DRUG_INTERACTIONS = [
  { drug: /warfarin|coumadin/i, trigger: /ibuprofen|aspirin|naproxen|nsaid/i, warn: "Warfarin + NSAIDs — increased bleeding risk. Consult your doctor before taking these." },
  { drug: /metformin/i, trigger: /contrast|iodine/i, warn: "Metformin may need to be paused before iodine contrast procedures. Talk to your doctor." },
  { drug: /ssri|fluoxetine|sertraline|escitalopram|paroxetine/i, trigger: /tramadol|triptan|sumatriptan/i, warn: "SSRIs + Tramadol/Triptans — risk of Serotonin Syndrome. Consult your doctor urgently." },
  { drug: /lisinopril|enalapril|ramipril/i, trigger: /potassium|spironolactone/i, warn: "ACE inhibitors + potassium supplements can cause dangerously high potassium. Check with your doctor." },
  { drug: /digoxin/i, trigger: /amiodarone|verapamil|diltiazem/i, warn: "These drugs can raise Digoxin to toxic levels. Seek medical advice." },
  { drug: /lithium/i, trigger: /ibuprofen|naproxen|nsaid|diuretic/i, warn: "NSAIDs/diuretics can raise Lithium to toxic levels. Avoid without doctor guidance." },
  { drug: /maoi|phenelzine|tranylcypromine/i, trigger: /ssri|sertraline|fluoxetine|tramadol|dextromethorphan/i, warn: "MAOIs + these medications can cause life-threatening Serotonin Syndrome. Seek emergency care." },
  { drug: /aspirin/i, trigger: /ibuprofen|naproxen/i, warn: "Aspirin + ibuprofen may reduce aspirin's heart-protective effect and increase GI bleeding." },
];
function checkMedInteractions(medsStr, aiText) {
  if (!medsStr) return [];
  const seen = new Set();
  return DRUG_INTERACTIONS.filter(({ drug, trigger, warn }) => {
    if (drug.test(medsStr) && trigger.test(aiText) && !seen.has(warn)) { seen.add(warn); return true; }
    return false;
  }).map(d => d.warn);
}

// ── Duration options ───────────────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { label: "Today", value: "today", urgency: "very recent onset" },
  { label: "2–3 days", value: "2-3days", urgency: "subacute" },
  { label: "1 week", value: "1week", urgency: "persistent" },
  { label: "1 month+", value: "1month+", urgency: "chronic — may need specialist evaluation" },
];

// ── Triage Screen (pain scale, body side, duration) ────────────────────────────
function TriageScreen({ onSubmit, initialSymptom }) {
  const [pain, setPain] = useState(5);
  const [bodySide, setBodySide] = useState("both");
  const [duration, setDuration] = useState(null);

  const painColor = pain <= 3 ? "#22c55e" : pain <= 6 ? "#f59e0b" : "#ef4444";
  const painLabel = pain <= 2 ? "Minimal" : pain <= 4 ? "Moderate" : pain <= 6 ? "Significant" : pain <= 8 ? "Severe" : "Extreme";

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#080b14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", overflow: "auto" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(239,68,68,0.07) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,0.07) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.025) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 500, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#b91c1c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px", boxShadow: "0 0 28px rgba(239,68,68,0.4)" }}>🩺</div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif", letterSpacing: "-0.03em" }}>Rate Your Pain</h1>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>This helps the AI give you a more accurate assessment and urgency level.</p>
          {initialSymptom && <div style={{ marginTop: 10, display: "inline-block", padding: "5px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, fontSize: 12, color: "rgba(255,130,130,0.9)" }}>Symptom: {initialSymptom}</div>}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px", display: "flex", flexDirection: "column", gap: 22 }}>

          {/* Pain Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Pain Intensity</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: painColor, fontFamily: "'Syne',sans-serif", transition: "color 0.3s" }}>{pain}</span>
                <span style={{ fontSize: 12, color: painColor, fontWeight: 600, transition: "color 0.3s", minWidth: 70 }}>{painLabel}</span>
              </div>
            </div>
            <input type="range" min={1} max={10} value={pain} onChange={e => setPain(Number(e.target.value))}
              style={{ width: "100%", cursor: "pointer", accentColor: painColor }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>1 – No pain</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>10 – Worst ever</span>
            </div>
            {/* Gradient bar */}
            <div style={{ marginTop: 8, height: 6, borderRadius: 6, background: "linear-gradient(to right,#22c55e,#f59e0b,#ef4444)", position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `${(pain - 1) / 9 * 100}%`, marginLeft: -8, width: 16, height: 16, borderRadius: "50%", background: painColor, border: "2px solid #080b14", boxShadow: `0 0 8px ${painColor}`, transition: "left 0.15s,background 0.3s" }} />
            </div>
          </div>

          {/* Body Side */}
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 10 }}>Side Affected</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[{ v: "left", l: "◀ Left" }, { v: "both", l: "◉ Both / Central" }, { v: "right", l: "Right ▶" }].map(({ v, l }) => (
                <button key={v} onClick={() => setBodySide(v)} style={{ padding: "10px 6px", borderRadius: 10, border: `1px solid ${bodySide === v ? "rgba(37,99,235,0.55)" : "rgba(255,255,255,0.08)"}`, background: bodySide === v ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.03)", color: bodySide === v ? "#60a5fa" : "rgba(255,255,255,0.45)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", fontWeight: bodySide === v ? 700 : 400, transition: "all 0.2s" }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 10 }}>How Long Has This Been Going On?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setDuration(opt)} style={{ padding: "12px 10px", borderRadius: 10, border: `1px solid ${duration?.value === opt.value ? "rgba(37,99,235,0.55)" : "rgba(255,255,255,0.08)"}`, background: duration?.value === opt.value ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.03)", color: duration?.value === opt.value ? "#60a5fa" : "rgba(255,255,255,0.45)", fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", fontWeight: duration?.value === opt.value ? 700 : 400, transition: "all 0.2s" }}>{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button onClick={() => onSubmit({ pain, bodySide, duration })} disabled={!duration}
            style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: duration ? "linear-gradient(135deg,#ef4444,#b91c1c)" : "rgba(255,255,255,0.06)", color: duration ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: duration ? "pointer" : "not-allowed", boxShadow: duration ? "0 8px 28px rgba(239,68,68,0.35)" : "none", transition: "all 0.25s" }}
          >🩺 Start Consultation</button>
          <button onClick={() => onSubmit(null)}
            style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}
          >Skip — chat without triage data</button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 14 }}>Data stays in this session only. Nothing is stored externally.</p>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        input[type=range]{-webkit-appearance:none;height:4px;background:transparent;}
        input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:4px;background:rgba(255,255,255,0.1);}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#60a5fa;cursor:pointer;}
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Merge all per-bone clips into one AnimationClip and fix bone names:
//   "mixamorig:LeftArm_$AssimpFbx$_Rotation.quaternion"
//   → "LeftArm.quaternion"
// ─────────────────────────────────────────────────────────────────────────────
function mergeClips(clips, name) {
  if (!clips?.length) return null;
  const tracks = [];
  const seen = new Set();

  for (const clip of clips) {
    for (const track of clip.tracks) {
      const dot = track.name.lastIndexOf(".");
      const bone = track.name.slice(0, dot);
      const prop = track.name.slice(dot);

      const clean = bone
        .replace(/^mixamorig:/i, "")
        .replace(/_\$AssimpFbx\$_\w+$/i, "");

      const key = clean + prop;
      if (seen.has(key)) continue;
      seen.add(key);

      const t = track.clone();
      t.name = key;
      tracks.push(t);
    }
  }

  const duration = Math.max(...clips.map(c => c.duration));
  return new THREE.AnimationClip(name, duration, tracks);
}

// ── Camera auto-fit — fires once when box arrives ───────────────────────────
function CameraFitter({ box, fovOffset = 1.2 }) {
  const { camera } = useThree();
  const firedRef = useRef(false);
  useEffect(() => {
    if (!box || firedRef.current) return;
    firedRef.current = true;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const fovRad = (camera.fov * Math.PI) / 180;
    const halfH = (size.y / 2) * fovOffset;
    const dist = halfH / Math.tan(fovRad / 2);
    camera.position.set(center.x, center.y, center.z + dist);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [box, camera, fovOffset]);
  return null;
}

// ── Smooth damped orbit — target set imperatively, never via prop ───────────
function SmoothOrbit({ fitBox, enablePan = false, enableZoom = false, minPolar, maxPolar, minAz, maxAz }) {
  const controlsRef = useRef();
  useEffect(() => {
    if (!fitBox || !controlsRef.current) return;
    const c = new THREE.Vector3();
    fitBox.getCenter(c);
    controlsRef.current.target.set(c.x, c.y, c.z);
    controlsRef.current.update();
  }, [fitBox]);
  useFrame(() => controlsRef.current?.update());
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={enablePan}
      enableZoom={enableZoom}
      enableDamping={true}
      dampingFactor={0.08}
      rotateSpeed={0.55}
      {...(minPolar != null ? { minPolarAngle: minPolar } : {})}
      {...(maxPolar != null ? { maxPolarAngle: maxPolar } : {})}
      {...(minAz != null ? { minAzimuthAngle: minAz } : {})}
      {...(maxAz != null ? { maxAzimuthAngle: maxAz } : {})}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctor 3-D avatar component
// ─────────────────────────────────────────────────────────────────────────────
function Doctor({ isTalking, onReady }) {
  const groupRef = useRef();
  const mixerRef = useRef(null);
  const actionsRef = useRef({ idle: null, talking: null });
  const readyRef = useRef(false);

  const { scene } = useGLTF("/models/doctor/avatar.glb");
  const { animations: idleClips } = useGLTF("/models/doctor/idle.glb");
  const { animations: talkClips } = useGLTF("/models/doctor/talking.glb");

  const idleClip = useRef(null);
  const talkClip = useRef(null);
  if (!idleClip.current) idleClip.current = mergeClips(idleClips, "idle");
  if (!talkClip.current) talkClip.current = mergeClips(talkClips, "talking");

  useEffect(() => {
    if (!scene || !groupRef.current || readyRef.current) return;
    readyRef.current = true;

    scene.traverse((obj) => {
      if (!obj.isMesh) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => {
        if (!m.emissive) m.emissive = new THREE.Color(0, 0, 0);
        m.needsUpdate = true;
      });
      obj.castShadow = true;
      obj.frustumCulled = false;
    });

    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = 2.0 / Math.max(size.x, size.y, size.z);
    groupRef.current.scale.setScalar(s);

    const box2 = new THREE.Box3().setFromObject(groupRef.current);
    const center = new THREE.Vector3();
    box2.getCenter(center);
    groupRef.current.position.sub(center);
    groupRef.current.position.y -= 0.1;

    // Pass bounding box to parent so CameraFitter can frame the doctor
    const finalBox = new THREE.Box3().setFromObject(groupRef.current);
    onReady?.(finalBox);

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    if (idleClip.current) {
      const a = mixer.clipAction(idleClip.current);
      a.setLoop(THREE.LoopRepeat, Infinity);
      actionsRef.current.idle = a;
    }
    if (talkClip.current) {
      const a = mixer.clipAction(talkClip.current);
      a.setLoop(THREE.LoopRepeat, Infinity);
      actionsRef.current.talking = a;
    }

    actionsRef.current.idle?.reset().play();

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [scene]); // eslint-disable-line

  useEffect(() => {
    const { idle, talking } = actionsRef.current;
    if (!idle) return;

    if (isTalking && talking) {
      idle.fadeOut(0.25);
      talking.reset().fadeIn(0.25).play();
    } else {
      talking?.fadeOut(0.25);
      idle.reset().fadeIn(0.25).play();
    }
  }, [isTalking]);

  useFrame((_, delta) => mixerRef.current?.update(delta));

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// ── Doctor-referral detection ─────────────────────────────────────────────
const REFERRAL_PATTERNS = [
  /see\s+a\s+(doctor|physician|specialist|gp|consultant|surgeon)/i,
  /consult\s+(a|your|with\s+a)\s*(doctor|physician|specialist|gp|healthcare\s+provider)/i,
  /visit\s+(a|the|your)\s+(doctor|hospital|clinic|er|emergency|gp)/i,
  /seek\s+(medical|professional|immediate)\s*(attention|help|care)/i,
  /recommend\s+(you\s+)?(see|visit|consult|go\s+to)/i,
  /go\s+to\s+(the\s+)?(hospital|clinic|er|emergency\s+room)/i,
  /medical\s+(evaluation|attention|assessment|review)\s+(is\s+)?(needed|required|recommended|advised)/i,
  /urgent(ly)?\s+(see|visit|consult|contact)/i,
];
function checkSeeDoctor(text) {
  return REFERRAL_PATTERNS.some(r => r.test(text));
}

// ── Appointment Reminder Modal ─────────────────────────────────────────────
function AppointmentModal({ onClose, userEmail, userWhatsapp, userName }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("AI Doctor consultation follow-up");
  const [notifStatus, setNotifStatus] = useState("idle"); // idle | granted | denied | sent
  const [activeTab, setActiveTab] = useState("browser"); // browser | whatsapp | email

  const iStyle = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 14px", outline: "none", fontFamily: "'DM Sans',sans-serif" };
  const lStyle = { fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 5 };

  const scheduledLabel = date && time ? `${date} at ${time}` : date || "(pick date & time above)";

  // —— Browser Notifications ——
  const scheduleBrowserNotif = async () => {
    if (!date || !time) return alert("Please pick a date and time first.");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { setNotifStatus("denied"); return; }
    const fireAt = new Date(`${date}T${time}:00`).getTime();
    const delay = fireAt - Date.now();
    if (delay <= 0) { alert("Please pick a future time."); return; }
    setTimeout(() => {
      new Notification("🏥 Doctor Appointment Reminder", {
        body: `${note}\nScheduled: ${scheduledLabel}`,
        icon: "https://cdn-icons-png.flaticon.com/512/2785/2785482.png",
      });
    }, delay);
    setNotifStatus("sent");
  };

  // —— WhatsApp deep-link ——
  const openWhatsApp = () => {
    if (!date || !time) return alert("Please pick a date and time first.");
    const msg = encodeURIComponent(
      `🏥 *Appointment Reminder*\nHi ${userName || "there"}, this is a reminder for your doctor appointment!\n\n🗓 Date: ${date}\n⏰ Time: ${time}\n📝 Note: ${note}\n\n_(Set via AI Symptom App)_`
    );
    const phone = userWhatsapp?.replace(/[^0-9]/g, "") || "";
    const url = phone
      ? `https://wa.me/${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
  };

  // —— Email mailto link ——
  const openEmail = () => {
    if (!date || !time) return alert("Please pick a date and time first.");
    const subject = encodeURIComponent("🏥 Doctor Appointment Reminder");
    const body = encodeURIComponent(
      `Hi ${userName || "there"},\n\nThis is a reminder for your upcoming doctor appointment.\n\n🗓 Date: ${date}\n⏰ Time: ${time}\n📝 Note: ${note}\n\nSet via AI Symptom App. Please consult a qualified medical professional.`
    );
    const to = userEmail || "";
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, "_blank");
  };

  const tabs = [
    { id: "browser", icon: "🔔", label: "Browser" },
    { id: "whatsapp", icon: "💬", label: "WhatsApp" },
    { id: "email", icon: "📧", label: "Email" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", animation: "fadeUp 0.2s ease both" }}>
      <div style={{ width: "100%", maxWidth: 430, margin: "0 20px", background: "#0d1525", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px 24px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif" }}>📅 Set Appointment Reminder</h3>
            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>The AI suggested you see a doctor. Set a reminder now!</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", width: 32, height: 32, fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>

        {/* Date + Time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div><label style={lStyle}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={iStyle} /></div>
          <div><label style={lStyle}>Time</label><input type="time" value={time} onChange={e => setTime(e.target.value)} style={iStyle} /></div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 18 }}>
          <label style={lStyle}>Reminder Note</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} style={iStyle} placeholder="e.g. Chest pain follow-up" />
        </div>

        {/* Channel Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex: 1, padding: "8px 4px", borderRadius: 9, border: `1px solid ${activeTab === t.id ? "rgba(37,99,235,0.55)" : "rgba(255,255,255,0.08)"}`, background: activeTab === t.id ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.03)", color: activeTab === t.id ? "#60a5fa" : "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", fontWeight: activeTab === t.id ? 700 : 400, transition: "all 0.2s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Browser tab */}
        {activeTab === "browser" && (
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>Schedules a browser notification that fires at the chosen time. Keep this tab open (or pin it).</p>
            {notifStatus === "sent" && <p style={{ color: "#22c55e", fontSize: 12, margin: "0 0 10px" }}>✅ Reminder set! You’ll get a notification at {scheduledLabel}.</p>}
            {notifStatus === "denied" && <p style={{ color: "#ef4444", fontSize: 12, margin: "0 0 10px" }}>❌ Notifications blocked. Please allow them in browser settings.</p>}
            <button onClick={scheduleBrowserNotif}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer", boxShadow: "0 6px 20px rgba(37,99,235,0.4)" }}>
              🔔 Schedule Browser Notification
            </button>
          </div>
        )}

        {/* WhatsApp tab */}
        {activeTab === "whatsapp" && (
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
              Opens WhatsApp with a pre-filled reminder message{userWhatsapp ? ` to ${userWhatsapp}` : ". Add your number at registration to auto-fill."}.
            </p>
            <button onClick={openWhatsApp}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#25d366,#128c7e)", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer", boxShadow: "0 6px 20px rgba(37,211,102,0.3)" }}>
              💬 Send WhatsApp Reminder
            </button>
          </div>
        )}

        {/* Email tab */}
        {activeTab === "email" && (
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
              Opens your email client with a pre-filled reminder{userEmail ? ` to ${userEmail}` : ". Sign in to auto-fill your email."}.
            </p>
            <button onClick={openEmail}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ea4335,#c23321)", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer", boxShadow: "0 6px 20px rgba(234,67,53,0.3)" }}>
              📧 Send Email Reminder
            </button>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 10.5, color: "rgba(255,255,255,0.15)", marginTop: 16, marginBottom: 0 }}>This is a reminder tool only. Always consult a real doctor.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat UI components
// ─────────────────────────────────────────────────────────────────────────────
function Bubble({ msg, onSetReminder }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12, animation: "fadeUp 0.25s ease both" }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginRight: 10, marginTop: 2 }}>🩺</div>
      )}
      <div style={{ maxWidth: "72%" }}>
        <div style={{
          padding: "11px 15px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.07)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
          fontSize: 13.5, fontFamily: "'DM Sans',sans-serif",
          color: isUser ? "#fff" : "rgba(255,255,255,0.85)", lineHeight: 1.6,
        }}>
          {cleanText(msg.content)}
          {msg.sources?.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
              {msg.sources.map((s, i) => (
                <span key={i} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.25)", color: "rgba(96,165,250,0.8)" }}>
                  {s.region} · {s.category}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Reminder button — shown only on AI messages that recommend seeing a doctor */}
        {!isUser && msg.suggestReminder && (
          <button onClick={onSetReminder}
            style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(37,99,235,0.4)", background: "rgba(37,99,235,0.1)", color: "#60a5fa", fontSize: 11.5, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(37,99,235,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(37,99,235,0.1)"}
          >
            📅 Set Appointment Reminder
          </button>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🩺</div>
      <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "bounce 1.2s ease infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Strip markdown bold/italic that AI sometimes emits
// ─────────────────────────────────────────────────────────────────────────────
const cleanText = (t) => t.replace(/\*\*/g, "").replace(/\*/g, "");

// ─────────────────────────────────────────────────────────────────────────────
// Shared dropdown style
// ─────────────────────────────────────────────────────────────────────────────
const dropdownStyle = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "rgba(255,255,255,0.75)",
  fontSize: 12,
  padding: "5px 8px",
  cursor: "pointer",
  outline: "none",
  fontFamily: "'DM Sans',sans-serif",
  height: 32,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function DoctorAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { muscleName, muscleKey, selectedSymptom } = location.state || {};
  const { profile } = useAuth();

  const [triageDone, setTriageDone] = useState(false);
  const [triageData, setTriageData] = useState(null);

  const patientProfile = profile ? [
    profile.age && `Age: ${profile.age}`,
    profile.gender && `Gender: ${profile.gender}`,
    profile.weight && `Weight: ${profile.weight} kg`,
    profile.height && `Height: ${profile.height} cm`,
    profile.conditions && `Existing conditions: ${profile.conditions}`,
    profile.medications && `Current medications: ${profile.medications}`,
    profile.allergies && `Allergies: ${profile.allergies}`,
  ].filter(Boolean).join(" | ") : null;

  if (!triageDone) {
    return <TriageScreen
      initialSymptom={selectedSymptom}
      onSubmit={(data) => { setTriageData(data); setTriageDone(true); }}
    />;
  }

  return <DoctorChat
    navigate={navigate}
    muscleName={muscleName}
    muscleKey={muscleKey}
    selectedSymptom={selectedSymptom}
    patientProfile={patientProfile}
    triageData={triageData}
    medications={profile?.medications || ""}
  />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner chat component — rendered after intake form
// ─────────────────────────────────────────────────────────────────────────────
function DoctorChat({ navigate, muscleName, muscleKey, selectedSymptom, patientProfile, triageData, medications }) {
  const { user } = useAuth(); // read auth at top level (hooks rule)
  // Build greeting that incorporates triage data pre-filled by the user
  const triageCtx = triageData
    ? ` Pain level: ${triageData.pain}/10 (${triageData.pain <= 3 ? "mild" : triageData.pain <= 6 ? "moderate" : triageData.pain <= 8 ? "severe" : "extreme"}), ${triageData.bodySide} side, duration: ${triageData.duration?.label || "unknown"}.`
    : "";
  const urgencyNote = triageData?.pain >= 8 ? " Given the high pain level, I want to assess you quickly. " : triageData?.duration?.value === "1month+" ? " Since this has been ongoing for over a month, we should discuss specialist referral too. " : " ";
  const greeting = selectedSymptom
    ? `Hello! I'm your AI doctor. I can see you're experiencing ${selectedSymptom} in your ${muscleName || "body"}.${triageCtx}${urgencyNote}Could you tell me whether anything makes it better or worse?`
    : muscleName
      ? `Hello! I'm your AI doctor. I can see you're experiencing symptoms related to your ${muscleName}.${triageCtx}${urgencyNote}Could you describe what you're feeling?`
      : `Hello! I'm your AI doctor, powered by a medical knowledge base.${triageCtx}${urgencyNote}Please describe your symptoms and I'll help assess them.`;


  const [messages, setMessages] = useState([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const [erBanner, setErBanner] = useState(null);
  const [interactionWarnings, setInteractionWarnings] = useState([]);
  const [showReminder, setShowReminder] = useState(false);

  // ── fitBox for camera ────────────────────────────────────────────────────
  const [docFitBox, setDocFitBox] = useState(null);
  const [inputLangCode, setInputLangCode] = useState("en-US");
  const [voiceGender, setVoiceGender] = useState("female");
  const [isMuted, setIsMuted] = useState(false);

  const recRef = useRef(null);
  const utteranceRef = useRef(null);
  const audioRef = useRef(null);   // for Google Translate TTS <Audio>
  const bottomRef = useRef();

  // ── Stop all in-progress speech (Web Speech + ResponsiveVoice + Audio) ─────
  const stopSpeech = () => {
    window.speechSynthesis?.cancel();
    window.responsiveVoice?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsTalking(false);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  // Cancel speech on unmount
  useEffect(() => () => { stopSpeech(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (!isMuted) stopSpeech();
    setIsMuted(prev => !prev);
  };

  // ── ResponsiveVoice names per language + gender ───────────────────────────
  // Tamil Male/Female, Telugu Male/Female, Hindi Male/Female
  const RV_VOICES = {
    ta: { male: "Tamil Male", female: "Tamil Female" },
    te: { male: "Telugu Male", female: "Telugu Female" },
    hi: { male: "Hindi Male", female: "Hindi Female" },
  };

  // ── Speak: ResponsiveVoice for Indian langs, Web Speech API for English ────
  const speak = (text) => {
    if (isMuted) return;
    stopSpeech();

    const langObj = LANGUAGES.find(l => l.inputCode === inputLangCode);
    const ttsLang = langObj?.ttsLang || "en-US";           // e.g. "ta-IN"
    const langShort = ttsLang.split("-")[0].toLowerCase();  // "ta", "te", "hi", "en"

    // ── Indian languages → ResponsiveVoice (real male/female voices) ──────────
    if (["ta", "te", "hi"].includes(langShort) && window.responsiveVoice) {
      const rvVoice = RV_VOICES[langShort]?.[voiceGender] ||
        RV_VOICES[langShort]?.female;     // graceful fallback
      setIsTalking(true);
      window.responsiveVoice.speak(text, rvVoice, {
        rate: voiceGender === "male" ? 0.9 : 1.0,
        pitch: voiceGender === "male" ? 0.8 : 1.0,
        volume: 1,
        onstart: () => setIsTalking(true),
        onend: () => setIsTalking(false),
        onerror: () => setIsTalking(false),
      });
      return;
    }

    // ── Fallback for Indian langs if ResponsiveVoice not loaded yet ────────────
    if (["ta", "te", "hi"].includes(langShort)) {
      const url = `${API_BASE.replace("/api", "")}/api/tts?lang=${langShort}&text=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setIsTalking(true);
      audio.onended = () => { setIsTalking(false); audioRef.current = null; };
      audio.onerror = () => { setIsTalking(false); audioRef.current = null; };
      audio.play().catch(() => { setIsTalking(false); audioRef.current = null; });
      return;
    }

    // ── English → Web Speech API ──────────────────────────────────────────────
    if (!window.speechSynthesis) return;
    const doSpeak = () => {
      const voice = getBrowserVoice(ttsLang, voiceGender);
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = ttsLang;
      utter.rate = 0.95;
      utter.pitch = voiceGender === "male" ? 0.75 : 1.15;
      if (voice) utter.voice = voice;
      utteranceRef.current = utter;
      utter.onstart = () => setIsTalking(true);
      utter.onend = () => { setIsTalking(false); utteranceRef.current = null; };
      utter.onerror = () => { setIsTalking(false); utteranceRef.current = null; };
      window.speechSynthesis.speak(utter);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; doSpeak(); };
    } else {
      doSpeak();
    }
  };

  // ── API call ──────────────────────────────────────────────────────────────
  const getResponse = async (userMsg) => {
    setIsTyping(true);
    setError(null);
    stopSpeech();

    // Red-flag scan on user message
    const userFlag = checkRedFlags(userMsg);
    if (userFlag) setErBanner(userFlag);

    try {
      // Build triage context to prefix profile
      const triageStr = triageData
        ? `Pain: ${triageData.pain}/10, Side: ${triageData.bodySide}, Duration: ${triageData.duration?.urgency || triageData.duration?.label}`
        : null;
      const fullProfile = [patientProfile, triageStr].filter(Boolean).join(" | ") || null;

      const res = await fetch(`${API_BASE}/doctor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          message: userMsg,
          muscleKey: muscleKey || null,
          muscleName: muscleName || null,
          replyLang: (LANGUAGES.find(l => l.inputCode === inputLangCode)?.ttsLang || "en-US").split("-")[0],
          patientProfile: fullProfile,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, sources: data.sourcesUsed || [], suggestReminder: checkSeeDoctor(data.reply) }]);
      speak(data.reply);

      // Red-flag scan on AI reply
      const aiFlag = checkRedFlags(data.reply);
      if (aiFlag) setErBanner(aiFlag);

      // Drug interaction check
      if (medications) {
        const warns = checkMedInteractions(medications, data.reply);
        if (warns.length) setInteractionWarnings(prev => [...new Set([...prev, ...warns])]);
      }
    } catch (err) {
      console.error("API error:", err);
      setError("Could not reach the AI server. Make sure the backend is running on port 3001.");
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please make sure the backend server is running." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    // Scan user's own message too
    const flag = checkRedFlags(text);
    if (flag) setErBanner(flag);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    await getResponse(text);
  };

  // ── Auto-send selected symptom once after initial render ────────────────────
  // Placed here so getResponse is already defined in this scope
  useEffect(() => {
    if (!selectedSymptom) return;
    const t = setTimeout(() => {
      setMessages(prev => [...prev, { role: "user", content: selectedSymptom }]);
      getResponse(selectedSymptom);
    }, 700);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mic toggle — uses selected input language ─────────────────────────────
  const toggleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported."); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = inputLangCode;          // ← dynamic language
    rec.onresult = e => { setInput(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", overflow: "hidden", background: "#080b14", fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── LEFT: Doctor 3D ── */}
      <div style={{ width: "42%", height: "100%", position: "relative", flexShrink: 0, background: "linear-gradient(170deg,#0d1525 0%,#080b14 100%)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Ground glow */}
        <div style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", width: 200, height: 50, background: "radial-gradient(ellipse,rgba(37,99,235,0.25) 0%,transparent 70%)", pointerEvents: "none" }} />
        {/* Grid bg */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(37,99,235,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.025) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />

        <Canvas camera={{ position: [0, 0.8, 3.5], fov: 40 }} style={{ width: "100%", height: "100%" }} shadows>
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 5, 3]} intensity={2.0} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-3, 3, 2]} intensity={0.7} />
          <directionalLight position={[0, 2, -3]} intensity={0.4} color="#4466ff" />
          <directionalLight position={[0, -2, 2]} intensity={0.3} />
          <Environment preset="city" />

          {/* Auto-fit camera once doctor model loads */}
          <CameraFitter box={docFitBox} fovOffset={1.1} />

          <Suspense fallback={
            <mesh visible={false}>
              <boxGeometry args={[0.001, 0.001, 0.001]} />
              <meshBasicMaterial />
            </mesh>
          }>
            <Doctor isTalking={isTalking} onReady={setDocFitBox} />
          </Suspense>

          {/* Smooth damped orbit — constrained so doctor stays upright */}
          <SmoothOrbit
            fitBox={docFitBox}
            enablePan={false}
            enableZoom={false}
            minPolar={Math.PI / 3}
            maxPolar={Math.PI * 0.58}
            minAz={-0.45}
            maxAz={0.45}
          />
        </Canvas>

        {/* Status badge */}
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "8px 18px", backdropFilter: "blur(8px)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isTalking ? "#22c55e" : "#3b82f6", boxShadow: isTalking ? "0 0 10px rgba(34,197,94,0.9)" : "0 0 8px rgba(59,130,246,0.8)", animation: "pulse 1.5s ease infinite" }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            {isMuted ? "🔇 Muted" : isTalking ? "Doctor is speaking…" : "AI Doctor · Online"}
          </span>
        </div>
      </div>

      {/* ── RIGHT: Chat ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>

        {/* ── Header ── */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: "rgba(255,255,255,0.02)", flexWrap: "wrap" }}>
          {/* Back → anatomy explorer */}
          <button onClick={() => navigate("/body")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.6)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>←</button>
          {/* Home button */}
          <button onClick={() => navigate("/home")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.4)", height: 34, padding: "0 10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, flexShrink: 0, gap: 4 }}>🏠 Home</button>

          {/* Avatar + title */}
          <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#2563eb,#1e40af)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 14px rgba(37,99,235,0.4)" }}>🩺</div>
          <div style={{ flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Syne',sans-serif" }}>AI Doctor</p>
            {muscleName && <p style={{ margin: 0, fontSize: 10, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.08em" }}>Consulting: {muscleName}</p>}
          </div>

          {/* Symptom badge — shown when navigated from a specific symptom */}
          {selectedSymptom && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, padding: "4px 11px", maxWidth: 200, flexShrink: 1 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", flexShrink: 0, boxShadow: "0 0 6px rgba(255,68,68,0.6)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,130,130,0.95)", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{selectedSymptom.length > 40 ? selectedSymptom.slice(0, 38) + "…" : selectedSymptom}</span>
            </div>
          )}          {/* ── Language & Voice controls ───────────────────────── */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

            {/* 🎤 Input language */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>🎤</span>
              <select
                value={inputLangCode}
                onChange={e => setInputLangCode(e.target.value)}
                style={dropdownStyle}
                title="Mic input language"
              >
                {LANGUAGES.map(l => (
                  <option key={l.inputCode} value={l.inputCode} style={{ background: "#0d1525" }}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* 🔊 Voice gender */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>🔊</span>
              <select
                value={voiceGender}
                onChange={e => setVoiceGender(e.target.value)}
                style={dropdownStyle}
                title="Doctor voice type"
              >
                {VOICE_GENDERS.map(g => (
                  <option key={g.value} value={g.value} style={{ background: "#0d1525" }}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* 🔇 Mute button */}
            <button
              onClick={toggleMute}
              title={isMuted ? "Un-mute doctor" : "Mute doctor"}
              style={{
                width: 34, height: 34, borderRadius: 8, border: "1px solid",
                borderColor: isMuted ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.12)",
                background: isMuted ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)",
                color: isMuted ? "#ef4444" : "rgba(255,255,255,0.55)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
                transition: "all 0.2s ease",
              }}
            >{isMuted ? "🔇" : "🔊"}</button>

            {/* RAG badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, padding: "5px 10px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s ease infinite" }} />
              <span style={{ fontSize: 11, color: "rgba(34,197,94,0.9)" }}>RAG · Online</span>
            </div>
          </div>
        </div>

        {/* ER Banner */}
        {erBanner && (
          <div style={{ padding: "12px 20px", background: "rgba(239,68,68,0.18)", borderBottom: "2px solid rgba(239,68,68,0.5)", display: "flex", alignItems: "center", gap: 12, animation: "fadeUp 0.3s ease both", flexWrap: "wrap" }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🚨</span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#f87171", fontFamily: "'Syne',sans-serif", letterSpacing: "-0.01em" }}>VISIT THE EMERGENCY ROOM NOW</p>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "rgba(248,113,113,0.8)", lineHeight: 1.4 }}>{erBanner} — Do not wait. Seek immediate medical attention.</p>
            </div>
            <a href="tel:112" style={{ padding: "7px 14px", borderRadius: 8, background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "'Syne',sans-serif", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 4px 12px rgba(239,68,68,0.4)" }}>📞 Call 112</a>
            <button onClick={() => setErBanner(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, color: "rgba(255,255,255,0.5)", cursor: "pointer", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>✕</button>
          </div>
        )}

        {/* Drug Interaction Warnings */}
        {interactionWarnings.length > 0 && (
          <div style={{ padding: "10px 20px", background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.25)" }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, color: "rgba(245,158,11,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>💊 Medication Interaction Alert</p>
            {interactionWarnings.map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: i < interactionWarnings.length - 1 ? 5 : 0 }}>
                <span style={{ fontSize: 12, color: "rgba(251,191,36,0.9)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>⚠️ {w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Triage Summary Badge */}
        {triageData && (
          <div style={{ padding: "6px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans',sans-serif" }}>Pain: <span style={{ color: triageData.pain <= 3 ? "#22c55e" : triageData.pain <= 6 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>{triageData.pain}/10</span></span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Side: <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{triageData.bodySide}</span></span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Duration: <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{triageData.duration?.label}</span></span>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ padding: "10px 24px", background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
            <span>⚠️</span>
            <span style={{ fontSize: 12, color: "rgba(239,68,68,0.9)" }}>{error}</span>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column" }}>
          {muscleName && (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span style={{ display: "inline-block", padding: "7px 16px", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 24, fontSize: 12, color: "rgba(96,165,250,0.85)" }}>
                🎯 Focused on <strong style={{ color: "#60a5fa" }}>{muscleName}</strong>
              </span>
            </div>
          )}
          {messages.map((m, i) => <Bubble key={i} msg={m} onSetReminder={() => setShowReminder(true)} />)}
          {isTyping && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding: "14px 24px 22px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "8px 8px 8px 16px" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={muscleName ? `Describe your ${muscleName} symptoms…` : "Describe your symptoms…"}
              rows={1} style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: "#fff", fontSize: 14, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, paddingTop: 6 }} />
            <button onClick={toggleMic} title={`Mic (${LANGUAGES.find(l => l.inputCode === inputLangCode)?.label || "English"})`}
              style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: listening ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)", color: listening ? "#ef4444" : "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
              {listening ? "⏹" : "🎤"}
            </button>
            <button onClick={handleSend} disabled={!input.trim() || isTyping}
              style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: input.trim() && !isTyping ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.06)", color: input.trim() && !isTyping ? "#fff" : "rgba(255,255,255,0.2)", cursor: input.trim() && !isTyping ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>↑</button>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center" }}>
            Powered by Gemini + Medical RAG · Not a substitute for professional advice
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        select option { background:#0d1525; color:#fff; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        input[type=date],input[type=time],input[type=text],input[type=tel]{color-scheme:dark;}
      `}</style>

      {/* Appointment Reminder Modal */}
      {showReminder && (
        <AppointmentModal
          onClose={() => setShowReminder(false)}
          userEmail={user?.email}
          userWhatsapp={user?.whatsapp}
          userName={user?.name}
        />
      )}
    </div>
  );
}