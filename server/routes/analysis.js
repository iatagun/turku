const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Tüm analizlerimi listele
router.get('/', auth, (req, res) => {
  try {
    const { status, turku_id } = req.query;
    let query = 'SELECT a.*, t.name as turku_adi, t.trt_no, t.region FROM analyses a LEFT JOIN turkus t ON a.turku_id = t.id WHERE a.user_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (turku_id) {
      query += ' AND a.turku_id = ?';
      params.push(turku_id);
    }

    query += ' ORDER BY a.updated_at DESC';

    const analyses = db.prepare(query).all(...params);

    // JSON alanlarını parse et
    const parsed = analyses.map(a => ({
      ...a,
      konu: a.konu ? JSON.parse(a.konu) : [],
      tema: a.tema ? JSON.parse(a.tema) : [],
      toplumsal_islev: a.toplumsal_islev ? JSON.parse(a.toplumsal_islev) : [],
      olumsuz_icerik: a.olumsuz_icerik ? JSON.parse(a.olumsuz_icerik) : [],
      sinif_duzeyi: a.sinif_duzeyi ? JSON.parse(a.sinif_duzeyi) : null,
      erdem_deger: a.erdem_deger ? JSON.parse(a.erdem_deger) : [],
      ilgili_alan: a.ilgili_alan ? JSON.parse(a.ilgili_alan) : [],
      cefr: a.cefr ? JSON.parse(a.cefr) : [],
    }));

    res.json(parsed);
  } catch (err) {
    console.error('Analiz listeleme hatası:', err);
    res.status(500).json({ error: 'Analizler listelenirken hata oluştu.' });
  }
});

// Tek analiz getir
router.get('/:id', auth, (req, res) => {
  try {
    const analysis = db.prepare(
      'SELECT a.*, t.name as turku_adi, t.trt_no, t.region, t.lyrics FROM analyses a LEFT JOIN turkus t ON a.turku_id = t.id WHERE a.id = ? AND a.user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!analysis) return res.status(404).json({ error: 'Analiz bulunamadı.' });

    const parsed = {
      ...analysis,
      konu: analysis.konu ? JSON.parse(analysis.konu) : [],
      tema: analysis.tema ? JSON.parse(analysis.tema) : [],
      toplumsal_islev: analysis.toplumsal_islev ? JSON.parse(analysis.toplumsal_islev) : [],
      olumsuz_icerik: analysis.olumsuz_icerik ? JSON.parse(analysis.olumsuz_icerik) : [],
      sinif_duzeyi: analysis.sinif_duzeyi ? JSON.parse(analysis.sinif_duzeyi) : null,
      erdem_deger: analysis.erdem_deger ? JSON.parse(analysis.erdem_deger) : [],
      ilgili_alan: analysis.ilgili_alan ? JSON.parse(analysis.ilgili_alan) : [],
      cefr: analysis.cefr ? JSON.parse(analysis.cefr) : [],
    };

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Analiz alınırken hata oluştu.' });
  }
});

// Yeni analiz oluştur
router.post('/', auth, (req, res) => {
  try {
    const { turku_id, turku_name, konu, kullanilabilirlik, somutluk, tema, toplumsal_islev,
            olumsuz_icerik, sinif_duzeyi, erdem_deger, ilgili_alan, cefr,
            anahtar_kelimeler, notlar, status } = req.body;

    if (!turku_id) return res.status(400).json({ error: 'Türkü seçilmedi.' });

    const result = db.prepare(`
      INSERT INTO analyses (user_id, turku_id, turku_name, status, konu, kullanilabilirlik, somutluk,
        tema, toplumsal_islev, olumsuz_icerik, sinif_duzeyi, erdem_deger, ilgili_alan, cefr,
        anahtar_kelimeler, notlar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, turku_id, turku_name, status || 'draft',
      JSON.stringify(konu || []), kullanilabilirlik || null, somutluk || null,
      JSON.stringify(tema || []), JSON.stringify(toplumsal_islev || []),
      JSON.stringify(olumsuz_icerik || []), JSON.stringify(sinif_duzeyi || null),
      JSON.stringify(erdem_deger || []), JSON.stringify(ilgili_alan || []),
      JSON.stringify(cefr || []), anahtar_kelimeler || null, notlar || null
    );

    const analysis = db.prepare('SELECT * FROM analyses WHERE id = ?').get(result.lastInsertRowid);
    res.json(analysis);
  } catch (err) {
    console.error('Analiz oluşturma hatası:', err);
    res.status(500).json({ error: 'Analiz oluşturulurken hata oluştu.' });
  }
});

// Analiz güncelle
router.put('/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM analyses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Analiz bulunamadı.' });

    const { konu, kullanilabilirlik, somutluk, tema, toplumsal_islev,
            olumsuz_icerik, sinif_duzeyi, erdem_deger, ilgili_alan, cefr,
            anahtar_kelimeler, notlar, status } = req.body;

    db.prepare(`
      UPDATE analyses SET konu=?, kullanilabilirlik=?, somutluk=?, tema=?, toplumsal_islev=?,
        olumsuz_icerik=?, sinif_duzeyi=?, erdem_deger=?, ilgili_alan=?, cefr=?,
        anahtar_kelimeler=?, notlar=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      JSON.stringify(konu || []), kullanilabilirlik || null, somutluk || null,
      JSON.stringify(tema || []), JSON.stringify(toplumsal_islev || []),
      JSON.stringify(olumsuz_icerik || []), JSON.stringify(sinif_duzeyi || null),
      JSON.stringify(erdem_deger || []), JSON.stringify(ilgili_alan || []),
      JSON.stringify(cefr || []), anahtar_kelimeler || null, notlar || null,
      status || 'draft', req.params.id, req.user.id
    );

    const updated = db.prepare('SELECT * FROM analyses WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Analiz güncellenirken hata oluştu.' });
  }
});

// Analiz sil
router.delete('/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM analyses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Analiz bulunamadı.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Analiz silinirken hata oluştu.' });
  }
});

module.exports = router;
