const db = require('../db');

exports.listLectiones = async (req, res) => {
  try {
    const [lectiones] = await db.promise().query('SELECT id, title, type, content FROM lectiones ORDER BY created_at DESC');
    res.json({ lectiones });
  } catch (err) {
    console.error('Error fetching lectiones:', err);
    res.status(500).json({ error: 'Failed to fetch lectiones.' });
  }
};

exports.createLectiones = async (req, res) => {
  // ...create lectiones logic...
  res.json({ message: 'Lectiones created.' });
};

exports.getLectiones = async (req, res) => {
  // ...get single lectiones...
  res.json({ lectiones: { id: req.params.id, title: 'Sample', type: 'note', content: 'Sample content' } });
};
