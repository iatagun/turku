const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const turkuService = require('../services/turkuService');

const router = express.Router();

router.get('/search', auth, asyncHandler(async (req, res) => {
  const result = await turkuService.search(req.query.q, req.query.category);
  res.json(result);
}));

router.get('/queue', auth, asyncHandler(async (req, res) => {
  res.json(turkuService.getQueue(req.query));
}));

router.post('/fetch-all', auth, asyncHandler(async (req, res) => {
  res.json(await turkuService.fetchAll(req.user.role));
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  res.json(await turkuService.getById(req.params.id));
}));

router.put('/:id', auth, asyncHandler(async (req, res) => {
  res.json(turkuService.update(req.params.id, req.body));
}));

router.post('/', auth, asyncHandler(async (req, res) => {
  res.json(turkuService.create(req.body));
}));

module.exports = router;
