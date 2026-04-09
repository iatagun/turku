const express = require('express');
const XLSX = require('xlsx');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Kategori etiketleri
const CATEGORY_LABELS = {
  konu: 'Türkünün Konusu',
  kullanilabilirlik: 'Kullanılabilirlik Düzeyi',
  somutluk: 'Somutluk-Soyutluk',
  tema: 'Tema / Duygusal Nitelik',
  toplumsal_islev: 'Toplumsal İşlev',
  olumsuz_icerik: 'Olumsuz İçerik',
  sinif_duzeyi: 'Sınıf Düzeyi',
  erdem_deger: 'Erdem-Değer-Eylem',
  ilgili_alan: 'İlgili Alan/Branş',
  cefr: 'CEFR Tematik Alanı',
  anahtar_kelimeler: 'Anahtar Kelimeler',
};

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

// Analizleri Excel olarak dışa aktar
router.get('/excel', auth, (req, res) => {
  try {
    const { ids, all } = req.query;

    let analyses;
    if (all === 'true') {
      analyses = db.prepare(`
        SELECT a.*, t.name as turku_adi, t.trt_no, t.region, t.city, t.source_person, t.compiler, t.lyrics,
               u.name as analiz_yapan
        FROM analyses a
        LEFT JOIN turkus t ON a.turku_id = t.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ?
        ORDER BY a.updated_at DESC
      `).all(req.user.id);
    } else if (ids) {
      const idList = ids.split(',').map(Number);
      const placeholders = idList.map(() => '?').join(',');
      analyses = db.prepare(`
        SELECT a.*, t.name as turku_adi, t.trt_no, t.region, t.city, t.source_person, t.compiler, t.lyrics,
               u.name as analiz_yapan
        FROM analyses a
        LEFT JOIN turkus t ON a.turku_id = t.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.id IN (${placeholders}) AND a.user_id = ?
        ORDER BY a.updated_at DESC
      `).all(...idList, req.user.id);
    } else {
      return res.status(400).json({ error: 'ids veya all parametresi gerekli.' });
    }

    if (!analyses.length) {
      return res.status(404).json({ error: 'Dışa aktarılacak analiz bulunamadı.' });
    }

    // Excel oluştur
    const rows = analyses.map((a, i) => ({
      'Sıra': i + 1,
      'Türkü Adı': a.turku_adi || a.turku_name || '',
      'TRT No': a.trt_no || '',
      'Yöre': a.region || '',
      'İl': a.city || '',
      'Kaynak Kişi': a.source_person || '',
      'Derleyen': a.compiler || '',
      'Analiz Yapan': a.analiz_yapan || '',
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
      'Türkü Sözleri': a.lyrics || '',
      'Oluşturma Tarihi': a.created_at || '',
      'Güncelleme Tarihi': a.updated_at || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Sütun genişlikleri
    ws['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
      { wch: 40 }, { wch: 35 }, { wch: 20 }, { wch: 40 },
      { wch: 40 }, { wch: 40 }, { wch: 20 }, { wch: 50 },
      { wch: 40 }, { wch: 40 }, { wch: 30 }, { wch: 30 },
      { wch: 50 }, { wch: 18 }, { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Türkü Analizleri');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Turku-Analizleri-${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.send(buffer);
  } catch (err) {
    console.error('Excel export hatası:', err);
    res.status(500).json({ error: 'Excel dışa aktarma sırasında hata oluştu.' });
  }
});

// Admin: Tüm kullanıcıların analizlerini dışa aktar
router.get('/excel/all', auth, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    }

    const analyses = db.prepare(`
      SELECT a.*, t.name as turku_adi, t.trt_no, t.region, t.city, t.source_person, t.compiler, t.lyrics,
             u.name as analiz_yapan
      FROM analyses a
      LEFT JOIN turkus t ON a.turku_id = t.id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY u.name, a.updated_at DESC
    `).all();

    const rows = analyses.map((a, i) => ({
      'Sıra': i + 1,
      'Analiz Yapan': a.analiz_yapan || '',
      'Türkü Adı': a.turku_adi || a.turku_name || '',
      'TRT No': a.trt_no || '',
      'Yöre': a.region || '',
      'İl': a.city || '',
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
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Tüm Analizler');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Tum-Turku-Analizleri-${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Excel dışa aktarma sırasında hata oluştu.' });
  }
});

module.exports = router;
