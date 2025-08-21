// All controller logic moved from authController.js
// Email Verification
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing verification token');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await db.promise().query('UPDATE users SET status="pending" WHERE id=?', [decoded.id]);
    const [rows] = await db.promise().query('SELECT * FROM users WHERE id=?', [decoded.id]);
    if (rows.length > 0) {
      sendApprovalRequest(rows[0]);
    }
    res.send('Email verified! Your account is now pending approval by the Head of Studies.');
  } catch (err) {
    res.status(400).send('Invalid or expired verification token.');
  }
};
// Reset Password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).send('Missing token or password');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query('UPDATE users SET password=? WHERE id=?', [hashedPassword, decoded.id]);
    res.status(200).send('Password reset successful.');
  } catch (err) {
    res.status(400).send('Invalid or expired reset token.');
  }
};
// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send('Email is required');
  const [rows] = await db.promise().query('SELECT * FROM users WHERE email=?', [email]);
  if (!rows.length) return res.status(200).send('If your email exists, a reset link has been sent.');
  const user = rows[0];
  // Generate a reset token (valid for 1 hour)
  const resetToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const resetUrl = `http://localhost:3001/reset-password.html?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #1b1b1b; color: #ffffff; padding: 20px; max-width: 600px; margin: auto; border-radius: 10px;">
      <h2 style="color: #00f2fe;">RUDASUMBWA Password Reset</h2>
      <p>Hello ${user.name},</p>
      <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 25px;background:linear-gradient(90deg,#4facfe,#00f2fe);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin-top:20px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;
  await transporter.sendMail({
    from: 'RUDASUMBWA <joyeuxpierreishimwe@gmail.com>',
    to: user.email,
    subject: 'RUDASUMBWA Password Reset',
    html
  });
  res.status(200).send('If your email exists, a reset link has been sent.');
};
// ...existing code...
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

// Approve User
const approve = async (req, res) => {
  const { userId } = req.query;
  try {
    await db.promise().query('UPDATE users SET status=? WHERE id=?', ['approved', userId]);
    const [rows] = await db.promise().query('SELECT * FROM users WHERE id=?', [userId]);
    if (rows.length > 0) {
      sendUserStatusEmail(rows[0], 'approved');
    }
    res.send('User approved successfully.');
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).send('Error approving user.');
  }
};

// Reject User
const reject = async (req, res) => {
  const { userId } = req.query;
  try {
    await db.promise().query('UPDATE users SET status=? WHERE id=?', ['rejected', userId]);
    const [rows] = await db.promise().query('SELECT * FROM users WHERE id=?', [userId]);
    if (rows.length > 0) {
      sendUserStatusEmail(rows[0], 'rejected');
    }
    res.send('User rejected successfully.');
  } catch (err) {
    console.error('Error rejecting user:', err);
    res.status(500).send('Error rejecting user.');
  }
};

// Sign Up
const signup = async (req, res) => {
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

  try { // Added try-catch for existing email check
    const [existing] = await db.promise().query('SELECT * FROM users WHERE email=?', [email]);
    if (existing.length > 0) return res.status(400).send('Email already exists');
  } catch (err) {
    console.error('Error checking existing email:', err);
    return res.status(500).send('Server error during signup.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let result;
  try { // Added try-catch for user insertion
    if (role === 'student') {
      [result] = await db.promise().query(
        'INSERT INTO users (name,email,class,parish,role,password,status) VALUES (?,?,?,?,?,?,?)',
        [name, email, className, parish, role, hashedPassword, 'unverified']
      );
    } else if (role === 'teacher') {
      [result] = await db.promise().query(
        'INSERT INTO users (name,email,phone,teacherClass,role,password,status) VALUES (?,?,?,?,?,?,?)',
        [name, email, phone, teacherClass, role, hashedPassword, 'unverified']
      );
    }
  } catch (err) {
    console.error('Error inserting new user:', err);
    return res.status(500).send('Server error during signup.');
  }

  const user = { id: result.insertId, name, email, role, class: className, parish, phone, teacherClass };
  // Send email verification link
  const verifyToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const verifyUrl = `http://localhost:3001/api/verify-email?token=${verifyToken}`;
  try { // Added try-catch for email sending
    await transporter.sendMail({
      from: 'RUDASUMBWA <joyeuxpierreishimwe@gmail.com>',
      to: user.email,
      subject: 'Verify your RUDASUMBWA account',
      html: `<div style="font-family: Arial, sans-serif; background-color: #1b1b1b; color: #ffffff; padding: 20px; max-width: 600px; margin: auto; border-radius: 10px;">
        <h2 style="color: #00f2fe;">Verify Your Email</h2>
        <p>Hello ${user.name},</p>
        <p>Click the link below to verify your email. This link expires in 15 minutes.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 25px;background:linear-gradient(90deg,#4facfe,#00f2fe);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin-top:20px;">Verify Email</a>
        <p>If you did not request this, please ignore this email.</p>
      </div>`
    });
  } catch (err) {
    console.error('Error sending verification email:', err);
    // Decide whether to return an error to the user or proceed.
    // For now, we'll send a generic server error.
    return res.status(500).send('Server error during signup (email sending failed).');
  }

  res.send('A verification link has been sent to your email. Please verify to continue.');
};

const logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Error during logout:', err);
    res.status(500).json({ error: 'Failed to logout.' });
  }
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send('Email is required');
  const [rows] = await db.promise().query('SELECT * FROM users WHERE email=?', [email]);
  if (!rows.length) return res.status(400).send('Email not found');
  const user = rows[0];
  if (user.status !== 'unverified') return res.status(400).send('Email is already verified');

  // Resend email verification link
  const verifyToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const verifyUrl = `http://localhost:3001/api/verify-email?token=${verifyToken}`;
  await transporter.sendMail({
    from: 'RUDASUMBWA <joyeuxpierreishimwe@gmail.com>',
    to: user.email,
    subject: 'Verify your RUDASUMBWA account',
    html: `<div style="font-family: Arial, sans-serif; background-color: #1b1b1b; color: #ffffff; padding: 20px; max-width: 600px; margin: auto; border-radius: 10px;">
      <h2 style="color: #00f2fe;">Verify Your Email</h2>
      <p>Hello ${user.name},</p>
      <p>Click the link below to verify your email. This link expires in 15 minutes.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 25px;background:linear-gradient(90deg,#4facfe,#00f2fe);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin-top:20px;">Verify Email</a>
      <p>If you did not request this, please ignore this email.</p>
    </div>`
  });
  res.send('A new verification link has been sent to your email.');
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.promise().query('SELECT * FROM users WHERE email=?', [email]);
  if (!rows.length) return res.status(400).send('Incorrect email or password');
  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send('Incorrect email or password');
  if (user.status === 'unverified') return res.status(403).send('Your email is not verified. Please check your email for a verification link.');
  if (user.status === 'pending') return res.status(403).send('⏳ Your personal details are still under review by the Head of Studies.');
  if (user.status === 'rejected') return res.status(403).send('❌ Your account was not approved. Please contact the school.');
  // JWT for session
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, message: 'Login successful!' });
};

module.exports = {
  verifyEmail,
  resetPassword,
  forgotPassword,
  signup,
  logout,
  resendVerificationEmail,
  login,
  approve,
  reject
};
