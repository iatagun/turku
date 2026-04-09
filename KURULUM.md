# Türkü Analiz Platformu - Kurulum ve Çalıştırma Rehberi

## Gereksinimler
- **Node.js** v18+ (önerilen: v22)
- **Git**
- **ngrok** (dış erişim için)

---

## 1. Projeyi İndir ve Kur

```bash
git clone https://github.com/KULLANICI/turku.git
cd turku

# Bağımlılıkları kur (hem sunucu hem istemci)
npm install
cd client && npm install && cd ..
```

## 2. Ortam Değişkenlerini Ayarla

Proje kök dizininde `.env` dosyası oluştur:

```bash
# Windows
echo JWT_SECRET=turku-analiz-platformu-gizli-anahtar-2026> .env
echo PORT=3005>> .env

# Mac/Linux
echo "JWT_SECRET=turku-analiz-platformu-gizli-anahtar-2026" > .env
echo "PORT=3005" >> .env
```

## 3. İstemciyi Derle (Production)

```bash
npm run build
```

## 4. Sunucuyu Başlat

```bash
npm start
```

Tarayıcıda aç: **http://localhost:3005**

---

## 5. ngrok ile Dış Erişim

### ngrok Kurulumu (İlk Kez)

1. https://ngrok.com adresinden ücretsiz hesap aç
2. ngrok'u indir ve kur:
   - **Windows**: https://ngrok.com/download → zip'i aç, PATH'e ekle
   - **Mac**: `brew install ngrok`
   - **Linux**: `snap install ngrok`
3. Auth token'ı ayarla (dashboard'dan al):
   ```bash
   ngrok config add-authtoken SENIN_TOKEN_IN
   ```

### ngrok'u Çalıştır

```bash
ngrok http 3005
```

Ekranda şöyle bir URL göreceksin:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3005
```

Bu URL'yi kullanıcılarla paylaş. 30 kişi aynı anda bu URL üzerinden erişebilir.

---

## Hızlı Başlatma (Tek Komut)

### Windows (PowerShell)
```powershell
cd turku
npm start
# Yeni terminal aç:
ngrok http 3005
```

### Windows (Betik ile)
```powershell
# start.ps1 dosyasını çalıştır:
.\start.ps1
```

### Mac/Linux
```bash
cd turku
npm start &
ngrok http 3005
```

---

## Varsayılan Admin Hesabı
- **E-posta**: admin@turku.edu.tr
- **Şifre**: admin123

> ⚠️ İlk girişten sonra şifrenizi değiştirmeniz önerilir.

## Notlar
- Veritabanı otomatik oluşturulur (`turku-analiz.db`)
- 4521 türkü yüklemek için: Giriş yap → Türkü Listesi → "Repertükülden Güncelle"
- SQLite WAL modu aktif — 30 eşzamanlı kullanıcı desteklenir
