const analysisRepo = require('../repositories/analysisRepository');
const { ValidationError, NotFoundError, ConflictError } = require('../middleware/errorHandler');

const analysisService = {
  listByUser(userId, filters) {
    return analysisRepo.findByUser(userId, filters);
  },

  getById(id, userId) {
    const analysis = analysisRepo.findById(id, userId);
    if (!analysis) throw new NotFoundError('Analiz bulunamadı.');
    return analysis;
  },

  create(userId, data) {
    if (!data.turku_id) throw new ValidationError('Türkü seçilmedi.');

    // Atomic check + insert (race condition koruması, 30 kişi aynı anda)
    const result = analysisRepo.createIfAvailable(userId, data.turku_id, data.turku_name, data);

    if (result.conflict) {
      throw new ConflictError(
        `Bu türkünün analizi zaten ${result.existing.analyst_name} tarafından tamamlanmış.`,
        { existingAnalysisId: result.existing.id }
      );
    }

    return result.analysis;
  },

  update(id, userId, data) {
    const existing = analysisRepo.findById(id, userId);
    if (!existing) throw new NotFoundError('Analiz bulunamadı.');
    return analysisRepo.update(id, userId, data);
  },

  delete(id, userId) {
    const result = analysisRepo.delete(id, userId);
    if (result.changes === 0) throw new NotFoundError('Analiz bulunamadı.');
    return { success: true };
  },
};

module.exports = analysisService;
