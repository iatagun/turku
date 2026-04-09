const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { searchTurku, getTurkuDetail, fetchAllTurkus } = require('../services/repertukul');

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

// Türkü kuyruğu - tüm türküler + analiz durumu
router.get('/queue', auth, (req, res) => {
  try {
    const { page = 1, limit = 50, filter, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let countQuery = `SELECT COUNT(*) as total FROM turkus t`;
    let dataQuery = `
      SELECT t.id, t.repertukul_id, t.name, t.trt_no, t.region, t.city, t.musical_type,
        (SELECT COUNT(*) FROM analyses a WHERE a.turku_id = t.id AND a.status = 'completed') as completed_count,
        (SELECT COUNT(*) FROM analyses a WHERE a.turku_id = t.id AND a.status = 'draft') as draft_count,
        (SELECT GROUP_CONCAT(u.name, ', ') FROM analyses a JOIN users u ON a.user_id = u.id WHERE a.turku_id = t.id AND a.status = 'completed') as analyzed_by
      FROM turkus t
    `;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("t.name LIKE ?");
      params.push(`%${search}%`);
    }

    if (filter === 'pending') {
      conditions.push("t.id NOT IN (SELECT turku_id FROM analyses WHERE status = 'completed')");
    } else if (filter === 'completed') {
      conditions.push("t.id IN (SELECT turku_id FROM analyses WHERE status = 'completed')");
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      countQuery += where;
      dataQuery += where;
    }

    dataQuery += ' ORDER BY t.name ASC LIMIT ? OFFSET ?';

    const total = db.prepare(countQuery).get(...params).total;
    const items = db.prepare(dataQuery).all(...params, parseInt(limit), offset);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Kuyruk hatası:', err);
    res.status(500).json({ error: 'Türkü listesi alınırken hata oluştu.' });
  }
});

// Toplu türkü çekme (admin)
router.post('/fetch-all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekiyor.' });
    }

    const existingCount = db.prepare('SELECT COUNT(*) as c FROM turkus').get().c;

    const items = await fetchAllTurkus();

    const insert = db.prepare(`
      INSERT OR IGNORE INTO turkus (repertukul_id, name)
      VALUES (?, ?)
    `);

    const insertMany = db.transaction((turkus) => {
      let inserted = 0;
      for (const t of turkus) {
        const result = insert.run(t.id, t.name);
        if (result.changes > 0) inserted++;
      }
      return inserted;
    });

    const inserted = insertMany(items);
    const totalNow = db.prepare('SELECT COUNT(*) as c FROM turkus').get().c;

    res.json({
      message: `${inserted} yeni türkü eklendi.`,
      fetched: items.length,
      inserted,
      totalBefore: existingCount,
      totalNow,
    });
  } catch (err) {
    console.error('Toplu çekme hatası:', err);
    res.status(500).json({ error: 'Toplu türkü çekme sırasında hata oluştu.' });
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
