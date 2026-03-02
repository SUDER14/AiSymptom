import { Suspense, useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useNavigate, useLocation } from "react-router-dom";
import * as THREE from "three";

// Preload all 3 files upfront so swaps are instant
useGLTF.preload("/models/doctor/avatar.glb");
useGLTF.preload("/models/doctor/idle.glb");
useGLTF.preload("/models/doctor/talking.glb");

const API_BASE = "http://localhost:3001/api";
const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

// ── Language options ───────────────────────────────────────────────────────────
const LANGUAGES = [
  { label: "🇬🇧 English", inputCode: "en-US", ttsLang: "en" },
  { label: "🇮🇳 Tamil", inputCode: "ta-IN", ttsLang: "ta" },
  { label: "🇮🇳 Telugu", inputCode: "te-IN", ttsLang: "te" },
  { label: "🇮🇳 Hindi", inputCode: "hi-IN", ttsLang: "hi" },
];

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

// ─────────────────────────────────────────────────────────────────────────────
// Doctor 3-D avatar component
// ─────────────────────────────────────────────────────────────────────────────
function Doctor({ isTalking }) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Chat UI components
// ─────────────────────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12, animation: "fadeUp 0.25s ease both" }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginRight: 10, marginTop: 2 }}>🩺</div>
      )}
      <div style={{
        maxWidth: "72%", padding: "11px 15px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "rgba(255,255,255,0.07)",
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
        fontSize: 13.5, fontFamily: "'DM Sans',sans-serif",
        color: isUser ? "#fff" : "rgba(255,255,255,0.85)", lineHeight: 1.6,
      }}>
        {msg.content}
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
  const { muscleName, muscleKey } = location.state || {};

  const [messages, setMessages] = useState([{
    role: "assistant",
    content: muscleName
      ? `Hello! I'm your AI doctor. I can see you're experiencing symptoms related to your **${muscleName}**. Could you describe what you're feeling — when it started, severity (1–10), and what makes it better or worse?`
      : "Hello! I'm your AI doctor, powered by a medical knowledge base. Please describe your symptoms and I'll help assess them.",
  }]);
  const [input, setInput] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);

  // ── Language & mute state ─────────────────────────────────────────────────
  const [inputLangCode, setInputLangCode] = useState("en-US");
  const [replyTtsLang, setReplyTtsLang] = useState("en");   // for backend proxy
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);  // currently playing Audio element
  const replyTtsLangRef = useRef("en"); // always up-to-date ref (fixes stale closure)

  // Keep ref in sync whenever dropdown changes
  useEffect(() => { replyTtsLangRef.current = replyTtsLang; }, [replyTtsLang]);

  const bottomRef = useRef();
  const recRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  // Stop audio on unmount
  useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }, []);

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (!isMuted) {
      // stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsTalking(false);
    }
    setIsMuted(prev => !prev);
  };

  // ── Speak via backend TTS proxy (Google Translate — no local voice install needed) ─────
  const speak = async (text) => {
    if (isMuted) return;

    // Stop any previous audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    try {
      const lang = replyTtsLangRef.current;              // ← always current value
      const params = new URLSearchParams({ text, lang });
      const res = await fetch(`${API_BASE}/tts?${params}`);
      if (!res.ok) throw new Error("TTS fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setIsTalking(true);
      audio.onended = () => { setIsTalking(false); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = () => { setIsTalking(false); URL.revokeObjectURL(url); audioRef.current = null; };
      setIsTalking(true);
      audio.play();
    } catch (err) {
      console.warn("TTS error:", err.message);
      setIsTalking(false);
    }
  };

  // ── API call ──────────────────────────────────────────────────────────────
  const getResponse = async (userMsg) => {
    setIsTyping(true);
    setError(null);
    // Stop any in-progress audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setIsTalking(false); }

    try {
      const res = await fetch(`${API_BASE}/doctor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          message: userMsg,
          muscleKey: muscleKey || null,
          muscleName: muscleName || null,
          replyLang: replyTtsLangRef.current, // instruct Gemini to reply in this language
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, sources: data.sourcesUsed || [] }]);
      speak(data.reply);
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
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    await getResponse(text);
  };

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

        <Canvas camera={{ position: [0, 0.8, 2.8], fov: 40 }} style={{ width: "100%", height: "100%" }} shadows>
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 5, 3]} intensity={2.0} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-3, 3, 2]} intensity={0.7} />
          <directionalLight position={[0, 2, -3]} intensity={0.4} color="#4466ff" />
          <directionalLight position={[0, -2, 2]} intensity={0.3} />
          <Environment preset="city" />

          <Suspense fallback={
            <mesh visible={false}>
              <boxGeometry args={[0.001, 0.001, 0.001]} />
              <meshBasicMaterial />
            </mesh>
          }>
            <Doctor isTalking={isTalking} />
          </Suspense>

          <OrbitControls
            enablePan={false} enableZoom={false}
            minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI * 0.58}
            minAzimuthAngle={-0.4} maxAzimuthAngle={0.4}
            target={[0, 0.4, 0]}
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
          {/* Back button */}
          <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.6)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>←</button>

          {/* Avatar + title */}
          <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#2563eb,#1e40af)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 14px rgba(37,99,235,0.4)" }}>🩺</div>
          <div style={{ flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Syne',sans-serif" }}>AI Doctor</p>
            {muscleName && <p style={{ margin: 0, fontSize: 10, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.08em" }}>Consulting: {muscleName}</p>}
          </div>

          {/* ── Language & Mute controls ───────────────────────── */}
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

            {/* 🔊 Reply voice language */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>🔊</span>
              <select
                value={replyTtsLang}
                onChange={e => setReplyTtsLang(e.target.value)}
                style={dropdownStyle}
                title="Doctor reply voice language"
              >
                {LANGUAGES.map(l => (
                  <option key={l.ttsLang} value={l.ttsLang} style={{ background: "#0d1525" }}>{l.label}</option>
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
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
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
      `}</style>
    </div>
  );
}