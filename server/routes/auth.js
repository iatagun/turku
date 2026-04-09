const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const userRepo = require('../repositories/userRepository');

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new ValidationError('Tüm alanlar zorunludur.');
  if (password.length < 6) throw new ValidationError('Şifre en az 6 karakter olmalıdır.');

  const existing = userRepo.findByEmail(email);
  if (existing) throw new ValidationError('Bu e-posta adresi zaten kayıtlı.');

  const user = userRepo.create(name, email, password);
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ValidationError('E-posta ve şifre zorunludur.');

  const user = userRepo.findByEmail(email);
  if (!user || !userRepo.verifyPassword(password, user.password)) {
    throw new ValidationError('Geçersiz e-posta veya şifre.');
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  res.json(user);
}));

module.exports = router;
