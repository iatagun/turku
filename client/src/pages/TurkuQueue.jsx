import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

export default function TurkuQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const loadQueue = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filter !== 'all') params.filter = filter;
      if (search) params.search = search;
      const res = await api.get('/turku/queue', { params });
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Türkü listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadQueue(1);
  }, [loadQueue]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleFetchAll = async () => {
    if (!window.confirm('Repertükül sitesinden tüm türküler çekilecek. Devam edilsin mi?')) return;
    setFetching(true);
    try {
      const res = await api.post('/turku/fetch-all');
      toast.success(`${res.data.inserted} yeni türkü eklendi! Toplam: ${res.data.totalNow}`);
      loadQueue(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Türkü çekme hatası.');
    } finally {
      setFetching(false);
    }
  };

  const handleAnalyze = (turku) => {
    if (turku.completed_count > 0) {
      toast.error(`Bu türkünün analizi zaten tamamlanmış. (${turku.analyzed_by})`);
      return;
    }
    navigate(`/analysis/new/${turku.id}`);
  };

  const getStatusBadge = (item) => {
    if (item.completed_count > 0) {
      return <span className="badge badge-completed">✅ Analiz Edildi</span>;
    }
    if (item.draft_count > 0) {
      return <span className="badge badge-draft">📝 Taslak Var</span>;
    }
    return <span className="badge badge-pending">⏳ Bekliyor</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>📋 Türkü Listesi ({pagination.total})</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-accent" onClick={handleFetchAll} disabled={fetching}>
            {fetching ? '⏳ Çekiliyor...' : '🔄 Repertükülden Güncelle'}
          </button>
        )}
      </div>

      {/* Arama ve Filtre */}
      <div className="card">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} className="search-box" style={{ flex: 1, marginBottom: 0 }}>
            <input
              type="search"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Türkü adı ile ara..."
            />
            <button type="submit" className="btn btn-primary">🔍 Ara</button>
            {search && (
              <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setSearchInput(''); }}>
                ✕ Temizle
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Filtre Tabları */}
      <div className="tabs">
        {[
          { key: 'all', label: 'Tümü' },
          { key: 'pending', label: '⏳ Analiz Bekleyen' },
          { key: 'completed', label: '✅ Analiz Edilenler' },
        ].map(tab => (
          <button key={tab.key} className={filter === tab.key ? 'active' : ''} onClick={() => setFilter(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎵</div>
          <p>
            {pagination.total === 0
              ? 'Henüz türkü yüklenmemiş. Admin olarak "Repertükülden Güncelle" butonunu kullanın.'
              : 'Aramanızla eşleşen türkü bulunamadı.'}
          </p>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th>Türkü Adı</th>
                    <th>Yöre</th>
                    <th>Durum</th>
                    <th>Analiz Eden</th>
                    <th style={{ width: 120 }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} style={item.completed_count > 0 ? { background: '#f0faf0' } : {}}>
                      <td style={{ color: '#6B6B6B', fontSize: '0.85rem' }}>
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                        {item.trt_no && <div style={{ fontSize: '0.8rem', color: '#6B6B6B' }}>TRT: {item.trt_no}</div>}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>
                        {item.region || item.city || '-'}
                      </td>
                      <td>{getStatusBadge(item)}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {item.analyzed_by || '-'}
                      </td>
                      <td>
                        {item.completed_count > 0 ? (
                          <span style={{ fontSize: '0.8rem', color: '#6B6B6B' }}>Tamamlandı</span>
                        ) : (
                          <button className="btn btn-sm btn-primary" onClick={() => handleAnalyze(item)}>
                            Analiz Yap →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sayfalama */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px 0' }}>
              <button
                className="btn btn-sm btn-outline"
                disabled={pagination.page <= 1}
                onClick={() => loadQueue(pagination.page - 1)}
              >
                ← Önceki
              </button>
              <span style={{ fontSize: '0.9rem', color: '#6B6B6B' }}>
                Sayfa {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadQueue(pagination.page + 1)}
              >
                Sonraki →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
