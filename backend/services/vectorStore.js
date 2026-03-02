// backend/services/vectorStore.js
// In-memory vector store using Gemini embeddings + cosine similarity
// No external ChromaDB server required!

const { GoogleGenerativeAI } = require("@google/generative-ai");
const medicalKnowledge = require("../data/medicalKnowledge");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── In-memory store: array of { id, text, region, category, embedding } ────────
let vectorStore = [];

// ── Embed a single text using Gemini embedding model ──────────────────────────
async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
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
async function initVectorStore() {
  vectorStore = [];

  console.log(`📚 Embedding ${medicalKnowledge.length} medical knowledge chunks…`);

  // Embed in batches of 5 to respect API rate limits
  const batchSize = 5;
  for (let i = 0; i < medicalKnowledge.length; i += batchSize) {
    const batch = medicalKnowledge.slice(i, i + batchSize);

    const embeddings = await Promise.all(batch.map(item => embedText(item.text)));

    batch.forEach((item, j) => {
      vectorStore.push({
        id: item.id,
        text: item.text,
        region: item.region,
        category: item.category,
        embedding: embeddings[j],
      });
    });

    console.log(`  ✅ Embedded ${Math.min(i + batchSize, medicalKnowledge.length)}/${medicalKnowledge.length}`);

    // Small delay to respect rate limits
    if (i + batchSize < medicalKnowledge.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`✅ Vector store ready! (${vectorStore.length} chunks in memory)`);
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