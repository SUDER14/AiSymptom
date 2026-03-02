// backend/routes/tts.js
// Proxies Google Translate TTS so the browser doesn't need locally installed voices.
// Supports: en, ta (Tamil), te (Telugu), hi (Hindi)

const express = require("express");
const router = express.Router();
const https = require("https");

// Google Translate TTS is limited to ~200 chars per request.
// We chunk the text and respond with the first chunk's audio.
// (For longer text we return the whole audio via multiple fetches piped together.)

function fetchTTSChunk(text, lang) {
    return new Promise((resolve, reject) => {
        const encoded = encodeURIComponent(text.slice(0, 200));
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encoded}`;

        const options = {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Referer": "https://translate.google.com/",
            },
        };

        https.get(url, options, (res) => {
            const chunks = [];
            res.on("data", d => chunks.push(d));
            res.on("end", () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers["content-type"] || "audio/mpeg" }));
        }).on("error", reject);
    });
}

// GET /api/tts?text=Hello&lang=ta
router.get("/", async (req, res) => {
    const text = (req.query.text || "").trim();
    const lang = (req.query.lang || "en").toLowerCase();

    const ALLOWED = ["en", "ta", "te", "hi"];
    if (!ALLOWED.includes(lang)) return res.status(400).json({ error: "Unsupported language" });
    if (!text) return res.status(400).json({ error: "text is required" });

    try {
        // Split long text into ~200-char sentences so we can fetch each chunk
        const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
        const buffers = [];

        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (!trimmed) continue;
            // Further sub-chunk if a single sentence is > 200 chars
            let start = 0;
            while (start < trimmed.length) {
                const slice = trimmed.slice(start, start + 200);
                const { buffer } = await fetchTTSChunk(slice, lang);
                buffers.push(buffer);
                start += 200;
            }
        }

        const combined = Buffer.concat(buffers);
        res.set("Content-Type", "audio/mpeg");
        res.set("Cache-Control", "public, max-age=3600");
        res.send(combined);
    } catch (err) {
        console.error("TTS proxy error:", err.message);
        res.status(502).json({ error: "TTS fetch failed", details: err.message });
    }
});

module.exports = router;
