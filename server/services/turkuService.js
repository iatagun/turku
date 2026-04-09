const turkuRepo = require('../repositories/turkuRepository');
const { searchTurku, getTurkuDetail, fetchAllTurkus } = require('./repertukul');
const { ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

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
    const inserted = turkuRepo.insertBatch(items);
    const totalNow = turkuRepo.count();

    return {
      message: `${inserted} yeni türkü eklendi.`,
      fetched: items.length,
      inserted,
      totalBefore,
      totalNow,
    };
  },

  async getById(id) {
    let turku = turkuRepo.findByIdOrRepertukul(id);
    if (turku) return turku;

    const detail = await getTurkuDetail(id);
    if (!detail) throw new NotFoundError('Türkü bulunamadı.');

    turkuRepo.insertFromRepertukul(detail);
    return turkuRepo.findByRepertukulId(id) || detail;
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
