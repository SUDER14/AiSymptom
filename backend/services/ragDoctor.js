// backend/services/ragDoctor.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { queryVectorStore } = require("./vectorStore");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Map frontend muscle keys to canonical region names ────────────────────────
const REGION_MAP = {
  head: "head",
  neck: "neck",
  trapezius: "trapezius",
  pectoralis_major_left: "pectoralis_major",
  pectoralis_major_right: "pectoralis_major",
  deltoid_left: "deltoid",
  deltoid_right: "deltoid",
  bicep_left: "bicep",
  bicep_right: "bicep",
  tricep_left: "tricep",
  tricep_right: "tricep",
  rectus_abdominis: "rectus_abdominis",
  obliques_left: "obliques",
  obliques_right: "obliques",
  latissimus_dorsi_left: "latissimus_dorsi",
  latissimus_dorsi_right: "latissimus_dorsi",
  gluteus_maximus_left: "gluteus_maximus",
  gluteus_maximus_right: "gluteus_maximus",
  quadriceps_left: "quadriceps",
  quadriceps_right: "quadriceps",
  hamstrings_left: "hamstrings",
  hamstrings_right: "hamstrings",
  gastrocnemius_left: "gastrocnemius",
  gastrocnemius_right: "gastrocnemius",
};

// ── Core RAG function ─────────────────────────────────────────────────────────
async function getRagResponse({ userMessage, muscleKey, muscleName, replyLang, conversationHistory }) {
  // Language name map for the system prompt instruction
  const LANG_NAMES = { en: "English", ta: "Tamil", te: "Telugu", hi: "Hindi" };
  const replyLangName = LANG_NAMES[replyLang] || "English";
  // 1. Determine region for targeted vector search
  const region = REGION_MAP[muscleKey] || null;

  // 2. Build a rich search query combining user message + muscle context
  const searchQuery = muscleKey
    ? `${muscleName} muscle symptoms: ${userMessage}`
    : userMessage;

  // 3. Retrieve relevant medical knowledge from vector store
  const chunks = await queryVectorStore(searchQuery, 4, region);

  // 4. Build context string from retrieved chunks
  const context = chunks.length > 0
    ? chunks.map((c, i) =>
      `[Medical Reference ${i + 1} — ${c.region} / ${c.category}]\n${c.text}`
    ).join("\n\n")
    : "No specific medical references retrieved. Use general medical knowledge.";

  // 5. Build conversation history for multi-turn
  const history = (conversationHistory || [])
    .slice(-6)  // last 3 turns (6 messages) to stay within context window
    .map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

  // 6. System prompt with RAG context injected
  const systemPrompt = `You are an experienced AI medical assistant specialising in musculoskeletal health and sports medicine. You have access to verified medical references about the patient's specific condition.

${muscleKey ? `The patient has selected the **${muscleName}** region and is reporting symptoms related to it.` : ""}

MEDICAL KNOWLEDGE BASE (retrieved from clinical database):
${context}

INSTRUCTIONS:
- Use the medical references above to give accurate, evidence-based responses
- Always acknowledge severity — recommend urgent care if symptoms suggest serious conditions
- Give practical, actionable advice (RICE protocol, exercises, when to see a doctor)
- Ask clarifying questions to better assess the situation (duration, severity 1-10, aggravating factors)
- Be empathetic and clear — avoid overly technical jargon
- Always end responses with a recommendation (self-care / see GP / urgent care / ER)
- IMPORTANT: You are an AI assistant, not a doctor. Always recommend professional evaluation for diagnosis.
- Keep responses concise — 3-5 sentences max unless the patient asks for more detail
- LANGUAGE: You MUST reply entirely in **${replyLangName}**. Do not mix languages.`;

  // 7. Call Gemini — try each model in order, skip on 429
  // Free-tier daily limits differ per model, so we cascade across them
  const MODEL_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-flash-latest",
  ];

  let reply = "";
  let lastErr = null;

  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`🤖 Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      reply = result.response.text();
      console.log(`✅ Response from ${modelName}`);
      break; // success — stop trying further models
    } catch (err) {
      if (err.status === 429) {
        console.warn(`⚠️  ${modelName} hit rate/quota limit (429) — trying next model…`);
        lastErr = err;
        continue; // try the next model immediately
      }
      throw err; // non-429 errors bubble up
    }
  }

  if (!reply) {
    throw lastErr || new Error("All models exhausted with no reply");
  }

  return {
    reply,
    sourcesUsed: chunks.map(c => ({ region: c.region, category: c.category })),
  };
}

module.exports = { getRagResponse };
