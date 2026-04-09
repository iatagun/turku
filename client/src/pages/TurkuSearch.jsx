import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

export default function TurkuSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ local: [], remote: [] });
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', trt_no: '', region: '', city: '', source_person: '', compiler: '', notator: '', musical_type: '', lyrics: '' });
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (query.length < 2) return toast.error('En az 2 karakter girin.');
    setLoading(true);
    try {
      const res = await api.get('/turku/search', { params: { q: query } });
      setResults(res.data);
      if (!res.data.local.length && !res.data.remote.length) {
        toast('Sonuç bulunamadı. Manuel giriş yapabilirsiniz.', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error('Arama sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRemote = async (item) => {
    try {
      toast.loading('Türkü bilgileri çekiliyor...');
      const res = await api.get(`/turku/${item.id}`);
      toast.dismiss();
      toast.success('Türkü bilgileri alındı!');
      navigate(`/analysis/new/${res.data.id || res.data.repertukul_id}`);
    } catch {
      toast.dismiss();
      toast.error('Türkü detayları alınamadı.');
    }
  };

  const handleSelectLocal = (item) => {
    navigate(`/analysis/new/${item.id}`);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.name) return toast.error('Türkü adı zorunludur.');
    try {
      const res = await api.post('/turku', manualForm);
      toast.success('Türkü eklendi!');
      navigate(`/analysis/new/${res.data.id}`);
    } catch {
      toast.error('Türkü eklenirken hata oluştu.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Türkü Ara</h1>
        <button className="btn btn-outline" onClick={() => setManualMode(!manualMode)}>
          {manualMode ? 'Arama Moduna Dön' : '✏️ Manuel Türkü Ekle'}
        </button>
      </div>

      {!manualMode ? (
        <>
          <div className="card">
            <form onSubmit={handleSearch} className="search-box">
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Türkü adı, TRT no veya anahtar kelime ile arayın..."
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '⏳ Aranıyor...' : '🔍 Ara'}
              </button>
            </form>
            <p style={{ fontSize: '0.8rem', color: '#6B6B6B' }}>
              repertukul.com üzerinden TRT repertuvar türküleri aranır.
            </p>
          </div>

          {results.local.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2>📁 Sistemde Kayıtlı Türküler</h2>
              </div>
              <div className="search-results">
                {results.local.map(item => (
                  <div key={item.id} className="search-result-item" onClick={() => handleSelectLocal(item)}>
                    <div>
                      <div className="name">{item.name}</div>
                      <div className="meta">{[item.trt_no, item.region, item.musical_type].filter(Boolean).join(' • ')}</div>
                    </div>
                    <button className="btn btn-sm btn-primary">Analiz Yap →</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.remote.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2>🌐 Repertükül Sonuçları</h2>
              </div>
              <div className="search-results">
                {results.remote.map((item, i) => (
                  <div key={i} className="search-result-item" onClick={() => handleSelectRemote(item)}>
                    <div>
                      <div className="name">{item.name}</div>
                      <div className="meta">repertukul.com • ID: {item.id}</div>
                    </div>
                    <button className="btn btn-sm btn-secondary">Detay Çek & Analiz →</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !results.local.length && !results.remote.length && query.length >= 2 && (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <p>Aramanızla eşleşen türkü bulunamadı.</p>
              <button className="btn btn-outline mt-16" onClick={() => setManualMode(true)}>
                Manuel Türkü Ekle
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2>✏️ Manuel Türkü Ekle</h2>
          </div>
          <form onSubmit={handleManualSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Türkü Adı *</label>
                <input type="text" value={manualForm.name} onChange={e => setManualForm({ ...manualForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>TRT Repertuvar No</label>
                <input type="text" value={manualForm.trt_no} onChange={e => setManualForm({ ...manualForm, trt_no: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Yöre / Bölge</label>
                <input type="text" value={manualForm.region} onChange={e => setManualForm({ ...manualForm, region: e.target.value })} />
              </div>
              <div className="form-group">
                <label>İl</label>
                <input type="text" value={manualForm.city} onChange={e => setManualForm({ ...manualForm, city: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Kaynak Kişi</label>
                <input type="text" value={manualForm.source_person} onChange={e => setManualForm({ ...manualForm, source_person: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Derleyen</label>
                <input type="text" value={manualForm.compiler} onChange={e => setManualForm({ ...manualForm, compiler: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Notaya Alan</label>
                <input type="text" value={manualForm.notator} onChange={e => setManualForm({ ...manualForm, notator: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Müzikal Tür</label>
                <input type="text" value={manualForm.musical_type} onChange={e => setManualForm({ ...manualForm, musical_type: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Türkü Sözleri</label>
              <textarea rows={6} value={manualForm.lyrics} onChange={e => setManualForm({ ...manualForm, lyrics: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg">Türkü Ekle & Analiz Yap →</button>
          </form>
        </div>
      )}
    </div>
  );
}
