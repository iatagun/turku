const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'turku-analiz.db');
console.log(`📂 Veritabanı yolu: ${dbPath}`);
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'teacher',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS turkus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repertukul_id TEXT UNIQUE,
    trt_no TEXT,
    name TEXT NOT NULL,
    region TEXT,
    city TEXT,
    district TEXT,
    village TEXT,
    source_person TEXT,
    compiler TEXT,
    notator TEXT,
    musical_type TEXT,
    modal_scale TEXT,
    lyrics TEXT,
    raw_html TEXT,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    turku_id INTEGER NOT NULL,
    turku_name TEXT,
    status TEXT DEFAULT 'draft',

    -- 1. Türkünün Konusu (çoklu seçim, JSON array)
    konu JSON,

    -- 2. Ders Kitabında Kullanılabilirlik Düzeyi (tek seçim)
    kullanilabilirlik TEXT,

    -- 3. Somutluk-Soyutluk Düzeyi (tek seçim)
    somutluk TEXT,

    -- 4. Türkünün Teması / Duygusal Niteliği (çoklu seçim, JSON array)
    tema JSON,

    -- 5. Toplumsal İşlev (çoklu seçim, JSON array)
    toplumsal_islev JSON,

    -- 6. Olumsuz İçerik Kategorisi (çoklu seçim, JSON array)
    olumsuz_icerik JSON,

    -- 7. İlk Kez Öğretilebileceği Sınıf Düzeyi (JSON: {kademe, sinif})
    sinif_duzeyi JSON,

    -- 8. Erdem-Değer-Eylem Çerçevesi (JSON array of {deger, iliski})
    erdem_deger JSON,

    -- 9. İlgili Alan / Branş (çoklu seçim, JSON array)
    ilgili_alan JSON,

    -- 10. CEFR Tematik Alanı (çoklu seçim, JSON array)
    cefr JSON,

    -- 11. Anahtar Kelimeler (serbest metin)
    anahtar_kelimeler TEXT,

    -- Ek notlar
    notlar TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (turku_id) REFERENCES turkus(id)
  );

  CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
  CREATE INDEX IF NOT EXISTS idx_analyses_turku ON analyses(turku_id);
  CREATE INDEX IF NOT EXISTS idx_turkus_name ON turkus(name);
`);

// slug kolonu yoksa ekle
try {
  db.prepare("SELECT slug FROM turkus LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE turkus ADD COLUMN slug TEXT");
}

// Varsayılan admin kullanıcısı oluştur
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@turku.edu.tr');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin', 'admin@turku.edu.tr', hash, 'admin'
  );
}

module.exports = db;
