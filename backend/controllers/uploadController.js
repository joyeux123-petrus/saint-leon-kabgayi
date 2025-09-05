const path = require('path');
const fs = require('fs');

// Upload image handler
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ message: 'Image uploaded successfully.', filename: req.file.filename, url: fileUrl });
};

// Upload document handler
exports.uploadDocument = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No document file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ message: 'Document uploaded successfully.', filename: req.file.filename, url: fileUrl });
};

// Delete file handler
exports.deleteFile = (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      // If file not found, still return success for idempotency
      if (err.code === 'ENOENT') {
        return res.status(200).json({ message: 'File already deleted or not found.' });
      }
      console.error('Error deleting file:', err);
      return res.status(500).json({ error: 'Failed to delete file.' });
    }
    res.json({ message: 'File deleted successfully.' });
  });
};