const turkuRepo = require('../repositories/turkuRepository');
const { searchTurku, getTurkuDetail, fetchAllTurkus, fetchAllLyrics } = require('./repertukul');
const { ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

// Aktif söz çekme işlemi takibi
let lyricsJobStatus = null;

const turkuService = {
  async search(q, category) {
    if (!q || q.length < 2) {
      throw new ValidationError('Arama terimi en az 2 karakter olmalıdır.');
    }
    const local = turkuRepo.searchByName(q);
    const { results: remote } = await searchTurku(q, category || '1');
    return { local, remote };
  },

  getQueue({ page = 1, limit = 50, filter, search }) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

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

    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const total = turkuRepo.count(where, params);
    const items = turkuRepo.findPaginated({ conditions: where, params, limit: limitNum, offset });

    return {
      items,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  },

  async fetchAll(userRole) {
    if (userRole !== 'admin') {
      throw new ForbiddenError('Bu işlem için admin yetkisi gerekiyor.');
    }

    const totalBefore = turkuRepo.count();
    const items = await fetchAllTurkus();

    // Önce mevcut türkülerin slug'larını güncelle
    turkuRepo.updateBatchSlugs(items);
    // Sonra yeni türküleri ekle (slug ile birlikte)
    const inserted = turkuRepo.insertBatch(items);
    const totalNow = turkuRepo.count();

    return {
      message: `${inserted} yeni türkü eklendi, slug'lar güncellendi.`,
      fetched: items.length,
      inserted,
      totalBefore,
      totalNow,
    };
  },

  async fetchLyrics(userRole) {
    if (userRole !== 'admin') {
      throw new ForbiddenError('Bu işlem için admin yetkisi gerekiyor.');
    }

    if (lyricsJobStatus && lyricsJobStatus.running) {
      return {
        message: 'Söz çekme işlemi devam ediyor.',
        ...lyricsJobStatus,
      };
    }

    const remaining = turkuRepo.countWithoutLyrics();
    if (remaining === 0) {
      return {
        message: 'Tüm türkülerin sözleri zaten çekilmiş.',
        withLyrics: turkuRepo.countWithLyrics(),
        remaining: 0,
      };
    }

    // Arka planda başlat — blocking değil
    lyricsJobStatus = { running: true, fetched: 0, failed: 0, total: remaining };

    fetchAllLyrics(turkuRepo, (progress) => {
      lyricsJobStatus = { ...lyricsJobStatus, ...progress };
    }).then((result) => {
      lyricsJobStatus = { running: false, ...result };
      console.log(`Söz çekme tamamlandı: ${result.fetched} başarılı, ${result.failed} başarısız`);
    }).catch((err) => {
      lyricsJobStatus = { running: false, error: err.message };
      console.error('Söz çekme hatası:', err.message);
    });

    return {
      message: `${remaining} türkü için söz çekme başlatıldı. İlerleme: /api/turku/lyrics-status`,
      total: remaining,
    };
  },

  getLyricsStatus() {
    return {
      withLyrics: turkuRepo.countWithLyrics(),
      withoutLyrics: turkuRepo.countWithoutLyrics(),
      job: lyricsJobStatus,
    };
  },

  async getById(id) {
    let turku = turkuRepo.findByIdOrRepertukul(id);
    if (!turku) throw new NotFoundError('Türkü bulunamadı.');

    // Eğer sözler henüz çekilmediyse ve slug varsa, şimdi çek
    if ((!turku.lyrics || turku.lyrics === '') && turku.slug) {
      const detail = await getTurkuDetail(turku.slug);
      if (detail && detail.lyrics) {
        turkuRepo.updateLyricsAndMeta(turku.id, detail);
        turku = turkuRepo.findById(turku.id);
      }
    }

    return turku;
  },

  update(id, data) {
    return turkuRepo.update(id, data);
  },

  create(data) {
    if (!data.name) throw new ValidationError('Türkü adı zorunludur.');
    const result = turkuRepo.insertManual(data);
    return turkuRepo.findById(result.lastInsertRowid);
  },
};

module.exports = turkuService;
