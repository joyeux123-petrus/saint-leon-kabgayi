const db = require('../models/db');

exports.listLectiones = async (req, res) => {
  // ...fetch lectiones from DB...
  res.json({ lectiones: [
    { id: 1, title: 'Math Notes', type: 'note', content: 'Algebra basics PDF' },
    { id: 2, title: 'Physics Video', type: 'video', content: 'Newton Laws Video' },
    { id: 3, title: 'Brain Wave Exercise', type: 'exercise', content: 'Critical thinking challenge' }
  ] });
};

exports.createLectiones = async (req, res) => {
  // ...create lectiones logic...
  res.json({ message: 'Lectiones created.' });
};

exports.getLectiones = async (req, res) => {
  // ...get single lectiones...
  res.json({ lectiones: { id: req.params.id, title: 'Sample', type: 'note', content: 'Sample content' } });
};
