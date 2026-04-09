const db = require('../db');

const turkuRepository = {
  count(conditions = '', params = []) {
    return db.prepare(`SELECT COUNT(*) as total FROM turkus t ${conditions}`).get(...params).total;
  },

  findPaginated({ conditions = '', params = [], limit = 50, offset = 0 }) {
    return db.prepare(`
      SELECT t.id, t.repertukul_id, t.name, t.trt_no, t.region, t.city, t.musical_type,
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
    const insert = db.prepare('INSERT OR IGNORE INTO turkus (repertukul_id, name) VALUES (?, ?)');
    const run = db.transaction((turkus) => {
      let inserted = 0;
      for (const t of turkus) {
        if (insert.run(t.id, t.name).changes > 0) inserted++;
      }
      return inserted;
    });
    return run(items);
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
