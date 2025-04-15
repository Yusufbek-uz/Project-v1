// ai.js
const fetch = require("node-fetch");
require("dotenv").config();

const API_URL = "https://api.intelligence.io.solutions/api/v1/chat/completions";
const API_KEY = process.env.API_KEY;

let messages = [
  {
    role: "system",
    content: "You are a helpful assistant",
  },
];

async function askAI(userMessage) {
  messages.push({ role: "user", content: userMessage });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-R1", // ✅ vot tut model!
      messages,
    }),
  });

  const data = await response.json();

  try {
    const aiMessage = data.choices[0].message.content;

    messages.push({ role: "assistant", content: aiMessage });

    return aiMessage.split("</think>\n\n")[1] || aiMessage;
  } catch (error) {
    console.error("AI Response Error:", data);
    return "❌ Oops! AI ne dal otvet. Prover' API key i model.";
  }
}

module.exports = askAI;
