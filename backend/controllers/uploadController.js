const path = require('path');
const fs = require('fs');

// Upload image handler
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  res.json({ message: 'Image uploaded successfully.', filename: req.file.filename });
};

// Upload document handler
exports.uploadDocument = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No document file uploaded.' });
  }
  res.json({ message: 'Document uploaded successfully.', filename: req.file.filename });
};

// Delete file handler
exports.deleteFile = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete file.' });
    }
    res.json({ message: 'File deleted successfully.' });
  });
};
