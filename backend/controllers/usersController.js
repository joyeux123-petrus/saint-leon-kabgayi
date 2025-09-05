const bcrypt = require('bcrypt');

// Fetch classes for teacher dashboard
const listClasses = (db) => async (req, res) => {
  try {
    // Assume teacher ID is available via req.user.id
    const [classes] = await db.query('SELECT id, name FROM classes WHERE teacher_id = ?', [req.user.id]);
    res.json({ classes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch classes.' });
  }
};

const profile = (db) => async (req, res) => {
  try {
    // Assume user ID is available via req.user.id (set by auth middleware)
    console.log('Fetching profile for user ID:', req.user.id); // Add this line
    const [rows] = await db.query('SELECT full_name, username, email, subjects, parish, classes FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err); // Modify this line
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

const listUsers = (db) => async (req, res) => {
  try {
    // Fetch all users from the database
    const [users] = await db.query('SELECT id, name, email, role, status FROM users');
    res.json({ users });
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};

const getUserById = (db) => async (req, res) => {
  console.log('getUserById controller reached.');
  try {
    const userId = req.params.userId;
    console.log('Fetching user with ID:', userId);

    const [rows] = await db.query('SELECT id, name, email, studentId, profilePic FROM users WHERE id = ?', [userId]);

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

const getPendingUsers = (db) => async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, class, parish FROM users WHERE status = ?', ['pending']);
    res.json(users);
  } catch (err) {
    console.error('Error fetching pending users:', err);
    res.status(500).json({ error: 'Failed to retrieve pending users.' });
  }
};

const approveUser = (db) => async (req, res) => {
  try {
    const userId = req.params.userId;
    await db.query('UPDATE users SET status = ? WHERE id = ?', ['approved', userId]);
    res.json({ message: 'User approved successfully.' });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ error: 'Failed to approve user.' });
  }
};

const rejectUser = (db) => async (req, res) => {
  try {
    const userId = req.params.userId;
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User rejected successfully.' });
  } catch (err) {
    console.error('Error rejecting user:', err);
    res.status(500).json({ error: 'Failed to reject user.' });
  }
};

const changePassword = (db) => async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required.' });
      }

      const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const user = rows[0];
      const match = await bcrypt.compare(currentPassword, user.password);

      if (!match) {
        return res.status(401).json({ error: 'Incorrect current password.' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

      res.json({ message: 'Password changed successfully.' });
    } catch (err) {
      console.error('Error changing password:', err);
      res.status(500).json({ error: 'Failed to change password.' });
    }
  };

const uploadProfilePic = (db) => async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const profilePicPath = `/uploads/profile_pics/${req.file.filename}`;

    await db.query('UPDATE users SET profilePic = ? WHERE id = ?', [profilePicPath, userId]);

    res.json({ message: 'Profile picture uploaded successfully.', profilePicUrl: profilePicPath });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({ error: 'Failed to upload profile picture.' });
  }
};

const updateUserName = (db) => async (req, res) => {
  try {
    const { fullName } = req.body;
    const userId = req.user.id;

    if (!fullName) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    await db.query('UPDATE users SET full_name = ? WHERE id = ?', [fullName, userId]);

    res.json({ message: 'Name updated successfully.' });
  } catch (err) {
    console.error('Error updating user name:', err);
    res.status(500).json({ error: 'Failed to update name.' });
  }
};

module.exports = (db) => ({
  listClasses: listClasses(db),
  profile: profile(db),
  listUsers: listUsers(db),
  getUserById: getUserById(db),
  getPendingUsers: getPendingUsers(db),
  approveUser: approveUser(db),
  rejectUser: rejectUser(db),
  changePassword: changePassword(db),
  uploadProfilePic: uploadProfilePic(db),
  updateUserName: updateUserName(db)
});
