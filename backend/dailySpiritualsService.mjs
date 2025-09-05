import express from "express";
import mysql from "mysql2/promise";
import axios from "axios";
import cron from "node-cron";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection settings
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

// Function to fetch and save data
async function fetchAndSaveDailyData() {
  const today = new Date();
  const yyyy = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const mm = today.getMonth() + 1;
  const dd = today.getDate();

  try {
    const [litRes, saintRes, gospelRes] = await Promise.all([
      axios.get(`https://liturgy.day/api/day/${yyyy}`, {
        headers: { Accept: "application/json" },
      }),
      axios.get(`https://liturgy.day/api/saints/${mm}/${dd}`, {
        headers: { Accept: "application/json" },
      }),
      axios.get(`https://liturgy.day/api/gospels/${yyyy}`, {
        headers: { Accept: "application/json" },
      }),
    ]);

    const liturgy = litRes.data;
    const saint = saintRes.data.saint_of_the_day;
    const gospel = gospelRes.data.gospel_of_the_day;

    const conn = await mysql.createConnection(dbConfig);
    await conn.execute(
      `INSERT INTO daily_spirituals
        (date, gospel_title, gospel_text, saint_name, saint_feast, liturgical_season, sunday_cycle, weekday_cycle, rosary_series)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         gospel_title = VALUES(gospel_title),
         gospel_text = VALUES(gospel_text),
         saint_name = VALUES(saint_name),
         saint_feast = VALUES(saint_feast),
         liturgical_season = VALUES(liturgical_season),
         sunday_cycle = VALUES(sunday_cycle),
         weekday_cycle = VALUES(weekday_cycle),
         rosary_series = VALUES(rosary_series)`,
      [
        yyyy,
        gospel?.title || null,
        gospel?.reading || null,
        saint?.name || null,
        saint?.feast_day || null,
        liturgy?.season || null,
        liturgy?.sunday_cycle || null,
        liturgy?.weekday_cycle || null,
        liturgy?.rosary_series || null,
      ]
    );
    await conn.end();

    console.log(`✅ Saved liturgy, gospel, and saint for ${yyyy}`);
  } catch (err) {
    console.error("❌ Error fetching or saving daily data:", err.message);
  }
}

// Cron job: run daily at midnight
cron.schedule("0 0 * * *", fetchAndSaveDailyData);

// Fetch once on startup
fetchAndSaveDailyData();

// API endpoint: return today’s data
app.get("/api/today", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      "SELECT * FROM daily_spirituals WHERE date = ?",
      [today]
    );
    await conn.end();

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: "No data for today yet." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(3002, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
