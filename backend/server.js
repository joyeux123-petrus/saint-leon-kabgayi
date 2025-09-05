const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config(); // Moved to the top
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");
const authRoutes = require("./routes/auth.js");
const usersRoutes = require("./routes/users.js");
const notesRoutes = require("./routes/notes.js");
const eventsRoutes = require("./routes/events.js");
const announcementsRoutes = require("./routes/announcements.js");
const subjectsRoutes = require("./routes/subjects.js");
const quizzesRoutes = require("./routes/quizzes.js");
const analyticsRoutes = require("./routes/analytics.js");
const leaderboardRoutes = require("./routes/leaderboard.js");

const connectToDatabase = require("./db.js");

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(process.cwd(), '../frontend')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), '../frontend/index.html'));
});

async function startServer() {
  // Setup MySQL connection
  const db = await connectToDatabase();

  // Gemini setup
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const basePrompt = `
You are Rudasumbwa AI, an academic and spiritual assistant for Petit Séminaire Saint Léon Kabgayi. 
Always respond respectfully, clearly, and age-appropriately.
`;

  const rolePrompts = {
    student: `
Assist a student with:
- Explaining lessons step by step.
- Generating practice quizzes.
- Summarizing notes.
- Explaining Holy Gospel simply.
Never grade or do admin tasks.
`,
    teacher: `
Assist a teacher with:
- Creating quizzes (MCQ, fill-in, open-ended).
- Auto-grading student answers when possible.
- Summarizing student progress.
Never do admin tasks.
`,
    admin: `
Assist an administrator with:
- Student verification.
- Club activity monitoring.
- Spiritual event management.
- Leaderboard reports.
Never generate quizzes or solve homework.
`
  };

  app.use('/api/auth', authRoutes(db));
  app.use('/api/users', usersRoutes(db));
  app.use('/api/notes', notesRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/announcements', announcementsRoutes);
  app.use('/api/subjects', subjectsRoutes);
  app.use('/api/quizzes', quizzesRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);

  // AI route
  app.post("/api/ask", async (req, res) => {
    try {
      const { uid, prompt } = req.body;

      if (!uid || !prompt) {
        return res.status(400).json({ error: "Missing uid or prompt" });
      }

      // Get user role from DB
      const [rows] = await db.query("SELECT role FROM users WHERE uid = ?", [uid]);
      if (rows.length === 0) return res.status(404).json({ error: "User not found" });

      const role = rows[0].role || "student";
      const systemPrompt = `${basePrompt}

${rolePrompts[role]}`;

      // Ask Gemini
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        systemInstruction: {
          role: "system",
          parts: [{ text: systemPrompt }]
        }
      });

      const result = await model.generateContent(prompt);
      res.json({ role, response: result.response.text() });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Start server
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log(`Rudasumbwa AI running on port ${PORT}`));
}

startServer();
