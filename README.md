# Türkü Analiz Platformu 🎵

Öğretmenlerin TRT repertuvar türkülerini **repertukul.com** üzerinden arayıp, "Öğretim Temelli Türkü Sınıflandırma Sistemi"ne göre analiz etmelerini ve analizleri **Excel'e aktarmalarını** sağlayan web uygulaması.

## Özellikler

- 🔍 **Türkü Arama** — repertukul.com üzerinden gerçek zamanlı arama
- 📝 **11 Kategorili Analiz Formu** — Konu, Tema, Erdem-Değer, CEFR, Sınıf Düzeyi vb.
- 📊 **Excel Dışa Aktarma** — Bireysel veya toplu analiz raporları
- 👥 **Çoklu Kullanıcı** — JWT tabanlı kimlik doğrulama (30 eşzamanlı kullanıcı)
- 🏫 **Admin Paneli** — Tüm analizleri görüntüleme ve dışa aktarma

## Kurulum

```bash
# Bağımlılıkları yükle
npm install
cd client && npm install && cd ..

# Frontend'i derle
cd client && npx vite build && cd ..

# Sunucuyu başlat
node server/index.js
```

Uygulama **http://localhost:3005** adresinde çalışır.

## Varsayılan Giriş

| E-posta | Şifre |
|---------|-------|
| admin@turku.edu.tr | admin123 |

## Teknolojiler

- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **Veritabanı:** SQLite (better-sqlite3)
- **Kimlik Doğrulama:** JWT
- **Veri Kaynağı:** repertukul.com (web scraping)
- **Excel:** xlsx kütüphanesi