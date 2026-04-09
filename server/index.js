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
});
