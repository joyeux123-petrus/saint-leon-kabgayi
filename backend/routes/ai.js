const express = require("express");
const connectToDatabase = require("../db.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ask
router.post("/ask", async (req, res) => {
  const db = await connectToDatabase();
  try {
    const { userId, prompt } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Save to MySQL
    await db.query(
      "INSERT INTO ai_queries (user_id, prompt, response) VALUES (?, ?, ?)",
      [userId, prompt, responseText]
    );

    res.json({ response: responseText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

module.exports = router;