import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

const API_BASE = "http://localhost:3001/api";

// ── Vital definitions ─────────────────────────────────────────────────────────
const VITALS = [
    { id: "systolic", label: "Systolic BP", unit: "mmHg", icon: "🫀", color: "#ef4444", min: 80, max: 180, normal: [90, 120], step: 1 },
    { id: "diastolic", label: "Diastolic BP", unit: "mmHg", icon: "💓", color: "#f97316", min: 40, max: 120, normal: [60, 80], step: 1 },
    { id: "heart_rate", label: "Heart Rate", unit: "bpm", icon: "❤️", color: "#ec4899", min: 40, max: 200, normal: [60, 100], step: 1 },
    { id: "glucose", label: "Blood Glucose", unit: "mg/dL", icon: "🩸", color: "#eab308", min: 50, max: 400, normal: [70, 140], step: 1 },
    { id: "spo2", label: "SpO₂", unit: "%", icon: "🫁", color: "#06b6d4", min: 80, max: 100, normal: [95, 100], step: 0.1 },
    { id: "weight", label: "Weight", unit: "kg", icon: "⚖️", color: "#a855f7", min: 20, max: 200, normal: [50, 90], step: 0.1 },
    { id: "temperature", label: "Temperature", unit: "°C", icon: "🌡️", color: "#10b981", min: 35, max: 42, normal: [36.1, 37.5], step: 0.1 },
];

const STORAGE_KEY = "ai_symptom_vitals_history";

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveHistory(h) { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); }

function getStatus(vitalId, value) {
    const v = VITALS.find(x => x.id === vitalId);
    if (!v) return "normal";
    if (value < v.normal[0]) return "low";
    if (value > v.normal[1]) return "high";
    return "normal";
}

const STATUS_COLOR = { normal: "#10b981", low: "#06b6d4", high: "#ef4444" };
const STATUS_LABEL = { normal: "Normal", low: "Low", high: "High" };

// ── SVG Ring Gauge ────────────────────────────────────────────────────────────
function RingGauge({ value, min, max, color, size = 80 }) {
    const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
    const r = (size - 12) / 2;
    const circ = 2 * Math.PI * r;
    const dash = pct * circ;
    const cx = size / 2, cy = size / 2;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            <circle
                cx={cx} cy={cy} r={r} fill="none"
                stroke={color} strokeWidth={8}
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
            />
        </svg>
    );
}

// ── Sparkline (last 7 readings) ───────────────────────────────────────────────
function Sparkline({ data, color }) {
    if (data.length < 2) return <div style={{ height: 28 }} />;
    const vals = data.slice(-7).map(d => d.value);
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const range = mx - mn || 1;
    const W = 80, H = 28;
    const pts = vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H - ((v - mn) / range) * H;
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg width={W} height={H} style={{ overflow: "visible" }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.7} strokeLinecap="round" strokeLinejoin="round" />
            {vals.map((v, i) => {
                const x = (i / (vals.length - 1)) * W;
                const y = H - ((v - mn) / range) * H;
                return <circle key={i} cx={x} cy={y} r={i === vals.length - 1 ? 3 : 1.5} fill={i === vals.length - 1 ? color : "rgba(255,255,255,0.3)"} />;
            })}
        </svg>
    );
}

