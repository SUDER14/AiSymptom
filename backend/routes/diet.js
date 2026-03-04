// backend/routes/diet.js
// AI diet recommendation chatbot — disease-aware nutritionist via Gemini
require("dotenv").config();
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Disease-specific nutritional context ──────────────────────────────────────
const DISEASE_CONTEXT = {
    diabetes_type2: `
    - Focus on low glycaemic index (GI < 55) foods
    - Limit refined carbohydrates, white rice, white bread, sugary drinks
    - Emphasise fibre-rich foods (vegetables, legumes, whole grains)
    - Include lean proteins and healthy fats to slow glucose absorption
    - Recommend 3 main meals with 2 small snacks; avoid skipping meals
    - Foods to AVOID: sugar, sweets, fruit juices, white rice, maida, alcohol
    - Foods to EAT: brown rice, millets (ragi, jowar), oats, dal, methi, bitter gourd`,
    diabetes_type1: `
    - Carb counting is critical — recommend consistent carb intake per meal
    - Focus on complex carbohydrates paired with protein and fat
    - Monitor effect of different foods on blood glucose
    - Include slow-digesting foods to prevent hypoglycaemia
    - Avoid high-sugar foods and refined carbs
    - Emphasise regular meal timing to match insulin regimen`,
    hypothyroidism: `
    - Avoid goitrogens in raw form (raw cabbage, broccoli, cauliflower, soy) — cooking reduces their effect
    - Include iodine-rich foods (iodised salt, seafood, dairy)
    - Emphasise selenium-rich foods (Brazil nuts, eggs, sunflower seeds)
    - Include zinc sources (pumpkin seeds, chickpeas, meat)
    - Take thyroid medication on empty stomach; wait 4 hours before dairy/calcium
    - Avoid gluten if Hashimoto's is suspected
    - Include anti-inflammatory foods: turmeric, ginger, omega-3 rich fish`,
    hyperthyroidism: `
    - Avoid iodine-rich foods (seaweed, kelp, iodised salt in excess)
    - Focus on calcium and vitamin D (increased bone turnover)
    - Include cruciferous vegetables (broccoli, cabbage) to dampen thyroid activity
    - Limit caffeine as it worsens palpitations and anxiety
    - Eat calorie-dense foods to compensate for rapid metabolism
    - Include antioxidant-rich foods to protect against oxidative stress`,
    hypertension: `
    - Follow DASH diet principles (Dietary Approaches to Stop Hypertension)
    - Limit sodium to < 2300 mg/day (< 1500 mg/day is ideal)
    - Increase potassium (bananas, sweet potato, avocado, leafy greens)
    - Include magnesium-rich foods (nuts, seeds, dark chocolate)
    - Emphasise plant-based protein over red meat
    - Avoid pickles, papad, processed foods, ready-made sauces, alcohol
    - Include beetroot, garlic, flaxseed, olive oil for their BP-lowering effects`,
    high_cholesterol: `
    - Increase soluble fibre (oats, barley, lentils, fruits) to reduce LDL
    - Avoid saturated fats (ghee in excess, red meat, full-fat dairy, fried foods)
    - Eliminate trans fats (vanaspati, margarine, packaged biscuits)
    - Include omega-3 fatty acids (fatty fish, walnuts, flaxseed, chia seeds)
    - Use olive oil or rice bran oil instead of refined oil
    - Include plant sterols (found in fortified foods, nuts, seeds)
    - Eat nuts (almonds, walnuts) in small quantities daily`,
    pcos: `
    - Follow a low GI, anti-inflammatory diet to improve insulin sensitivity
    - Limit sugar, refined carbs, and processed foods
    - Include anti-androgen foods: spearmint tea, flaxseed, green tea
    - Emphasise fibre-rich vegetables and slow-digesting grains
    - Include healthy fats (avocado, olive oil, nuts) to support hormone health
    - Ensure adequate vitamin D, magnesium, zinc, and inositol (from whole grains)
    - Avoid dairy in excess if it worsens symptoms (individual variation)
    - Limit red meat; prefer plant protein and fatty fish`,
    fatty_liver: `
    - Eliminate alcohol completely
    - Reduce total calorie intake for weight loss (5-10% weight loss dramatically improves NAFLD)
    - Avoid refined sugars especially fructose (fruit juices, soft drinks, sweets)
    - Limit saturated fats; use olive oil instead
    - Include choline-rich foods (eggs, fish, broccoli) to support liver fat metabolism
    - Emphasise cruciferous vegetables (broccoli, Brussels sprouts) for liver detox
    - Coffee (without sugar) has shown protective effects on the liver
    - Include turmeric, green tea for anti-inflammatory and liver-protective effects`,
    kidney_disease: `
    - Restrict potassium (avoid banana, orange, potato, tomato, avocado in excess)
    - Restrict phosphorus (avoid dairy, nuts, seeds, cola drinks, processed foods)
    - Limit sodium to reduce fluid retention and hypertension
    - Adjust protein intake per stage of CKD (less protein for advanced CKD to slow progression)
    - Monitor fluid intake carefully
    - Preferred foods: apple, berries, cabbage, cauliflower, egg whites, white rice
    - CRITICAL: Dietary needs vary significantly by CKD stage — always follow nephrologist guidance`,
    anemia: `
    - High iron foods: red meat, liver, dark leafy greens (spinach, methi), lentils, tofu, seeds
    - Vitamin C enhances iron absorption — pair iron foods with citrus, amla, bell peppers
    - Avoid tea/coffee with meals (tannins reduce iron absorption)
    - Include folate sources (leafy greens, legumes, fortified cereals) for megaloblastic anaemia
    - Include B12 sources (dairy, eggs, meat, fortified foods) especially for vegans
    - Cook in iron cookware to increase iron content of food
    - Avoid calcium supplements/dairy near iron-rich meals`,
    obesity: `
    - Calorie deficit of 500-750 kcal/day for gradual, sustainable weight loss (0.5-1 kg/week)
    - High protein diet (1.2-1.6 g/kg body weight) to preserve muscle and increase satiety
    - Emphasise volume eating: high-fibre vegetables, soups, salads
    - Limit liquid calories (juices, alcohol, sugary tea/coffee)
    - Avoid ultra-processed foods, fried foods, refined carbs
    - Include gut-friendly foods (probiotics, fermented foods) to support metabolism
    - Mindful eating strategies: eat slowly, no screens during meals, use smaller plates`,
    ibs: `
    - Follow low-FODMAP diet: avoid onion, garlic, wheat, dairy (lactose), legumes, stone fruits
    - Identify personal trigger foods through a food diary
    - Increase soluble fibre (oats, psyllium husk) rather than insoluble fibre
    - Include probiotic foods (yoghurt, kefir, idli, dosa) for gut microbiome support
    - Eat regular small meals; avoid skipping meals or overeating
    - Stay well hydrated (1.5-2 litres water/day)
    - Avoid carbonated drinks, caffeine, alcohol, and spicy foods if they trigger symptoms`,
    osteoporosis: `
    - Calcium-rich foods: dairy products, ragi (finger millet), sesame seeds, almonds, broccoli, tofu
    - Vitamin D: fatty fish, egg yolk, fortified foods; sunlight exposure 15-20 min/day
    - Include magnesium (nuts, seeds, dark chocolate) and vitamin K2 (fermented foods)
    - Avoid excess sodium and alcohol (both increase calcium excretion)
    - Limit caffeine (>3 cups/day reduces calcium absorption)
    - Include protein to support bone matrix (collagen synthesis)
    - Avoid very high oxalate foods (spinach, beet) paired with calcium-rich meals`,
    arthritis: `
    - Anti-inflammatory diet: Mediterranean-style eating
    - Include omega-3 fatty acids: fatty fish (salmon, mackerel, sardines), walnuts, flaxseed
    - Include antioxidants: colourful vegetables and fruits (berries, peppers, leafy greens)
    - Use turmeric (curcumin) and ginger daily — potent anti-inflammatory effects
    - Avoid pro-inflammatory foods: processed foods, refined sugars, red meat, trans fats
    - Include vitamin D and calcium to protect bone health
    - Olive oil has similar anti-inflammatory properties to ibuprofen when used regularly`,
    gout: `
    - Severely limit purines: organ meats, red meat, shellfish, anchovies, sardines, mackerel
    - Avoid alcohol especially beer and spirits (increases uric acid)
    - Avoid high-fructose foods: soft drinks, fruit juices, honey, sweets
    - Stay very well hydrated (2-3 litres water/day to flush uric acid)
    - Include cherries and tart cherry juice (lower uric acid naturally)
    - Low-fat dairy is beneficial (promotes uric acid excretion)
    - Include vitamin C-rich foods (citrus, amla) to lower uric acid levels
    - Vegetable purines (peas, mushrooms) are less problematic than animal purines`,
};

