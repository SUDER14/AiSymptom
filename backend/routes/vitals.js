// backend/routes/vitals.js
// AI-powered health vitals analysis via Gemini
require("dotenv").config();
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-flash-latest",
];

// POST /api/vitals/analyse
router.post("/analyse", async (req, res) => {
    const { vitals } = req.body;
    if (!vitals || vitals.length === 0) {
        return res.status(400).json({ error: "No vitals provided" });
    }

    const systemPrompt = `You are a clinical health analyst AI. You interpret patient-reported vital signs and provide a structured, empathetic health assessment. You are NOT diagnosing — you are flagging concerns and giving practical guidance.

RESPONSE FORMAT (always use this structure):
📊 VITAL SIGNS SUMMARY
- List each vital with its status (brief)

🔍 KEY OBSERVATIONS
- Highlight anything outside normal range
- Note any relationships between vitals (e.g., high BP + high heart rate)

✅ WHAT'S LOOKING GOOD
- Acknowledge normal readings positively

⚠️ AREAS OF CONCERN
- Flag any abnormal readings with brief explanation of implications

💡 RECOMMENDATIONS
- 3-5 practical, actionable steps based on the readings
- Include lifestyle, diet, and when to seek medical advice

🏥 WHEN TO SEE A DOCTOR
- Specific thresholds or symptoms that warrant medical attention

Keep the tone warm, professional, and reassuring. Avoid alarming language but be honest about concerning readings. Keep total response under 350 words.`;

    const userMessage = `Please analyse these vital signs readings:\n\n${vitals.join("\n")}`;

    let analysis = "";
    let lastErr = null;

    for (const modelName of MODEL_CHAIN) {
        try {
            console.log(`📊 Vitals AI trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
            const result = await model.generateContent(userMessage);
            analysis = result.response.text();
            console.log(`✅ Vitals analysis from ${modelName}`);
            break;
        } catch (err) {
            if (err.status === 429) {
                console.warn(`⚠️  ${modelName} rate limited — trying next…`);
                lastErr = err;
                continue;
            }
            throw err;
        }
    }

    if (!analysis) {
        return res.status(503).json({ error: "All AI models unavailable", details: lastErr?.message });
    }

    res.json({ analysis });
});

module.exports = router;