// ── Vital Card ────────────────────────────────────────────────────────────────
function VitalCard({ vital, history, onClick }) {
    const readings = history.filter(h => h.vitalId === vital.id).sort((a, b) => a.ts - b.ts);
    const latest = readings[readings.length - 1];
    const value = latest?.value;
    const status = value != null ? getStatus(vital.id, value) : null;
    const [hover, setHover] = useState(false);

    return (
        <div
            onClick={() => onClick(vital)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                background: hover ? `${vital.color}10` : "rgba(255,255,255,0.03)",
                border: `1px solid ${hover ? vital.color + "40" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 16, padding: "18px 18px 14px", cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: hover ? `0 8px 30px ${vital.color}20` : "none",
                transform: hover ? "translateY(-2px)" : "none",
                display: "flex", flexDirection: "column", gap: 12,
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{vital.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>{vital.label}</span>
                </div>
                {status && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: `${STATUS_COLOR[status]}18`, border: `1px solid ${STATUS_COLOR[status]}40`, color: STATUS_COLOR[status], fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                        {STATUS_LABEL[status]}
                    </span>
                )}
            </div>

            {/* Gauge + Value */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <RingGauge value={value ?? vital.min} min={vital.min} max={vital.max} color={value != null ? vital.color : "rgba(255,255,255,0.1)"} size={72} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                        <span style={{ fontSize: value != null ? (value >= 100 ? 13 : 15) : 12, fontWeight: 700, color: value != null ? "#fff" : "rgba(255,255,255,0.2)", fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
                            {value != null ? value.toFixed(vital.step < 1 ? 1 : 0) : "—"}
                        </span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans',sans-serif" }}>{vital.unit}</span>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <Sparkline data={readings} color={vital.color} />
                    <div style={{ marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Sans',sans-serif" }}>
                        {readings.length > 0 ? `${readings.length} reading${readings.length > 1 ? "s" : ""} · Normal: ${vital.normal[0]}–${vital.normal[1]} ${vital.unit}` : "No readings yet — click to add"}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Add Reading Modal ─────────────────────────────────────────────────────────
function AddModal({ vital, onSave, onClose }) {
    const [val, setVal] = useState("");
    const inputRef = useRef();
    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

    const save = () => {
        const n = parseFloat(val);
        if (isNaN(n) || n < vital.min || n > vital.max) return;
        onSave({ vitalId: vital.id, value: n, ts: Date.now() });
        onClose();
    };

    const status = val !== "" ? getStatus(vital.id, parseFloat(val)) : null;

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: "#0d1525", border: `1px solid ${vital.color}40`, borderRadius: 20, padding: "28px 32px", width: 340, boxShadow: `0 20px 60px ${vital.color}20` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <span style={{ fontSize: 24 }}>{vital.icon}</span>
                    <div>
                        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#fff", fontFamily: "'Syne',sans-serif" }}>Log {vital.label}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans',sans-serif" }}>Normal range: {vital.normal[0]}–{vital.normal[1]} {vital.unit}</p>
                    </div>
                </div>

                <div style={{ position: "relative", marginBottom: 16 }}>
                    <input
                        ref={inputRef}
                        type="number" value={val} step={vital.step} min={vital.min} max={vital.max}
                        onChange={e => setVal(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && save()}
                        placeholder={`e.g. ${Math.round((vital.normal[0] + vital.normal[1]) / 2)}`}
                        style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: `1px solid ${status ? STATUS_COLOR[status] + "60" : "rgba(255,255,255,0.12)"}`, borderRadius: 12, padding: "14px 60px 14px 18px", color: "#fff", fontSize: 22, fontFamily: "'Syne',sans-serif", fontWeight: 700, outline: "none", transition: "border-color 0.2s" }}
                    />
                    <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans',sans-serif" }}>{vital.unit}</span>
                </div>

                {status && val !== "" && (
                    <div style={{ marginBottom: 14, padding: "8px 14px", borderRadius: 8, background: `${STATUS_COLOR[status]}12`, border: `1px solid ${STATUS_COLOR[status]}30`, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[status], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: STATUS_COLOR[status], fontFamily: "'DM Sans',sans-serif" }}>
                            {status === "normal" ? "✅ Within normal range" : status === "high" ? "⚠️ Above normal range" : "⚠️ Below normal range"}
                        </span>
                    </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                    <button onClick={save} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${vital.color},${vital.color}bb)`, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: `0 4px 16px ${vital.color}40` }}>Save Reading</button>
                </div>
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function HealthDashboard() {
    const navigate = useNavigate();
    const [history, setHistory] = useState(loadHistory);
    const [activeModal, setActiveModal] = useState(null); // vital object
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const bottomRef = useRef();

    const addReading = (entry) => {
        const updated = [...history, entry];
        setHistory(updated);
        saveHistory(updated);
    };

    const clearHistory = () => {
        if (!window.confirm("Clear all vital readings? This cannot be undone.")) return;
        setHistory([]);
        saveHistory([]);
        setAiAnalysis("");
    };

    // ── Build latest vitals summary for AI ───────────────────────────────────
    const getLatestVitals = () => {
        return VITALS.map(v => {
            const readings = history.filter(h => h.vitalId === v.id).sort((a, b) => a.ts - b.ts);
            const latest = readings[readings.length - 1];
            return latest ? `${v.label}: ${latest.value.toFixed(v.step < 1 ? 1 : 0)} ${v.unit} (${getStatus(v.id, latest.value)})` : null;
        }).filter(Boolean);
    };

    const analyseWithAI = async () => {
        const vitals = getLatestVitals();
        if (vitals.length === 0) return;
        setAiLoading(true);
        setAiAnalysis("");
        setActiveTab("analysis");
        try {
            const res = await fetch(`${API_BASE}/vitals/analyse`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vitals }),
            });
            if (!res.ok) throw new Error("Server error");
            const data = await res.json();
            setAiAnalysis(data.analysis);
        } catch (err) {
            setAiAnalysis("❌ Could not reach the AI server. Make sure the backend is running on port 3001.");
        } finally {
            setAiLoading(false);
        }
    };

    const recentHistory = [...history].sort((a, b) => b.ts - a.ts).slice(0, 30);

    const hasReadings = history.length > 0;

    return (
        <Layout pageTitle="Health Dashboard">
            <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "32px 20px 60px" }}>


                {/* ── Tabs ── */}
                <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 4 }}>
                    {[
                        { id: "dashboard", label: "📊 Dashboard" },
                        { id: "analysis", label: "✨ AI Analysis" },
                        { id: "history", label: "📋 History" },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "9px 16px", borderRadius: 9, border: "none", background: activeTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent", color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.18s" }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── DASHBOARD TAB ── */}
                {activeTab === "dashboard" && (
                    <>
                        {!hasReadings && (
                            <div style={{ textAlign: "center", padding: "40px 20px", marginBottom: 24 }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontFamily: "'DM Sans',sans-serif" }}>No readings yet. Click any vital card below to log your first reading.</p>
                            </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                            {VITALS.map(v => (
                                <VitalCard key={v.id} vital={v} history={history} onClick={setActiveModal} />
                            ))}
                        </div>

                        {/* Quick summary bar */}
                        {hasReadings && (
                            <div style={{ marginTop: 20, padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, display: "flex", gap: 20, flexWrap: "wrap" }}>
                                {VITALS.map(v => {
                                    const readings = history.filter(h => h.vitalId === v.id).sort((a, b) => a.ts - b.ts);
                                    const latest = readings[readings.length - 1];
                                    if (!latest) return null;
                                    const status = getStatus(v.id, latest.value);
                                    return (
                                        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[status], flexShrink: 0 }} />
                                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans',sans-serif" }}>{v.icon} {latest.value.toFixed(v.step < 1 ? 1 : 0)} {v.unit}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ── AI ANALYSIS TAB ── */}
                {activeTab === "analysis" && (
                    <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: "28px 28px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✨</div>
                            <div>
                                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Syne',sans-serif" }}>AI Health Analysis</p>
                                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans',sans-serif" }}>Powered by Gemini · Not a substitute for medical advice</p>
                            </div>
                            {hasReadings && (
                                <button onClick={analyseWithAI} disabled={aiLoading} style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.15)", color: "#818cf8", fontSize: 13, cursor: aiLoading ? "wait" : "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                                    {aiLoading ? "⏳ Thinking…" : "🔄 Re-analyse"}
                                </button>
                            )}
                        </div>

                        {aiLoading && (
                            <div style={{ display: "flex", gap: 6, padding: "20px 0" }}>
                                {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#818cf8", animation: "bounce 1.2s ease infinite", animationDelay: `${i * 0.2}s` }} />)}
                            </div>
                        )}

                        {!aiLoading && aiAnalysis && (
                            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.8, fontFamily: "'DM Sans',sans-serif", whiteSpace: "pre-wrap" }}>
                                {aiAnalysis}
                            </div>
                        )}

                        {!aiLoading && !aiAnalysis && (
                            <div style={{ textAlign: "center", padding: "30px 0" }}>
                                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
                                    {hasReadings ? "Click \"AI Analysis\" above to get a personalised health assessment of your vitals." : "Log some vital readings first, then request an AI analysis."}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── HISTORY TAB ── */}
                {activeTab === "history" && (
                    <div>
                        {recentHistory.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.35)", fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
                                No readings recorded yet.
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {recentHistory.map((r, i) => {
                                    const vital = VITALS.find(v => v.id === r.vitalId);
                                    if (!vital) return null;
                                    const status = getStatus(r.vitalId, r.value);
                                    const date = new Date(r.ts);
                                    return (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                                            <span style={{ fontSize: 20 }}>{vital.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>{vital.label}</span>
                                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans',sans-serif", marginLeft: 8 }}>
                                                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontSize: 16, fontWeight: 700, color: vital.color, fontFamily: "'Syne',sans-serif" }}>
                                                    {r.value.toFixed(vital.step < 1 ? 1 : 0)}
                                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 3 }}>{vital.unit}</span>
                                                </span>
                                                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: `${STATUS_COLOR[status]}15`, color: STATUS_COLOR[status], border: `1px solid ${STATUS_COLOR[status]}30`, fontFamily: "'DM Sans',sans-serif" }}>
                                                    {STATUS_LABEL[status]}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {activeModal && (
                <AddModal vital={activeModal} onSave={addReading} onClose={() => setActiveModal(null)} />
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
        input::placeholder { color:rgba(255,255,255,0.2); }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
      `}</style>
            </div>
        </Layout>
    );
}
