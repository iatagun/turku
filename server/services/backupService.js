const db = require('../db');
const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'turku';
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const BACKUP_PATH = 'backups/turku-backup.json';
const GITHUB_API = 'https://api.github.com';

function githubReady() {
  return !!(GITHUB_TOKEN && GITHUB_OWNER);
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

const backupService = {
  // Tüm kullanıcı verilerini (users + analyses) JSON olarak dışa aktar
  exportData() {
    const users = db.prepare('SELECT * FROM users').all();
    const analyses = db.prepare('SELECT * FROM analyses').all();
    return { version: 1, exported_at: new Date().toISOString(), users, analyses };
  },

  // GitHub'a yedekleme yükle
  async saveBackup() {
    if (!githubReady()) {
      console.log('⚠️  GitHub yedekleme yapılandırılmamış (GITHUB_TOKEN / GITHUB_OWNER eksik)');
      return false;
    }

    try {
      const data = this.exportData();
      if (data.analyses.length === 0 && data.users.length <= 1) {
        console.log('ℹ️  Yedeklenecek veri yok, atlanıyor.');
        return false;
      }

      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
      const url = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${BACKUP_PATH}`;

      // Mevcut dosyanın SHA'sını al (güncelleme için gerekli)
      let sha = null;
      try {
        const existing = await axios.get(url, { headers: githubHeaders() });
        sha = existing.data.sha;
      } catch (e) {
        if (e.response?.status !== 404) throw e;
      }

      const payload = {
        message: `🔄 Otomatik yedekleme: ${data.users.length} kullanıcı, ${data.analyses.length} analiz`,
        content,
        ...(sha && { sha }),
      };

      await axios.put(url, payload, { headers: githubHeaders() });
      console.log(`💾 GitHub'a yedeklendi (${data.users.length} kullanıcı, ${data.analyses.length} analiz)`);
      return true;
    } catch (err) {
      console.error('❌ GitHub yedekleme hatası:', err.response?.data?.message || err.message);
      return false;
    }
  },

  // GitHub'dan yedek indir
  async fetchBackup() {
    if (!githubReady()) return null;

    try {
      const url = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${BACKUP_PATH}`;
      const res = await axios.get(url, { headers: githubHeaders() });
      const raw = Buffer.from(res.data.content, 'base64').toString('utf-8');
      return JSON.parse(raw);
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('ℹ️  GitHub\'da yedek dosyası bulunamadı.');
      } else {
        console.error('❌ GitHub yedek indirme hatası:', err.response?.data?.message || err.message);
      }
      return null;
    }
  },

  // GitHub'dan yedekten geri yükle (sadece DB boşsa)
  async restoreIfEmpty() {
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const analysisCount = db.prepare('SELECT COUNT(*) as c FROM analyses').get().c;

    if (analysisCount > 0 || userCount > 1) return false;

    const data = await this.fetchBackup();
    if (!data) return false;

    try {
      const txn = db.transaction(() => {
        const insertUser = db.prepare(`
          INSERT OR IGNORE INTO users (id, name, email, password, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const u of data.users) {
          insertUser.run(u.id, u.name, u.email, u.password, u.role, u.created_at);
        }

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
      console.log(`✅ GitHub'dan geri yüklendi: ${data.users.length} kullanıcı, ${data.analyses.length} analiz`);
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
