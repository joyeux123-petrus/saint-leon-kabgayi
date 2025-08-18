// RUDASUMBWA Auth Controller (Node.js + MySQL + Nodemailer)
require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const HEAD_EMAIL = 'joyeuxpierreishimwe@gmail.com';

// Helper: send approval request to Head of Studies
function sendApprovalRequest(user) {
  const approveUrl = `http://localhost:3001/api/approve?userId=${user.id}`;
  const rejectUrl = `http://localhost:3001/api/reject?userId=${user.id}`;
  let userDetails = `
    <p>Name: <strong>${user.name}</strong></p>
    <p>Email: <strong>${user.email}</strong></p>
    <p>Role: <strong>${user.role}</strong></p>
  `;

  if (user.role === 'student') {
    userDetails += `
      <p>Class: <strong>${user.class}</strong></p>
      <p>Parish/District: <strong>${user.parish}</strong></p>
    `;
  } else if (user.role === 'teacher') {
    userDetails += `
      <p>Phone: <strong>${user.phone}</strong></p>
      <p>Class Taught: <strong>${user.teacherClass}</strong></p>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #1b1b1b; color: #ffffff; padding: 20px; max-width: 600px; margin: auto; border-radius: 10px;">
      <h2 style="color: #00f2fe;">New RUDASUMBWA Sign Up Approval Request</h2>
      ${userDetails}
      <div style="margin-top:20px;">
        <a href="${approveUrl}" style="display:inline-block;padding:12px 25px;background:linear-gradient(90deg,#4facfe,#00f2fe);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin-right:10px;">Approve</a>
        <a href="${rejectUrl}" style="display:inline-block;padding:12px 25px;background:#ff4c4c;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Reject</a>
      </div>
    </div>
  `;
  transporter.sendMail({
    from: 'RUDASUMBWA <joyeuxpierreishimwe@gmail.com>',
    to: HEAD_EMAIL,
    subject: 'New RUDASUMBWA Sign Up Approval Request',
    html
  });
}

// Helper: send approval/rejection email to user
function sendUserStatusEmail(user, status) {
  let html = '';
  let subject = '';
  if (status === 'approved') {
    subject = '✅ Welcome to RUDASUMBWA – Access Approved!';
    html = `
      <div style="font-family: Arial, sans-serif; background-color: #1b1b1b; color: #ffffff; padding: 20px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #333; backdrop-filter: blur(10px); background-color: rgba(27, 27, 27, 0.8);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://www.petitseminairesaintleon.rw/images/logo.png" alt="School Logo" style="width: 80px;">
          <h1 style="color: #00f2fe; margin-top: 10px;">RUDASUMBWA</h1>
        </div>
        <div style="text-align: center;">
          <h2 style="color: #28a745;">✔</h2>
          <h2 style="color: #00f2fe;">Congratulations, ${user.name}!</h2>
          <p>You are now verified as a student of Petit Séminaire Saint Léon Kabgayi. You can log in to RUDASUMBWA and start enjoying your study journey.</p>
          <a href="http://localhost:3001/login.html" style="display: inline-block; padding: 12px 25px; background: linear-gradient(90deg, #4facfe, #00f2fe); color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Go to Login</a>
        </div>
      </div>
    `;
  } else {
    subject = '❌ RUDASUMBWA Registration – Not Approved';
    html = `
      <div style="font-family: Arial, sans-serif; background-color: #1b1b1b; color: #ffffff; padding: 20px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #333; backdrop-filter: blur(10px); background-color: rgba(27, 27, 27, 0.8);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://www.petitseminairesaintleon.rw/images/logo.png" alt="School Logo" style="width: 80px;">
          <h1 style="color: #00f2fe; margin-top: 10px;">RUDASUMBWA</h1>
        </div>
        <div style="text-align: center;">
          <h2 style="color: #dc3545;">❌</h2>
          <h2 style="color: #ff4c4c;">Account Not Approved</h2>
          <p>Dear ${user.name},</p>
          <p>Unfortunately, your details could not be verified as a student of Petit Séminaire Saint Léon Kabgayi. Please contact the Director of Studies for more information.</p>
          <a href="mailto:info@rudasumbwa.rw" style="display: inline-block; padding: 12px 25px; background: #ff4c4c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Contact Support</a>
        </div>
      </div>
    `;
  }
  transporter.sendMail({
    from: 'RUDASUMBWA <joyeuxpierreishimwe@gmail.com>',
    to: user.email,
    subject,
    html
  });
}

// Sign Up
exports.signup = async (req, res) => {
  const { name, email, role, password, className, parish, phone, teacherClass } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).send('All fields are required');
  }

  if (role === 'student' && (!className || !parish)) {
    return res.status(400).send('Class and parish are required for students');
  }

  if (role === 'teacher' && (!phone || !teacherClass)) {
    return res.status(400).send('Phone number and class taught are required for teachers');
  }

  const [existing] = await db.promise().query('SELECT * FROM users WHERE email=?', [email]);
  if (existing.length > 0) return res.status(400).send('Email already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  let result;
  if (role === 'student') {
    [result] = await db.promise().query(
      'INSERT INTO users (name,email,class,parish,role,password,status) VALUES (?,?,?,?,?,?,?)',
      [name, email, className, parish, role, hashedPassword, 'pending']
    );
  } else if (role === 'teacher') {
    [result] = await db.promise().query(
      'INSERT INTO users (name,email,phone,teacherClass,role,password,status) VALUES (?,?,?,?,?,?,?)',
      [name, email, phone, teacherClass, role, hashedPassword, 'pending']
    );
  }

  const user = { id: result.insertId, name, email, role, class: className, parish, phone, teacherClass };
  sendApprovalRequest(user);
  res.send('Your account is pending approval by the Head of Studies');
};

// Approve
exports.approve = async (req, res) => {
  const userId = req.query.userId;
  const [rows] = await db.promise().query('SELECT * FROM users WHERE id=?', [userId]);
  if (!rows.length) return res.status(404).send('User not found');
  await db.promise().query('UPDATE users SET status="approved" WHERE id=?', [userId]);
  sendUserStatusEmail(rows[0], 'approved');
  res.send('User approved and notified.');
};

// Reject
exports.reject = async (req, res) => {
  const userId = req.query.userId;
  const [rows] = await db.promise().query('SELECT * FROM users WHERE id=?', [userId]);
  if (!rows.length) return res.status(404).send('User not found');
  await db.promise().query('UPDATE users SET status="rejected" WHERE id=?', [userId]);
  sendUserStatusEmail(rows[0], 'rejected');
  res.send('User rejected and notified.');
};

exports.logout = async (req, res) => {
  try {
    // In a real application, you might invalidate a token here (e.g., add to a blacklist)
    // For now, we'll just send a success message, assuming client-side token removal.
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Error during logout:', err);
    res.status(500).json({ error: 'Failed to logout.' });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.promise().query('SELECT * FROM users WHERE email=?', [email]);
  if (!rows.length) return res.status(400).send('Incorrect email or password');
  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send('Incorrect email or password');
  if (user.status === 'pending') return res.status(403).send('⏳ Your personal details are still under review by the Head of Studies.');
  if (user.status === 'rejected') return res.status(403).send('❌ Your account was not approved. Please contact the school.');
  // JWT for session
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, message: 'Login successful!' });
};
