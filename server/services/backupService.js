const db = require('../db');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(__dirname, '..');

const BACKUP_FILE = path.join(BACKUP_DIR, 'turku-backup.json');

const backupService = {
  // Tüm kullanıcı verilerini (users + analyses) JSON olarak dışa aktar
  exportData() {
    const users = db.prepare('SELECT * FROM users').all();
    const analyses = db.prepare('SELECT * FROM analyses').all();
    return { version: 1, exported_at: new Date().toISOString(), users, analyses };
  },

  // Yedekleme dosyasına kaydet
  saveBackup() {
    try {
      const data = this.exportData();
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Yedekleme kaydedildi: ${BACKUP_FILE} (${data.users.length} kullanıcı, ${data.analyses.length} analiz)`);
      return true;
    } catch (err) {
      console.error('❌ Yedekleme hatası:', err.message);
      return false;
    }
  },

  // Yedekten geri yükle (sadece DB boşsa)
  restoreIfEmpty() {
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const analysisCount = db.prepare('SELECT COUNT(*) as c FROM analyses').get().c;

    // Zaten veri varsa geri yükleme yapma
    if (analysisCount > 0 || userCount > 1) return false;

    if (!fs.existsSync(BACKUP_FILE)) {
      console.log('ℹ️  Yedekleme dosyası bulunamadı, yeni kurulum.');
      return false;
    }

    try {
      const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
      const data = JSON.parse(raw);

      const txn = db.transaction(() => {
        // Kullanıcıları geri yükle (admin hariç, zaten var)
        const insertUser = db.prepare(`
          INSERT OR IGNORE INTO users (id, name, email, password, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const u of data.users) {
          insertUser.run(u.id, u.name, u.email, u.password, u.role, u.created_at);
        }

        // Analizleri geri yükle
        const insertAnalysis = db.prepare(`
          INSERT OR IGNORE INTO analyses (id, user_id, turku_id, turku_name, status,
            konu, kullanilabilirlik, somutluk, tema, toplumsal_islev,
            olumsuz_icerik, sinif_duzeyi, erdem_deger, ilgili_alan, cefr,
            anahtar_kelimeler, notlar, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const a of data.analyses) {
          insertAnalysis.run(
            a.id, a.user_id, a.turku_id, a.turku_name, a.status,
            a.konu, a.kullanilabilirlik, a.somutluk, a.tema, a.toplumsal_islev,
            a.olumsuz_icerik, a.sinif_duzeyi, a.erdem_deger, a.ilgili_alan, a.cefr,
            a.anahtar_kelimeler, a.notlar, a.created_at, a.updated_at
          );
        }
      });

      txn();
      console.log(`✅ Yedekten geri yüklendi: ${data.users.length} kullanıcı, ${data.analyses.length} analiz`);
      return true;
    } catch (err) {
      console.error('❌ Geri yükleme hatası:', err.message);
      return false;
    }
  },

  // Periyodik yedekleme başlat (her 30 dakikada bir)
  startAutoBackup(intervalMs = 30 * 60 * 1000) {
    setInterval(() => {
      this.saveBackup();
    }, intervalMs);
    console.log(`⏰ Otomatik yedekleme aktif (her ${intervalMs / 60000} dakika)`);
  },
};

module.exports = backupService;
