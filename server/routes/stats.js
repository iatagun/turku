const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const statsService = require('../services/statsService');

const router = express.Router();

router.get('/', auth, asyncHandler(async (req, res) => {
  res.json(statsService.getPlatformStats());
}));

module.exports = router;
