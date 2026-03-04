// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const net = require("net");
const { initVectorStore } = require("./services/vectorStore");
const doctorRoutes = require("./routes/doctor");
const ttsRoutes = require("./routes/tts");
const dietRoutes = require("./routes/diet");
const vitalsRoutes = require("./routes/vitals");
const appointmentRoutes = require("./routes/appointments");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/doctor", doctorRoutes);
app.use("/api/tts", ttsRoutes);
app.use("/api/diet", dietRoutes);
app.use("/api/vitals", vitalsRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// ── Helper: check if port is available ────────────────────────────────────────
function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once("error", () => resolve(false))
      .once("listening", () => { tester.close(); resolve(true); })
      .listen(port, "127.0.0.1");
  });
}

// ── Helper: wait until port is free (up to 10 s) ──────────────────────────────
async function waitForPort(port, maxWaitMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isPortFree(port)) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

// ── Start server ───────────────────────────────────────────────────────────────
async function startServer(ragReady) {
  // Wait up to 10 s for port to become free (handles ghost processes)
  const free = await waitForPort(PORT);
  if (!free) {
    console.error(`❌ Port ${PORT} is still in use after 10 s.`);
    console.error("   Run: taskkill /F /IM node.exe   then retry.");
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    const ragStatus = ragReady ? "with RAG ✅" : "WITHOUT RAG ⚠️";
    console.log(`🚀 Backend running at http://localhost:${PORT}  (${ragStatus})`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error("   Run: taskkill /F /IM node.exe   then retry.");
    } else {
      console.error("❌ Server error:", err.message);
    }
    process.exit(1);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function start() {
  // Start the HTTP server IMMEDIATELY so the app is usable right away
  await startServer(false);

  // Load RAG in the background — won't block the server
  console.log("🔧 Initialising vector store in background…");
  initVectorStore()
    .then(() => {
      console.log("✅ Vector store ready — RAG is now active!");
    })
    .catch((err) => {
      console.error("❌ Vector store error:", err.message);
      console.warn("⚠️  RAG disabled — AI doctor still works, just without local medical references.");
      console.warn("   Tip: if you see a 429 quota error, wait ~1 minute and restart.");
    });
}

start();