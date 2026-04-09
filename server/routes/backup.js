const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const backupService = require('../services/backupService');

const router = express.Router();

// Sadece admin kullanıcılar yedekleme yapabilir
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
  }
  next();
}

// POST /api/backup - Manuel yedekleme oluştur
router.post('/', auth, adminOnly, asyncHandler(async (req, res) => {
  const success = await backupService.saveBackup();
  if (success) {
    res.json({ message: 'Yedekleme GitHub\'a başarıyla yüklendi.' });
  } else {
    res.status(500).json({ error: 'Yedekleme oluşturulamadı. GitHub ayarlarını kontrol edin.' });
  }
}));

// GET /api/backup/download - Yedekleme verisini indir
router.get('/download', auth, adminOnly, asyncHandler(async (req, res) => {
  const data = backupService.exportData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=turku-backup-${new Date().toISOString().slice(0,10)}.json`);
  res.json(data);
}));

module.exports = router;
