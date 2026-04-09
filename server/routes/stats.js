const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Platform geneli istatistikler
router.get('/', auth, (req, res) => {
  try {
    const totalTurkus = db.prepare('SELECT COUNT(*) as c FROM turkus').get().c;

    const analyzedTurkus = db.prepare(
      "SELECT COUNT(DISTINCT turku_id) as c FROM analyses WHERE status = 'completed'"
    ).get().c;

    const pendingTurkus = totalTurkus - analyzedTurkus;

    const totalAnalyses = db.prepare('SELECT COUNT(*) as c FROM analyses').get().c;
    const completedAnalyses = db.prepare("SELECT COUNT(*) as c FROM analyses WHERE status = 'completed'").get().c;
    const draftAnalyses = db.prepare("SELECT COUNT(*) as c FROM analyses WHERE status = 'draft'").get().c;

    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const activeAnalysts = db.prepare(
      "SELECT COUNT(DISTINCT user_id) as c FROM analyses WHERE status = 'completed'"
    ).get().c;

    const completionRate = totalTurkus > 0
      ? Math.round((analyzedTurkus / totalTurkus) * 100)
      : 0;

    // Son 10 tamamlanan analiz
    const recentCompleted = db.prepare(`
      SELECT a.id, a.turku_name, a.updated_at, u.name as analyst_name
      FROM analyses a
      JOIN users u ON a.user_id = u.id
      WHERE a.status = 'completed'
      ORDER BY a.updated_at DESC
      LIMIT 10
    `).all();

    // Kullanıcı bazlı istatistikler
    const userStats = db.prepare(`
      SELECT u.id, u.name,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN a.status = 'draft' THEN 1 END) as drafts
      FROM users u
      LEFT JOIN analyses a ON u.id = a.user_id
      GROUP BY u.id
      ORDER BY completed DESC
    `).all();

    res.json({
      turkus: { total: totalTurkus, analyzed: analyzedTurkus, pending: pendingTurkus },
      analyses: { total: totalAnalyses, completed: completedAnalyses, draft: draftAnalyses },
      users: { total: totalUsers, activeAnalysts },
      completionRate,
      recentCompleted,
      userStats,
    });
  } catch (err) {
    console.error('İstatistik hatası:', err);
    res.status(500).json({ error: 'İstatistikler alınırken hata oluştu.' });
  }
});

module.exports = router;
