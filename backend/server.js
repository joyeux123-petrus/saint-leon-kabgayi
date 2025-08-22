const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import database connection
const db = require('./db');

// Import all route modules
const authRoutes = require('./routes/auth');
const academicSummaryRoutes = require('./routes/academicSummary');
const adminAuth = require('./middleware/adminAuth');
const gospelRoutes = require('./routes/gospel');
const usersRoutes = require('./routes/users');
const quizzesRoutes = require('./routes/quizzes');
const lectionesRoutes = require('./routes/lectiones');
const clubsRoutes = require('./routes/clubs');
const eventsRoutes = require('./routes/events');
const leaderboardRoutes = require('./routes/leaderboard');
const announcementsRoutes = require('./routes/announcements');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboard');
const messagesRoutes = require('./routes/messages');
const helpRoutes = require('./routes/help');
const subjectsRoutes = require('./routes/subjects');
const notesRoutes = require('./routes/notes');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes - Fixed routes first, then dynamic routes
app.use('/api/auth', authRoutes);
app.use('/api/academic-summary', academicSummaryRoutes);
app.use('/api/gospel', gospelRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/lectiones', lectionesRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/notes', notesRoutes);

// Serve static files from frontend
// Serve specific frontend files with protection
app.get('/saintleon-secure', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'admin-login.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'admin.html'));
});

// Serve other static files from frontend (excluding specific HTML files handled above)
// This will serve CSS, JS, images, etc.
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all other routes not explicitly handled
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // If the request is for a specific HTML file that should be protected,
  // and it wasn't caught by the specific routes above, it's a 404.
  const requestedFile = req.path.split('/').pop();
  if (requestedFile.endsWith('.html') && (requestedFile === 'admin.html' || requestedFile === 'admin-login.html')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

// Test database connection and start server
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  } else {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`RUDASUMBWA server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
});

module.exports = app;
