import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "12px", animation: "fadeUp 0.25s ease both" }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg,#ff3333,#880000)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", flexShrink: 0, marginRight: "10px", marginTop: 2,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: "72%", padding: "12px 16px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "linear-gradient(135deg,#ff3333,#cc1111)" : "rgba(255,255,255,0.06)",
        border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
        fontSize: "13.5px", fontFamily: "'DM Sans',sans-serif",
        color: isUser ? "#fff" : "rgba(255,255,255,0.8)",
        lineHeight: 1.6,
        boxShadow: isUser ? "0 4px 14px rgba(255,50,50,0.25)" : "none",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#ff3333,#880000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🤖</div>
      <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "5px", alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "bounce 1.2s ease infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { muscleName, prefillMessage } = location.state || {};

  const [messages, setMessages] = useState([{
    role: "assistant",
    content: muscleName
      ? `Hi! I see you're experiencing issues with your ${muscleName}. Please describe your symptoms in detail — when did they start, how severe are they, and what makes them better or worse?`
      : "Hi! I'm your AI health assistant. Please describe your symptoms and I'll help you understand what might be going on.",
  }]);
  const [input, setInput] = useState(prefillMessage || "");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Replace this with your real AI API call
  const getAIResponse = async (userMessage) => {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));
    setIsTyping(false);
    const userTurns = messages.filter((m) => m.role === "user").length;
    const responses = [
      `Based on your description of ${muscleName || "the affected area"}, this could indicate muscle strain or inflammation. How long have you been experiencing this?`,
      "On a scale of 1–10, how would you rate the pain? Does it radiate to other areas?",
      "Have you had any recent physical activity or injury that might have triggered this?",
      "These symptoms warrant attention. I'd recommend consulting a physiotherapist or sports medicine doctor. Would you like me to outline what to expect from the examination?",
    ];
    return responses[Math.min(userTurns, responses.length - 1)];
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    const reply = await getAIResponse(text);
    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "radial-gradient(ellipse at 40% 30%,#12060a 0%,#080b14 60%,#04060f 100%)", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Header */}
      <header style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(255,255,255,0.6)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px" }}
        >←</button>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#ff3333,#880000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 0 16px rgba(255,50,50,0.3)" }}>🤖</div>
        <div>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff", fontFamily: "'Syne',sans-serif" }}>AI Health Assistant</p>
          {muscleName && <p style={{ margin: 0, fontSize: "11px", color: "#ff6b6b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Consulting: {muscleName}</p>}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,200,80,0.08)", border: "1px solid rgba(0,200,80,0.2)", borderRadius: "20px", padding: "5px 12px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00c850", animation: "pulse 2s ease infinite" }} />
          <span style={{ fontSize: "11px", color: "rgba(0,200,80,0.8)" }}>Online</span>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", maxWidth: "760px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {muscleName && (
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ display: "inline-block", padding: "8px 18px", background: "rgba(255,60,60,0.06)", border: "1px solid rgba(255,60,60,0.15)", borderRadius: "24px", fontSize: "12px", color: "rgba(255,100,100,0.7)" }}>
              🎯 Focused on <strong style={{ color: "#ff6b6b" }}>{muscleName}</strong>
            </span>
          </div>
        )}
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", maxWidth: "760px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "8px 8px 8px 16px" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Describe your ${muscleName ? muscleName + " " : ""}symptoms…`}
            rows={1}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", color: "#fff", fontSize: "14px", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, paddingTop: "6px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            style={{
              width: 40, height: 40, borderRadius: "10px",
              background: input.trim() && !isTyping ? "linear-gradient(135deg,#ff3333,#cc1111)" : "rgba(255,255,255,0.06)",
              border: "none", color: input.trim() && !isTyping ? "#fff" : "rgba(255,255,255,0.2)",
              cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", flexShrink: 0,
            }}
          >↑</button>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
          Not a substitute for professional medical advice · Enter to send
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,80,80,0.2);border-radius:2px}
      `}</style>
    </div>
  );
}