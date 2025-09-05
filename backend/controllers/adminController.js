const Admin = require('../models/admin.js');
const User = require('../models/user.js'); // Assuming you have a User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../db.js');

const login = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for email:', email);
  console.log('Password received:', password);

  try {
    const admin = await Admin.findByEmail(email);
    console.log('Admin found:', admin);

    if (!admin || admin.length === 0) {
      console.log('Admin not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin[0].password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (admin[0].role !== 'admin') {
      console.log('User is not an admin:', email);
      return res.status(403).json({ message: 'Forbidden' });
    }

    const token = jwt.sign({ id: admin[0].id, role: admin[0].role }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    console.log('Token generated for admin:', admin[0].id);

    res.json({ token });
  } catch (error) {
    console.error('Server error during admin login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPendingUsers = async (req, res) => {
  const db = await connectToDatabase();
  const query = 'SELECT id, name, email, role, className, parish, phone, created_at FROM users WHERE status = ?';
  try {
    const [results] = await db.query(query, ['pending']);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching pending users:', err);
    return res.status(500).json({ message: 'Error fetching pending users' });
  }
};

const approveUser = async (req, res) => {
  const db = await connectToDatabase();
  const { id } = req.params;
  const query = 'UPDATE users SET status = ? WHERE id = ?';
  try {
    const [result] = await db.query(query, ['approved', id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or already approved' });
    }
    res.status(200).json({ message: 'User approved successfully' });
  } catch (err) {
    console.error('Error approving user:', err);
    return res.status(500).json({ message: 'Error approving user' });
  }
};

const rejectUser = async (req, res) => {
  const db = await connectToDatabase();
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ? AND status = ?';
  try {
    const [result] = await db.query(query, [id, 'pending']);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or not in pending status' });
    }
    res.status(200).json({ message: 'User rejected and deleted successfully' });
  } catch (err) {
    console.error('Error rejecting user:', err);
    return res.status(500).json({ message: 'Error rejecting user' });
  }
};

const getDashboardAnalytics = async (req, res) => {
  const db = await connectToDatabase();
  const queries = {
    totalUsers: 'SELECT COUNT(*) as count FROM users',
    pendingUsers: 'SELECT COUNT(*) as count FROM users WHERE status = \'pending\'',
    totalSubjects: 'SELECT COUNT(*) as count FROM subjects',
    totalQuizzes: 'SELECT COUNT(*) as count FROM quizzes'
  };

  try {
    const results = {};
    for (const key in queries) {
      const [result] = await db.query(queries[key]);
      results[key] = result[0].count;
    }
    res.status(200).json(results);
  } catch (err) {
    console.error(`Error fetching dashboard analytics:`, err);
    return res.status(500).json({ message: `Error fetching dashboard analytics` });
  }
};

const getAllUsers = async (req, res) => {
  const db = await connectToDatabase();
  const query = 'SELECT id, name, email, role, className, parish, phone, status, created_at FROM users';
  try {
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching all users:', err);
    return res.status(500).json({ message: 'Error fetching all users' });
  }
};

const getUserById = async (req, res) => {
  const db = await connectToDatabase();
  const { id } = req.params;
  const query = 'SELECT id, name, email, role, className, parish, phone, status, created_at FROM users WHERE id = ?';
  try {
    const [result] = await db.query(query, [id]);
    if (result.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(result[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ message: 'Error fetching user' });
  }
};

const updateUser = async (req, res) => {
  const db = await connectToDatabase();
  const { id } = req.params;
  const { name, email, role, className, parish, phone } = req.body;
  const query = 'UPDATE users SET name = ?, email = ?, role = ?, className = ?, parish = ?, phone = ? WHERE id = ?';
  try {
    const [result] = await db.query(query, [name, email, role, className, parish, phone, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ message: 'Error updating user' });
  }
};

const deleteUser = async (req, res) => {
  const db = await connectToDatabase();
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';
  try {
    const [result] = await db.query(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: 'Error deleting user' });
  }
};

const assignSubjectsToTeacher = async (req, res) => {
  const db = await connectToDatabase();
  const { teacherId } = req.params;
  const { subjectIds } = req.body; // subjectIds is an array

  if (!teacherId || !subjectIds || !Array.isArray(subjectIds)) {
    return res.status(400).json({ message: 'Invalid input: teacherId and an array of subjectIds are required.' });
  }

  const connection = await db.getConnection();
  try {
    // Start a transaction
    await connection.beginTransaction();

    // 1. Clear existing assignments for this teacher
    await connection.query('DELETE FROM teacher_subjects WHERE teacher_id = ?', [teacherId]);

    // 2. Insert new assignments
    if (subjectIds.length > 0) {
      const values = subjectIds.map(subjectId => [teacherId, subjectId]);
      // Using connection.query for parameterized queries with multiple rows
      // Note: For 'INSERT ... VALUES ?', the '?' expects an array of arrays.
      await connection.query('INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ?', [values]);
    }

    // Commit the transaction
    await connection.commit();

    res.status(200).json({ message: 'Subjects assigned to teacher successfully.' });
  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('Error assigning subjects to teacher:', error);
    res.status(500).json({ message: 'Server error during subject assignment.' });
  } finally {
    connection.release();
  }
};

const getAssignedSubjectsForTeacher = async (req, res) => {
  const db = await connectToDatabase();
  const { teacherId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT s.id, s.name FROM subjects s JOIN teacher_subjects ts ON s.id = ts.subject_id WHERE ts.teacher_id = ?',
      [teacherId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching assigned subjects for teacher:', error);
    res.status(500).json({ message: 'Server error fetching assigned subjects.' });
  }
};

const assignStudentToClub = async (req, res) => {
    const db = await connectToDatabase();
    const { studentId, clubId } = req.body;

    if (!studentId || !clubId) {
        return res.status(400).json({ message: 'studentId and clubId are required' });
    }

    try {
        const [student] = await db.query('SELECT * FROM users WHERE id = ? AND role = ?', [studentId, 'student']);
        if (student.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const [club] = await db.query('SELECT * FROM clubs WHERE id = ?', [clubId]);
        if (club.length === 0) {
            return res.status(404).json({ message: 'Club not found' });
        }

        await db.query('INSERT INTO student_clubs (student_id, club_id) VALUES (?, ?)', [studentId, clubId]);

        res.status(201).json({ message: 'Student assigned to club successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Student already in this club' });
        }
        console.error('Error assigning student to club:', error);
        res.status(500).json({ message: 'Failed to assign student to club' });
    }
};

module.exports = {
    login,
    getPendingUsers,
    approveUser,
    rejectUser,
    getDashboardAnalytics,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    assignSubjectsToTeacher,
    getAssignedSubjectsForTeacher,
    assignStudentToClub
}