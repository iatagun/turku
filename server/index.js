require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/turku', require('./routes/turku'));
app.use('/api/analyses', require('./routes/analysis'));
app.use('/api/export', require('./routes/export'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/backup', require('./routes/backup'));

// Sağlık kontrolü
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Merkezi error handler (tüm route'lardan sonra)
app.use(errorHandler);

// Production'da React build dosyalarını sun
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuild, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🎵 Türkü Analiz Platformu sunucusu ${PORT} portunda çalışıyor`);
  console.log(`   http://localhost:${PORT}`);

  // Yedekten geri yükleme (DB boşsa)
  const backupService = require('./services/backupService');
  backupService.restoreIfEmpty();

  // DB boşsa otomatik türkü listesini çek (Render deploy sonrası vb.)
  const turkuRepo = require('./repositories/turkuRepository');
  const totalTurkus = turkuRepo.count();
  if (totalTurkus === 0) {
    console.log('📥 DB boş, repertükül.com\'dan türkü listesi çekiliyor...');
    const { fetchAllTurkus } = require('./services/repertukul');
    fetchAllTurkus().then(items => {
      const inserted = turkuRepo.insertBatch(items);
      console.log(`✅ ${inserted} türkü yüklendi.`);

      // Slug'ları güncelle
      turkuRepo.updateBatchSlugs(items);
      console.log('✅ Slug\'lar güncellendi.');
    }).catch(err => {
      console.error('❌ Otomatik türkü çekme hatası:', err.message);
    });
  }

  // Otomatik yedekleme (her 30 dakikada bir)
  backupService.startAutoBackup();
});

// Kapanışta son yedekleme
function gracefulShutdown(signal) {
  console.log(`\n🛑 ${signal} sinyali alındı, son yedekleme yapılıyor...`);
  try {
    const backupService = require('./services/backupService');
    backupService.saveBackup();
  } catch (err) {
    console.error('❌ Kapanış yedeği hatası:', err.message);
  }
  process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
