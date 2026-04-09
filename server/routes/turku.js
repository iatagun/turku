const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { searchTurku, getTurkuDetail } = require('../services/repertukul');

const router = express.Router();

// Türkü ara (repertukul.com üzerinden)
router.get('/search', auth, async (req, res) => {
  try {
    const { q, category } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Arama terimi en az 2 karakter olmalıdır.' });
    }

    // Önce yerel veritabanında ara
    const localResults = db.prepare(
      "SELECT id, name, trt_no, region, city, musical_type FROM turkus WHERE name LIKE ? LIMIT 50"
    ).all(`%${q}%`);

    // Repertukul.com'da da ara
    const { results: remoteResults } = await searchTurku(q, category || '1');

    res.json({ local: localResults, remote: remoteResults });
  } catch (err) {
    console.error('Arama hatası:', err);
    res.status(500).json({ error: 'Arama sırasında hata oluştu.' });
  }
});

// Türkü detayı getir
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Önce yerel veritabanında bak
    let turku = db.prepare('SELECT * FROM turkus WHERE id = ? OR repertukul_id = ?').get(id, id);

    if (turku) {
      return res.json(turku);
    }

    // Yerel bulunamadı, repertukul.com'dan çek
    const detail = await getTurkuDetail(id);
    if (!detail) {
      return res.status(404).json({ error: 'Türkü bulunamadı.' });
    }

    // Yerel veritabanına kaydet
    const result = db.prepare(`
      INSERT OR IGNORE INTO turkus (repertukul_id, trt_no, name, region, city, source_person, compiler, notator, musical_type, modal_scale, lyrics, raw_html)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      detail.repertukul_id, detail.trt_no, detail.name || `Türkü #${id}`,
      detail.region, detail.city, detail.source_person, detail.compiler,
      detail.notator, detail.musical_type, detail.modal_scale,
      detail.lyrics, detail.raw_html
    );

    turku = db.prepare('SELECT * FROM turkus WHERE repertukul_id = ?').get(id);
    res.json(turku || detail);
  } catch (err) {
    console.error('Detay hatası:', err);
    res.status(500).json({ error: 'Türkü detayı alınırken hata oluştu.' });
  }
});

// Türkü bilgilerini manuel güncelle
router.put('/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const { name, trt_no, region, city, district, village, source_person, compiler, notator, musical_type, modal_scale, lyrics } = req.body;

    db.prepare(`
      UPDATE turkus SET name=?, trt_no=?, region=?, city=?, district=?, village=?,
        source_person=?, compiler=?, notator=?, musical_type=?, modal_scale=?, lyrics=?
      WHERE id = ?
    `).run(name, trt_no, region, city, district, village, source_person, compiler, notator, musical_type, modal_scale, lyrics, id);

    const turku = db.prepare('SELECT * FROM turkus WHERE id = ?').get(id);
    res.json(turku);
  } catch (err) {
    res.status(500).json({ error: 'Güncelleme sırasında hata oluştu.' });
  }
});

// Manuel türkü ekle
router.post('/', auth, (req, res) => {
  try {
    const { name, trt_no, region, city, district, village, source_person, compiler, notator, musical_type, modal_scale, lyrics } = req.body;
    if (!name) return res.status(400).json({ error: 'Türkü adı zorunludur.' });

    const result = db.prepare(`
      INSERT INTO turkus (name, trt_no, region, city, district, village, source_person, compiler, notator, musical_type, modal_scale, lyrics)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, trt_no, region, city, district, village, source_person, compiler, notator, musical_type, modal_scale, lyrics);

    const turku = db.prepare('SELECT * FROM turkus WHERE id = ?').get(result.lastInsertRowid);
    res.json(turku);
  } catch (err) {
    res.status(500).json({ error: 'Ekleme sırasında hata oluştu.' });
  }
});

module.exports = router;
