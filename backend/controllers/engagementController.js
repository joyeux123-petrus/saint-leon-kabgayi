const db = require('../db');

exports.submitEngagementMetrics = (req, res) => {
  const { attempt_id } = req.params;
  const { engagement_level, frustration_level, confusion_level } = req.body;

  const query = 'INSERT INTO engagement_data (attempt_id, engagement_level, frustration_level, confusion_level) VALUES (?, ?, ?, ?)';
  db.promise().query(query, [attempt_id, engagement_level, frustration_level, confusion_level], (err, result) => {
    if (err) {
      console.error('Error submitting engagement metrics:', err);
      return res.status(500).json({ message: 'Error submitting engagement metrics' });
    }
    res.status(201).json({ message: 'Engagement metrics submitted successfully', engagementId: result.insertId });
  });
};

exports.getEngagementMetrics = (req, res) => {
  const { attempt_id } = req.params;

  const query = 'SELECT * FROM engagement_data WHERE attempt_id = ? ORDER BY timestamp ASC';
  db.promise().query(query, [attempt_id], (err, results) => {
    if (err) {
      console.error('Error fetching engagement metrics:', err);
      return res.status(500).json({ message: 'Error fetching engagement metrics' });
    }
    res.status(200).json(results);
  });
};