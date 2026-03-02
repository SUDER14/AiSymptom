const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCrabvz32NchryI7N2M2klirMAushUddi0");

async function run() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY || "AIzaSyCrabvz32NchryI7N2M2klirMAushUddi0"}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name));
}

run().catch(console.error);
