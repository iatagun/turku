const db = require('../db');
const bcrypt = require('bcryptjs');

const userRepository = {
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById(id) {
    return db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
  },

  create(name, email, password) {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name, email, hash);
    return { id: result.lastInsertRowid, name, email, role: 'teacher' };
  },

  verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  },
};

module.exports = userRepository;
