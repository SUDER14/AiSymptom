// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initVectorStore } = require("./services/vectorStore");
const doctorRoutes = require("./routes/doctor");
const ttsRoutes = require("./routes/tts");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/doctor", doctorRoutes);
app.use("/api/tts", ttsRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// ── Start: init vector store then listen ─────────────────────────────────────
async function start() {
  try {
    console.log("🔧 Initialising vector store…");
    await initVectorStore();
    console.log("✅ Vector store ready");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
    });
    server.on("error", err => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Run: taskkill /F /IM node.exe  then try again.`);
      } else {
        console.error("❌ Server error:", err.message);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Startup error:", err.message);
    console.log("⚠️  Starting without vector store (RAG disabled)");

    // Start anyway so frontend doesn't break
    const fallbackServer = app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT} (no RAG)`);
    });
    fallbackServer.on("error", err => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Stop the existing process first (Ctrl+C in the other terminal).`);
      } else {
        console.error("❌ Server error:", err.message);
      }
      process.exit(1);
    });
  }
}

start();