// ── Model chain (cascade through free models) ─────────────────────────────────
const MODEL_CHAIN = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-flash-latest",
];

// ── POST /api/diet/chat ───────────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
    const { message, diseaseId, conversationHistory = [] } = req.body;

    if (!message) return res.status(400).json({ error: "message is required" });

    const nutritionContext = DISEASE_CONTEXT[diseaseId] || "Provide general balanced nutrition advice.";

    const systemPrompt = `You are a warm, friendly AI nutritionist who gives simple, practical dietary advice for people managing health conditions.

PATIENT CONDITION: ${diseaseId ? diseaseId.replace(/_/g, " ") : "General Nutrition"}

SPECIFIC NUTRITIONAL GUIDELINES FOR THIS CONDITION:
${nutritionContext}

REPLY STYLE — follow these rules strictly:
- Write in plain, simple, conversational language. No markdown. No asterisks (**). No bullet points. No numbered lists. No headers.
- Keep your reply to 3-4 short sentences for the first message, 2-3 sentences for follow-ups.
- For the first message: briefly mention 2-3 key foods to eat and 2-3 to avoid, then suggest ONE simple meal idea.
- After every reply, ask ONE specific, friendly follow-up question about their lifestyle or preferences.
  Examples: "Do you usually cook at home or eat out?", "Are you vegetarian?", "What do you normally eat for breakfast?"
- Include Indian food examples where relevant (ragi, dal, idli, methi, amla, etc.)
- Be encouraging and positive. Dietary changes are hard — acknowledge that.
- Never use asterisks, markdown bold, headers, or bullet symbols. Plain sentences only.
- Always mention that a registered dietitian can give a personalised plan.`;

    const history = conversationHistory
        .slice(-8)
        .map(m => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
        }));

    let reply = "";
    let lastErr = null;

    for (const modelName of MODEL_CHAIN) {
        try {
            console.log(`🥗 Diet AI trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(message);
            reply = result.response.text();
            console.log(`✅ Diet response from ${modelName}`);
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

    if (!reply) {
        return res.status(503).json({ error: "All AI models unavailable", details: lastErr?.message });
    }

    res.json({ reply, diseaseId });
});

module.exports = router;
