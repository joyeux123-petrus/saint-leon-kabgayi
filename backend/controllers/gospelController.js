const db = require('../db');

exports.getGospelOfTheDay = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const url = `https://liturgy.day/api/day/${today}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Assuming the API returns an object with a 'gospel' field
    const gospelContent = data.gospel ? data.gospel.text : 'No Gospel found for today.';

    res.json({ content: gospelContent });
  } catch (error) {
    console.error("Error fetching Gospel:", error);
    res.status(500).json({ error: "Failed to fetch Gospel" });
  }
};

exports.publishGospel = async (req, res) => {
    const { content } = req.body;
    try {
        await db.query('INSERT INTO gospel (content, date) VALUES (?, NOW())', [content]);
        res.json({ message: 'Gospel published successfully.' });
    } catch (err) {
        console.error('Error publishing gospel:', err);
        res.status(500).json({ error: 'Failed to publish gospel.' });
    }
};
