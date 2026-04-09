const db = require('../db');

const JSON_FIELDS = ['konu', 'tema', 'toplumsal_islev', 'olumsuz_icerik',
                     'sinif_duzeyi', 'erdem_deger', 'ilgili_alan', 'cefr'];

function parseJsonFields(row) {
  if (!row) return null;
  const parsed = { ...row };
  for (const field of JSON_FIELDS) {
    if (parsed[field]) {
      try { parsed[field] = JSON.parse(parsed[field]); }
      catch { parsed[field] = field === 'sinif_duzeyi' ? null : []; }
    } else {
      parsed[field] = field === 'sinif_duzeyi' ? null : [];
    }
  }
  return parsed;
}

function serializePayload(data) {
  return {
    konu: JSON.stringify(data.konu || []),
    kullanilabilirlik: data.kullanilabilirlik || null,
    somutluk: data.somutluk || null,
    tema: JSON.stringify(data.tema || []),
    toplumsal_islev: JSON.stringify(data.toplumsal_islev || []),
    olumsuz_icerik: JSON.stringify(data.olumsuz_icerik || []),
    sinif_duzeyi: JSON.stringify(data.sinif_duzeyi || null),
    erdem_deger: JSON.stringify(data.erdem_deger || []),
    ilgili_alan: JSON.stringify(data.ilgili_alan || []),
    cefr: JSON.stringify(data.cefr || []),
    anahtar_kelimeler: data.anahtar_kelimeler || null,
    notlar: data.notlar || null,
  };
}

const analysisRepository = {
  findByUser(userId, { status, turku_id } = {}) {
    let query = `SELECT a.*, t.name as turku_adi, t.trt_no, t.region
      FROM analyses a LEFT JOIN turkus t ON a.turku_id = t.id WHERE a.user_id = ?`;
    const params = [userId];

    if (status) { query += ' AND a.status = ?'; params.push(status); }
    if (turku_id) { query += ' AND a.turku_id = ?'; params.push(turku_id); }
    query += ' ORDER BY a.updated_at DESC';

    return db.prepare(query).all(...params).map(parseJsonFields);
  },

  findById(id, userId) {
    const row = db.prepare(`
      SELECT a.*, t.name as turku_adi, t.trt_no, t.region, t.lyrics
      FROM analyses a LEFT JOIN turkus t ON a.turku_id = t.id
      WHERE a.id = ? AND a.user_id = ?
    `).get(id, userId);
    return parseJsonFields(row);
  },

  findCompletedByTurku(turkuId) {
    return db.prepare(`
      SELECT a.id, u.name as analyst_name
      FROM analyses a JOIN users u ON a.user_id = u.id
      WHERE a.turku_id = ? AND a.status = 'completed'
    `).get(turkuId);
  },

  // Atomic: check + insert in single transaction (race condition koruması)
  createIfAvailable(userId, turkuId, turkuName, data) {
    const s = serializePayload(data);
    const txn = db.transaction(() => {
      const existing = this.findCompletedByTurku(turkuId);
      if (existing) return { conflict: true, existing };

      const result = db.prepare(`
        INSERT INTO analyses (user_id, turku_id, turku_name, status,
          konu, kullanilabilirlik, somutluk, tema, toplumsal_islev,
          olumsuz_icerik, sinif_duzeyi, erdem_deger, ilgili_alan, cefr,
          anahtar_kelimeler, notlar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId, turkuId, turkuName, data.status || 'draft',
        s.konu, s.kullanilabilirlik, s.somutluk, s.tema, s.toplumsal_islev,
        s.olumsuz_icerik, s.sinif_duzeyi, s.erdem_deger, s.ilgili_alan, s.cefr,
        s.anahtar_kelimeler, s.notlar
      );

      return {
        conflict: false,
        analysis: db.prepare('SELECT * FROM analyses WHERE id = ?').get(result.lastInsertRowid),
      };
    });
    return txn();
  },

  update(id, userId, data) {
    const s = serializePayload(data);
    db.prepare(`
      UPDATE analyses SET konu=?, kullanilabilirlik=?, somutluk=?, tema=?, toplumsal_islev=?,
        olumsuz_icerik=?, sinif_duzeyi=?, erdem_deger=?, ilgili_alan=?, cefr=?,
        anahtar_kelimeler=?, notlar=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      s.konu, s.kullanilabilirlik, s.somutluk, s.tema, s.toplumsal_islev,
      s.olumsuz_icerik, s.sinif_duzeyi, s.erdem_deger, s.ilgili_alan, s.cefr,
      s.anahtar_kelimeler, s.notlar, data.status || 'draft', id, userId
    );
    return db.prepare('SELECT * FROM analyses WHERE id = ?').get(id);
  },

  delete(id, userId) {
    return db.prepare('DELETE FROM analyses WHERE id = ? AND user_id = ?').run(id, userId);
  },

  // İstatistik sorguları
  countAll() {
    return db.prepare('SELECT COUNT(*) as c FROM analyses').get().c;
  },
  countByStatus(status) {
    return db.prepare('SELECT COUNT(*) as c FROM analyses WHERE status = ?').get(status).c;
  },
  countDistinctAnalyzedTurkus() {
    return db.prepare("SELECT COUNT(DISTINCT turku_id) as c FROM analyses WHERE status = 'completed'").get().c;
  },
  countActiveAnalysts() {
    return db.prepare("SELECT COUNT(DISTINCT user_id) as c FROM analyses WHERE status = 'completed'").get().c;
  },
  recentCompleted(limit = 10) {
    return db.prepare(`
      SELECT a.id, a.turku_name, a.updated_at, u.name as analyst_name
      FROM analyses a JOIN users u ON a.user_id = u.id
      WHERE a.status = 'completed' ORDER BY a.updated_at DESC LIMIT ?
    `).all(limit);
  },
  userStats() {
    return db.prepare(`
      SELECT u.id, u.name,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN a.status = 'draft' THEN 1 END) as drafts
      FROM users u LEFT JOIN analyses a ON u.id = a.user_id
      GROUP BY u.id ORDER BY completed DESC
    `).all();
  },

  // Excel export için
  findForExport(userId, ids = null) {
    if (ids) {
      const placeholders = ids.map(() => '?').join(',');
      return db.prepare(`
        SELECT a.*, t.name as turku_adi, t.trt_no, t.region, t.city,
          t.source_person, t.compiler, t.lyrics, u.name as analiz_yapan
        FROM analyses a LEFT JOIN turkus t ON a.turku_id = t.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.id IN (${placeholders}) AND a.user_id = ?
        ORDER BY a.updated_at DESC
      `).all(...ids, userId);
    }
    return db.prepare(`
      SELECT a.*, t.name as turku_adi, t.trt_no, t.region, t.city,
        t.source_person, t.compiler, t.lyrics, u.name as analiz_yapan
      FROM analyses a LEFT JOIN turkus t ON a.turku_id = t.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ? ORDER BY a.updated_at DESC
    `).all(userId);
  },

  findAllForExport() {
    return db.prepare(`
      SELECT a.*, t.name as turku_adi, t.trt_no, t.region, t.city,
        t.source_person, t.compiler, t.lyrics, u.name as analiz_yapan
      FROM analyses a LEFT JOIN turkus t ON a.turku_id = t.id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY u.name, a.updated_at DESC
    `).all();
  },
};

module.exports = analysisRepository;
