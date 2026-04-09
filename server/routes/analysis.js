const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const analysisService = require('../services/analysisService');
const backupService = require('../services/backupService');

const router = express.Router();

// Tamamlanan analizlerde arka planda GitHub'a yedekle
function backupIfCompleted(status) {
  if (status === 'completed') {
    backupService.saveBackup().catch(err =>
      console.error('❌ Arka plan yedekleme hatası:', err.message)
    );
  }
}

router.get('/', auth, asyncHandler(async (req, res) => {
  res.json(analysisService.listByUser(req.user.id, req.query));
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  res.json(analysisService.getById(req.params.id, req.user.id));
}));

router.post('/', auth, asyncHandler(async (req, res) => {
  const result = analysisService.create(req.user.id, req.body);
  backupIfCompleted(req.body.status);
  res.json(result);
}));

router.put('/:id', auth, asyncHandler(async (req, res) => {
  const result = analysisService.update(req.params.id, req.user.id, req.body);
  backupIfCompleted(req.body.status);
  res.json(result);
}));

router.delete('/:id', auth, asyncHandler(async (req, res) => {
  res.json(analysisService.delete(req.params.id, req.user.id));
}));

module.exports = router;
