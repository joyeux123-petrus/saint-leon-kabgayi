const mysql = require("mysql2/promise");

let db;

async function connectToDatabase() {
  if (db) return db;
  db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  return db;
}

module.exports = connectToDatabase;
