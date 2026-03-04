// backend/routes/doctor.js
const express = require("express");
const router = express.Router();
const { getRagResponse } = require("../services/ragDoctor");

// In-memory session store (replace with Redis in production)
const sessions = new Map();

// ── POST /api/doctor/chat ─────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  try {
    const {
      sessionId,
      message,
      muscleKey,
      muscleName,
      replyLang,
      patientProfile,
    } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get or create conversation history for this session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }
    const history = sessions.get(sessionId);

    // Add user message to history
    history.push({ role: "user", content: message });

    // Get RAG-powered response
    const { reply, sourcesUsed } = await getRagResponse({
      userMessage: message,
      muscleKey: muscleKey || null,
      muscleName: muscleName || null,
      replyLang: replyLang || "en",
      patientProfile: patientProfile || null,
      conversationHistory: history.slice(0, -1),
    });

    // Add assistant response to history
    history.push({ role: "assistant", content: reply });

    // Keep history manageable (last 20 messages)
    if (history.length > 20) {
      sessions.set(sessionId, history.slice(-20));
    }

    return res.json({
      reply,
      sourcesUsed,
      sessionId,
    });
  } catch (err) {
    console.error("RAG chat error:", err);
    return res.status(500).json({
      error: "Failed to get AI response",
      details: err.message,
    });
  }
});

// ── DELETE /api/doctor/session/:id — clear conversation ──────────────────────
router.delete("/session/:id", (req, res) => {
  sessions.delete(req.params.id);
  res.json({ cleared: true });
});

module.exports = router;