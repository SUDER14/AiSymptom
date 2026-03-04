import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001/api";

// ── Disease catalogue ──────────────────────────────────────────────────────────
const DISEASES = [
    { id: "diabetes_type2", label: "Type 2 Diabetes", icon: "🩸", color: "#ef4444" },
    { id: "diabetes_type1", label: "Type 1 Diabetes", icon: "💉", color: "#f97316" },
    { id: "hypothyroidism", label: "Hypothyroidism", icon: "🦋", color: "#a855f7" },
    { id: "hyperthyroidism", label: "Hyperthyroidism", icon: "⚡", color: "#eab308" },
    { id: "hypertension", label: "Hypertension", icon: "❤️", color: "#ec4899" },
    { id: "high_cholesterol", label: "High Cholesterol", icon: "🫀", color: "#f43f5e" },
    { id: "pcos", label: "PCOS", icon: "🌸", color: "#d946ef" },
    { id: "fatty_liver", label: "Fatty Liver", icon: "🫁", color: "#84cc16" },
    { id: "kidney_disease", label: "Kidney Disease", icon: "🫘", color: "#06b6d4" },
    { id: "anemia", label: "Anaemia", icon: "🩺", color: "#f59e0b" },
    { id: "obesity", label: "Obesity", icon: "⚖️", color: "#10b981" },
    { id: "ibs", label: "IBS / Gut Issues", icon: "🌿", color: "#22d3ee" },
    { id: "osteoporosis", label: "Osteoporosis", icon: "🦴", color: "#e2e8f0" },
    { id: "arthritis", label: "Arthritis", icon: "🦵", color: "#fb923c" },
    { id: "gout", label: "Gout", icon: "🦶", color: "#c084fc" },
];

const GOALS = [
    { id: "manage", label: "Manage Condition", icon: "🎯" },
    { id: "weightloss", label: "Weight Loss", icon: "📉" },
    { id: "energy", label: "Boost Energy", icon: "⚡" },
    { id: "heal", label: "Heal & Recover", icon: "💚" },
];

const PREFS = [
    { id: "vegetarian", label: "Vegetarian", icon: "🥦" },
    { id: "vegan", label: "Vegan", icon: "🌱" },
    { id: "non_veg", label: "Non-Veg", icon: "🍗" },
    { id: "any", label: "No preference", icon: "🍽️" },
];

// ── Typing animation component ────────────────────────────────────────────────
function TypingDots() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={avatarStyle}>🥗</div>
            <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "bounce 1.2s ease infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
            </div>
        </div>
    );
}

const avatarStyle = {
    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg,#10b981,#059669)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
    marginRight: 10, marginTop: 2, boxShadow: "0 0 12px rgba(16,185,129,0.35)",
};

// Strip markdown bold/italic markers the AI sometimes emits
const cleanText = (t) => t.replace(/\*\*/g, "").replace(/\*/g, "");

