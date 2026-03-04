// src/pages/HomePage.jsx
// Main hub after login — shows all features + patient intake profile setup
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import HumanScene from "../components/HumanScene";

// ── Patient Intake Modal ───────────────────────────────────────────────────────
function IntakeModal({ onClose, onSave, existing }) {
    const [form, setForm] = useState(existing || {
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
    const labelStyle = { fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 5, display: "block" };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(8px)" }}>
            <div style={{
                width: "100%", maxWidth: 500, background: "#0d1525",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
                padding: "28px 28px 24px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                maxHeight: "90vh", overflowY: "auto",
                fontFamily: "'DM Sans',sans-serif",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif" }}>Health Profile</h2>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Used to personalise AI doctor advice</p>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>×</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Age</label>
                            <input type="number" min="1" max="120" placeholder="e.g. 25" value={form.age} onChange={e => set("age", e.target.value)} style={fieldStyle} />
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={labelStyle}>Weight (kg)</label>
                            <input type="number" min="1" placeholder="e.g. 65" value={form.weight} onChange={e => set("weight", e.target.value)} style={fieldStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Height (cm)</label>
                            <input type="number" min="1" placeholder="e.g. 165" value={form.height} onChange={e => set("height", e.target.value)} style={fieldStyle} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>Existing Medical Conditions</label>
                        <input type="text" placeholder="e.g. Diabetes, Asthma (or None)" value={form.conditions} onChange={e => set("conditions", e.target.value)} style={fieldStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Current Medications</label>
                        <input type="text" placeholder="e.g. Metformin (or None)" value={form.medications} onChange={e => set("medications", e.target.value)} style={fieldStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Known Allergies</label>
                        <input type="text" placeholder="e.g. Penicillin (or None)" value={form.allergies} onChange={e => set("allergies", e.target.value)} style={fieldStyle} />
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        <button onClick={() => onSave(form)}
                            style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer", boxShadow: "0 6px 20px rgba(37,99,235,0.4)" }}>
                            💾 Save Profile
                        </button>
                        <button onClick={onClose}
                            style={{ padding: "13px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 14, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
                            Cancel
                        </button>
                    </div>
                </div>
                <style>{`
          input::placeholder { color:rgba(255,255,255,0.2); }
          input:focus, select:focus { border-color:rgba(37,99,235,0.5)!important; }
          select option { background:#0d1525; color:#fff; }
          ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        `}</style>
            </div>
        </div>
    );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, gradient, glowColor, badge, onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                cursor: "pointer", borderRadius: 20, padding: "28px 24px",
                background: hovered ? `linear-gradient(135deg,${gradient.from}22,${gradient.to}11)` : "rgba(255,255,255,0.03)",
                border: `1px solid ${hovered ? glowColor + "55" : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.25s ease",
                transform: hovered ? "translateY(-4px)" : "none",
                boxShadow: hovered ? `0 20px 50px ${glowColor}22, 0 0 0 1px ${glowColor}22` : "none",
                position: "relative", overflow: "hidden",
            }}
        >
            {/* Glow orb */}
            {hovered && <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${glowColor}20 0%,transparent 70%)`, pointerEvents: "none" }} />}

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `linear-gradient(135deg,${gradient.from},${gradient.to})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24,
                    boxShadow: `0 8px 20px ${glowColor}40`,
                    transition: "transform 0.25s",
                    transform: hovered ? "scale(1.1) rotate(-5deg)" : "none",
                }}>
                    {icon}
                </div>
                {badge && (
                    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: `${glowColor}22`, border: `1px solid ${glowColor}44`, color: glowColor, fontWeight: 700, letterSpacing: "0.05em" }}>
                        {badge}
                    </span>
                )}
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif", letterSpacing: "-0.02em" }}>{title}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{desc}</p>

            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 6, color: glowColor, fontSize: 12, fontWeight: 600, opacity: hovered ? 1 : 0.5, transition: "opacity 0.2s" }}>
                Open <span style={{ fontSize: 14 }}>→</span>
            </div>
        </div>
    );
}

// ── Main HomePage ──────────────────────────────────────────────────────────────
export default function HomePage() {
    const navigate = useNavigate();
    const { user, profile, saveProfile, logout } = useAuth();
    const [showIntake, setShowIntake] = useState(false);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    };

    const features = [
        {
            icon: "🫁",
            title: "AI Doctor",
            desc: "Interactive 3D anatomy explorer with AI-powered symptom analysis and medical advice.",
            gradient: { from: "#2563eb", to: "#1d4ed8" },
            glowColor: "#3b82f6",
            badge: "RAG Powered",
            path: "/body",
        },
        {
            icon: "🗓",
            title: "Book Hospital",
            desc: "Find real hospitals near you and book appointment slots instantly.",
            gradient: { from: "#00d4ff", to: "#7c3aed" },
            glowColor: "#00d4ff",
            badge: "OpenStreetMap",
            path: "/appointments",
        },
        {
            icon: "📄",
            title: "PDF Report",
            desc: "Download your consultation summary to share with your real doctor.",
            gradient: { from: "#00e5a0", to: "#059669" },
            glowColor: "#00e5a0",
            badge: "Export",
            path: "/reports",
        },
    ];

    const [activeModel, setActiveModel] = useState("male_muscle");
    const [modelPath, setModelPath] = useState(null);
    useEffect(() => {
        import("@react-three/drei").then(({ useGLTF }) => {
            useGLTF.preload("/models/male_muscle/scene.glb");
            useGLTF.preload("/models/male_skeleton/scene.glb");
            useGLTF.preload("/models/female_muscle/scene.glb");
            useGLTF.preload("/models/female_skeleton/scene.glb");
        });
    }, []);

    useEffect(() => {
        const map = {
            male_muscle: "/models/male_muscle/scene.glb",
            male_skeleton: "/models/male_skeleton/scene.glb",
            female_muscle: "/models/female_muscle/scene.glb",
            female_skeleton: "/models/female_skeleton/scene.glb",
        };
        setModelPath(map[activeModel]);
    }, [activeModel]);

    return (
        <Layout>
            {showIntake && <IntakeModal existing={profile} onSave={(d)=>{saveProfile(d);setShowIntake(false);}} onClose={()=>setShowIntake(false)} />}

            {/* RED FLAG */}
            <div className="redflag-banner">
                <div className="rf-icon">⚠️</div>
                <div className="rf-text">
                    <h4>Red Flag Detected — Seek Medical Attention</h4>
                    <p>Your recent symptoms (chest tightness + left arm pain) may require urgent evaluation. Do not ignore this.</p>
                </div>
                <button className="rf-btn" onClick={()=>navigate("/appointments")}>📞 Find ER Now</button>
            </div>

            {/* STAT CARDS */}
            <div className="stat-grid">
                <div className="stat-card c1">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-label">Heart Rate</div>
                    <div className="stat-value c1">78 <span style={{fontSize:14,fontWeight:400}}>bpm</span></div>
                    <div className="stat-sub">↑ 3 bpm from yesterday</div>
                </div>
                <div className="stat-card c2">
                    <div className="stat-icon">🩸</div>
                    <div className="stat-label">Blood Pressure</div>
                    <div className="stat-value c2">120/80</div>
                    <div className="stat-sub">✓ Normal range</div>
                </div>
                <div className="stat-card c3">
                    <div className="stat-icon">😴</div>
                    <div className="stat-label">Sleep</div>
                    <div className="stat-value c3">7.2 <span style={{fontSize:14,fontWeight:400}}>hrs</span></div>
                    <div className="stat-sub">↓ 0.8h below goal</div>
                </div>
                <div className="stat-card c4">
                    <div className="stat-icon">🌡️</div>
                    <div className="stat-label">SpO2</div>
                    <div className="stat-value c4">97%</div>
                    <div className="stat-sub">Normal saturation</div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="content-grid">
                <div className="anatomy-card">
                    <div className="anatomy-header">
                        <h3>3D Anatomy Explorer</h3>
                        <div className="model-switcher">
                            <button className={`model-btn ${activeModel==='male_muscle'?'active':''}`} onClick={()=>setActiveModel('male_muscle')}>Muscle</button>
                            <button className={`model-btn ${activeModel==='male_skeleton'?'active':''}`} onClick={()=>setActiveModel('male_skeleton')}>Skeleton</button>
                            <button className={`model-btn ${activeModel.includes('male')?'active':''}`} onClick={()=>setActiveModel('male_muscle')}>Male</button>
                            <button className={`model-btn ${activeModel.includes('female')?'active':''}`} onClick={()=>setActiveModel(activeModel.replace('male','female'))}>Female</button>
                        </div>
                    </div>
                    <div className="anatomy-body">
                        {modelPath && <HumanScene modelPath={modelPath} onMuscleSelect={()=>{}} />}
                    </div>
                </div>
                <div className="right-panel">
                    <div className="ai-status-card">
                        <div className="ai-status-top">
                            <div className="ai-avatar">🩺</div>
                            <div>
                                <div className="ai-name">Dr. AI Assistant</div>
                                <div className="ai-online"><span className="online-dot"></span> Online · RAG Powered</div>
                            </div>
                        </div>
                        <div className="ai-message">"Based on your recent symptom history, I'd like to ask about that headache you reported 2 days ago. Has it persisted?"</div>
                        <button className="consult-btn" onClick={()=>navigate('/doctor')}>Start Consultation →</button>
                    </div>
                    <div className="vitals-card">
                        <div className="card-title">Live Vitals <span>View all →</span></div>
                        <div className="vital-row">
                            <div className="vital-icon" style={{background:'rgba(255,69,96,0.1)'}}>❤️</div>
                            <div className="vital-info">
                                <div className="vital-name">Heart Rate</div>
                                <div className="vital-value" style={{color:'var(--red)'}}>78 bpm</div>
                                <div className="vital-bar"><div className="vital-fill" style={{width:'65%',background:'var(--red)'}} /></div>
                            </div>
                        </div>
                        <div className="vital-row">
                            <div className="vital-icon" style={{background:'rgba(0,229,160,0.1)'}}>💧</div>
                            <div className="vital-info">
                                <div className="vital-name">Blood Pressure</div>
                                <div className="vital-value" style={{color:'var(--green)'}}>120/80</div>
                                <div className="vital-bar"><div className="vital-fill" style={{width:'78%',background:'var(--green)'}} /></div>
                            </div>
                        </div>
                        <div className="vital-row" style={{marginBottom:0}}>
                            <div className="vital-icon" style={{background:'rgba(0,212,255,0.1)'}}>🫁</div>
                            <div className="vital-info">
                                <div className="vital-name">SpO2</div>
                                <div className="vital-value" style={{color:'var(--accent)'}}>97%</div>
                                <div className="vital-bar"><div className="vital-fill" style={{width:'97%',background:'var(--accent)'}} /></div>
                            </div>
                        </div>
                    </div>
                    <div className="symptoms-card">
                        <div className="card-title">Recent Symptoms <span>History →</span></div>
                        <div className="symptom-item">
                            <div className="symptom-dot" style={{background:'var(--red)'}}></div>
                            <div className="symptom-text">Headache · Head region</div>
                            <div className="severity-badge" style={{background:'rgba(255,69,96,0.1)',color:'var(--red)'}}>Severe</div>
                        </div>
                        <div className="symptom-item">
                            <div className="symptom-dot" style={{background:'#f59e0b'}}></div>
                            <div className="symptom-text">Shoulder pain · Trapezius</div>
                            <div className="severity-badge" style={{background:'rgba(245,158,11,0.1)',color:'#f59e0b'}}>Moderate</div>
                        </div>
                        <div className="symptom-item">
                            <div className="symptom-dot" style={{background:'var(--green)'}}></div>
                            <div className="symptom-text">Lower back · Lumbar</div>
                            <div className="severity-badge" style={{background:'rgba(0,229,160,0.1)',color:'var(--green)'}}>Mild</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="features-grid">
                {features.map((f,i)=>(<FeatureCard key={i} {...f} onClick={()=>navigate(f.path)} />))}
            </div>
        </Layout>
    );
}
