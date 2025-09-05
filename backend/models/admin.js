const connectToDatabase = require('../db');
const bcrypt = require('bcrypt');

const Admin = {
  async create(email, password) {
    const db = await connectToDatabase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO admins (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, 'admin']
    );
    return result;
  },

  async findByEmail(email) {
    const db = await connectToDatabase();
    const rows = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0];
  }
};

module.exports = Admin;