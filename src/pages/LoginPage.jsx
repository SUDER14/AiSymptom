// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [tab, setTab] = useState("signin"); // "signin" | "register"
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", whatsapp: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
        if (tab === "register") {
            if (!form.name) { setError("Please enter your name."); return; }
            if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
            if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
        }
        setLoading(true);
        // Simulate network delay for realism
        await new Promise(r => setTimeout(r, 900));
        login({
            name: tab === "register" ? form.name : (form.email.split("@")[0]),
            email: form.email,
            whatsapp: form.whatsapp || "",
            avatar: tab === "register" ? form.name[0]?.toUpperCase() : form.email[0]?.toUpperCase(),
        });
        setLoading(false);
        navigate("/home");
    };

    const inputStyle = {
        width: "100%", boxSizing: "border-box",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12, color: "#fff",
        fontSize: 14, padding: "13px 16px",
        outline: "none", fontFamily: "'DM Sans',sans-serif",
        transition: "border-color 0.2s",
    };

    return (
        <div style={{
            width: "100vw", height: "100vh",
            background: "#080b14",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans',sans-serif",
            overflow: "hidden", position: "relative",
        }}>
            {/* Animated background blobs */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "-20%", left: "-15%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(37,99,235,0.10) 0%,transparent 70%)", animation: "float1 8s ease-in-out infinite" }} />
                <div style={{ position: "absolute", bottom: "-20%", right: "-15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)", animation: "float2 10s ease-in-out infinite" }} />
                <div style={{ position: "absolute", top: "50%", left: "60%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.06) 0%,transparent 70%)", animation: "float3 12s ease-in-out infinite" }} />
                {/* Grid */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.03) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
                {/* Particles */}
                {[...Array(18)].map((_, i) => (
                    <div key={i} style={{
                        position: "absolute",
                        width: Math.random() * 3 + 1,
                        height: Math.random() * 3 + 1,
                        borderRadius: "50%",
                        background: `rgba(${i % 3 === 0 ? "37,99,235" : i % 3 === 1 ? "139,92,246" : "16,185,129"},0.4)`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 3}s`,
                    }} />
                ))}
            </div>

            {/* Card */}
            <div style={{
                position: "relative", zIndex: 1,
                width: "100%", maxWidth: 440,
                margin: "0 24px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                padding: "36px 36px 32px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18,
                        background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, margin: "0 auto 16px",
                        boxShadow: "0 0 32px rgba(37,99,235,0.5), 0 0 0 1px rgba(37,99,235,0.3) inset",
                    }}>🩺</div>
                    <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#fff", fontFamily: "'Syne',sans-serif", letterSpacing: "-0.03em" }}>
                        AI Symptom
                    </h1>
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                        Your intelligent health companion
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, marginBottom: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
                    {[{ id: "signin", label: "Sign In" }, { id: "register", label: "Create Account" }].map(t => (
                        <button key={t.id} onClick={() => { setTab(t.id); setError(""); }}
                            style={{
                                flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                                transition: "all 0.2s",
                                background: tab === t.id ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "transparent",
                                color: tab === t.id ? "#fff" : "rgba(255,255,255,0.35)",
                                boxShadow: tab === t.id ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
                            }}>{t.label}</button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {tab === "register" && (
                        <div>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>Full Name</label>
                            <input type="text" placeholder="e.g. Shatvitha" value={form.name} onChange={e => set("name", e.target.value)} style={inputStyle} />
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>Email</label>
                        <input type="email" placeholder="you@example.com" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle} />
                    </div>

                    <div>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>Password</label>
                        <input type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} style={inputStyle} />
                    </div>

                    {tab === "register" && (
                        <div>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>Confirm Password</label>
                            <input type="password" placeholder="••••••••" value={form.confirm} onChange={e => set("confirm", e.target.value)} style={inputStyle} />
                        </div>
                    )}
                    {tab === "register" && (
                        <div>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>WhatsApp Number <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(for appointment reminders, optional)</span></label>
                            <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>📱</span>
                                <input type="tel" placeholder="+91 9876543210" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} style={{ ...inputStyle, paddingLeft: 40 }} />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 12, color: "rgba(239,100,100,0.9)" }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        style={{
                            width: "100%", padding: "14px", marginTop: 4,
                            borderRadius: 12, border: "none",
                            background: loading ? "rgba(37,99,235,0.4)" : "linear-gradient(135deg,#2563eb,#1d4ed8)",
                            color: loading ? "rgba(255,255,255,0.5)" : "#fff",
                            fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif",
                            cursor: loading ? "not-allowed" : "pointer",
                            boxShadow: loading ? "none" : "0 8px 28px rgba(37,99,235,0.45)",
                            transition: "all 0.2s", letterSpacing: "-0.01em",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                        {loading ? (
                            <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> {tab === "signin" ? "Signing in…" : "Creating account…"}</>
                        ) : (
                            tab === "signin" ? "🔐 Sign In" : "🚀 Create Account"
                        )}
                    </button>

                    {tab === "signin" && (
                        <button type="button"
                            onClick={() => { login({ name: "Guest", email: "guest@demo.com", avatar: "G" }); navigate("/home"); }}
                            style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
                            Continue as Guest (Demo)
                        </button>
                    )}
                </form>

                <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 20, marginBottom: 0 }}>
                    Session only · Nothing stored externally · For demo purposes
                </p>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,20px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,30px)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-25px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        input::placeholder { color:rgba(255,255,255,0.2); }
        input:focus { border-color:rgba(37,99,235,0.5) !important; box-shadow:0 0 0 3px rgba(37,99,235,0.08); }
      `}</style>
        </div>
    );
}