// ── Chat bubble ───────────────────────────────────────────────────────────────
function Bubble({ msg }) {
    const isUser = msg.role === "user";
    return (
        <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14, animation: "fadeUp 0.25s ease both" }}>
            {!isUser && <div style={avatarStyle}>🥗</div>}
            <div style={{
                maxWidth: "78%", padding: "12px 16px",
                borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: isUser ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.06)",
                border: isUser ? "none" : "1px solid rgba(255,255,255,0.1)",
                fontSize: 13.5, fontFamily: "'DM Sans',sans-serif",
                color: isUser ? "#fff" : "rgba(255,255,255,0.88)", lineHeight: 1.7,
                whiteSpace: "pre-wrap",
            }}>
                {cleanText(msg.content)}
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DietRecommendation() {
    const navigate = useNavigate();
    const [step, setStep] = useState("select"); // select | chat
    const [selectedDisease, setSelectedDisease] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState("manage");
    const [selectedPref, setSelectedPref] = useState("any");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const bottomRef = useRef();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const filteredDiseases = DISEASES.filter(d =>
        d.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Start session with disease context ──────────────────────────────────────
    const handleStart = async () => {
        if (!selectedDisease) return;
        const disease = DISEASES.find(d => d.id === selectedDisease);
        const goal = GOALS.find(g => g.id === selectedGoal);
        const pref = PREFS.find(p => p.id === selectedPref);

        const initMsg = `I have ${disease.label}. My goal is to ${goal.label.toLowerCase()}. My diet preference is ${pref.label}. Please give me personalised diet advice.`;

        setStep("chat");
        setMessages([{ role: "user", content: `${disease.icon} ${disease.label} · ${goal.icon} ${goal.label} · ${pref.icon} ${pref.label}` }]);
        await sendToBE(initMsg, []);
    };

    // ── Send to backend diet route ──────────────────────────────────────────────
    const sendToBE = async (userMsg, history) => {
        setIsTyping(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/diet/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg, diseaseId: selectedDisease, conversationHistory: history }),
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        } catch (err) {
            console.error(err);
            setError("Could not reach the AI server. Make sure the backend is running on port 3001.");
            setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please make sure the backend server is running." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping) return;
        const newHistory = [...messages, { role: "user", content: text }];
        setMessages(newHistory);
        setInput("");
        await sendToBE(text, newHistory.slice(-8));
    };

    const disease = DISEASES.find(d => d.id === selectedDisease);

    // ── STEP 1: Disease selector ─────────────────────────────────────────────────
    if (step === "select") {
        return (
            <div style={{ width: "100vw", minHeight: "100vh", background: "#080b14", fontFamily: "'DM Sans',sans-serif", overflowY: "auto" }}>
                {/* Animated background blobs */}
                <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
                    <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)" }} />
                    <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)" }} />
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(16,185,129,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.025) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
                </div>

                <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 24px 60px" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                        <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(255,255,255,0.6)", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18 }}>←</button>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 20px rgba(16,185,129,0.4)" }}>🥗</div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif", letterSpacing: "-0.5px" }}>Diet Advisor</h1>
                            <p style={{ margin: 0, fontSize: 12, color: "rgba(16,185,129,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI-Powered Nutrition Guidance</p>
                        </div>
                    </div>

                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 32, marginLeft: 96 }}>Select your condition and preferences to get a personalised diet plan.</p>

                    {/* Step 1: Disease */}
                    <Section label="01 · Select Your Condition" icon="🫀">
                        {/* Search */}
                        <input
                            placeholder="🔍  Search condition…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: "100%", boxSizing: "border-box", marginBottom: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, padding: "10px 14px", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                            {filteredDiseases.map(d => (
                                <DiseaseCard
                                    key={d.id}
                                    disease={d}
                                    selected={selectedDisease === d.id}
                                    onClick={() => setSelectedDisease(d.id)}
                                />
                            ))}
                        </div>
                    </Section>

                    {/* Step 2: Goal */}
                    <Section label="02 · Your Health Goal" icon="🎯">
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {GOALS.map(g => (
                                <PillBtn key={g.id} item={g} selected={selectedGoal === g.id} onClick={() => setSelectedGoal(g.id)} color="#10b981" />
                            ))}
                        </div>
                    </Section>

                    {/* Step 3: Diet preference */}
                    <Section label="03 · Diet Preference" icon="🥦">
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {PREFS.map(p => (
                                <PillBtn key={p.id} item={p} selected={selectedPref === p.id} onClick={() => setSelectedPref(p.id)} color="#a855f7" />
                            ))}
                        </div>
                    </Section>

                    {/* Start button */}
                    <button
                        onClick={handleStart}
                        disabled={!selectedDisease}
                        style={{
                            width: "100%", padding: "16px", marginTop: 12, borderRadius: 14, border: "none", cursor: selectedDisease ? "pointer" : "not-allowed",
                            background: selectedDisease ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.06)",
                            color: selectedDisease ? "#fff" : "rgba(255,255,255,0.2)",
                            fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                            transition: "all 0.2s ease",
                            boxShadow: selectedDisease ? "0 8px 32px rgba(16,185,129,0.35)" : "none",
                        }}
                    >
                        {selectedDisease ? `🚀 Generate My ${DISEASES.find(d => d.id === selectedDisease)?.label} Diet Plan` : "Select a condition to continue"}
                    </button>
                </div>

                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          input::placeholder { color: rgba(255,255,255,0.25); }
          ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
        `}</style>
            </div>
        );
    }

    // ── STEP 2: Chat UI ──────────────────────────────────────────────────────────
    return (
        <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "#080b14", fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: "rgba(255,255,255,0.02)" }}>
                <button onClick={() => setStep("select")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.6)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>←</button>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 0 14px rgba(16,185,129,0.4)" }}>🥗</div>
                <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Syne',sans-serif" }}>Diet Advisor</p>
                    {disease && <p style={{ margin: 0, fontSize: 11, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.08em" }}>{disease.icon} {disease.label}</p>}
                </div>

                {/* Back to home */}
                <button onClick={() => navigate("/")} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.4)", padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    🏠 Home
                </button>

                {/* Change condition */}
                <button onClick={() => { setStep("select"); setMessages([]); }} style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, color: "rgba(52,211,153,0.9)", padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    🔄 Change Condition
                </button>

                {/* Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 20, padding: "5px 10px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse 2s ease infinite" }} />
                    <span style={{ fontSize: 11, color: "rgba(52,211,153,0.9)" }}>AI Nutritionist</span>
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
                {/* Tip banner */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <span style={{ display: "inline-block", padding: "7px 18px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 24, fontSize: 12, color: "rgba(52,211,153,0.85)" }}>
                        💬 You can ask follow-up questions like "give me a weekly meal plan" or "what snacks can I eat?"
                    </span>
                </div>
                {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                {isTyping && <TypingDots />}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding: "14px 24px 22px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "8px 8px 8px 16px" }}>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Ask about foods, meal plans, recipes, nutrients…"
                        rows={1}
                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: "#fff", fontSize: 14, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, paddingTop: 6 }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: input.trim() && !isTyping ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.06)", color: input.trim() && !isTyping ? "#fff" : "rgba(255,255,255,0.2)", cursor: input.trim() && !isTyping ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}
                    >↑</button>
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center" }}>
                    Powered by Gemini AI · Not a substitute for professional dietitian advice
                </p>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
      `}</style>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ label, icon, children }) {
    return (
        <div style={{ marginBottom: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
            </div>
            {children}
        </div>
    );
}

function DiseaseCard({ disease, selected, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "14px 12px", borderRadius: 12, border: `1px solid ${selected ? disease.color : "rgba(255,255,255,0.08)"}`,
                background: selected ? `${disease.color}18` : "rgba(255,255,255,0.035)",
                cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                boxShadow: selected ? `0 0 20px ${disease.color}30` : "none",
                transform: selected ? "scale(1.03)" : "scale(1)",
            }}
        >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{disease.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: selected ? "#fff" : "rgba(255,255,255,0.6)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.3 }}>{disease.label}</div>
            {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: disease.color, marginTop: 6, boxShadow: `0 0 8px ${disease.color}` }} />}
        </button>
    );
}

function PillBtn({ item, selected, onClick, color }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "8px 16px", borderRadius: 24, border: `1px solid ${selected ? color : "rgba(255,255,255,0.1)"}`,
                background: selected ? `${color}20` : "rgba(255,255,255,0.04)",
                color: selected ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.18s ease",
                boxShadow: selected ? `0 0 14px ${color}30` : "none",
            }}
        >
            <span>{item.icon}</span>
            <span style={{ fontWeight: selected ? 600 : 400 }}>{item.label}</span>
        </button>
    );
}
