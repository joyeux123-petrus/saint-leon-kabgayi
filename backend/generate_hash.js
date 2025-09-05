const bcrypt = require('bcrypt');

const plainPassword = 'Rud@Sumbwa!2025#Adm'; // Replace with the actual password you want to use
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed Password:', hash);
});