const bcrypt = require('bcrypt');

async function generateHash() {
  const password = "Rud@2025!SeLk#HQ";
  const hash = await bcrypt.hash(password, 12);
  console.log("Password:", password);
  console.log("BCrypt Hash:", hash);
}

generateHash().catch(console.error);
