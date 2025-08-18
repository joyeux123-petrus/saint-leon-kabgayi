const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'RUDASUMBWA',
  password: 'joyeux123',
  database: 'RUDASUMBWA'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database RUDASUMBWA!');
});

module.exports = db;
