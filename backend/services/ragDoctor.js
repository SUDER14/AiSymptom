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
async function getRagResponse({ userMessage, muscleKey, muscleName, replyLang, patientProfile, conversationHistory }) {
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
  const systemPrompt = `You are a friendly, plain-speaking AI medical assistant who specialises in musculoskeletal health.

${muscleKey ? `The patient has selected the ${muscleName} region and is reporting symptoms there.` : ""}
${patientProfile ? `\nPATIENT HEALTH PROFILE:\n${patientProfile}\nUse this profile to personalise your advice (e.g. consider age, weight, existing conditions, medications).` : ""}

MEDICAL KNOWLEDGE BASE (retrieved from clinical database):
${context}

REPLY STYLE — follow these rules strictly:
- Write in plain conversational English. No bullet points, no numbered lists, no markdown.
- Never use asterisks (**) or any markdown formatting whatsoever.
- Keep your answer to 2-3 short sentences maximum unless the patient asks for more detail.
- After your answer, ask ONE specific follow-up question to better understand their situation.
  Good follow-up examples: "How long have you had this pain?", "Does the pain get worse when you lift your arm?", "On a scale of 1 to 10, how painful is it right now?"
- Be warm and human. Avoid medical jargon. If you must use a medical term, explain it simply.
- Always end with a care suggestion: rest at home / see a GP soon / go to urgent care / call emergency services.
- You are an AI assistant, not a doctor. Always recommend professional evaluation for diagnosis.
- LANGUAGE: Reply entirely in ${replyLangName}. Do not mix languages.`;

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
