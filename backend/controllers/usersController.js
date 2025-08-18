const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

// Fetch classes for teacher dashboard
exports.listClasses = async (req, res) => {
  try {
    // Assume teacher ID is available via req.user.id
    const [classes] = await db.promise().query('SELECT id, name FROM classes WHERE teacher_id = ?', [req.user.id]);
    res.json({ classes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch classes.' });
  }
};

exports.profile = async (req, res) => {
  try {
    // Assume user ID is available via req.user.id (set by auth middleware)
    const [rows] = await db.promise().query('SELECT name, email, subjects, parish, classes FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const [users] = await db.promise().query('SELECT id, name, email, role, status FROM users');
    res.json({ users });
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};

exports.getUserById = async (req, res) => {
  console.log('getUserById controller reached.');
  try {
    const userId = req.params.userId;
    console.log('Fetching user with ID:', userId);
    
    const [rows] = await db.promise().query('SELECT id, name, email, studentId, profilePic FROM users WHERE id = ?', [userId]);
    
    if (rows.length === 0) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ error: 'User not found.' });
    }
    
    console.log('User found:', rows[0]);
    res.json(rows[0]); // Return the user object directly, not wrapped in {user: ...}
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const [users] = await db.promise().query('SELECT id, name, email, class, parish FROM users WHERE status = ?', ['pending']);
    res.json(users);
  } catch (err) {
    console.error('Error fetching pending users:', err);
    res.status(500).json({ error: 'Failed to retrieve pending users.' });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    await db.promise().query('UPDATE users SET status = ? WHERE id = ?', ['approved', userId]);
    res.json({ message: 'User approved successfully.' });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ error: 'Failed to approve user.' });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    await db.promise().query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User rejected successfully.' });
  } catch (err) {
    console.error('Error rejecting user:', err);
    res.status(500).json({ error: 'Failed to reject user.' });
  }
};
