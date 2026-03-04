// backend/services/vectorStore.js
// In-memory vector store using Gemini embeddings + cosine similarity
// No external ChromaDB server required!

const { GoogleGenerativeAI } = require("@google/generative-ai");
const medicalKnowledge = require("../data/medicalKnowledge");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Cache file path ────────────────────────────────────────────────────────────
const CACHE_FILE = path.join(__dirname, "../data/embeddings.cache.json");

// ── In-memory store: array of { id, text, region, category, embedding } ────────
let vectorStore = [];

// ── Sleep helper ──────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Embed a single text — retries on 429 with exponential backoff ──────────────
async function embedText(text, retries = 6) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (err) {
      const is429 = err.status === 429 || (err.message || "").includes("429");
      if (!is429 || attempt === retries) throw err;

      // Exponential backoff — hard-cap at 60s regardless of any API hint
      let waitMs = Math.min(2000 * Math.pow(2, attempt), 60000); // 2s, 4s, 8s … 60s cap
      // Only trust retry-after hints that are small (≤ 120 s); ignore giant timestamps
      const retryMatch = (err.message || "").match(/retryDelay[^\d]*"(\d{1,3})s"/i);
      if (retryMatch) {
        const hintMs = parseInt(retryMatch[1]) * 1000 + 500;
        waitMs = Math.min(Math.max(waitMs, hintMs), 60000); // still cap at 60s
      }

      console.log(`  ⏳ Rate limited — waiting ${(waitMs / 1000).toFixed(1)}s before retry ${attempt}/${retries}…`);
      await sleep(waitMs);
    }
  }
}

// ── Cosine similarity between two vectors ─────────────────────────────────────
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Initialise: embed all knowledge chunks into memory ────────────────────────
// On first run: embeds chunks one at a time and saves to disk cache.
// On subsequent runs: loads from cache instantly (zero API calls needed).
async function initVectorStore() {
  vectorStore = [];

  // ── Try loading from disk cache first ────────────────────────────────────────
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
      if (Array.isArray(cached) && cached.length === medicalKnowledge.length) {
        vectorStore = cached;
        console.log(`✅ Loaded ${vectorStore.length} embeddings from cache (no API calls needed)`);
        return;
      }
      console.log("⚠️  Cache size mismatch — will re-embed…");
    } catch {
      console.log("⚠️  Cache read failed — will re-embed…");
    }
  }

  // ── Fresh embed (only on first run or after knowledge base changes) ────────────
  const total = medicalKnowledge.length;
  console.log(`📚 Embedding ${total} medical knowledge chunks (1 at a time, ~700ms gap)…`);
  console.log(`   Estimated time: ~${Math.ceil(total * 0.7 / 60)} min`);

  for (let i = 0; i < total; i++) {
    const item = medicalKnowledge[i];

    const embedding = await embedText(item.text);
    vectorStore.push({
      id: item.id,
      text: item.text,
      region: item.region,
      category: item.category,
      embedding,
    });

    if ((i + 1) % 10 === 0 || i === total - 1) {
      console.log(`  ✅ Embedded ${i + 1}/${total}`);
    }

    // 700 ms gap between requests → stays under 86 req/min comfortably
    if (i < total - 1) await sleep(700);
  }

  console.log(`✅ Vector store ready! (${vectorStore.length} chunks in memory)`);

  // Save to disk so next restart loads from cache (no API calls)
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(vectorStore), "utf8");
    console.log(`💾 Embeddings saved to cache — future restarts will be instant!`);
  } catch (e) {
    console.warn("⚠️  Could not save embedding cache:", e.message);
  }
}

// ── Query: embed the question then rank chunks by cosine similarity ────────────
async function queryVectorStore(question, topK = 4, regionFilter = null) {
  if (vectorStore.length === 0) {
    console.warn("⚠️  Vector store is empty — RAG disabled");
    return [];
  }

  try {
    const queryEmbedding = await embedText(question);

    // Score each chunk
    let scored = vectorStore.map(item => ({
      ...item,
      score: cosineSimilarity(queryEmbedding, item.embedding),
    }));

    // Optionally restrict to a specific region + always include "general" chunks
    if (regionFilter) {
      const filtered = scored.filter(
        item => item.region === regionFilter || item.region === "general"
      );
      // Fall back to full store if filter yields too few results
      scored = filtered.length >= topK ? filtered : scored;
    }

    // Sort descending by similarity and return top-K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(item => ({
      text: item.text,
      region: item.region,
      category: item.category,
      score: item.score,
    }));
  } catch (err) {
    console.error("❌ Vector query error:", err.message);
    return [];
  }
}

module.exports = { initVectorStore, queryVectorStore };