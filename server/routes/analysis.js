const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const analysisService = require('../services/analysisService');

const router = express.Router();

router.get('/', auth, asyncHandler(async (req, res) => {
  res.json(analysisService.listByUser(req.user.id, req.query));
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  res.json(analysisService.getById(req.params.id, req.user.id));
}));

router.post('/', auth, asyncHandler(async (req, res) => {
  res.json(analysisService.create(req.user.id, req.body));
}));

router.put('/:id', auth, asyncHandler(async (req, res) => {
  res.json(analysisService.update(req.params.id, req.user.id, req.body));
}));

router.delete('/:id', auth, asyncHandler(async (req, res) => {
  res.json(analysisService.delete(req.params.id, req.user.id));
}));

module.exports = router;
