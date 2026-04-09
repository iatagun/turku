const db = require('../db');

const turkuRepository = {
  count(conditions = '', params = []) {
    return db.prepare(`SELECT COUNT(*) as total FROM turkus t ${conditions}`).get(...params).total;
  },

  findPaginated({ conditions = '', params = [], limit = 50, offset = 0 }) {
    return db.prepare(`
      SELECT t.id, t.repertukul_id, t.name, t.trt_no, t.region, t.city, t.musical_type, t.slug,
        CASE WHEN t.lyrics IS NOT NULL AND t.lyrics != '' AND t.lyrics != '[SOZ_YOK]' THEN 1 ELSE 0 END as has_lyrics,
        (SELECT COUNT(*) FROM analyses a WHERE a.turku_id = t.id AND a.status = 'completed') as completed_count,
        (SELECT COUNT(*) FROM analyses a WHERE a.turku_id = t.id AND a.status = 'draft') as draft_count,
        (SELECT GROUP_CONCAT(u.name, ', ') FROM analyses a JOIN users u ON a.user_id = u.id
         WHERE a.turku_id = t.id AND a.status = 'completed') as analyzed_by
      FROM turkus t ${conditions}
      ORDER BY t.name ASC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
  },

  findById(id) {
    return db.prepare('SELECT * FROM turkus WHERE id = ?').get(id);
  },

  findByIdOrRepertukul(id) {
    return db.prepare('SELECT * FROM turkus WHERE id = ? OR repertukul_id = ?').get(id, id);
  },

  findByRepertukulId(id) {
    return db.prepare('SELECT * FROM turkus WHERE repertukul_id = ?').get(id);
  },

  insertFromRepertukul(detail) {
    return db.prepare(`
      INSERT OR IGNORE INTO turkus (repertukul_id, trt_no, name, region, city,
        source_person, compiler, notator, musical_type, modal_scale, lyrics, raw_html)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      detail.repertukul_id, detail.trt_no, detail.name,
      detail.region, detail.city, detail.source_person, detail.compiler,
      detail.notator, detail.musical_type, detail.modal_scale,
      detail.lyrics, detail.raw_html
    );
  },

  insertBatch(items) {
    const insert = db.prepare('INSERT OR IGNORE INTO turkus (repertukul_id, name, slug) VALUES (?, ?, ?)');
    const run = db.transaction((turkus) => {
      let inserted = 0;
      for (const t of turkus) {
        if (insert.run(t.id, t.name, t.slug || null).changes > 0) inserted++;
      }
      return inserted;
    });
    return run(items);
  },

  updateBatchSlugs(items) {
    const update = db.prepare('UPDATE turkus SET slug = ? WHERE repertukul_id = ?');
    const run = db.transaction((turkus) => {
      let updated = 0;
      for (const t of turkus) {
        if (t.slug && update.run(t.slug, t.id).changes > 0) updated++;
      }
      return updated;
    });
    return run(items);
  },

  findWithoutLyrics(limit = 100) {
    return db.prepare(
      "SELECT id, slug, name FROM turkus WHERE slug IS NOT NULL AND slug != '' AND (lyrics IS NULL OR lyrics = '') LIMIT ?"
    ).all(limit);
  },

  updateLyricsAndMeta(id, detail) {
    db.prepare(`
      UPDATE turkus SET lyrics = ?, trt_no = COALESCE(NULLIF(?, ''), trt_no),
        region = COALESCE(NULLIF(?, ''), region),
        source_person = COALESCE(NULLIF(?, ''), source_person),
        compiler = COALESCE(NULLIF(?, ''), compiler),
        notator = COALESCE(NULLIF(?, ''), notator),
        musical_type = COALESCE(NULLIF(?, ''), musical_type),
        modal_scale = COALESCE(NULLIF(?, ''), modal_scale)
      WHERE id = ?
    `).run(
      detail.lyrics, detail.trt_no || '', detail.region || '',
      detail.source_person || '', detail.compiler || '',
      detail.notator || '', detail.musical_type || '',
      detail.modal_scale || '', id
    );
  },

  markNoLyrics(id) {
    db.prepare("UPDATE turkus SET lyrics = '[SOZ_YOK]' WHERE id = ?").run(id);
  },

  countWithLyrics() {
    return db.prepare(
      "SELECT COUNT(*) as total FROM turkus WHERE lyrics IS NOT NULL AND lyrics != '' AND lyrics != '[SOZ_YOK]'"
    ).get().total;
  },

  countWithoutLyrics() {
    return db.prepare(
      "SELECT COUNT(*) as total FROM turkus WHERE slug IS NOT NULL AND slug != '' AND (lyrics IS NULL OR lyrics = '')"
    ).get().total;
  },

  insertManual(data) {
    const { name, trt_no, region, city, district, village, source_person,
            compiler, notator, musical_type, modal_scale, lyrics } = data;
    return db.prepare(`
      INSERT INTO turkus (name, trt_no, region, city, district, village,
        source_person, compiler, notator, musical_type, modal_scale, lyrics)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, trt_no, region, city, district, village,
           source_person, compiler, notator, musical_type, modal_scale, lyrics);
  },

  update(id, data) {
    const { name, trt_no, region, city, district, village, source_person,
            compiler, notator, musical_type, modal_scale, lyrics } = data;
    db.prepare(`
      UPDATE turkus SET name=?, trt_no=?, region=?, city=?, district=?, village=?,
        source_person=?, compiler=?, notator=?, musical_type=?, modal_scale=?, lyrics=?
      WHERE id = ?
    `).run(name, trt_no, region, city, district, village,
           source_person, compiler, notator, musical_type, modal_scale, lyrics, id);
    return this.findById(id);
  },

  searchByName(query, limit = 50) {
    return db.prepare(
      'SELECT id, name, trt_no, region, city, musical_type FROM turkus WHERE name LIKE ? LIMIT ?'
    ).all(`%${query}%`, limit);
  },
};

module.exports = turkuRepository;
