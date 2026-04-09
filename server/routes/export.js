const express = require('express');
const XLSX = require('xlsx');
const auth = require('../middleware/auth');
const { asyncHandler, ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const analysisRepo = require('../repositories/analysisRepository');

const router = express.Router();

function formatJsonField(val) {
  if (!val) return '';
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        if (typeof item === 'object' && item.deger) {
          return `${item.deger}: ${item.iliski || ''}`;
        }
        return String(item);
      }).join('; ');
    }
    if (typeof parsed === 'object') {
      if (parsed.kademe) return `${parsed.kademe} - ${parsed.sinif || ''}`;
      return JSON.stringify(parsed);
    }
    return String(parsed);
  } catch {
    return String(val);
  }
}

function buildExcelBuffer(analyses, sheetName) {
  const rows = analyses.map((a, i) => ({
    'Sıra': i + 1,
    ...(a.analiz_yapan ? { 'Analiz Yapan': a.analiz_yapan } : {}),
    'Türkü Adı': a.turku_adi || a.turku_name || '',
    'TRT No': a.trt_no || '',
    'Yöre': a.region || '',
    'İl': a.city || '',
    'Kaynak Kişi': a.source_person || '',
    'Derleyen': a.compiler || '',
    'Durum': a.status === 'completed' ? 'Tamamlandı' : 'Taslak',
    'Türkünün Konusu': formatJsonField(a.konu),
    'Kullanılabilirlik Düzeyi': a.kullanilabilirlik || '',
    'Somutluk-Soyutluk': a.somutluk || '',
    'Tema / Duygusal Nitelik': formatJsonField(a.tema),
    'Toplumsal İşlev': formatJsonField(a.toplumsal_islev),
    'Olumsuz İçerik': formatJsonField(a.olumsuz_icerik),
    'Sınıf Düzeyi': formatJsonField(a.sinif_duzeyi),
    'Erdem-Değer-Eylem': formatJsonField(a.erdem_deger),
    'İlgili Alan/Branş': formatJsonField(a.ilgili_alan),
    'CEFR Tematik Alanı': formatJsonField(a.cefr),
    'Anahtar Kelimeler': a.anahtar_kelimeler || '',
    'Notlar': a.notlar || '',
    ...(a.lyrics !== undefined ? { 'Türkü Sözleri': a.lyrics || '' } : {}),
    'Oluşturma Tarihi': a.created_at || '',
    'Güncelleme Tarihi': a.updated_at || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function sendExcel(res, buffer, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(buffer);
}

router.get('/excel', auth, asyncHandler(async (req, res) => {
  const { ids, all } = req.query;

  let analyses;
  if (all === 'true') {
    analyses = analysisRepo.findForExport(req.user.id);
  } else if (ids) {
    analyses = analysisRepo.findForExport(req.user.id, ids.split(',').map(Number));
  } else {
    throw new ValidationError('ids veya all parametresi gerekli.');
  }

  if (!analyses.length) throw new NotFoundError('Dışa aktarılacak analiz bulunamadı.');

  const buffer = buildExcelBuffer(analyses, 'Türkü Analizleri');
  sendExcel(res, buffer, `Turku-Analizleri-${new Date().toISOString().slice(0, 10)}.xlsx`);
}));

router.get('/excel/all', auth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new ForbiddenError();

  const analyses = analysisRepo.findAllForExport();
  const buffer = buildExcelBuffer(analyses, 'Tüm Analizler');
  sendExcel(res, buffer, `Tum-Turku-Analizleri-${new Date().toISOString().slice(0, 10)}.xlsx`);
}));

module.exports = router;
